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
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    
    let studentInfo = null;
    if (user.role === 'student') {
      const studentRes = await db.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      studentInfo = studentRes.rows[0] || null;
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
    const isExplicitlyAuthorizedRes = await db.query('SELECT id FROM authorized_emails WHERE email = $1', [e]);
    const isExplicitlyAuthorized = isExplicitlyAuthorizedRes.rows[0];
    const emailPrefix = e.split('@')[0].toUpperCase();
    const isRollNoEmail = emailPrefix === cleanRoll || cleanRoll.includes(emailPrefix);

    if (!isExplicitlyAuthorized && !isRollNoEmail) {
      return res.status(403).json({ error: 'Unauthorized college email ID. Registration is restricted to pre-authorized college email addresses.' });
    }

    // 3. Check duplicate registered email
    const duplicateEmailRes = await db.query('SELECT id FROM users WHERE email=$1', [e]);
    if (duplicateEmailRes.rows[0]) {
      return res.status(409).json({ error: 'This email address is already registered.' });
    }

    // 4. Check duplicate registered roll number
    const duplicateRollRes = await db.query('SELECT id FROM students WHERE roll_no=$1', [cleanRoll]);
    if (duplicateRollRes.rows[0]) {
      return res.status(409).json({ error: 'This roll number is already registered.' });
    }

    // 5. Check duplicate student name reference in same department to prevent duplicate/spoofed accounts
    const duplicateNameUserRes = await db.query('SELECT id FROM users WHERE LOWER(name) = $1 AND department = $2', [cleanName.toLowerCase(), department]);
    if (duplicateNameUserRes.rows[0]) {
      return res.status(409).json({ error: 'A student with this name is already registered in this department. Duplicate name references are not allowed.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const ur = await db.query('INSERT INTO users(email,password,name,role,department) VALUES($1,$2,$3,$4,$5) RETURNING id', [e, hash, cleanName, 'student', department]);
    const newUserId = ur.rows[0].id;
    await db.query('INSERT INTO students(user_id,roll_no,year,semester,section) VALUES($1,$2,$3,$4,$5)', [newUserId, cleanRoll, parseInt(year), parseInt(semester), section || 'A']);

    // Add to authorized_emails table to mark as active
    try {
      await db.query('INSERT INTO authorized_emails (email, roll_no, name, department) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING', [e, cleanRoll, cleanName, department]);
    } catch {}

    const token = signToken({ userId: newUserId, email: e, name: cleanName, role: 'student', department });
    return res.status(201).json({ message: 'Account registered successfully', token, user: { id: newUserId, email: e, name: cleanName, role: 'student', department } });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});


// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const payload = verifyToken(req.headers['authorization']);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const db = getDb();
    const userRes = await db.query('SELECT id, name, email, role, department, created_at FROM users WHERE id = $1', [payload.userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    let student = null;
    if (user.role === 'student') {
      const studentRes = await db.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      student = studentRes.rows[0] || null;
    }
    return res.json({ user: { ...user, student } });
  } catch (err) {
    console.error('Auth /me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
