'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QRCode from 'qrcode';

export default function PrincipalOutpassPage() {
  const router = useRouter();
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actioning, setActioning] = useState(false);
  const [toast, setToast] = useState('');
  const [userRole, setUserRole] = useState('principal');
  const [notifs, setNotifs] = useState([]);
  const [qrUrl, setQrUrl] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (f) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/teacher?filter=${f}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setOutpasses(d.outpasses || []); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'principal') { router.push('/login'); return; }
    setUserRole(parsed.role);
    load(filter);
    // Fetch notifications
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
  }, [filter]);

  const unread = notifs.filter(n=>!n.is_read).length;

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
      'Approved On : ' + (op.principal_action_at ? new Date(op.principal_action_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')),
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

  const handleAction = async (id, action) => {
    setActioning(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/outpass/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, remarks }),
    });
    if (res.ok) {
      showToast(action === 'approve' ? '✅ Outpass fully approved! User notified.' : '❌ Outpass rejected.');
      setSelected(null); setRemarks('');
      load('pending');
    } else {
      const d = await res.json(); showToast('❌ ' + d.error);
    }
    setActioning(false);
  };

  // For Principal: show outpasses based on status
  const displayOutpasses = filter === 'pending'
    ? outpasses.filter(o => o.status === 'pending_principal')
    : filter === 'approved'
    ? outpasses.filter(o => o.principal_status === 'approved')
    : outpasses.filter(o => o.principal_status === 'rejected');

  const selectOutpass = (op) => {
    setSelected(op);
    setRemarks('');
    setQrUrl(null);
    if (op.principal_status === 'approved' || op.status === 'approved') {
      generateQR(op);
    }
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
        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap}
        .fb{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .fb.on{background:rgba(167,139,250,.15);color:#a78bfa;border:1px solid rgba(167,139,250,.3)}
        .fb.off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.08)}
        .fb.off:hover{background:rgba(255,255,255,.09);color:#fff}
        .layout{display:grid;grid-template-columns:1fr 390px;gap:1.5rem}
        .card-list{display:flex;flex-direction:column;gap:10px}
        .op-card{
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;
          border-left:3px solid transparent;
        }
        .op-card:hover{background:rgba(255,255,255,.07)}
        .op-card.sel{border-color:rgba(167,139,250,.4)!important;background:rgba(167,139,250,.05)}
        .op-card.p{border-left-color:#a78bfa}
        .op-card.a{border-left-color:#4ade80}
        .op-card.r{border-left-color:#f87171}
        .op-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .student-row{display:flex;align-items:center;gap:10px}
        .av{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(167,139,250,.07));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#a78bfa;flex-shrink:0}
        .sname{font-size:13.5px;font-weight:700;color:rgba(255,255,255,.9)}
        .smeta{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .stag{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:7px;white-space:nowrap}
        .op-reason{font-size:13px;color:rgba(255,255,255,.72);margin-bottom:6px;line-height:1.5}
        .op-details{display:flex;gap:14px;flex-wrap:wrap}
        .op-det{font-size:11.5px;color:rgba(255,255,255,.38)}
        .op-det strong{color:rgba(255,255,255,.6)}
        .teacher-status{
          margin-top:8px;padding:7px 10px;border-radius:8px;
          background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.18);
          font-size:12px;color:#86efac;display:flex;align-items:center;gap:6px;
        }

        .detail{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.6rem;position:sticky;top:1rem;height:fit-content;max-height:calc(100vh - 2rem);overflow-y:auto}
        .det-title{font-size:14px;font-weight:800;color:#fff;margin-bottom:1.3rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,.07)}
        .det-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .det-row:last-of-type{border-bottom:none}
        .dk{font-size:12px;color:rgba(255,255,255,.38);font-weight:600}
        .dv{font-size:13px;color:rgba(255,255,255,.82);font-weight:600;text-align:right;max-width:200px}

        .rl{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:6px;margin-top:1.2rem;display:block}
        .ri{width:100%;padding:10px 13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:13.5px;resize:vertical;min-height:80px;outline:none;transition:border-color .2s;font-family:inherit}
        .ri:focus{border-color:rgba(167,139,250,.5)}
        .ri::placeholder{color:rgba(255,255,255,.22)}
        .act-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:1rem}
        .btn-ap{height:48px;background:linear-gradient(135deg,rgba(74,222,128,.2),rgba(74,222,128,.1));border:1px solid rgba(74,222,128,.35);border-radius:11px;color:#4ade80;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
        .btn-ap:hover{background:linear-gradient(135deg,rgba(74,222,128,.3),rgba(74,222,128,.15))}
        .btn-rj{height:48px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:11px;color:#f87171;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
        .btn-rj:hover{background:rgba(248,113,113,.2)}
        .btn-ap:disabled,.btn-rj:disabled{opacity:.5;cursor:not-allowed}

        .empty{text-align:center;padding:3rem;color:rgba(255,255,255,.3)}
        .skel{background:rgba(255,255,255,.06);border-radius:10px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2240;border:1px solid rgba(167,139,250,.3);border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.4);animation:si .3s ease}
        @keyframes si{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
        .qr-section{margin-top:1.2rem;padding:16px;background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.15);border-radius:14px;text-align:center}
        .qr-section-title{font-size:13px;font-weight:700;color:#86efac;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px}
        .qr-wrap{display:inline-block;padding:12px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.2);margin-bottom:10px}
        .qr-wrap img{display:block;width:180px;height:180px}
        .qr-download-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.25);border-radius:8px;color:#4ade80;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .qr-download-btn:hover{background:rgba(74,222,128,.2)}
        .no-sel{text-align:center;padding:3rem 1rem;color:rgba(255,255,255,.25);font-size:13px}
        @media(max-width:1100px){.layout{grid-template-columns:1fr}.detail{position:static}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}}
      `}</style>
      <div className="root">
        <Sidebar pendingCount={outpasses.filter(o=>o.status==='pending_principal').length} unreadCount={unread} />
        <main className="main">
          <div className="page-title">👑 Principal Outpass Approvals</div>
          <div className="page-sub">Final approval authority for all outpass requests in the institution</div>
          <div className="toolbar">
            {['pending','approved','rejected'].map(f=>(
              <button key={f} className={`fb ${filter===f?'on':'off'}`} onClick={()=>{setFilter(f);setSelected(null);}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                {f==='pending' && outpasses.filter(o=>o.status==='pending_principal').length > 0 &&
                  <span style={{marginLeft:6,background:'#f87171',color:'#fff',fontSize:10,padding:'1px 6px',borderRadius:8}}>
                    {outpasses.filter(o=>o.status==='pending_principal').length}
                  </span>}
              </button>
            ))}
          </div>

          <div className="layout">
            <div className="card-list">
              {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:120}}/>) :
               displayOutpasses.length === 0 ? <div className="empty"><div style={{fontSize:40,marginBottom:8}}>✅</div>No {filter} approvals</div> :
               displayOutpasses.map(op => {
                 const initials = op.student_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                 const prSt = op.principal_status;
                 const stColor = prSt==='approved'?'#4ade80':prSt==='rejected'?'#f87171':'#a78bfa';
                 const stBg = prSt==='approved'?'rgba(74,222,128,.12)':prSt==='rejected'?'rgba(248,113,113,.12)':'rgba(167,139,250,.12)';
                 const isStudent = !!op.student_id;
                 return (
                   <div key={op.id} className={`op-card ${prSt==='pending'?'p':prSt==='approved'?'a':'r'}${selected?.id===op.id?' sel':''}`}
                     onClick={()=>selectOutpass(op)}>
                     <div className="op-top">
                       <div className="student-row">
                         <div className="av">{initials}</div>
                         <div>
                           <div className="sname">{op.student_name}</div>
                           <div className="smeta">
                             {isStudent ? (
                               `${op.roll_no} · Dept: ${op.department}`
                             ) : (
                               `${op.applicant_role === 'class_teacher' ? 'Teacher' : 'HOD'} · Dept: ${op.department}`
                             )}
                           </div>
                         </div>
                       </div>
                       <span className="stag" style={{color:stColor,background:stBg}}>{prSt==='pending'?'Awaiting Principal':prSt.charAt(0).toUpperCase()+prSt.slice(1)}</span>
                     </div>
                     <div className="op-reason">📝 {op.reason}</div>
                     <div className="op-details">
                       <div className="op-det"><strong>📍</strong> {op.destination}</div>
                       <div className="op-det"><strong>📅</strong> {op.from_date}{op.to_date!==op.from_date?` → ${op.to_date}`:''}</div>
                       <div className="op-det"><strong>🕐</strong> {op.from_time} – {op.to_time}</div>
                     </div>
                     <div className="teacher-status">
                       {isStudent ? (
                         <>
                           <span>🏛️</span> Approved by Teacher &amp; HOD ({op.department})
                           {op.hod_remarks && <span style={{color:'rgba(255,255,255,.5)',marginLeft:4}}>· HOD: "{op.hod_remarks}"</span>}
                         </>
                       ) : (
                         <>
                           <span>💼</span> Direct Staff Request ({op.applicant_role === 'class_teacher' ? 'Teacher' : 'HOD'})
                         </>
                       )}
                     </div>
                   </div>
                 );
               })}
            </div>

            <div className="detail">
              {!selected ? (
                <div className="no-sel"><div style={{fontSize:36,marginBottom:8}}>👈</div>Select a request to review</div>
              ) : (
                <>
                  <div className="det-title">📋 Full Outpass Details</div>
                  {(() => {
                    const isStudent = !!selected.student_id;
                    const details = [
                      [isStudent ? 'Student Name' : 'Staff Name', selected.student_name],
                      [isStudent ? 'Roll Number' : 'Role', isStudent ? selected.roll_no : (selected.applicant_role === 'class_teacher' ? 'Teacher' : 'HOD')],
                      ['Department', selected.department],
                    ];
                    if (isStudent) {
                      details.push(['Year / Semester', `Year ${selected.year} · Sem ${selected.semester}`]);
                      details.push(['Section', selected.section]);
                    }
                    details.push(
                      ['Reason', selected.reason],
                      ['Destination', selected.destination],
                      ['From Date', selected.from_date],
                      ['To Date', selected.to_date],
                      ['Time', `${selected.from_time} – ${selected.to_time}`]
                    );
                    if (isStudent) {
                      details.push(['Teacher Remarks', selected.teacher_remarks || '—']);
                      details.push(['HOD Remarks', selected.hod_remarks || '—']);
                    }
                    details.push(['Applied On', new Date(selected.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})]);
                    
                    return details.map(([k,v])=>(
                      <div key={k} className="det-row"><span className="dk">{k}</span><span className="dv">{v}</span></div>
                    ));
                  })()}

                  {selected.status === 'pending_principal' && (
                    <>
                      <label className="rl">Your Remarks (optional)</label>
                      <textarea className="ri" placeholder="Add remarks for your decision..."
                        value={remarks} onChange={e=>setRemarks(e.target.value)} rows={3}/>
                      <div className="act-btns">
                        <button className="btn-ap" disabled={actioning} onClick={()=>handleAction(selected.id,'approve')}>
                          {actioning?'…':'✅ Approve'}
                        </button>
                        <button className="btn-rj" disabled={actioning} onClick={()=>handleAction(selected.id,'reject')}>
                          {actioning?'…':'❌ Reject'}
                        </button>
                      </div>
                    </>
                  )}
                  {(selected.principal_status === 'approved' || selected.status === 'approved') && (
                    <>
                      <div style={{marginTop:'1rem',padding:'12px',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.2)',borderRadius:10,fontSize:13,color:'#86efac'}}>
                        ✅ You fully approved this outpass.
                        {selected.principal_remarks&&<div style={{marginTop:6,color:'rgba(255,255,255,.5)'}}>Remarks: {selected.principal_remarks}</div>}
                      </div>
                      {/* QR Code for approved outpass */}
                      {qrUrl && (
                        <div className="qr-section">
                          <div className="qr-section-title">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="10" y="10" width="4" height="4" rx=".5" stroke="currentColor" strokeWidth="1.2"/></svg>
                            Gate Pass QR Code
                          </div>
                          <div className="qr-wrap">
                            <img src={qrUrl} alt="Outpass QR" />
                          </div>
                          <div>
                            <button className="qr-download-btn" onClick={() => {
                              const a = document.createElement('a');
                              a.href = qrUrl;
                              a.download = `outpass_${selected.id}_qr.png`;
                              a.click();
                            }}>📥 Download QR</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {selected.principal_status === 'rejected' && (
                    <div style={{marginTop:'1rem',padding:'12px',background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,fontSize:13,color:'#fca5a5'}}>
                      ❌ You rejected this outpass.
                      {selected.principal_remarks&&<div style={{marginTop:6}}>Reason: {selected.principal_remarks}</div>}
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
