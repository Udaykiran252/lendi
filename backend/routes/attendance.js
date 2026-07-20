const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(user.userId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const records = db.prepare(`SELECT a.*,s.name as subject_name,s.code as subject_code,s.faculty_name FROM attendance a JOIN subjects s ON a.subject_id=s.id WHERE a.student_id=? ORDER BY a.date DESC`).all(student.id);
  const map = {};
  for (const r of records) {
    if (!map[r.subject_id]) map[r.subject_id] = { subject_id: r.subject_id, subject_name: r.subject_name, subject_code: r.subject_code, faculty_name: r.faculty_name, total: 0, present: 0, absent: 0, records: [] };
    map[r.subject_id].total++;
    if (r.status === 'present') map[r.subject_id].present++;
    else map[r.subject_id].absent++;
    map[r.subject_id].records.push({ date: r.date, status: r.status });
  }

  const subjects = Object.values(map).map(s => ({ ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }));
  const overall = subjects.length ? Math.round(subjects.reduce((a, s) => a + s.percentage, 0) / subjects.length) : 0;
  return res.json({ subjects, overall, student });
});

module.exports = router;
