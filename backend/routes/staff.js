const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

function safeNotify(db, userId, title, message, type, outpassId) {
  try {
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`)
      .run(userId, title, message, type, outpassId);
  } catch (e) {
    try {
      db.prepare(`INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)`)
        .run(userId, title, message, type);
    } catch (e2) {
      console.error('Notification error:', e2.message);
    }
  }
}

router.post('/verify', (req, res) => {
  try {
    const user = verifyToken(req.headers['authorization']);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!['gate_staff', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only gate security staff can verify outpasses' });
    }

    const { outpass_id, action } = req.body || {};
    if (!outpass_id) return res.status(400).json({ error: 'Outpass ID required' });

    const db = getDb();
    const op = db.prepare(`
      SELECT o.*, u.id as student_user_id, u.name as student_name
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(outpass_id);

    if (!op) return res.status(404).json({ error: 'Outpass not found' });
    if (op.status !== 'approved' && op.principal_status !== 'approved') {
      return res.status(400).json({ error: 'This outpass is not fully approved!' });
    }

    const now = new Date().toISOString();
    if (action === 'exit') {
      db.prepare('UPDATE outpasses SET exit_time = ? WHERE id = ?').run(now, op.id);
      safeNotify(db, op.student_user_id, '🚪 Gate Exit Logged', `Gate exit recorded at ${new Date(now).toLocaleTimeString('en-IN')}`, 'info', op.id);
      return res.json({ message: 'Gate exit verified successfully', exit_time: now });
    } else if (action === 'entry') {
      db.prepare('UPDATE outpasses SET entry_time = ? WHERE id = ?').run(now, op.id);
      safeNotify(db, op.student_user_id, '🏠 Gate Entry Logged', `Gate entry recorded at ${new Date(now).toLocaleTimeString('en-IN')}`, 'info', op.id);
      return res.json({ message: 'Gate entry verified successfully', entry_time: now });
    } else {
      return res.status(400).json({ error: 'Invalid action, must be exit or entry' });
    }
  } catch (err) {
    console.error('Staff verify error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
