import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request, segmentData) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await segmentData.params;
  const db = getDb();
  const op = db.prepare(`
    SELECT o.*, u.name as student_name, u.email as student_email, u.role as applicant_role, u.department,
           s.roll_no, s.year, s.semester, s.section
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN students s ON o.student_id = s.id
    WHERE o.id = ?
  `).get(id);
  if (!op) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ outpass: op });
}

export async function PATCH(request, segmentData) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: outpassId } = await segmentData.params;

  const { action, remarks } = await request.json(); // action: 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const db = getDb();
  const op = db.prepare(`
    SELECT o.*, u.id as student_user_id, u.name as student_name, u.department
    FROM outpasses o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(outpassId);
  if (!op) return NextResponse.json({ error: 'Outpass not found' }, { status: 404 });

  const now = new Date().toISOString();
  const statusVal = action === 'approve' ? 'approved' : 'rejected';

  if (user.role === 'class_teacher') {
    if (op.teacher_status !== 'pending')
      return NextResponse.json({ error: 'Already actioned by teacher' }, { status: 400 });
    if (op.department !== user.department)
      return NextResponse.json({ error: 'Not your department' }, { status: 403 });

    db.prepare(`UPDATE outpasses SET teacher_status=?, teacher_remarks=?, teacher_action_at=?,
      status=? WHERE id=?`).run(
      statusVal, remarks||'', now,
      action === 'approve' ? 'pending_hod' : 'rejected',
      op.id
    );

    // Notify student
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`).run(
      op.student_user_id,
      action === 'approve' ? 'Outpass Approved by Teacher' : 'Outpass Rejected by Teacher',
      action === 'approve'
        ? `Your outpass request has been approved by your class teacher. Awaiting HOD approval.`
        : `Your outpass request was rejected by your class teacher. Reason: ${remarks || 'No reason given'}`,
      action === 'approve' ? 'info' : 'warning',
      op.id
    );

    // Notify HOD
    if (action === 'approve') {
      const hod = db.prepare(`SELECT id FROM users WHERE department=? AND role='hod' LIMIT 1`).get(user.department);
      if (hod) {
        db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`).run(
          hod.id, 'Outpass Awaiting Your Approval',
          `${op.student_name}'s outpass has been approved by class teacher. Please review.`,
          'action', op.id
        );
      }
    }

  } else if (user.role === 'hod') {
    if (op.hod_status !== 'pending')
      return NextResponse.json({ error: 'Already actioned by HOD' }, { status: 400 });

    db.prepare(`UPDATE outpasses SET hod_status=?, hod_remarks=?, hod_action_at=?,
      status=? WHERE id=?`).run(
      statusVal, remarks||'', now,
      action === 'approve' ? 'pending_principal' : 'rejected',
      op.id
    );

    // Notify student
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`).run(
      op.student_user_id,
      action === 'approve' ? 'Outpass Approved by HOD' : 'Outpass Rejected by HOD',
      action === 'approve'
        ? `Your outpass to ${op.destination} has been approved by the HOD. Awaiting Principal approval.`
        : `Your outpass was rejected by the HOD. Reason: ${remarks || 'No reason given'}`,
      action === 'approve' ? 'info' : 'warning',
      op.id
    );

    // Notify Principal
    if (action === 'approve') {
      const principal = db.prepare(`SELECT id FROM users WHERE role='principal' LIMIT 1`).get();
      if (principal) {
        db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`).run(
          principal.id, 'Outpass Awaiting Your Approval',
          `${op.student_name}'s outpass has been approved by HOD. Please review.`,
          'action', op.id
        );
      }
    }

  } else if (user.role === 'principal') {
    if (op.principal_status !== 'pending')
      return NextResponse.json({ error: 'Already actioned by Principal' }, { status: 400 });

    db.prepare(`UPDATE outpasses SET principal_status=?, principal_remarks=?, principal_action_at=?,
      status=? WHERE id=?`).run(
      statusVal, remarks||'', now,
      action === 'approve' ? 'approved' : 'rejected',
      op.id
    );

    // Notify student
    db.prepare(`INSERT INTO notifications(user_id,title,message,type,outpass_id) VALUES(?,?,?,?,?)`).run(
      op.student_user_id,
      action === 'approve' ? '✅ Outpass Fully Approved!' : '❌ Outpass Rejected by Principal',
      action === 'approve'
        ? `Your outpass to ${op.destination} has been fully approved by the Principal. You may proceed.`
        : `Your outpass was rejected by the Principal. Reason: ${remarks || 'No reason given'}`,
      action === 'approve' ? 'success' : 'warning',
      op.id
    );

  } else {
    return NextResponse.json({ error: 'Not authorized to take action' }, { status: 403 });
  }

  return NextResponse.json({ message: `Outpass ${statusVal}` });
}
