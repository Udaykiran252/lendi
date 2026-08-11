const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function isAdmin(req) {
  const user = verifyToken(req.headers['authorization']);
  return user && user.role === 'admin';
}

router.get('/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const usersRes = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.created_at,
             s.roll_no, s.year, s.semester, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY u.role, u.name
    `);
    return res.json({ users: usersRes.rows });
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
    const existingUserRes = await db.query('SELECT id FROM users WHERE email=$1', [e]);
    if (existingUserRes.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    let newUserId;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const ur = await client.query(
        'INSERT INTO users(email,password,name,role,department) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [e, hash, name.trim(), role, department || null]
      );
      newUserId = ur.rows[0].id;

      if (role === 'student') {
        if (!roll_no || !year || !semester) {
          throw new Error('Student roll number, year and semester are required');
        }
        const existingStudentRes = await client.query('SELECT id FROM students WHERE roll_no=$1', [roll_no.toUpperCase()]);
        if (existingStudentRes.rows[0]) {
          throw new Error('Roll number already registered');
        }
        await client.query(
          'INSERT INTO students(user_id,roll_no,year,semester,section) VALUES($1,$2,$3,$4,$5)',
          [newUserId, roll_no.toUpperCase(), parseInt(year), parseInt(semester), section || 'A']
        );
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    return res.status(201).json({ message: 'User created successfully', userId: newUserId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

router.delete('/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM students WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
