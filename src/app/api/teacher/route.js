import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['class_teacher','hod','principal'].includes(user.role))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'pending';

  let query = `
    SELECT o.*, u.name as student_name, u.email as student_email, u.role as applicant_role, u.department,
           s.roll_no, s.year, s.semester, s.section
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN students s ON o.student_id = s.id
  `;

  if (user.role === 'class_teacher') {
    query += ` WHERE LOWER(TRIM(u.department)) = LOWER(TRIM('${user.department}'))`;
    if (filter === 'pending') query += ` AND o.teacher_status = 'pending'`;
    else if (filter === 'approved') query += ` AND o.teacher_status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.teacher_status = 'rejected'`;
  } else if (user.role === 'hod') {
    // HOD only sees requests that were APPROVED by the teacher
    query += ` WHERE LOWER(TRIM(u.department)) = LOWER(TRIM('${user.department}')) AND o.teacher_status = 'approved'`;
    if (filter === 'pending') query += ` AND o.hod_status = 'pending'`;
    else if (filter === 'approved') query += ` AND o.hod_status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.hod_status = 'rejected'`;
  } else if (user.role === 'principal') {
    // Principal only sees requests that were APPROVED by both Teacher AND HOD
    query += ` WHERE (o.teacher_status = 'approved' AND o.hod_status = 'approved')`;
    if (filter === 'pending') query += ` AND o.status = 'pending_principal'`;
    else if (filter === 'approved') query += ` AND o.status = 'approved'`;
    else if (filter === 'rejected') query += ` AND o.principal_status = 'rejected'`;
  }

  query += ` ORDER BY o.created_at DESC`;
  const outpasses = db.prepare(query).all();

  // Also get all students for monitoring
  let students = [];
  if (user.role === 'class_teacher' || user.role === 'hod') {
    students = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, s.roll_no, s.year, s.semester, s.section
      FROM users u JOIN students s ON u.id = s.user_id
      WHERE LOWER(TRIM(u.department)) = LOWER(TRIM(?)) AND u.role = 'student'
      ORDER BY s.roll_no
    `).all(user.department);
  } else {
    students = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, s.roll_no, s.year, s.semester, s.section
      FROM users u JOIN students s ON u.id = s.user_id
      WHERE u.role = 'student' ORDER BY u.department, s.roll_no
    `).all();
  }

  return NextResponse.json({ outpasses, students });
}
