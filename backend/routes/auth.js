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
    const cleanRoll = roll_no.toUpperCase().trim();
    const cleanName = name.trim();

    // 1. Strict domain check
    if (!e.endsWith('@lendi.edu.in')) {
      return res.status(400).json({ error: 'Only official @lendi.edu.in college email addresses are allowed.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const db = getDb();

    // 2. Authorized College Email & Roll Number Verification
    const isExplicitlyAuthorized = db.prepare('SELECT id FROM authorized_emails WHERE email = ?').get(e);
    const emailPrefix = e.split('@')[0].toUpperCase();
    const isRollNoEmail = emailPrefix === cleanRoll || cleanRoll.includes(emailPrefix);

    if (!isExplicitlyAuthorized && !isRollNoEmail) {
      return res.status(403).json({ error: 'Unauthorized college email ID. Registration is restricted to pre-authorized college email addresses.' });
    }

    // 3. Check duplicate registered email
    if (db.prepare('SELECT id FROM users WHERE email=?').get(e)) {
      return res.status(409).json({ error: 'This email address is already registered.' });
    }

    // 4. Check duplicate registered roll number
    if (db.prepare('SELECT id FROM students WHERE roll_no=?').get(cleanRoll)) {
      return res.status(409).json({ error: 'This roll number is already registered.' });
    }

    // 5. Check duplicate student name reference in same department to prevent duplicate/spoofed accounts
    const duplicateNameUser = db.prepare('SELECT id FROM users WHERE LOWER(name) = ? AND department = ?').get(cleanName.toLowerCase(), department);
    if (duplicateNameUser) {
      return res.status(409).json({ error: 'A student with this name is already registered in this department. Duplicate name references are not allowed.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const ur = db.prepare('INSERT INTO users(email,password,name,role,department) VALUES(?,?,?,?,?)').run(e, hash, cleanName, 'student', department);
    db.prepare('INSERT INTO students(user_id,roll_no,year,semester,section) VALUES(?,?,?,?,?)').run(ur.lastInsertRowid, cleanRoll, parseInt(year), parseInt(semester), section || 'A');

    // Add to authorized_emails table to mark as active
    try {
      db.prepare('INSERT OR IGNORE INTO authorized_emails (email, roll_no, name, department) VALUES (?, ?, ?, ?)').run(e, cleanRoll, cleanName, department);
    } catch {}

    const token = signToken({ userId: ur.lastInsertRowid, email: e, name: cleanName, role: 'student', department });
    return res.status(201).json({ message: 'Account registered successfully', token, user: { id: ur.lastInsertRowid, email: e, name: cleanName, role: 'student', department } });
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
