const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function safeNotify(db, userId, title, message, type, outpassId) {
  try {
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`)
      .run(userId, title, message, type, outpassId);
  } catch (e) {
    try {
      db.prepare(`INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)`)
        .run(userId, title, message, type);
    } catch (e2) {
      console.error('Notification error:', e2.message);
    }
  }
}

// GET /api/outpass
router.get('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  let outpasses = [];
  if (user.role === 'student') {
    const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(user.userId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    outpasses = db.prepare(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.student_id = ?
      ORDER BY o.created_at DESC
    `).all(student.id);
  } else {
    outpasses = db.prepare(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(user.userId);
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

    const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(user.userId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const result = db.prepare(`
      INSERT INTO outpasses(student_id,user_id,reason,destination,from_date,to_date,from_time,to_time,status,teacher_status,hod_status,principal_status)
      VALUES(?,?,?,?,?,?,?,?,'pending_teacher','pending','pending','pending')
    `).run(student.id, user.userId, reason, destination, from_date, to_date, from_time || '', to_time || '');

    const teacher = db.prepare(`SELECT id FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='class_teacher' LIMIT 1`).get(user.department);
    if (teacher) {
      safeNotify(db, teacher.id, 'New Outpass Request', `${user.name} has submitted an outpass request — ${reason}`, 'action', result.lastInsertRowid);
    }
    safeNotify(db, user.userId, 'Outpass Submitted', `Your outpass request for "${destination}" has been successfully submitted.`, 'info', result.lastInsertRowid);

    return res.status(201).json({ message: 'Outpass submitted', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Outpass POST error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/outpass/:id
router.get('/:id', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const op = db.prepare(`
    SELECT o.*, u.name as student_name, u.email as student_email, u.role as applicant_role, u.department,
           s.roll_no, s.year, s.semester, s.section
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN students s ON o.student_id = s.id
    WHERE o.id = ?
  `).get(req.params.id);

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
    const op = db.prepare(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(outpassId);

    if (!op) return res.status(404).json({ error: 'Outpass not found' });
    const now = new Date().toISOString();
    const statusVal = action === 'approve' ? 'approved' : 'rejected';

    if (user.role === 'class_teacher') {
      db.prepare(`UPDATE outpasses SET teacher_status=?, teacher_remarks=?, teacher_action_at=?, status=? WHERE id=?`)
        .run(statusVal, remarks || '', now, action === 'approve' ? 'pending_hod' : 'rejected', op.id);

      safeNotify(db, op.student_user_id,
        action === 'approve' ? 'Outpass Approved by Teacher' : 'Outpass Rejected by Teacher',
        action === 'approve' ? 'Your outpass request has been approved by your class teacher. Awaiting HOD approval.' : `Your outpass request was rejected by your class teacher. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'info' : 'warning', op.id
      );

      if (action === 'approve') {
        const hod = db.prepare(`SELECT id FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='hod' LIMIT 1`).get(user.department || op.department);
        if (hod) {
          safeNotify(db, hod.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by class teacher. Please review.`, 'action', op.id);
        }
      }
    } else if (user.role === 'hod') {
      if (op.teacher_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected by the Class Teacher and cannot be processed by HOD.' });
      }

      db.prepare(`UPDATE outpasses SET hod_status=?, hod_remarks=?, hod_action_at=?, status=? WHERE id=?`)
        .run(statusVal, remarks || '', now, action === 'approve' ? 'pending_principal' : 'rejected', op.id);

      safeNotify(db, op.student_user_id,
        action === 'approve' ? 'Outpass Approved by HOD' : 'Outpass Rejected by HOD',
        action === 'approve' ? `Your outpass to ${op.destination} has been approved by the HOD. Awaiting Principal approval.` : `Your outpass was rejected by the HOD. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'info' : 'warning', op.id
      );

      if (action === 'approve') {
        const principal = db.prepare(`SELECT id FROM users WHERE role='principal' LIMIT 1`).get();
        if (principal) {
          safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by HOD. Please review.`, 'action', op.id);
        }
      }
    } else if (user.role === 'principal') {
      if (op.teacher_status === 'rejected' || op.hod_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected at an earlier stage and cannot be approved by Principal.' });
      }

      db.prepare(`UPDATE outpasses SET principal_status=?, principal_remarks=?, principal_action_at=?, status=? WHERE id=?`)
        .run(statusVal, remarks || '', now, action === 'approve' ? 'approved' : 'rejected', op.id);

      safeNotify(db, op.student_user_id,
        action === 'approve' ? '✅ Outpass Fully Approved!' : '❌ Outpass Rejected by Principal',
        action === 'approve' ? `Your outpass to ${op.destination} has been fully approved by Teacher, HOD, and Principal! Show your Gate Pass QR.` : `Your outpass was rejected by the Principal. Reason: ${remarks || 'No reason given'}`,
        action === 'approve' ? 'success' : 'warning', op.id
      );
    } else {
      return res.status(403).json({ error: 'Not authorized to take action' });
    }

    return res.json({ message: `Outpass ${statusVal}` });
  } catch (err) {
    console.error('PATCH /api/outpass error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
