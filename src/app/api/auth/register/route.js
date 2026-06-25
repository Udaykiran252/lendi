import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, roll_no, year, semester, section, department } = await request.json();
    if (!name || !email || !password || !roll_no || !year || !semester || !department)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    const e = email.toLowerCase().trim();
    if (!e.endsWith('@lendi.edu.in')) return NextResponse.json({ error: 'Only @lendi.edu.in emails allowed' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be 8+ characters' }, { status: 400 });
    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(e)) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    if (db.prepare('SELECT id FROM students WHERE roll_no=?').get(roll_no.toUpperCase())) return NextResponse.json({ error: 'Roll number already registered' }, { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    const ur = db.prepare('INSERT INTO users(email,password,name,role,department) VALUES(?,?,?,?,?)').run(e, hash, name.trim(), 'student', department);
    db.prepare('INSERT INTO students(user_id,roll_no,year,semester,section) VALUES(?,?,?,?,?)').run(ur.lastInsertRowid, roll_no.toUpperCase(), parseInt(year), parseInt(semester), section||'A');
    const token = signToken({ userId: ur.lastInsertRowid, email: e, name: name.trim(), role: 'student', department });
    return NextResponse.json({ message: 'Account created', token, user: { id: ur.lastInsertRowid, email: e, name: name.trim(), role: 'student', department } }, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Registration failed' }, { status: 500 }); }
}
