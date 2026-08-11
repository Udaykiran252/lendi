const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const notificationsRes = await db.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [user.userId]);
  return res.json({ notifications: notificationsRes.rows });
});

router.patch('/', async (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.body || {};
  const db = getDb();
  if (id === 'all') {
    await db.query('UPDATE notifications SET read=1 WHERE user_id=$1', [user.userId]);
  } else {
    await db.query('UPDATE notifications SET read=1 WHERE id=$1 AND user_id=$2', [id, user.userId]);
  }
  return res.json({ message: 'Marked as read' });
});

module.exports = router;
