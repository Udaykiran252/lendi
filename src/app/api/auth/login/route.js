import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    let studentInfo = null;
    if (user.role === 'student') studentInfo = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, department: user.department });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, student: studentInfo } });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
