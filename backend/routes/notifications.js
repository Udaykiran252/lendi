const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

router.get('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(user.userId);
  return res.json({ notifications });
});

router.patch('/', (req, res) => {
  const user = verifyToken(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.body || {};
  const db = getDb();
  if (id === 'all') {
    db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(user.userId);
  } else {
    db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(id, user.userId);
  }
  return res.json({ message: 'Marked as read' });
});

module.exports = router;
