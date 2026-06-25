import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Helper to check if user is admin
function isAdmin(request) {
  const user = verifyToken(request);
  return user && user.role === 'admin';
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const db = getDb();
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.created_at,
             s.roll_no, s.year, s.semester, s.section
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY u.role, u.name
    `).all();
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  try {
    const { name, email, password, role, department, roll_no, year, semester, section } = await request.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
    }

    const e = email.toLowerCase().trim();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(e)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
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

    return NextResponse.json({ message: 'User created successfully', userId: newUserId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    db.transaction(() => {
      // Delete from student table first if exists
      db.prepare('DELETE FROM students WHERE user_id = ?').run(userId);
      // Delete from notifications
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
      // Delete from users
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
