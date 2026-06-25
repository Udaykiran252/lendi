import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(user.userId);
  return NextResponse.json({ notifications });
}

export async function PATCH(request) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await request.json();
  const db = getDb();
  if (id === 'all') db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(user.userId);
  else db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(id, user.userId);
  return NextResponse.json({ message: 'Marked as read' });
}
