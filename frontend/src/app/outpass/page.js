'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QRCode from 'qrcode';

const ST = {
  pending_teacher:   { label:'Awaiting Teacher',   color:'#fbbf24', bg:'rgba(251,191,36,.12)', ico:'⏳', step:1 },
  pending_hod:       { label:'Awaiting HOD',       color:'#60a5fa', bg:'rgba(96,165,250,.12)',  ico:'📋', step:2 },
  pending_principal: { label:'Awaiting Principal', color:'#a78bfa', bg:'rgba(167,139,250,.12)', ico:'👑', step:3 },
  approved:          { label:'Fully Approved',     color:'#4ade80', bg:'rgba(74,222,128,.12)',  ico:'✅', step:4 },
  rejected:          { label:'Rejected',           color:'#f87171', bg:'rgba(248,113,113,.12)', ico:'❌', step:0 },
};

export default function OutpassPage() {
  const router = useRouter();
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' });
  const [qrModal, setQrModal] = useState(null); // { qrUrl, outpass, ... }

  const showToast = (msg, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(''),3500); };

  const generateQR = useCallback(async (op) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sName = op.student_name || user.name || 'Student';
    const rNo = op.roll_no || user.student?.roll_no || 'N/A';
    const dept = op.department || user.department || 'N/A';
    const yrSem = op.year ? `Yr ${op.year} · Sec ${op.section || 'A'}` : '';

    const qrData = [
      `════════════════════════════════`,
      `  LENDI INSTITUTE OF TECH OUTPASS`,
      `════════════════════════════════`,
      `Outpass ID  : #${op.id}`,
      `Student Name: ${sName}`,
      `Roll Number : ${rNo}`,
      `Department  : ${dept} ${yrSem ? `(${yrSem})` : ''}`,
      `────────────────────────────────`,
      `Destination : ${op.destination}`,
      `Reason      : ${op.reason}`,
      `From        : ${op.from_date} ${op.from_time || ''}`,
      `To          : ${op.to_date} ${op.to_time || ''}`,
      `────────────────────────────────`,
      `Status      : ✅ FULLY APPROVED`,
      `Approved By : Teacher ✓ | HOD ✓ | Principal ✓`,
      `Approved On : ${op.principal_action_at ? new Date(op.principal_action_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}`,
      `════════════════════════════════`,
    ].join('\n');

    try {
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 340, margin: 2,
        color: { dark: '#07111f', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrModal({
        qrUrl,
        outpass: op,
        studentName: sName,
        rollNo: rNo,
        department: dept,
        year: op.year,
        section: op.section
      });
    } catch (err) { console.error('QR generation failed:', err); }
  }, []);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/outpass', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      const list = d.outpasses || [];
      setOutpasses(list);
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id');
      if (targetId) {
        const found = list.find(o => String(o.id) === String(targetId));
        if (found && found.status === 'approved') {
          generateQR(found);
        }
      }
    }
    setLoading(false);
  }, [generateQR]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    load();
  }, [load, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason||!form.destination||!form.from_date||!form.to_date) { setError('Please fill all required fields'); return; }
    setSubmitting(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/outpass', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok) {
        showToast('✅ Outpass submitted! Your teacher will review it shortly.','ok');
        setShowForm(false); setForm({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' });
        load();
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission request failed:', err);
      setError('Connection/server error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = { total:outpasses.length, approved:outpasses.filter(o=>o.status==='approved').length, pending:outpasses.filter(o=>o.status?.startsWith('pending')).length, rejected:outpasses.filter(o=>o.status==='rejected').length };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .toprow{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;flex-wrap:wrap;gap:1rem}
        .page-title{font-size:1.5rem;font-weight:800;color:#0d2340}
        .page-sub{font-size:13.5px;color:#64748b;margin-bottom:1.5rem}
        .btn-apply{background:#0d2340;border:none;border-radius:12px;color:#ffffff;font-size:14px;font-weight:800;padding:0 20px;height:44px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;white-space:nowrap;transition:all .2s;box-shadow:0 4px 14px rgba(13,35,64,.15)}
        .btn-apply:hover{background:#d9232d;transform:translateY(-2px);box-shadow:0 6px 20px rgba(217,35,45,.2)}

        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.8rem}
        .sc{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,0.02)}
        .sc-n{font-size:1.8rem;font-weight:800;color:#0d2340;line-height:1;margin-bottom:4px}
        .sc-l{font-size:12px;color:#64748b;font-weight:600}

        .op-list{display:flex;flex-direction:column;gap:12px}
        .op-card{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;transition:all .2s;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .op-card:hover{border-color:#cbd5e1;box-shadow:0 6px 16px rgba(0,0,0,0.05)}
        .op-card.approved{border-left:4px solid #16a34a}
        .op-card.pending_teacher,.op-card.pending_hod,.op-card.pending_principal{border-left:4px solid #f59e0b}
        .op-card.rejected{border-left:4px solid #dc2626}

        .op-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px}
        .op-reason{font-size:15px;font-weight:800;color:#0d2340}
        .op-badge{font-size:12px;font-weight:700;padding:5px 12px;border-radius:8px;white-space:nowrap}
        .op-meta{font-size:12.5px;color:#64748b;line-height:1.8}
        .op-meta strong{color:#0d2340}

        /* Progress steps */
        .op-steps{display:flex;align-items:center;gap:0;margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9}
        .step-item{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1}
        .step-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
        .step-dot.done{background:#16a34a;color:#ffffff}
        .step-dot.cur{background:rgba(245,158,11,.15);border:2px solid #f59e0b;color:#d97706}
        .step-dot.todo{background:#f1f5f9;border:1px solid #cbd5e1;color:#94a3b8}
        .step-dot.rej{background:#fee2e2;border:2px solid #dc2626;color:#dc2626}
        .step-lbl{font-size:10px;color:#64748b;text-align:center;font-weight:600}
        .step-line{flex:1;height:2px;background:#e2e8f0}
        .step-line.done{background:#16a34a}

        /* Form modal */
        .backdrop{position:fixed;inset:0;z-index:50;background:rgba(13,35,64,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem}
        .modal{background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:2rem;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.15)}
        .modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
        .modal-title{font-size:1.1rem;font-weight:800;color:#0d2340}
        .close{background:none;border:none;color:#64748b;cursor:pointer;padding:4px;display:flex;align-items:center}
        .close:hover{color:#0d2340}
        .form{display:flex;flex-direction:column;gap:.95rem}
        .field{display:flex;flex-direction:column;gap:5px}
        .lbl{font-size:12px;font-weight:700;color:#0d2340;letter-spacing:.3px}
        .inp,.textarea{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:14px;outline:none;transition:border-color .2s;font-family:inherit;font-weight:500}
        .inp{height:46px;padding:0 14px}
        .textarea{padding:12px 14px;resize:vertical;min-height:80px}
        .inp::placeholder,.textarea::placeholder{color:#94a3b8}
        .inp:focus,.textarea:focus{border-color:#0d2340;background:#ffffff}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .alert-err{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:10px;font-size:13px;background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;margin-bottom:.5rem}
        .form-btns{display:flex;gap:10px;margin-top:4px}
        .btn-cancel{flex:1;height:48px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;color:#475569;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600}
        .btn-submit{flex:2;height:48px;background:#0d2340;border:none;border-radius:12px;color:#ffffff;font-size:14.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;transition:all .2s;box-shadow:0 4px 12px rgba(13,35,64,.2)}
        .btn-submit:hover{background:#d9232d}
        .btn-submit:disabled{opacity:.55;cursor:not-allowed}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#ffffff;border-radius:50%;animation:rot .7s linear infinite;flex-shrink:0}
        @keyframes rot{to{transform:rotate(360deg)}}

        .empty{text-align:center;padding:4rem 2rem}
        .empty-ico{font-size:48px;margin-bottom:1rem}
        .empty-t{font-size:16px;font-weight:700;color:#64748b;margin-bottom:.4rem}
        .empty-s{font-size:13px;color:#94a3b8}

        .skel{background:#e2e8f0;border-radius:10px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}

        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2340;border:1px solid #1e293b;border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.2);animation:si .3s ease}
        @keyframes si{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}

        .qr-btn{margin-top:12px;display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#dcfce7;border:1px solid #86efac;border-radius:11px;color:#16a34a;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .qr-btn:hover{background:#bbf7d0;transform:translateY(-1px)}
        .qr-backdrop{position:fixed;inset:0;z-index:100;background:rgba(13,35,64,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .25s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .qr-modal{background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:2rem;width:100%;max-width:420px;box-shadow:0 30px 60px rgba(0,0,0,.2);text-align:center;animation:scaleIn .3s ease}
        @keyframes scaleIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
        .qr-header{font-size:18px;font-weight:800;color:#0d2340;margin-bottom:4px}
        .qr-sub{font-size:13px;color:#64748b;margin-bottom:1.5rem}
        .qr-frame{display:inline-block;padding:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.08);margin-bottom:1.2rem}
        .qr-frame img{display:block;width:260px;height:260px}
        .qr-info{display:flex;flex-direction:column;gap:7px;text-align:left;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:1.2rem}
        .qr-row{display:flex;justify-content:space-between;font-size:12.5px}
        .qr-lbl{color:#64748b;font-weight:600}
        .qr-val{color:#0d2340;font-weight:700;text-align:right;max-width:60%}
        .qr-actions{display:flex;gap:10px}
        .qr-download{flex:1;height:44px;background:#0d2340;border:none;border-radius:11px;color:#ffffff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
        .qr-download:hover{background:#d9232d;transform:translateY(-1px)}
        .qr-close{flex:1;height:44px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:11px;color:#475569;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
        .qr-close:hover{background:#e2e8f0;color:#0d2340}

        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr 1fr}.toprow{flex-direction:column}.op-steps{display:none}.qr-frame img{width:220px;height:220px}.qr-modal{padding:1.5rem}}
      `}</style>


      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="toprow">
            <div><div className="page-title">🚪 My Outpasses</div><div className="page-sub">Apply for outpass and track approval status</div></div>
            <button className="btn-apply" onClick={()=>{setShowForm(true);setError('')}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Apply for Outpass
            </button>
          </div>

          <div className="stats">
            {[{n:stats.total,l:'Total',c:'#fff'},{n:stats.approved,l:'Approved',c:'#4ade80'},{n:stats.pending,l:'Pending',c:'#fbbf24'},{n:stats.rejected,l:'Rejected',c:'#f87171'}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-n" style={{color:s.c}}>{s.n}</div><div className="sc-l">{s.l}</div></div>
            ))}
          </div>

          {loading ? <div className="op-list">{[1,2,3].map(i=><div key={i} className="skel" style={{height:100}}/>)}</div>
          : outpasses.length===0 ? (
            <div className="empty">
              <div className="empty-ico">🚪</div>
              <div className="empty-t">No outpasses yet</div>
              <div className="empty-s">Click "Apply for Outpass" above to submit your first request</div>
            </div>
          ) : (
            <div className="op-list">
              {outpasses.map(op => {
                const st = ST[op.status]||{label:op.status,color:'#fff',bg:'rgba(255,255,255,.1)',ico:'📋',step:0};
                const isApproved = op.status==='approved';
                const isRejected = op.status==='rejected';
                return (
                  <div key={op.id} className={`op-card ${op.status}`}>
                    <div className="op-head">
                      <div className="op-reason">{op.reason}</div>
                      <span className="op-badge" style={{color:st.color,background:st.bg}}>{st.ico} {st.label}</span>
                    </div>
                    <div className="op-meta">
                      <strong>Destination:</strong> {op.destination} &nbsp;·&nbsp;
                      <strong>Date:</strong> {op.from_date}{op.to_date!==op.from_date?` → ${op.to_date}`:''} &nbsp;·&nbsp;
                      {op.from_time&&<><strong>Time:</strong> {op.from_time} — {op.to_time} &nbsp;·&nbsp;</>}
                      <strong>Applied:</strong> {new Date(op.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                    {/* Approval steps */}
                    <div className="op-steps">
                      {[
                        {lbl:'Submitted', done:true, rej:false},
                        {lbl:'Teacher', done:op.teacher_status==='approved'||isApproved, rej:op.teacher_status==='rejected'||isRejected},
                        {lbl:'HOD', done:op.hod_status==='approved'||isApproved, rej:op.hod_status==='rejected'},
                        {lbl:'Principal', done:op.principal_status==='approved'||isApproved, rej:op.principal_status==='rejected'},
                        {lbl:'Approved', done:isApproved, rej:isRejected},
                      ].map((step,i,arr)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
                          <div className="step-item">
                            <div className={`step-dot ${step.rej?'rej':step.done?'done':i===st.step?'cur':'todo'}`}>
                              {step.rej?'✗':step.done?'✓':i+1}
                            </div>
                            <div className="step-lbl">{step.lbl}</div>
                          </div>
                          {i<arr.length-1 && <div className={`step-line ${step.done&&!step.rej?'done':''}`}/>}
                        </div>
                      ))}
                    </div>
                    {/* QR Button for approved outpasses */}
                    {isApproved && (
                      <button className="qr-btn" onClick={(e) => { e.stopPropagation(); generateQR(op); }}>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="10" y="10" width="4" height="4" rx=".5" stroke="currentColor" strokeWidth="1.2"/></svg>
                        🎫 Show Gate Pass QR
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">🚪 Apply for Outpass</div>
              <button className="close" onClick={()=>setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
            {error && <div className="alert-err"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3M7 9v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>{error}</div>}
            <form className="form" onSubmit={handleSubmit}>
              <div className="field"><label className="lbl">Reason *</label><textarea className="textarea" placeholder="Describe your reason for going out..." value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} required/></div>
              <div className="field"><label className="lbl">Destination *</label><input className="inp" type="text" placeholder="Where are you going?" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} required/></div>
              <div className="two">
                <div className="field"><label className="lbl">From Date *</label><input className="inp" type="date" value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})} required/></div>
                <div className="field"><label className="lbl">To Date *</label><input className="inp" type="date" value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})} required/></div>
              </div>
              <div className="two">
                <div className="field"><label className="lbl">From Time</label><input className="inp" type="time" value={form.from_time} onChange={e=>setForm({...form,from_time:e.target.value})}/></div>
                <div className="field"><label className="lbl">To Time</label><input className="inp" type="time" value={form.to_time} onChange={e=>setForm({...form,to_time:e.target.value})}/></div>
              </div>
              <div className="form-btns">
                <button type="button" className="btn-cancel" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>{submitting?<><span className="spin"/>Submitting…</>:'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast.msg}</div>}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="qr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setQrModal(null); }}>
          <div className="qr-modal">
            <div className="qr-header">🎫 Gate Pass QR Code</div>
            <div className="qr-sub">Show this QR at the security gate for verification</div>
            <div className="qr-frame">
              <img src={qrModal.qrUrl} alt="Outpass QR Code" />
            </div>
            <div className="qr-info">
              {[
                ['Outpass ID', `#${qrModal.outpass.id}`],
                ['Student Name', qrModal.studentName],
                ['Roll Number', qrModal.rollNo],
                ['Department', `${qrModal.department}${qrModal.year ? ` (Yr ${qrModal.year})` : ''}`],
                ['Destination', qrModal.outpass.destination],
                ['Date', `${qrModal.outpass.from_date}${qrModal.outpass.to_date !== qrModal.outpass.from_date ? ` → ${qrModal.outpass.to_date}` : ''}`],
                ['Time', `${qrModal.outpass.from_time || '—'} – ${qrModal.outpass.to_time || '—'}`],
                ['Approval Status', '✅ Teacher ✓ | HOD ✓ | Principal ✓'],
              ].map(([k, v]) => (
                <div key={k} className="qr-row"><span className="qr-lbl">{k}</span><span className="qr-val">{v}</span></div>
              ))}
            </div>
            <div className="qr-actions">
              <button className="qr-download" onClick={() => {
                const a = document.createElement('a');
                a.href = qrModal.qrUrl;
                a.download = `outpass_${qrModal.outpass.id}_qr.png`;
                a.click();
              }}>📥 Download QR</button>
              <button className="qr-close" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
