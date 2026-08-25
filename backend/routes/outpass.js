const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

async function safeNotify(db, userId, title, message, type, outpassId) {
  try {
    await db.query(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES($1,$2,$3,$4,$5)`,
      [userId, title, message, type, outpassId]);
  } catch (e) {
    try {
      await db.query(`INSERT INTO notifications(user_id,title,message,type) VALUES($1,$2,$3,$4)`,
        [userId, title, message, type]);
    } catch (e2) {
      console.error('Notification error:', e2.message);
    }
  }
}

// GET /api/outpass
router.get('/', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  let outpasses = [];
  if (user.role === 'student') {
    const studentRes = await db.query('SELECT * FROM students WHERE user_id=$1', [user.userId]);
    const student = studentRes.rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const opRes = await db.query(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.student_id = $1
      ORDER BY o.created_at DESC
    `, [student.id]);
    outpasses = opRes.rows;
  } else {
    const opRes = await db.query(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [user.userId]);
    outpasses = opRes.rows;
  }
  return res.json({ outpasses });
});

// POST /api/outpass
router.post('/', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can create outpass requests' });
  }

  try {
    const db = getDb();
    const { reason, destination, from_date, to_date, from_time, to_time } = req.body;
    if (!reason || !destination || !from_date || !to_date) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    if (fromDate < today) {
      return res.status(400).json({
        error: "Past dates are not allowed."
      });
    }

    if (toDate < fromDate) {
      return res.status(400).json({
        error: "To Date cannot be earlier than From Date."
      });
    }
    const studentRes = await db.query('SELECT * FROM students WHERE user_id=$1', [user.userId]);
    const student = studentRes.rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const result = await db.query(`
      INSERT INTO outpasses(student_id,user_id,reason,destination,from_date,to_date,from_time,to_time,status,teacher_status,hod_status,principal_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,'pending_teacher','pending','pending','pending')
      RETURNING id
    `, [student.id, user.userId, reason, destination, from_date, to_date, from_time || '', to_time || '']);
    const newOutpassId = result.rows[0].id;

    const teacherRes = await db.query(`SELECT id FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM($1)) AND role='class_teacher' LIMIT 1`, [user.department]);
    const teacher = teacherRes.rows[0];
    if (teacher) {
      await safeNotify(db, teacher.id, 'New Outpass Request', `${user.name} has submitted an outpass request — ${reason}`, 'action', newOutpassId);
    }
    await safeNotify(db, user.userId, 'Outpass Submitted', `Your outpass request for "${destination}" has been successfully submitted.`, 'info', newOutpassId);

    return res.status(201).json({ message: 'Outpass submitted', id: newOutpassId });
  } catch (err) {
    console.error('Outpass POST error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/outpass/:id
router.get('/:id', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const opRes = await db.query(`
    SELECT o.*, u.name as student_name, u.email as student_email, u.role as applicant_role, u.department,
           s.roll_no, s.year, s.semester, s.section
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN students s ON o.student_id = s.id
    WHERE o.id = $1
  `, [req.params.id]);

  const op = opRes.rows[0];
  if (!op) return res.status(404).json({ error: 'Not found' });
  return res.json({ outpass: op });
});

// PATCH /api/outpass/:id
router.patch('/:id', async (req, res) => {
  try {
    const user = verifyToken(req.headers['authorization']);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const outpassId = req.params.id;
    const { action, remarks } = req.body || {};
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const db = getDb();
    const opRes = await db.query(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [outpassId]);

    const op = opRes.rows[0];
    if (!op) return res.status(404).json({ error: 'Outpass not found' });
    const now = new Date().toISOString();
    const statusVal = action === 'approve' ? 'approved' : 'rejected';

    if (user.role === 'class_teacher') {
      await db.query(`UPDATE outpasses SET teacher_status=$1, teacher_remarks=$2, teacher_action_at=$3, status=$4 WHERE id=$5`,
        [statusVal, remarks || '', now, action === 'approve' ? 'pending_hod' : 'rejected', op.id]);

      await safeNotify(db, op.student_user_id,
        action === 'approve' ? 'Outpass Approved by Teacher' : 'Outpass Rejected by Teacher',
        action === 'approve' ? 'Your outpass request has been approved by your class teacher. Awaiting HOD approval.' : `Your outpass request was rejected by your class teacher. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'info' : 'warning', op.id
      );

      if (action === 'approve') {
        const hodRes = await db.query(`SELECT id FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM($1)) AND role='hod' LIMIT 1`, [user.department || op.department]);
        const hod = hodRes.rows[0];
        if (hod) {
          await safeNotify(db, hod.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by class teacher. Please review.`, 'action', op.id);
        }
      }
    } else if (user.role === 'hod') {
      if (op.teacher_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected by the Class Teacher and cannot be processed by HOD.' });
      }

      await db.query(`UPDATE outpasses SET hod_status=$1, hod_remarks=$2, hod_action_at=$3, status=$4 WHERE id=$5`,
        [statusVal, remarks || '', now, action === 'approve' ? 'pending_principal' : 'rejected', op.id]);

      await safeNotify(db, op.student_user_id,
        action === 'approve' ? 'Outpass Approved by HOD' : 'Outpass Rejected by HOD',
        action === 'approve' ? `Your outpass to ${op.destination} has been approved by the HOD. Awaiting Principal approval.` : `Your outpass was rejected by the HOD. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'info' : 'warning', op.id
      );

      if (action === 'approve') {
        const principalRes = await db.query(`SELECT id FROM users WHERE role='principal' LIMIT 1`);
        const principal = principalRes.rows[0];
        if (principal) {
          await safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by HOD. Please review.`, 'action', op.id);
        }
      }
    } else if (user.role === 'principal') {
      if (op.teacher_status === 'rejected' || op.hod_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected at an earlier stage and cannot be approved by Principal.' });
      }

      await db.query(`UPDATE outpasses SET principal_status=$1, principal_remarks=$2, principal_action_at=$3, status=$4 WHERE id=$5`,
        [statusVal, remarks || '', now, action === 'approve' ? 'approved' : 'rejected', op.id]);

      await safeNotify(db, op.student_user_id,
        action === 'approve' ? '✅ Outpass Fully Approved!' : '❌ Outpass Rejected by Principal',
        action === 'approve' ? `Your outpass to ${op.destination} has been fully approved by Teacher, HOD, and Principal! Show your Gate Pass QR.` : `Your outpass was rejected by the Principal. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'success' : 'warning', op.id
      );
    } else {
      return res.status(403).json({ error: 'Not authorized to take action' });
    }

    // Emit real-time Socket.IO event to affected student's room after successful DB update
    try {
      const io = req.app.get('io');
      if (io && op.student_user_id) {
        let updatedStatus = 'rejected';
        if (action === 'approve') {
          if (user.role === 'class_teacher') updatedStatus = 'pending_hod';
          else if (user.role === 'hod') updatedStatus = 'pending_principal';
          else if (user.role === 'principal') updatedStatus = 'approved';
        }
        io.to(`user_${op.student_user_id}`).emit('outpass_updated', {
          outpassId: op.id,
          action,
          status: updatedStatus
        });
      }
    } catch (socketErr) {
      console.error('Socket.IO emission error:', socketErr);
    }

    return res.json({ message: `Outpass ${statusVal}` });
  } catch (err) {
    console.error('PATCH /api/outpass error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
