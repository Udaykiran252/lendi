'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

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
        } else if (f !== 'all') {
          setFilter('all');
        }
      }
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['hod','principal'].includes(parsed.role)) { router.push('/login'); return; }
    setUserRole(parsed.role);
    load(filter);
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
  }, [filter, load, router]);

  const unread = notifs.filter(n=>!n.is_read).length;

  const handleAction = async (id, action) => {
    const isTeacherAbsent = selected?.teacher_status === 'bypassed';
    if (action === 'reject' && !remarks.trim()) {
      showToast('❌ Reason for rejection is required.');
      return;
    }
    if (action === 'approve' && isTeacherAbsent && !remarks.trim()) {
      showToast('❌ Reason / remarks is required as Class Teacher was absent.');
      return;
    }

    setActioning(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/outpass/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, remarks: remarks.trim() }),
      });
      if (res.ok) {
        if (action === 'approve') {
          setSuccessId(id);
          showToast('✅ Outpass approved successfully!');
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
    ? outpasses.filter(o => ['approved', 'bypassed'].includes(o.teacher_status) && o.hod_status === 'pending')
    : filter === 'approved'
    ? outpasses.filter(o => ['approved', 'bypassed'].includes(o.hod_status))
    : filter === 'rejected'
    ? outpasses.filter(o => o.hod_status === 'rejected')
    : outpasses;

  const selectOutpass = (op) => {
    setSelected(op);
    setRemarks('');
  };

  const teacherStatusText = (st) => {
    if (st === 'bypassed') return { text: '⚡ Class Teacher Absent', color: '#f59e0b' };
    if (st === 'pending') return { text: '⏳ Pending', color: '#d97706' };
    if (st === 'rejected') return { text: '✕ Rejected', color: '#dc2626' };
    return { text: '✓ Approved', color: '#16a34a' };
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh;width:100%;max-width:100vw;overflow-x:hidden}
        .main{flex:1;padding:2rem 2.5rem;min-height:100vh;overflow-y:auto;background:#f8fafc;width:100%;max-width:1440px;margin:0 auto}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem;color:#0d2340}
        .page-sub{font-size:13.5px;color:#64748b;margin-bottom:1.5rem}
        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
        .fb{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0}
        .fb.on{background:#0d2340;color:#ffffff;box-shadow:0 2px 8px rgba(13,35,64,.15)}
        .fb.off{background:#ffffff;color:#64748b;border:1px solid #e2e8f0}
        .fb.off:hover{background:#f1f5f9;color:#0d2340}
        .layout{display:grid;grid-template-columns:1fr;gap:1.5rem;width:100%}
        .layout.has-selected{grid-template-columns:1fr minmax(320px, 420px)}
        .layout:not(.has-selected) .detail-col{display:none}
        .card{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .op-item{padding:16px 18px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background .15s;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .op-item:hover{background:#f8fafc}
        .op-item.sel{background:#f8fafc;border-left:4px solid #0d2340}
        .op-name{font-size:14.5px;font-weight:800;color:#0d2340;margin-bottom:2px}
        .op-sub{font-size:12px;color:#64748b;line-height:1.5;word-break:break-word}
        .op-tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap}
        .op-tag.student{background:#dbeafe;color:#2563eb}
        .op-tag.teacher{background:#dcfce7;color:#16a34a}

        .back-btn{display:none;align-items:center;gap:6px;padding:8px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px;font-family:inherit;width:fit-content;transition:all .15s}
        .back-btn:hover{background:#e2e8f0}

        .panel{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;position:sticky;top:2rem;max-height:calc(100vh - 4rem);overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .panel-title{font-size:15px;font-weight:800;margin-bottom:1rem;color:#0d2340;display:flex;justify-content:space-between;align-items:center}
        .info-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:1.2rem}
        .info-row{display:flex;justify-content:space-between;font-size:13px}
        .info-lbl{color:#64748b}
        .info-val{color:#0d2340;font-weight:700;text-align:right;max-width:60%;word-break:break-word}
        .reason-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:13px;color:#334155;margin-bottom:1.2rem;line-height:1.5;font-weight:500;word-break:break-word}
        .textarea{width:100%;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13.5px;padding:10px 12px;outline:none;resize:vertical;min-height:70px;margin-bottom:1rem;font-family:inherit;font-weight:500}
        .textarea:focus{border-color:#0d2340;background:#ffffff}
        .act-btns{display:flex;gap:10px}
        .btn-app{flex:1;height:44px;background:#16a34a;border:none;border-radius:10px;color:#ffffff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-app:hover{background:#15803d}
        .btn-rej{flex:1;height:44px;background:#dc2626;border:none;border-radius:10px;color:#ffffff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-rej:hover{background:#b91c1c}
        .btn-app:disabled,.btn-rej:disabled{opacity:.5;cursor:not-allowed}

        .success-banner{background:#dcfce7;border:1px solid #86efac;border-radius:12px;padding:14px;margin-bottom:1rem;font-size:13px;color:#16a34a;display:flex;align-items:center;gap:10px;font-weight:600}
        .skel{background:#f1f5f9;border-radius:10px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2340;border:1px solid #1e293b;border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.2)}
        .empty-p{text-align:center;padding:3rem 1rem;color:#94a3b8;font-size:13.5px}

        @media(max-width:1150px){
          .root{flex-direction:column;width:100%}
          .layout{grid-template-columns:1fr}
          .layout.has-selected{grid-template-columns:1fr}
          .layout.has-selected .list-col{display:none}
          .layout:not(.has-selected) .detail-col{display:none}
          .back-btn{display:inline-flex}
          .panel{position:static;margin-top:0}
          .main{padding:1rem 1rem 90px 1rem;max-width:100vw;overflow-x:hidden}
          .page-title{font-size:1.3rem}
          .page-sub{font-size:12.5px;margin-bottom:1rem}
          .fb{padding:7px 14px;font-size:12px}
        }
      `}</style>

      <div className="root">
        <Sidebar unreadCount={unread} />
        <main className="main">
          <div className="page-title">📋 HOD Outpass Approvals</div>
          <div className="page-sub">Review outpasses approved by Class Teachers in your department</div>

          <div className="toolbar">
            {[
              { id: 'pending', label: '⏳ Awaiting My Approval', cnt: outpasses.filter(o => ['approved', 'bypassed'].includes(o.teacher_status) && o.hod_status === 'pending').length },
              { id: 'approved', label: '✅ Approved by Me', cnt: null },
              { id: 'rejected', label: '❌ Rejected by Me', cnt: null },
              { id: 'all', label: '📋 All Dept Requests', cnt: null },
            ].map(f => (
              <button key={f.id} className={`fb ${filter === f.id ? 'on' : 'off'}`} onClick={() => { setFilter(f.id); setSelected(null); load(f.id); }}>
                {f.label} {f.cnt !== null && f.cnt > 0 ? `(${f.cnt})` : ''}
              </button>
            ))}
          </div>

          <div className={`layout ${selected ? 'has-selected' : ''}`}>
            <div className="list-col">
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

            <div className="detail-col">
              {!selected ? (
                <div className="panel empty-p">Select an outpass request to view details and take action</div>
              ) : (
                <div className="panel">
                  <button className="back-btn" onClick={() => setSelected(null)}>
                    ← Back to Outpass List
                  </button>

                  {successId === selected.id && (
                    <div className="success-banner">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Outpass action updated successfully
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
                    <div className="info-row">
                      <span className="info-lbl">Teacher Status</span>
                      <span className="info-val" style={{color: teacherStatusText(selected.teacher_status).color}}>
                        {teacherStatusText(selected.teacher_status).text}
                      </span>
                    </div>
                    {selected.teacher_remarks && (
                      <div className="info-row"><span className="info-lbl">Teacher Reason</span><span className="info-val">{selected.teacher_remarks}</span></div>
                    )}
                  </div>

                  <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Reason for Outpass</div>
                  <div className="reason-box">{selected.reason}</div>

                  {selected.hod_status === 'pending' && ['approved', 'bypassed'].includes(selected.teacher_status) && (
                    <>
                      <div style={{fontSize:12,fontWeight:600,color:'#64748b',marginBottom:4}}>
                        Reason {selected.teacher_status === 'bypassed' && <span style={{color:'#ef4444'}}>*</span>}
                      </div>
                      <textarea className="textarea" 
                        placeholder="Reason..."
                        value={remarks} onChange={e => setRemarks(e.target.value)} />
                      <div className="act-btns">
                        <button className="btn-app" disabled={actioning} onClick={() => handleAction(selected.id, 'approve')}>
                          {actioning ? 'Processing...' : '✓ Approve Request'}
                        </button>
                        <button className="btn-rej" disabled={actioning} onClick={() => handleAction(selected.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    </>
                  )}

                  {selected.hod_status === 'approved' && (
                    <div style={{fontSize:13,fontWeight:700,color:'#16a34a',marginTop:12,padding:'10px 14px',background:'#dcfce7',border:'1px solid #86efac',borderRadius:10,textAlign:'center'}}>
                      ✓ Approved by HOD
                    </div>
                  )}

                  {selected.hod_status === 'bypassed' && (
                    <div style={{fontSize:13,fontWeight:700,color:'#d97706',marginTop:12,padding:'10px 14px',background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:10,textAlign:'center'}}>
                      ⚡ HOD Absent
                    </div>
                  )}

                  {selected.hod_status === 'rejected' && (
                    <div style={{fontSize:13,fontWeight:700,color:'#dc2626',marginTop:12,padding:'10px 14px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:10,textAlign:'center'}}>
                      ✕ Rejected by HOD
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
