const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!['hod', 'principal', 'class_teacher'].includes(user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDb();
  const type = req.query.type || 'students';

  if (type === 'students') {
    const params = [];
    let whereClause = '';
    if (user.role !== 'principal') {
      params.push(user.department);
      whereClause = `WHERE u.department = $1`;
    }

    const studentsRes = await db.query(`
      SELECT u.id as user_id, u.name, u.email, u.department,
             s.id as student_id, s.roll_no, s.year, s.semester, s.section,
             (SELECT COUNT(*)::int FROM attendance a WHERE a.student_id = s.id) as total_classes,
             (SELECT COUNT(*)::int FROM attendance a WHERE a.student_id = s.id AND a.status = 'present') as present_count,
             (SELECT COUNT(*)::int FROM outpasses o WHERE o.student_id = s.id AND o.status = 'approved') as approved_outpasses
      FROM users u JOIN students s ON u.id = s.user_id
      ${whereClause}
      ORDER BY u.department, s.roll_no
    `, params);

    return res.json({
      students: studentsRes.rows.map(s => ({
        ...s,
        attendance_pct: s.total_classes > 0 ? Math.round((s.present_count / s.total_classes) * 100) : 0
      }))
    });
  }

  if (type === 'staff_attendance') {
    if (user.role !== 'principal') return res.status(403).json({ error: 'Access denied' });
    const staffRes = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.department,
             (SELECT COUNT(*)::int FROM staff_attendance sa WHERE sa.user_id = u.id) as total_days,
             (SELECT COUNT(*)::int FROM staff_attendance sa WHERE sa.user_id = u.id AND sa.status = 'present') as present_days,
             (SELECT COUNT(*)::int FROM staff_attendance sa WHERE sa.user_id = u.id AND sa.status = 'leave') as leave_days
      FROM users u
      WHERE u.role IN ('class_teacher', 'hod')
      ORDER BY u.role, u.name
    `);

    return res.json({
      staff: staffRes.rows.map(s => ({
        ...s,
        attendance_pct: s.total_days > 0 ? Math.round((s.present_days / s.total_days) * 100) : 0,
        leave_days: s.leave_days || 0
      }))
    });
  }

  if (type === 'stats') {
    const dept = user.role === 'principal' ? null : user.department;

    let totalStudents = 0;
    let pendingOutpasses = 0;
    let approvedToday = 0;

    if (user.role === 'principal') {
      const totRes = await db.query(`SELECT COUNT(*)::int as c FROM users u WHERE u.role='student'`);
      totalStudents = totRes.rows[0].c;

      const pendRes = await db.query(`SELECT COUNT(*)::int as c FROM outpasses WHERE status = 'pending_principal'`);
      pendingOutpasses = pendRes.rows[0].c;

      const appTodayRes = await db.query(`SELECT COUNT(*)::int as c FROM outpasses WHERE status = 'approved' AND principal_action_at::date = CURRENT_DATE`);
      approvedToday = appTodayRes.rows[0].c;
    } else {
      const totRes = await db.query(`SELECT COUNT(*)::int as c FROM users u WHERE u.role='student' AND u.department = $1`, [user.department]);
      totalStudents = totRes.rows[0].c;

      const pendRes = await db.query(`
        SELECT COUNT(*)::int as c FROM outpasses o
        JOIN students st ON o.student_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE u.department = $1 AND o.teacher_status = 'approved' AND o.hod_status = 'pending'
      `, [user.department]);
      pendingOutpasses = pendRes.rows[0].c;

      const appTodayRes = await db.query(`
        SELECT COUNT(*)::int as c FROM outpasses o
        JOIN students st ON o.student_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE u.department = $1 AND o.hod_status = 'approved' AND o.hod_action_at::date = CURRENT_DATE
      `, [user.department]);
      approvedToday = appTodayRes.rows[0].c;
    }

    const lowAttParams = [];
    let deptFilter = '';
    if (dept) {
      lowAttParams.push(dept);
      deptFilter = `AND u.department = $1`;
    }

    const lowAttRes = await db.query(`
      SELECT COUNT(DISTINCT s.id) as c FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE 1=1 ${deptFilter}
      GROUP BY s.id HAVING (COALESCE(COUNT(CASE WHEN a.status='present' THEN 1 END)*100.0 / NULLIF(COUNT(a.id), 0), 0)) < 75
    `, lowAttParams);

    const lowAttendance = lowAttRes.rows.length;

    return res.json({ totalStudents, pendingOutpasses, approvedToday, lowAttendance });
  }

  return res.status(400).json({ error: 'Invalid type' });
});

module.exports = router;
