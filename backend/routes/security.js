const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

async function safeNotify(db, userId, title, message, type, outpassId) {
  try {
    await db.query(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES($1,$2,$3,$4,$5)`,
      [userId, title, message, type, outpassId]);
  } catch (e) {
    try {
      await db.query(`INSERT INTO notifications(user_id,title,message,type) VALUES($1,$2,$3,$4)`,
        [userId, title, message, type]);
    } catch (e2) {
      console.error('Notification error:', e2.message);
    }
  }
}

// GET /api/security/outpasses
// Returns ONLY active outpasses fully approved by Teacher, HOD, and Principal.
// Expired or fully completed (returned) past data is strictly excluded.
router.get('/outpasses', async (req, res) => {
  try {
    const user = verifyToken(req.headers['authorization']);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!['security', 'gate_staff', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only Security Guard staff can access this portal' });
    }

    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Fetch ONLY fully approved outpasses (status = 'approved' & all 3 statuses = 'approved')
    // and where student has NOT already completed their entry back, or to_date >= today
    const activeOutpassesRes = await db.query(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.status = 'approved'
        AND o.teacher_status = 'approved'
        AND o.hod_status = 'approved'
        AND o.principal_status = 'approved'
        AND o.entry_time IS NULL
        AND o.to_date >= $1
      ORDER BY o.created_at DESC
    `, [todayStr]);
    const activeOutpasses = activeOutpassesRes.rows;

    // Stats calculation
    const currentlyOut = activeOutpasses.filter(o => o.exit_time !== null && o.entry_time === null).length;
    
    // Today's total exit & return counts
    const exitedTodayRes = await db.query(`
      SELECT COUNT(*)::int as cnt FROM outpasses
      WHERE status = 'approved' AND exit_time::text LIKE $1
    `, [`${todayStr}%`]);
    const exitedTodayCount = exitedTodayRes.rows[0]?.cnt || 0;

    const returnedTodayRes = await db.query(`
      SELECT COUNT(*)::int as cnt FROM outpasses
      WHERE status = 'approved' AND entry_time::text LIKE $1
    `, [`${todayStr}%`]);
    const returnedTodayCount = returnedTodayRes.rows[0]?.cnt || 0;

    return res.json({
      outpasses: activeOutpasses,
      stats: {
        activeApproved: activeOutpasses.length,
        currentlyOut,
        exitedToday: exitedTodayCount,
        returnedToday: returnedTodayCount
      }
    });
  } catch (err) {
    console.error('Security GET outpasses error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/security/verify
// Verify gate exit / gate entry for a fully approved outpass
router.post('/verify', async (req, res) => {
  try {
    const user = verifyToken(req.headers['authorization']);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!['security', 'gate_staff', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only Security Guard staff can verify outpasses' });
    }

    const { outpass_id, action, raw_qr } = req.body || {};
    let targetId = outpass_id;

    // Parse raw_qr string if provided from scanner
    if (!targetId && raw_qr) {
      const match = raw_qr.match(/Outpass ID\s*:\s*#?(\d+)/i) || raw_qr.match(/ID:?\s*#?(\d+)/i) || raw_qr.match(/^(\d+)$/);
      if (match) targetId = match[1];
    }

    if (!targetId) return res.status(400).json({ error: 'Valid Outpass ID or QR Code payload required' });

    const db = getDb();
    const opRes = await db.query(`
      SELECT o.*, u.id as student_user_id, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.id = $1
    `, [targetId]);

    const op = opRes.rows[0];
    if (!op) return res.status(404).json({ error: `Outpass #${targetId} not found in system` });

    // Enforce 3-level approval check
    if (op.status !== 'approved' || op.teacher_status !== 'approved' || op.hod_status !== 'approved' || op.principal_status !== 'approved') {
      return res.status(400).json({ error: '⛔ INVALID OUTPASS: Outpass is not fully approved by Teacher, HOD, and Principal!' });
    }

    const now = new Date().toISOString();
    const formattedTime = new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (action === 'exit') {
      if (op.exit_time) {
        return res.status(400).json({ error: `Gate exit was already recorded at ${new Date(op.exit_time).toLocaleTimeString('en-IN')}` });
      }
      await db.query('UPDATE outpasses SET exit_time = $1 WHERE id = $2', [now, op.id]);
      await safeNotify(db, op.student_user_id, '🚪 Gate Exit Logged', `Security guard verified gate exit at ${formattedTime}`, 'info', op.id);
      return res.json({ message: `✅ Gate Exit Verified for ${op.student_name} (Roll: ${op.roll_no || 'N/A'})`, exit_time: now, outpass: op });
    } else if (action === 'entry') {
      if (!op.exit_time) {
        return res.status(400).json({ error: 'Student has not logged gate exit yet!' });
      }
      if (op.entry_time) {
        return res.status(400).json({ error: `Gate entry was already recorded at ${new Date(op.entry_time).toLocaleTimeString('en-IN')}` });
      }
      await db.query('UPDATE outpasses SET entry_time = $1 WHERE id = $2', [now, op.id]);
      await safeNotify(db, op.student_user_id, '🏠 Gate Entry Logged', `Security guard verified campus return at ${formattedTime}`, 'info', op.id);
      return res.json({ message: `✅ Gate Entry Verified for ${op.student_name}. Outpass complete!`, entry_time: now, outpass: op });
    } else {
      // Just lookup/preview details for security guard scan
      return res.json({ outpass: op });
    }
  } catch (err) {
    console.error('Security verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
