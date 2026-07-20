const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { signToken, verifyToken } = require('../lib/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    
    let studentInfo = null;
    if (user.role === 'student') {
      studentInfo = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    }
    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, department: user.department });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, student: studentInfo } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roll_no, year, semester, section, department } = req.body;
    if (!name || !email || !password || !roll_no || !year || !semester || !department) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const e = email.toLowerCase().trim();
    if (!e.endsWith('@lendi.edu.in')) return res.status(400).json({ error: 'Only @lendi.edu.in emails allowed' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });

    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(e)) return res.status(409).json({ error: 'Email already registered' });
    if (db.prepare('SELECT id FROM students WHERE roll_no=?').get(roll_no.toUpperCase())) return res.status(409).json({ error: 'Roll number already registered' });

    const hash = await bcrypt.hash(password, 10);
    const ur = db.prepare('INSERT INTO users(email,password,name,role,department) VALUES(?,?,?,?,?)').run(e, hash, name.trim(), 'student', department);
    db.prepare('INSERT INTO students(user_id,roll_no,year,semester,section) VALUES(?,?,?,?,?)').run(ur.lastInsertRowid, roll_no.toUpperCase(), parseInt(year), parseInt(semester), section || 'A');

    const token = signToken({ userId: ur.lastInsertRowid, email: e, name: name.trim(), role: 'student', department });
    return res.status(201).json({ message: 'Account created', token, user: { id: ur.lastInsertRowid, email: e, name: name.trim(), role: 'student', department } });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const payload = verifyToken(req.headers['authorization']);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let student = null;
    if (user.role === 'student') {
      student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    }
    return res.json({ user: { ...user, student } });
  } catch (err) {
    console.error('Auth /me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
