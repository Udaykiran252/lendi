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
  const [notifs, setNotifs] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (f = filter) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/teacher?filter=${f}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setOutpasses(d.outpasses || []); }
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
    const res = await fetch(`/api/outpass/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, remarks }),
    });
    if (res.ok) {
      showToast(action === 'approve' ? '✅ Outpass approved! Sent to HOD.' : '❌ Outpass rejected.');
      setSelected(null); setRemarks('');
      load('pending');
    } else {
      const d = await res.json(); showToast('❌ ' + d.error);
    }
    setActioning(false);
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.5rem}
        .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap}
        .filter-btn{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .filter-btn.on{background:rgba(255,200,60,.15);color:#ffc83c;border:1px solid rgba(255,200,60,.3)}
        .filter-btn.off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.08)}
        .filter-btn.off:hover{background:rgba(255,255,255,.09);color:#fff}

        .layout{display:grid;grid-template-columns:1fr 380px;gap:1.5rem}

        .card-list{display:flex;flex-direction:column;gap:10px}
        .op-card{
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;
          border-left:3px solid transparent;
        }
        .op-card:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.13)}
        .op-card.selected{border-color:rgba(255,200,60,.4)!important;background:rgba(255,200,60,.06)}
        .op-card.pending-card{border-left-color:#fbbf24}
        .op-card.approved-card{border-left-color:#4ade80}
        .op-card.rejected-card{border-left-color:#f87171}

        .op-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .op-student{display:flex;align-items:center;gap:10px}
        .av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(255,200,60,.2),rgba(255,200,60,.07));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#ffc83c;flex-shrink:0}
        .sname{font-size:13.5px;font-weight:700;color:rgba(255,255,255,.9)}
        .smeta{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .status-tag{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:7px;white-space:nowrap}
        .op-reason{font-size:13px;color:rgba(255,255,255,.72);margin-bottom:6px;line-height:1.5}
        .op-details{display:flex;gap:16px;flex-wrap:wrap}
        .op-det{font-size:11.5px;color:rgba(255,255,255,.38)}
        .op-det strong{color:rgba(255,255,255,.62)}

        /* Detail panel */
        .detail{
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:16px;padding:1.6rem;position:sticky;top:1rem;
          height:fit-content;max-height:calc(100vh - 2rem);overflow-y:auto;
        }
        .det-title{font-size:14px;font-weight:800;color:#fff;margin-bottom:1.3rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,.07)}
        .det-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .det-row:last-of-type{border-bottom:none}
        .det-key{font-size:12px;color:rgba(255,255,255,.38);font-weight:600}
        .det-val{font-size:13px;color:rgba(255,255,255,.82);font-weight:600;text-align:right;max-width:200px}

        .remarks-lbl{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:6px;margin-top:1.2rem;display:block}
        .remarks-inp{
          width:100%;padding:10px 13px;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);border-radius:10px;
          color:#fff;font-size:13.5px;resize:vertical;min-height:80px;outline:none;
          transition:border-color .2s;font-family:inherit;
        }
        .remarks-inp:focus{border-color:rgba(255,200,60,.5)}
        .remarks-inp::placeholder{color:rgba(255,255,255,.22)}

        .action-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:1rem}
        .btn-approve{
          height:46px;background:linear-gradient(135deg,rgba(74,222,128,.2),rgba(74,222,128,.1));
          border:1px solid rgba(74,222,128,.35);border-radius:11px;color:#4ade80;
          font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;
        }
        .btn-approve:hover{background:linear-gradient(135deg,rgba(74,222,128,.3),rgba(74,222,128,.15))}
        .btn-reject{
          height:46px;background:rgba(248,113,113,.1);
          border:1px solid rgba(248,113,113,.3);border-radius:11px;color:#f87171;
          font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;
        }
        .btn-reject:hover{background:rgba(248,113,113,.2)}
        .btn-approve:disabled,.btn-reject:disabled{opacity:.5;cursor:not-allowed}

        .empty{text-align:center;padding:3rem;color:rgba(255,255,255,.3)}
        .empty-ico{font-size:40px;margin-bottom:.8rem}
        .skel{background:rgba(255,255,255,.06);border-radius:10px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}

        .toast{
          position:fixed;bottom:2rem;right:2rem;z-index:200;
          background:#0d2240;border:1px solid rgba(255,200,60,.3);
          border-radius:12px;padding:13px 18px;
          font-size:13.5px;font-weight:600;color:#fff;
          box-shadow:0 10px 40px rgba(0,0,0,.4);
          animation:slideIn .3s ease;
        }
        @keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}

        .no-select{text-align:center;padding:3rem 1rem;color:rgba(255,255,255,.25);font-size:13px}

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

                  {selected.teacher_status === 'pending' && (
                    <>
                      <label className="remarks-lbl">Remarks (optional)</label>
                      <textarea className="remarks-inp" placeholder="Add a note or reason for your decision..."
                        value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}/>
                      <div className="action-btns">
                        <button className="btn-approve" disabled={actioning} onClick={()=>handleAction(selected.id,'approve')}>
                          {actioning?'…':'✅ Approve'}
                        </button>
                        <button className="btn-reject" disabled={actioning} onClick={()=>handleAction(selected.id,'reject')}>
                          {actioning?'…':'❌ Reject'}
                        </button>
                      </div>
                    </>
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
