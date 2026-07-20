'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QRCode from 'qrcode';

export default function HodOutpassPage() {
  const router = useRouter();
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actioning, setActioning] = useState(false);
  const [toast, setToast] = useState('');
  const [successId, setSuccessId] = useState(null);
  const [userRole, setUserRole] = useState('hod');
  const [notifs, setNotifs] = useState([]);
  const [qrUrl, setQrUrl] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const generateQR = useCallback(async (op) => {
    const isStudent = !!op.student_id;
    const qrData = [
      '══════════════════════════',
      '  LENDI COLLEGE OUTPASS',
      '══════════════════════════',
      'Outpass ID  : #' + op.id,
      isStudent ? 'Student     : ' + op.student_name : 'Staff       : ' + op.student_name,
      isStudent ? 'Roll No     : ' + op.roll_no : 'Role        : ' + (op.applicant_role === 'class_teacher' ? 'Teacher' : 'HOD'),
      'Department  : ' + op.department,
      '──────────────────────────',
      'Destination : ' + op.destination,
      'Reason      : ' + op.reason,
      'From        : ' + op.from_date + ' ' + (op.from_time || ''),
      'To          : ' + op.to_date + ' ' + (op.to_time || ''),
      '──────────────────────────',
      'Status      : APPROVED',
      'Approved On : ' + (op.hod_action_at ? new Date(op.hod_action_at).toLocaleString('en-IN') : 'N/A'),
      '══════════════════════════',
    ].join('\n');
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 240, margin: 2,
        color: { dark: '#07111f', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrUrl(url);
    } catch (err) { console.error('QR gen failed:', err); }
  }, []);

  const load = useCallback(async (f = filter) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/teacher?filter=${f}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      const list = d.outpasses || [];
      setOutpasses(list);
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id');
      if (targetId) {
        const found = list.find(o => String(o.id) === String(targetId));
        if (found) {
          setSelected(found);
          if (found.hod_status === 'approved' || found.status === 'approved') generateQR(found);
        } else if (f !== 'all') {
          setFilter('all');
        }
      }
    }
    setLoading(false);
  }, [filter, generateQR]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['hod','principal'].includes(parsed.role)) { router.push('/login'); return; }
    setUserRole(parsed.role);
    load(filter);
    // Fetch notifications
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
  }, [filter, load, router]);

  const unread = notifs.filter(n=>!n.is_read).length;

  const handleAction = async (id, action) => {
    setActioning(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/outpass/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, remarks }),
      });
      if (res.ok) {
        if (action === 'approve') {
          setSuccessId(id);
          showToast('✅ Request approved and sent to Principal.');
        } else {
          showToast('❌ Outpass rejected.');
        }
        setSelected(null);
        setRemarks('');
        load('pending');
      } else {
        let errorMsg = `Server error (${res.status})`;
        try { const d = await res.json(); errorMsg = d.error || errorMsg; } catch {}
        showToast('❌ ' + errorMsg);
      }
    } catch (err) {
      showToast('❌ Network error. Please try again.');
    } finally {
      setActioning(false);
    }
  };

  const displayOutpasses = filter === 'pending'
    ? outpasses.filter(o => o.teacher_status === 'approved' && o.hod_status === 'pending')
    : filter === 'approved'
    ? outpasses.filter(o => o.hod_status === 'approved')
    : outpasses.filter(o => o.hod_status === 'rejected');

  const selectOutpass = (op) => {
    setSelected(op);
    setRemarks('');
    setQrUrl(null);
    if (op.hod_status === 'approved') {
      generateQR(op);
    }
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;max-width:1200px}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.5rem}
        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap}
        .fb{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
        .fb.on{background:rgba(251,191,36,.18);color:#fbbf24;border:1px solid rgba(251,191,36,.35)}
        .fb.off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.08)}
        .fb.off:hover{background:rgba(255,255,255,.09);color:#fff}
        .layout{display:grid;grid-template-columns:1fr 380px;gap:1.5rem}
        .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
        .op-item{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;transition:background .15s;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .op-item:hover{background:rgba(255,255,255,.05)}
        .op-item.sel{background:rgba(251,191,36,.1);border-left:3px solid #fbbf24}
        .op-name{font-size:14.5px;font-weight:700;color:rgba(255,255,255,.9);margin-bottom:2px}
        .op-sub{font-size:12px;color:rgba(255,255,255,.4);line-height:1.5}
        .op-tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap}
        .op-tag.student{background:rgba(96,165,250,.12);color:#60a5fa}
        .op-tag.teacher{background:rgba(74,222,128,.12);color:#4ade80}

        .panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;position:sticky;top:2rem}
        .panel-title{font-size:15px;font-weight:800;margin-bottom:1rem;color:#fff;display:flex;justify-content:space-between;align-items:center}
        .info-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:1.2rem}
        .info-row{display:flex;justify-content:space-between;font-size:13px}
        .info-lbl{color:rgba(255,255,255,.4)}
        .info-val{color:rgba(255,255,255,.85);font-weight:600;text-align:right;max-width:60%}
        .reason-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px;font-size:13px;color:rgba(255,255,255,.75);margin-bottom:1.2rem;line-height:1.5}
        .textarea{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#fff;font-size:13.5px;padding:10px 12px;outline:none;resize:vertical;min-height:70px;margin-bottom:1rem;font-family:inherit}
        .textarea:focus{border-color:rgba(251,191,36,.5)}
        .act-btns{display:flex;gap:10px}
        .btn-app{flex:1;height:44px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;border-radius:10px;color:#07111f;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-app:hover{opacity:.9}
        .btn-rej{flex:1;height:44px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);border-radius:10px;color:#f87171;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-rej:hover{background:rgba(248,113,113,.2)}
        .btn-app:disabled,.btn-rej:disabled{opacity:.5;cursor:not-allowed}

        .success-banner{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);border-radius:12px;padding:14px;margin-bottom:1rem;font-size:13px;color:#4ade80;display:flex;align-items:center;gap:10px}
        .skel{background:rgba(255,255,255,.06);border-radius:10px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2240;border:1px solid rgba(251,191,36,.3);border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.4)}
        .empty-p{text-align:center;padding:3rem 1rem;color:rgba(255,255,255,.3);font-size:13.5px}
        .qr-box{text-align:center;padding:12px;background:#fff;border-radius:12px;margin-top:1rem}
        .qr-box img{width:180px;height:180px;display:block;margin:0 auto}

        @media(max-width:900px){.layout{grid-template-columns:1fr}.panel{position:static}.main{padding:1.2rem;padding-bottom:80px}}
      `}</style>

      <div className="root">
        <Sidebar unreadCount={unread} />
        <main className="main">
          <div className="page-title">📋 HOD Outpass Approvals</div>
          <div className="page-sub">Review outpasses approved by Class Teachers in your department</div>

          <div className="toolbar">
            {[
              { id: 'pending', label: '⏳ Awaiting My Approval', cnt: outpasses.filter(o => o.teacher_status === 'approved' && o.hod_status === 'pending').length },
              { id: 'approved', label: '✅ Approved by Me', cnt: null },
              { id: 'rejected', label: '❌ Rejected by Me', cnt: null },
              { id: 'all', label: '📋 All Dept Requests', cnt: null },
            ].map(f => (
              <button key={f.id} className={`fb ${filter === f.id ? 'on' : 'off'}`} onClick={() => { setFilter(f.id); setSelected(null); load(f.id); }}>
                {f.label} {f.cnt !== null && f.cnt > 0 ? `(${f.cnt})` : ''}
              </button>
            ))}
          </div>

          <div className="layout">
            <div>
              {loading ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:72}}/>) :
               displayOutpasses.length === 0 ? (
                <div className="card empty-p">No {filter} outpasses found.</div>
               ) : (
                <div className="card">
                  {displayOutpasses.map(op => {
                    const isSel = selected?.id === op.id;
                    const applicantRole = op.applicant_role || (op.student_id ? 'student' : 'teacher');
                    return (
                      <div key={op.id} className={`op-item ${isSel ? 'sel' : ''}`} onClick={() => selectOutpass(op)}>
                        <div>
                          <div className="op-name">{op.student_name || 'Applicant'}</div>
                          <div className="op-sub">
                            {op.student_id ? `Roll: ${op.roll_no || 'N/A'}` : `Teacher (${op.department})`}<br/>
                            Destination: <strong>{op.destination}</strong> · Date: {op.from_date}
                          </div>
                        </div>
                        <span className={`op-tag ${applicantRole}`}>{applicantRole.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
               )}
            </div>

            <div>
              {!selected ? (
                <div className="panel empty-p">Select an outpass request to view details and take action</div>
              ) : (
                <div className="panel">
                  {successId === selected.id && (
                    <div className="success-banner">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Passed to Principal for final approval
                    </div>
                  )}

                  <div className="panel-title">
                    <span>Outpass #{selected.id}</span>
                    <span className={`op-tag ${selected.applicant_role || 'student'}`}>
                      {(selected.applicant_role || 'student').toUpperCase()}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div className="info-row"><span className="info-lbl">Applicant</span><span className="info-val">{selected.student_name}</span></div>
                    {selected.student_id && <div className="info-row"><span className="info-lbl">Roll Number</span><span className="info-val">{selected.roll_no}</span></div>}
                    <div className="info-row"><span className="info-lbl">Destination</span><span className="info-val">{selected.destination}</span></div>
                    <div className="info-row"><span className="info-lbl">From</span><span className="info-val">{selected.from_date} {selected.from_time}</span></div>
                    <div className="info-row"><span className="info-lbl">To</span><span className="info-val">{selected.to_date} {selected.to_time}</span></div>
                    <div className="info-row"><span className="info-lbl">Teacher Status</span><span className="info-val" style={{color:'#4ade80'}}>✓ Approved</span></div>
                    <div className="info-row"><span className="info-lbl">Teacher Remarks</span><span className="info-val">{selected.teacher_remarks || '—'}</span></div>
                  </div>

                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:4}}>Reason for Outpass</div>
                  <div className="reason-box">{selected.reason}</div>

                  {selected.hod_status === 'pending' && selected.teacher_status === 'approved' && (
                    <>
                      <textarea className="textarea" placeholder="Add remarks (optional)..."
                        value={remarks} onChange={e => setRemarks(e.target.value)} />
                      <div className="act-btns">
                        <button className="btn-app" disabled={actioning} onClick={() => handleAction(selected.id, 'approve')}>
                          {actioning ? 'Approving...' : '✓ Approve & Pass to Principal'}
                        </button>
                        <button className="btn-rej" disabled={actioning} onClick={() => handleAction(selected.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    </>
                  )}

                  {selected.hod_status === 'approved' && qrUrl && (
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'#fbbf24',marginTop:10}}>HOD Approved</div>
                      <div className="qr-box">
                        <img src={qrUrl} alt="Gate Pass QR" />
                        <div style={{fontSize:11,color:'#07111f',fontWeight:700,marginTop:4}}>Gate Pass QR Code</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
