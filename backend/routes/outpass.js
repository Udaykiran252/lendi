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

function autoAdvancePendingOutpasses(db, targetUser) {
  const now = new Date().toISOString();
  if (targetUser.role === 'class_teacher') {
    const pendingOps = db.prepare(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.teacher_status = 'pending'
        AND LOWER(TRIM(u.department)) = LOWER(TRIM(?))
    `).all(targetUser.department || '');

    for (const op of pendingOps) {
      const hod = db.prepare(`SELECT * FROM users WHERE LOWER(TRIM(department)) = LOWER(TRIM(?)) AND role = 'hod' LIMIT 1`).get(op.department);
      const isHodAbsent = !hod || hod.availability_status === 'absent';

      let nextTeacherStatus = 'bypassed';
      let nextTeacherRemarks = 'Directly passed to HOD (Class Teacher absent)';
      let nextHodStatus = op.hod_status;
      let nextHodRemarks = op.hod_remarks;
      let nextPrincipalStatus = op.principal_status;
      let nextPrincipalRemarks = op.principal_remarks;
      let nextOverallStatus = 'pending_hod';

      if (isHodAbsent) {
        nextHodStatus = 'bypassed';
        nextHodRemarks = 'Directly passed to Principal (HOD absent)';

        const principal = db.prepare(`SELECT * FROM users WHERE role = 'principal' LIMIT 1`).get();
        const isPrincipalAbsent = !principal || principal.availability_status === 'absent';

        if (isPrincipalAbsent) {
          nextPrincipalStatus = 'bypassed';
          nextPrincipalRemarks = 'Auto-approved by System (Principal absent)';
          nextOverallStatus = 'approved';
        } else {
          nextOverallStatus = 'pending_principal';
        }
      }

      db.prepare(`
        UPDATE outpasses
        SET teacher_status=?, teacher_remarks=?, teacher_action_at=?,
            hod_status=?, hod_remarks=?, hod_action_at=?,
            principal_status=?, principal_remarks=?, principal_action_at=?,
            status=?
        WHERE id=?
      `).run(
        nextTeacherStatus, nextTeacherRemarks, now,
        nextHodStatus, nextHodRemarks, nextHodStatus === 'bypassed' ? now : op.hod_action_at,
        nextPrincipalStatus, nextPrincipalRemarks, nextPrincipalStatus === 'bypassed' ? now : op.principal_action_at,
        nextOverallStatus, op.id
      );

      if (nextOverallStatus === 'approved') {
        safeNotify(db, op.student_user_id, '✅ Outpass Auto-Approved!', `Your outpass to ${op.destination} has been fully approved (approvers absent). Show your Gate Pass QR.`, 'success', op.id);
      } else if (nextOverallStatus === 'pending_principal') {
        const principal = db.prepare(`SELECT id FROM users WHERE role='principal' LIMIT 1`).get();
        if (principal) {
          safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass passed to you (Teacher & HOD absent). Please review.`, 'action', op.id);
        }
      } else if (nextOverallStatus === 'pending_hod') {
        if (hod) {
          safeNotify(db, hod.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass passed to you (Teacher absent). Please review.`, 'action', op.id);
        }
      }
    }
  } else if (targetUser.role === 'hod') {
    const pendingOps = db.prepare(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.hod_status = 'pending'
        AND o.teacher_status IN ('approved', 'bypassed')
        AND LOWER(TRIM(u.department)) = LOWER(TRIM(?))
    `).all(targetUser.department || '');

    for (const op of pendingOps) {
      const principal = db.prepare(`SELECT * FROM users WHERE role = 'principal' LIMIT 1`).get();
      const isPrincipalAbsent = !principal || principal.availability_status === 'absent';

      let nextHodStatus = 'bypassed';
      let nextHodRemarks = 'Directly passed to Principal (HOD absent)';
      let nextPrincipalStatus = op.principal_status;
      let nextPrincipalRemarks = op.principal_remarks;
      let nextOverallStatus = 'pending_principal';

      if (isPrincipalAbsent) {
        nextPrincipalStatus = 'bypassed';
        nextPrincipalRemarks = 'Auto-approved by System (Principal absent)';
        nextOverallStatus = 'approved';
      }

      db.prepare(`
        UPDATE outpasses
        SET hod_status=?, hod_remarks=?, hod_action_at=?,
            principal_status=?, principal_remarks=?, principal_action_at=?,
            status=?
        WHERE id=?
      `).run(
        nextHodStatus, nextHodRemarks, now,
        nextPrincipalStatus, nextPrincipalRemarks, nextPrincipalStatus === 'bypassed' ? now : op.principal_action_at,
        nextOverallStatus, op.id
      );

      if (nextOverallStatus === 'approved') {
        safeNotify(db, op.student_user_id, '✅ Outpass Auto-Approved!', `Your outpass to ${op.destination} has been fully approved (approvers absent). Show your Gate Pass QR.`, 'success', op.id);
      } else if (nextOverallStatus === 'pending_principal') {
        if (principal) {
          safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass passed to you (HOD absent). Please review.`, 'action', op.id);
        }
      }
    }
  } else if (targetUser.role === 'principal') {
    const pendingOps = db.prepare(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.principal_status = 'pending'
        AND o.status = 'pending_principal'
    `).all();

    for (const op of pendingOps) {
      db.prepare(`
        UPDATE outpasses
        SET principal_status='bypassed', principal_remarks='Auto-approved by System (Principal absent)', principal_action_at=?, status='approved'
        WHERE id=?
      `).run(now, op.id);

      safeNotify(db, op.student_user_id, '✅ Outpass Auto-Approved!', `Your outpass to ${op.destination} has been fully approved by system (Principal absent). Show your Gate Pass QR.`, 'success', op.id);
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

    const now = new Date().toISOString();
    const teacher = db.prepare(`SELECT * FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='class_teacher' LIMIT 1`).get(user.department);
    const hod = db.prepare(`SELECT * FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='hod' LIMIT 1`).get(user.department);
    const principal = db.prepare(`SELECT * FROM users WHERE role='principal' LIMIT 1`).get();

    const isTeacherAbsent = !teacher || teacher.availability_status === 'absent';
    const isHodAbsent = !hod || hod.availability_status === 'absent';
    const isPrincipalAbsent = !principal || principal.availability_status === 'absent';

    let initialStatus = 'pending_teacher';
    let teacherStatus = 'pending';
    let teacherRemarks = null;
    let teacherActionAt = null;
    let hodStatus = 'pending';
    let hodRemarks = null;
    let hodActionAt = null;
    let principalStatus = 'pending';
    let principalRemarks = null;
    let principalActionAt = null;

    if (isTeacherAbsent) {
      teacherStatus = 'bypassed';
      teacherRemarks = 'Directly passed to HOD (Class Teacher absent)';
      teacherActionAt = now;

      if (isHodAbsent) {
        hodStatus = 'bypassed';
        hodRemarks = 'Directly passed to Principal (HOD absent)';
        hodActionAt = now;

        if (isPrincipalAbsent) {
          principalStatus = 'bypassed';
          principalRemarks = 'Auto-approved by System (Principal absent)';
          principalActionAt = now;
          initialStatus = 'approved';
        } else {
          initialStatus = 'pending_principal';
        }
      } else {
        initialStatus = 'pending_hod';
      }
    }

    const result = db.prepare(`
      INSERT INTO outpasses(
        student_id, user_id, reason, destination, from_date, to_date, from_time, to_time,
        status, teacher_status, teacher_remarks, teacher_action_at,
        hod_status, hod_remarks, hod_action_at,
        principal_status, principal_remarks, principal_action_at
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      student.id, user.userId, reason, destination, from_date, to_date, from_time || '', to_time || '',
      initialStatus, teacherStatus, teacherRemarks, teacherActionAt,
      hodStatus, hodRemarks, hodActionAt,
      principalStatus, principalRemarks, principalActionAt
    );

    const outpassId = result.lastInsertRowid;

    // Notifications routing
    if (initialStatus === 'pending_teacher' && teacher) {
      safeNotify(db, teacher.id, 'New Outpass Request', `${user.name} has submitted an outpass request — ${reason}`, 'action', outpassId);
    } else if (initialStatus === 'pending_hod' && hod) {
      safeNotify(db, hod.id, 'New Outpass Request (Passed to HOD)', `${user.name} submitted an outpass request (Class Teacher absent) — ${reason}`, 'action', outpassId);
    } else if (initialStatus === 'pending_principal' && principal) {
      safeNotify(db, principal.id, 'New Outpass Request (Passed to Principal)', `${user.name} submitted an outpass request (Teacher & HOD absent) — ${reason}`, 'action', outpassId);
    } else if (initialStatus === 'approved') {
      safeNotify(db, user.userId, '✅ Outpass Auto-Approved!', `Your outpass to "${destination}" has been automatically approved as authorities are absent. Show your Gate Pass QR.`, 'success', outpassId);
    }

    safeNotify(db, user.userId, 'Outpass Submitted', `Your outpass request for "${destination}" has been successfully submitted.`, 'info', outpassId);

    return res.status(201).json({ message: 'Outpass submitted', id: outpassId, status: initialStatus });
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

    if (action === 'reject') {
      if (!remarks || !remarks.trim()) {
        return res.status(400).json({ error: 'Reason for rejection is required.' });
      }
      let updateCol = user.role === 'class_teacher' ? 'teacher' : user.role === 'hod' ? 'hod' : 'principal';
      db.prepare(`UPDATE outpasses SET ${updateCol}_status='rejected', ${updateCol}_remarks=?, ${updateCol}_action_at=?, status='rejected' WHERE id=?`)
        .run(remarks.trim(), now, op.id);

      safeNotify(db, op.student_user_id, 'Outpass Rejected', `Your outpass request was rejected. Reason: ${remarks.trim()}`, 'warning', op.id);
      return res.json({ message: 'Outpass rejected' });
    }

    // Action === 'approve'
    if (user.role === 'class_teacher') {
      if (!remarks || !remarks.trim()) {
        return res.status(400).json({ error: 'Reason/remarks is required for Class Teacher approval.' });
      }
      const hod = db.prepare(`SELECT * FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='hod' LIMIT 1`).get(user.department || op.department);
      const isHodAbsent = !hod || hod.availability_status === 'absent';

      if (!isHodAbsent) {
        db.prepare(`UPDATE outpasses SET teacher_status='approved', teacher_remarks=?, teacher_action_at=?, status='pending_hod' WHERE id=?`)
          .run(remarks || '', now, op.id);

        safeNotify(db, op.student_user_id, 'Outpass Approved by Teacher', 'Your outpass request has been approved by your class teacher. Awaiting HOD approval.', 'info', op.id);
        if (hod) {
          safeNotify(db, hod.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by class teacher. Please review.`, 'action', op.id);
        }
      } else {
        const principal = db.prepare(`SELECT * FROM users WHERE role='principal' LIMIT 1`).get();
        const isPrincipalAbsent = !principal || principal.availability_status === 'absent';

        if (isPrincipalAbsent) {
          db.prepare(`UPDATE outpasses SET teacher_status='approved', teacher_remarks=?, teacher_action_at=?, hod_status='bypassed', hod_remarks='Directly passed to Principal (HOD absent)', hod_action_at=?, principal_status='bypassed', principal_remarks='Auto-approved by System (Principal absent)', principal_action_at=?, status='approved' WHERE id=?`)
            .run(remarks || '', now, now, now, op.id);

          safeNotify(db, op.student_user_id, '✅ Outpass Fully Approved!', `Your outpass to ${op.destination} has been fully approved! Show your Gate Pass QR.`, 'success', op.id);
        } else {
          db.prepare(`UPDATE outpasses SET teacher_status='approved', teacher_remarks=?, teacher_action_at=?, hod_status='bypassed', hod_remarks='Directly passed to Principal (HOD absent)', hod_action_at=?, status='pending_principal' WHERE id=?`)
            .run(remarks || '', now, now, op.id);

          safeNotify(db, op.student_user_id, 'Outpass Approved (HOD Absent)', 'Approved by Teacher. HOD is absent so it passed to Principal for final approval.', 'info', op.id);
          if (principal) {
            safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass passed directly to you as HOD is absent. Please review.`, 'action', op.id);
          }
        }
      }
    } else if (user.role === 'hod') {
      if (op.teacher_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected by the Class Teacher and cannot be processed by HOD.' });
      }
      if (op.teacher_status === 'bypassed' && (!remarks || !remarks.trim())) {
        return res.status(400).json({ error: 'Reason/remarks is required when Class Teacher is absent.' });
      }

      const principal = db.prepare(`SELECT * FROM users WHERE role='principal' LIMIT 1`).get();
      const isPrincipalAbsent = !principal || principal.availability_status === 'absent';

      if (isPrincipalAbsent) {
        db.prepare(`UPDATE outpasses SET hod_status='approved', hod_remarks=?, hod_action_at=?, principal_status='bypassed', principal_remarks='Auto-approved by System (Principal absent)', principal_action_at=?, status='approved' WHERE id=?`)
          .run(remarks || '', now, now, op.id);

        safeNotify(db, op.student_user_id, '✅ Outpass Fully Approved!', `Your outpass to ${op.destination} has been fully approved by HOD (Principal absent). Show your Gate Pass QR code!`, 'success', op.id);
      } else {
        db.prepare(`UPDATE outpasses SET hod_status='approved', hod_remarks=?, hod_action_at=?, status='pending_principal' WHERE id=?`)
          .run(remarks || '', now, op.id);

        safeNotify(db, op.student_user_id, 'Outpass Approved by HOD', `Your outpass to ${op.destination} has been approved by the HOD. Awaiting Principal approval.`, 'info', op.id);
        if (principal) {
          safeNotify(db, principal.id, 'Outpass Awaiting Your Approval', `${op.student_name}'s outpass has been approved by HOD. Please review.`, 'action', op.id);
        }
      }
    } else if (user.role === 'principal') {
      if (op.teacher_status === 'rejected' || op.hod_status === 'rejected' || op.status === 'rejected') {
        return res.status(400).json({ error: 'This outpass was rejected at an earlier stage and cannot be approved by Principal.' });
      }
      if (op.teacher_status === 'bypassed' && op.hod_status === 'bypassed' && (!remarks || !remarks.trim())) {
        return res.status(400).json({ error: 'Reason/remarks is required when Class Teacher and HOD are absent.' });
      }

      db.prepare(`UPDATE outpasses SET principal_status='approved', principal_remarks=?, principal_action_at=?, status='approved' WHERE id=?`)
        .run(remarks || '', now, op.id);

      safeNotify(db, op.student_user_id, '✅ Outpass Fully Approved!', `Your outpass to ${op.destination} has been fully approved by Principal! Show your Gate Pass QR.`, 'success', op.id);
    } else {
      return res.status(403).json({ error: 'Not authorized to take action' });
    }

    return res.json({ message: 'Outpass updated successfully' });
  } catch (err) {
    console.error('PATCH /api/outpass error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

module.exports = router;
module.exports.autoAdvancePendingOutpasses = autoAdvancePendingOutpasses;
