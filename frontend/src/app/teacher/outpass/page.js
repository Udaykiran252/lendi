'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const STATUS_MAP = {
  pending:  { label:'Pending',  color:'#fbbf24', bg:'rgba(251,191,36,.12)' },
  approved: { label:'Approved', color:'#4ade80', bg:'rgba(74,222,128,.12)' },
  rejected: { label:'Rejected', color:'#f87171', bg:'rgba(248,113,113,.12)' },
};

export default function TeacherOutpassPage() {
  const router = useRouter();
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actioning, setActioning] = useState(false);
  const [toast, setToast] = useState('');
  const [successId, setSuccessId] = useState(null);
  const [notifs, setNotifs] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (f = filter) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/teacher?filter=${f}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      const list = d.outpasses || [];
      setOutpasses(list);
      // Auto select outpass from URL query if present
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
    if (!['class_teacher'].includes(parsed.role)) { router.push('/login'); return; }
    load(filter);
    // Fetch notifications
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
  }, [filter]);

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
          showToast('✅ Request has been passed to the HOD.');
        } else {
          showToast('❌ Outpass rejected.');
        }
        setSelected(prev => prev ? { ...prev, teacher_status: action === 'approve' ? 'approved' : 'rejected', teacher_remarks: remarks } : null);
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

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem;color:#0d2340}
        .page-sub{font-size:13.5px;color:#64748b;margin-bottom:1.5rem}
        .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap}
        .filter-btn{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .filter-btn.on{background:#0d2340;color:#ffffff;box-shadow:0 2px 8px rgba(13,35,64,.15)}
        .filter-btn.off{background:#ffffff;color:#64748b;border:1px solid #e2e8f0}
        .filter-btn.off:hover{background:#f1f5f9;color:#0d2340}

        .layout{display:grid;grid-template-columns:1fr 380px;gap:1.5rem}

        .card-list{display:flex;flex-direction:column;gap:10px}
        .op-card{
          background:#ffffff;border:1px solid #e2e8f0;
          border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;
          border-left:4px solid transparent;box-shadow:0 4px 12px rgba(0,0,0,0.03)
        }
        .op-card:hover{border-color:#cbd5e1;box-shadow:0 6px 16px rgba(0,0,0,0.05)}
        .op-card.selected{border-color:#0d2340!important;background:#f8fafc}
        .op-card.pending-card{border-left-color:#f59e0b}
        .op-card.approved-card{border-left-color:#16a34a}
        .op-card.rejected-card{border-left-color:#dc2626}

        .op-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .op-student{display:flex;align-items:center;gap:10px}
        .av{width:36px;height:36px;border-radius:10px;background:#0d2340;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#ffffff;flex-shrink:0}
        .sname{font-size:13.5px;font-weight:800;color:#0d2340}
        .smeta{font-size:11.5px;color:#64748b;margin-top:2px}
        .status-tag{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:7px;white-space:nowrap}
        .op-reason{font-size:13px;color:#334155;margin-bottom:6px;line-height:1.5;font-weight:500}
        .op-details{display:flex;gap:16px;flex-wrap:wrap}
        .op-det{font-size:11.5px;color:#64748b}
        .op-det strong{color:#0d2340}

        /* Detail panel */
        .detail{
          background:#ffffff;border:1px solid #e2e8f0;
          border-radius:16px;padding:1.6rem;position:sticky;top:1rem;
          height:fit-content;max-height:calc(100vh - 2rem);overflow-y:auto;
          box-shadow:0 4px 12px rgba(0,0,0,0.03)
        }
        .det-title{font-size:14px;font-weight:800;color:#0d2340;margin-bottom:1.3rem;padding-bottom:1rem;border-bottom:1px solid #f1f5f9}
        .det-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f1f5f9}
        .det-row:last-of-type{border-bottom:none}
        .det-key{font-size:12px;color:#64748b;font-weight:600}
        .det-val{font-size:13px;color:#0d2340;font-weight:700;text-align:right;max-width:200px}

        .remarks-lbl{font-size:12px;font-weight:700;color:#0d2340;margin-bottom:6px;margin-top:1.2rem;display:block}
        .remarks-inp{
          width:100%;padding:10px 13px;background:#f8fafc;
          border:1px solid #cbd5e1;border-radius:10px;
          color:#0d2340;font-size:13.5px;resize:vertical;min-height:80px;outline:none;
          transition:border-color .2s;font-family:inherit;font-weight:500
        }
        .remarks-inp:focus{border-color:#0d2340;background:#ffffff}
        .remarks-inp::placeholder{color:#94a3b8}

        .action-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:1rem}
        .btn-approve{
          height:46px;background:#16a34a;
          border:none;border-radius:11px;color:#ffffff;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;
        }
        .btn-approve:hover{background:#15803d}
        .btn-reject{
          height:46px;background:#dc2626;
          border:none;border-radius:11px;color:#ffffff;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;
        }
        .btn-reject:hover{background:#b91c1c}
        .btn-approve:disabled,.btn-reject:disabled{opacity:.5;cursor:not-allowed}

        .empty{text-align:center;padding:3rem;color:#94a3b8}
        .empty-ico{font-size:40px;margin-bottom:.8rem}
        .skel{background:#f1f5f9;border-radius:10px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}

        .toast{
          position:fixed;bottom:2rem;right:2rem;z-index:200;
          background:#0d2340;border:1px solid #1e293b;
          border-radius:12px;padding:13px 18px;
          font-size:13.5px;font-weight:600;color:#fff;
          box-shadow:0 10px 40px rgba(0,0,0,.2);
          animation:slideIn .3s ease;
        }
        @keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .no-select{text-align:center;padding:3rem 1rem;color:#94a3b8;font-size:13px}

        @media(max-width:1100px){.layout{grid-template-columns:1fr}.detail{position:static}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}}
      `}</style>

      <div className="root">
        <Sidebar pendingCount={outpasses.filter(o=>o.teacher_status==='pending').length} unreadCount={unread} />
        <main className="main">
          <div className="page-title">🚪 Outpass Requests</div>
          <div className="page-sub">Review and approve student outpass requests for your department</div>

          <div className="toolbar">
            {['pending','approved','rejected'].map(f => (
              <button key={f} className={`filter-btn ${filter===f?'on':'off'}`} onClick={()=>{ setFilter(f); setSelected(null); }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

          <div className="layout">
            <div className="card-list">
              {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:110}}/>)
              : outpasses.length === 0
              ? <div className="empty"><div className="empty-ico">✅</div>No {filter} requests</div>
              : outpasses.map(op => {
                  const initials = op.student_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                  const st = STATUS_MAP[op.teacher_status] || STATUS_MAP.pending;
                  return (
                    <div key={op.id} className={`op-card ${op.teacher_status}-card${selected?.id===op.id?' selected':''}`}
                      onClick={()=>{ setSelected(op); setRemarks(''); }}>
                      <div className="op-top">
                        <div className="op-student">
                          <div className="av">{initials}</div>
                          <div>
                            <div className="sname">{op.student_name}</div>
                            <div className="smeta">{op.roll_no} · Yr {op.year} · Sec {op.section} · {op.department}</div>
                          </div>
                        </div>
                        <span className="status-tag" style={{color:st.color,background:st.bg}}>{st.label}</span>
                      </div>
                      <div className="op-reason">📝 {op.reason}</div>
                      <div className="op-details">
                        <div className="op-det"><strong>📍 Dest:</strong> {op.destination}</div>
                        <div className="op-det"><strong>📅</strong> {op.from_date}{op.to_date!==op.from_date?` → ${op.to_date}`:''}</div>
                        <div className="op-det"><strong>🕐</strong> {op.from_time} – {op.to_time}</div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Detail panel */}
            <div className="detail">
              {!selected ? (
                <div className="no-select">
                  <div style={{fontSize:36,marginBottom:8}}>👈</div>
                  Select a request to review
                </div>
              ) : (
                <>
                  <div className="det-title">📋 Outpass Details</div>
                  {[
                    ['Student', selected.student_name],
                    ['Roll No', selected.roll_no],
                    ['Department', selected.department],
                    ['Year / Section', `Year ${selected.year} · Section ${selected.section}`],
                    ['Reason', selected.reason],
                    ['Destination', selected.destination],
                    ['From Date', selected.from_date],
                    ['To Date', selected.to_date],
                    ['Time', `${selected.from_time} – ${selected.to_time}`],
                    ['Applied On', new Date(selected.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})],
                  ].map(([k,v])=>(
                    <div key={k} className="det-row"><span className="det-key">{k}</span><span className="det-val">{v}</span></div>
                  ))}

                  {selected.teacher_status === 'pending' && successId !== selected.id && (
                    <>
                      <label className="remarks-lbl">Your Remarks (optional)</label>
                      <textarea className="remarks-inp" placeholder="Add remarks for your decision..."
                        value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}/>
                      <div className="action-btns">
                        <button className="btn-approve" disabled={actioning} onClick={()=>handleAction(selected.id,'approve')}>
                          {actioning ? <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}><span style={{width:16,height:16,border:'2px solid rgba(74,222,128,.3)',borderTopColor:'#4ade80',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/> Processing</span> : '✅ Approve'}
                        </button>
                        <button className="btn-reject" disabled={actioning} onClick={()=>handleAction(selected.id,'reject')}>
                          {actioning ? '…' : '❌ Reject'}
                        </button>
                      </div>
                    </>
                  )}
                  {selected.teacher_status === 'pending' && successId === selected.id && (
                    <div style={{marginTop:'1rem',padding:'16px',background:'linear-gradient(135deg,rgba(74,222,128,.12),rgba(74,222,128,.06))',border:'1px solid rgba(74,222,128,.3)',borderRadius:12,fontSize:13.5,color:'#86efac',textAlign:'center',lineHeight:1.6}}>
                      <div style={{fontSize:22,marginBottom:6}}>✅</div>
                      <div style={{fontWeight:800,fontSize:14,color:'#4ade80',marginBottom:4}}>Request Approved!</div>
                      <div style={{color:'rgba(255,255,255,.7)'}}>The request has been passed to the HOD for further review.</div>
                    </div>
                  )}
                  {selected.teacher_status === 'approved' && (
                    <div style={{marginTop:'1rem',padding:'12px',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.2)',borderRadius:10,fontSize:13,color:'#86efac'}}>
                      ✅ You approved this request. It has been forwarded to the HOD.
                      {selected.teacher_remarks && <div style={{marginTop:6,color:'rgba(255,255,255,.5)'}}>Note: {selected.teacher_remarks}</div>}
                    </div>
                  )}
                  {selected.teacher_status === 'rejected' && (
                    <div style={{marginTop:'1rem',padding:'12px',background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,fontSize:13,color:'#fca5a5'}}>
                      ❌ You rejected this request.
                      {selected.teacher_remarks && <div style={{marginTop:6}}>Reason: {selected.teacher_remarks}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
