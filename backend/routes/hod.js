const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!['hod', 'principal', 'class_teacher'].includes(user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDb();
  const type = req.query.type || 'students';

  if (type === 'students') {
    const whereClause = user.role === 'principal' ? '' : `WHERE u.department = '${user.department}'`;
    const students = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.department,
             s.id as student_id, s.roll_no, s.year, s.semester, s.section,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id) as total_classes,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'present') as present_count,
             (SELECT COUNT(*) FROM outpasses o WHERE o.student_id = s.id AND o.status = 'approved') as approved_outpasses
      FROM users u JOIN students s ON u.id = s.user_id
      ${whereClause}
      ORDER BY u.department, s.roll_no
    `).all();

    return res.json({
      students: students.map(s => ({
        ...s,
        attendance_pct: s.total_classes > 0 ? Math.round((s.present_count / s.total_classes) * 100) : 0
      }))
    });
  }

  if (type === 'staff_attendance') {
    if (user.role !== 'principal') return res.status(403).json({ error: 'Access denied' });
    const staff = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department,
             (SELECT COUNT(*) FROM staff_attendance sa WHERE sa.user_id = u.id) as total_days,
             (SELECT COUNT(*) FROM staff_attendance sa WHERE sa.user_id = u.id AND sa.status = 'present') as present_days,
             (SELECT COUNT(*) FROM staff_attendance sa WHERE sa.user_id = u.id AND sa.status = 'leave') as leave_days
      FROM users u
      WHERE u.role IN ('class_teacher', 'hod')
      ORDER BY u.role, u.name
    `).all();

    return res.json({
      staff: staff.map(s => ({
        ...s,
        attendance_pct: s.total_days > 0 ? Math.round((s.present_days / s.total_days) * 100) : 0,
        leave_days: s.leave_days || 0
      }))
    });
  }

  if (type === 'stats') {
    const dept = user.role === 'principal' ? null : user.department;
    const deptFilter = dept ? `AND u.department = '${dept}'` : '';

    const totalStudents = db.prepare(`SELECT COUNT(*) as c FROM users u WHERE u.role='student' ${deptFilter}`).get().c;
    let pendingOutpasses = 0;
    let approvedToday = 0;

    if (user.role === 'principal') {
      pendingOutpasses = db.prepare(`SELECT COUNT(*) as c FROM outpasses WHERE status = 'pending_principal'`).get().c;
      approvedToday = db.prepare(`SELECT COUNT(*) as c FROM outpasses WHERE status = 'approved' AND date(principal_action_at) = date('now')`).get().c;
    } else {
      pendingOutpasses = db.prepare(`
        SELECT COUNT(*) as c FROM outpasses o
        JOIN students st ON o.student_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE u.department = ? AND o.teacher_status = 'approved' AND o.hod_status = 'pending'
      `).get(user.department).c;
      approvedToday = db.prepare(`
        SELECT COUNT(*) as c FROM outpasses o
        JOIN students st ON o.student_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE u.department = ? AND o.hod_status = 'approved' AND date(o.hod_action_at) = date('now')
      `).get(user.department).c;
    }

    const lowAttendance = db.prepare(`
      SELECT COUNT(DISTINCT s.id) as c FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE 1=1 ${deptFilter}
      GROUP BY s.id HAVING (COUNT(CASE WHEN a.status='present' THEN 1 END)*100.0/COUNT(a.id)) < 75
    `).all().length;

    return res.json({ totalStudents, pendingOutpasses, approvedToday, lowAttendance });
  }

  return res.status(400).json({ error: 'Invalid type' });
});

module.exports = router;
