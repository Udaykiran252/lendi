const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!['class_teacher', 'hod', 'principal'].includes(user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDb();
  const filter = req.query.filter || 'pending';

  let query = `
    SELECT o.*, u.name as student_name, u.email as student_email, u.role as applicant_role, u.department,
           s.roll_no, s.year, s.semester, s.section
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN students s ON o.student_id = s.id
  `;

  if (user.role === 'class_teacher') {
    query += ` WHERE LOWER(TRIM(u.department)) = LOWER(TRIM('${user.department}'))`;
    if (filter === 'pending') query += ` AND o.teacher_status = 'pending'`;
    else if (filter === 'approved') query += ` AND o.teacher_status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.teacher_status = 'rejected'`;
  } else if (user.role === 'hod') {
    query += ` WHERE LOWER(TRIM(u.department)) = LOWER(TRIM('${user.department}')) AND o.teacher_status = 'approved'`;
    if (filter === 'pending') query += ` AND o.hod_status = 'pending'`;
    else if (filter === 'approved') query += ` AND o.hod_status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.hod_status = 'rejected'`;
  } else if (user.role === 'principal') {
    query += ` WHERE (o.teacher_status = 'approved' AND o.hod_status = 'approved')`;
    if (filter === 'pending') query += ` AND o.status = 'pending_principal'`;
    else if (filter === 'approved') query += ` AND o.status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.principal_status = 'rejected'`;
  }

  query += ` ORDER BY o.created_at DESC`;
  const outpasses = db.prepare(query).all();

  let students = [];
  if (user.role === 'class_teacher' || user.role === 'hod') {
    students = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, s.roll_no, s.year, s.semester, s.section
      FROM users u JOIN students s ON u.id = s.user_id
      WHERE LOWER(TRIM(u.department)) = LOWER(TRIM(?)) AND u.role = 'student'
      ORDER BY s.roll_no
    `).all(user.department);
  } else {
    students = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, s.roll_no, s.year, s.semester, s.section
      FROM users u JOIN students s ON u.id = s.user_id
      WHERE u.role = 'student' ORDER BY u.department, s.roll_no
    `).all();
  }

  return res.json({ outpasses, students });
});

module.exports = router;
