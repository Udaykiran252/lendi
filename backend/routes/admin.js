const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function isAdmin(req) {
  const user = verifyToken(req.headers['authorization']);
  return user && user.role === 'admin';
}

router.get('/users', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.created_at,
             s.roll_no, s.year, s.semester, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY u.role, u.name
    `).all();
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

router.post('/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const { name, email, password, role, department, roll_no, year, semester, section } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' });
    }

    const e = email.toLowerCase().trim();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(e)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    let newUserId;
    db.transaction(() => {
      const ur = db.prepare('INSERT INTO users(email,password,name,role,department) VALUES(?,?,?,?,?)').run(
        e, hash, name.trim(), role, department || null
      );
      newUserId = ur.lastInsertRowid;

      if (role === 'student') {
        if (!roll_no || !year || !semester) {
          throw new Error('Student roll number, year and semester are required');
        }
        if (db.prepare('SELECT id FROM students WHERE roll_no=?').get(roll_no.toUpperCase())) {
          throw new Error('Roll number already registered');
        }
        db.prepare('INSERT INTO students(user_id,roll_no,year,semester,section) VALUES(?,?,?,?,?)').run(
          newUserId, roll_no.toUpperCase(), parseInt(year), parseInt(semester), section || 'A'
        );
      }
    })();

    return res.status(201).json({ message: 'User created successfully', userId: newUserId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

router.delete('/users', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.transaction(() => {
      db.prepare('DELETE FROM students WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
