// Lendi Outpass Route Handler (v2.2)
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper: insert a notification safely — never crashes the parent request
function safeNotify(db, userId, title, message, type, outpassId) {
  try {
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`)
      .run(userId, title, message, type, outpassId);
  } catch (e) {
    try {
      db.exec(`ALTER TABLE notifications ADD COLUMN outpass_id INTEGER`);
      db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`)
        .run(userId, title, message, type, outpassId);
    } catch (e2) {
      try {
        db.prepare(`INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)`)
          .run(userId, title, message, type);
      } catch (e3) {
        console.error('Notification insert failed:', e3.message);
      }
    }
  }
}

export async function GET(request) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  let outpasses = [];
  if (user.role === 'student') {
    const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(user.userId);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    outpasses = db.prepare(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.student_id = ?
      ORDER BY o.created_at DESC
    `).all(student.id);
  } else {
    outpasses = db.prepare(`
      SELECT o.*, u.name as student_name, u.email as student_email, u.department,
             s.roll_no, s.year, s.semester, s.section
      FROM outpasses o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN students s ON o.student_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(user.userId);
  }
  return NextResponse.json({ outpasses });
}

export async function POST(request) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'student') {
    return NextResponse.json({ error: 'Only students can create outpass requests' }, { status: 403 });
  }

  try {
    const db = getDb();
    const { reason, destination, from_date, to_date, from_time, to_time } = await request.json();
    if (!reason || !destination || !from_date || !to_date)
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });

    const student = db.prepare('SELECT * FROM students WHERE user_id=?').get(user.userId);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const result = db.prepare(`
      INSERT INTO outpasses(student_id,user_id,reason,destination,from_date,to_date,from_time,to_time,status,teacher_status,hod_status,principal_status)
      VALUES(?,?,?,?,?,?,?,?,'pending_teacher','pending','pending','pending')
    `).run(student.id, user.userId, reason, destination, from_date, to_date, from_time||'', to_time||'');

    // Notify the class teacher of this department
    const teacher = db.prepare(`SELECT id FROM users WHERE LOWER(TRIM(department))=LOWER(TRIM(?)) AND role='class_teacher' LIMIT 1`).get(user.department);
    if (teacher) {
      safeNotify(db, teacher.id, 'New Outpass Request',
        `${user.name} has submitted an outpass request — ${reason}`, 'action', result.lastInsertRowid);
    }

    // Notify the submitter
    safeNotify(db, user.userId, 'Outpass Submitted',
      `Your outpass request for "${destination}" has been successfully submitted.`, 'info', result.lastInsertRowid);

    return NextResponse.json({ message: 'Outpass submitted', id: result.lastInsertRowid }, { status: 201 });

  } catch (e) {
    console.error('Outpass POST error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
