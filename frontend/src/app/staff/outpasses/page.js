'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QRCode from 'qrcode';

const ST = {
  pending_hod:       { label:'Awaiting HOD',       color:'#fbbf24', bg:'rgba(251,191,36,.12)',  ico:'⏳', step:1 },
  pending_principal: { label:'Awaiting Principal', color:'#a78bfa', bg:'rgba(167,139,250,.12)', ico:'⏳', step:2 },
  approved:          { label:'Fully Approved',     color:'#4ade80', bg:'rgba(74,222,128,.12)',  ico:'✅', step:3 },
  rejected:          { label:'Rejected',           color:'#f87171', bg:'rgba(248,113,113,.12)', ico:'❌', step:0 },
};

export default function StaffOutpassPage() {
  const router = useRouter();
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' });
  const [qrModal, setQrModal] = useState(null); // { qrUrl, outpass }
  const [user, setUser] = useState(null);

  const showToast = (msg, type='ok') => { setToast({msg, type}); setTimeout(()=>setToast(''), 3500); };

  const load = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/outpass', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setOutpasses(d.outpasses||[]); }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['class_teacher', 'hod'].includes(parsed.role)) { router.push('/login'); return; }
    setUser(parsed);
    load();
  }, []);

  const generateQR = useCallback(async (op) => {
    const qrData = [
      `══════════════════════════`,
      `  LENDI COLLEGE OUTPASS`,
      `══════════════════════════`,
      `Outpass ID  : #${op.id}`,
      `Staff       : ${user?.name || 'N/A'}`,
      `Role        : ${user?.role === 'class_teacher' ? 'Teacher' : 'HOD'}`,
      `Department  : ${user?.department || 'N/A'}`,
      `──────────────────────────`,
      `Destination : ${op.destination}`,
      `Reason      : ${op.reason}`,
      `From        : ${op.from_date} ${op.from_time || ''}`,
      `To          : ${op.to_date} ${op.to_time || ''}`,
      `──────────────────────────`,
      `Status      : ✅ APPROVED`,
      `Approved On : ${op.principal_action_at ? new Date(op.principal_action_at).toLocaleString('en-IN') : 'N/A'}`,
      `══════════════════════════`,
    ].join('\n');
    try {
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 320, margin: 2,
        color: { dark: '#07111f', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrModal({ qrUrl, outpass: op, staffName: user?.name, role: user?.role === 'class_teacher' ? 'Teacher' : 'HOD', department: user?.department });
    } catch (err) { console.error('QR generation failed:', err); }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason||!form.destination||!form.from_date||!form.to_date) { setError('Please fill all required fields'); return; }
    setSubmitting(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/outpass', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        console.error('Failed to parse JSON response:', err);
      }
      if (res.ok) {
        const toastMsg = user?.role === 'hod'
          ? '✅ Outpass submitted to Principal for approval!'
          : '✅ Outpass submitted to HOD for approval!';
        showToast(toastMsg, 'ok');
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

  const stats = {
    total: outpasses.length,
    approved: outpasses.filter(o=>o.status==='approved').length,
    pending: outpasses.filter(o=>o.status==='pending_principal').length,
    rejected: outpasses.filter(o=>o.status==='rejected').length
  };

  const roleColor = user?.role === 'hod' ? '#fbbf24' : '#4ade80';

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
        .btn-apply{background:#0d2340;border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;padding:0 20px;height:44px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;white-space:nowrap;transition:all .2s;box-shadow:0 4px 15px rgba(13,35,64,.2)}
        .btn-apply:hover{background:#d9232d;transform:translateY(-2px);box-shadow:0 6px 20px rgba(217,35,45,.25)}

        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:1.1rem;display:flex;flex-direction:column;gap:4px;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sc-val{font-size:1.6rem;font-weight:800;color:#0d2340}
        .sc-lbl{font-size:12px;color:#64748b;font-weight:600}

        .layout{display:flex;flex-direction:column;gap:1.2rem}
        .card{background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:1.4rem;position:relative;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        
        .op-list{display:flex;flex-direction:column;gap:12px}
        .op-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:1.2rem;display:flex;justify-content:space-between;align-items:center;gap:2rem;flex-wrap:wrap;transition:all .2s}
        .op-card:hover{background:#ffffff;border-color:#cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,0.04)}
        .op-left{flex:1}
        .op-hdr{display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
        .op-reason{font-size:15px;font-weight:800;color:#0d2340}
        .status-badge{font-size:11.5px;font-weight:700;padding:3.5px 10px;border-radius:7px;display:inline-flex;align-items:center;gap:5px}
        
        .grid-det{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0}
        .det-item{display:flex;flex-direction:column;gap:2px}
        .det-l{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700}
        .det-v{font-size:13px;color:#0d2340;font-weight:700}

        /* Tracker styling */
        .track-row{display:flex;align-items:center;gap:15px;margin-top:12px;padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#475569}
        
        .qr-btn{height:40px;padding:0 16px;background:#16a34a;border:none;border-radius:9px;color:#ffffff;font-size:12.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
        .qr-btn:hover{background:#15803d}

        /* Form Overlay */
        .modal-overlay{position:fixed;inset:0;background:rgba(13,35,64,.4);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:2rem;width:100%;max-width:520px;box-shadow:0 20px 50px rgba(0,0,0,0.15)}
        .modal-t{font-size:1.3rem;font-weight:800;margin-bottom:1.2rem;color:#0d2340}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{display:flex;flex-direction:column;gap:5px;margin-bottom:1rem}
        .field.full{grid-column:1 / -1}
        .lbl{font-size:11.5px;font-weight:700;color:#0d2340;text-transform:uppercase}
        .inp{width:100%;height:44px;padding:0 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:9px;color:#0d2340;font-size:13.5px;outline:none;transition:border-color .2s;font-family:inherit;font-weight:500}
        .inp:focus{border-color:#0d2340;background:#ffffff}
        .modal-btns{display:flex;justify-content:flex-end;gap:10px;margin-top:1rem}
        .btn-c{height:44px;padding:0 18px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:9px;color:#475569;font-size:13.5px;font-weight:700;cursor:pointer}
        .btn-s{height:44px;padding:0 22px;background:#0d2340;border:none;border-radius:9px;color:#fff;font-size:13.5px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(13,35,64,.2)}
        .err{color:#dc2626;font-size:12.5px;margin-bottom:1rem;font-weight:600}

        /* QR Modal Overlay */
        .qr-modal-body{text-align:center;padding:1.5rem}
        .qr-box{display:inline-block;padding:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:1.5rem}
        .qr-box img{display:block}
        .qr-download{height:44px;padding:0 20px;background:#16a34a;border:none;border-radius:10px;color:#ffffff;font-size:13.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s;justify-content:center}
        .qr-download:hover{background:#15803d}

        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2340;border:1px solid #1e293b;border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.2)}
        .empty{text-align:center;padding:3.5rem;color:#94a3b8;font-size:14px}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr 1fr}.op-card{flex-direction:column;align-items:stretch}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="toprow">
            <div>
              <div className="page-title">🎫 Staff Outpass Portal</div>
              <div className="page-sub">Request gate passes directly to the Principal and check status</div>
            </div>
            <button className="btn-apply" onClick={()=>setShowForm(true)}>
              <span style={{fontSize:16}}>+</span> Apply for Outpass
            </button>
          </div>

          <div className="stats">
            {[
              { l:'Total Applications', v:loading?'…':stats.total },
              { l:'Pending Principal', v:loading?'…':stats.pending },
              { l:'Fully Approved', v:loading?'…':stats.approved },
              { l:'Rejected Requests', v:loading?'…':stats.rejected },
            ].map((s,i)=>(
              <div key={i} className="sc">
                <span className="sc-lbl">{s.l}</span>
                <span className="sc-val">{s.v}</span>
              </div>
            ))}
          </div>

          <div className="layout">
            <div className="card">
              <div style={{fontSize:14,fontWeight:800,marginBottom:'1.2rem',color:'rgba(255,255,255,.85)'}}>📋 Outpass Requests Log</div>
              {loading ? <div className="empty">Loading outpasses…</div> :
               outpasses.length === 0 ? <div className="empty">🎫 No outpasses applied yet. Click "Apply for Outpass" to start.</div> :
               <div className="op-list">
                 {outpasses.map(op => {
                   const st = ST[op.status] || ST.pending_principal;
                   return (
                     <div key={op.id} className="op-card">
                       <div className="op-left">
                         <div className="op-hdr">
                           <span className="op-reason">{op.reason}</span>
                           <span className="status-badge" style={{color:st.color,background:st.bg}}>{st.ico} {st.label}</span>
                         </div>
                         <div className="grid-det">
                           <div className="det-item"><span className="det-l">Destination</span><span className="det-v">{op.destination}</span></div>
                           <div className="det-item"><span className="det-l">From</span><span className="det-v">{op.from_date} · {op.from_time||'—'}</span></div>
                           <div className="det-item"><span className="det-l">To</span><span className="det-v">{op.to_date} · {op.to_time||'—'}</span></div>
                           <div className="det-item"><span className="det-l">Applied On</span><span className="det-v">{new Date(op.created_at).toLocaleDateString('en-IN')}</span></div>
                         </div>
                          <div className="track-row" style={{display:'flex',flexWrap:'wrap',gap:'10px'}}>
                            {user?.role === 'class_teacher' && (
                              <div style={{marginRight:15}}>
                                👨‍💼 <strong>HOD Status:</strong>{' '}
                                <span style={{color:op.hod_status==='approved'?'#4ade80':op.hod_status==='rejected'?'#f87171':'#fbbf24',fontWeight:700}}>
                                  {op.hod_status.toUpperCase()}
                                </span>
                                {op.hod_remarks && <span style={{color:'rgba(255,255,255,.5)'}}> · Remarks: "{op.hod_remarks}"</span>}
                              </div>
                            )}
                            <div>
                              👑 <strong>Principal Status:</strong>{' '}
                              <span style={{color:op.principal_status==='approved'?'#4ade80':op.principal_status==='rejected'?'#f87171':'#a78bfa',fontWeight:700}}>
                                {op.principal_status.toUpperCase()}
                              </span>
                              {op.principal_remarks && <span style={{color:'rgba(255,255,255,.5)'}}> · Remarks: "{op.principal_remarks}"</span>}
                            </div>
                          </div>
                       </div>
                       {(op.principal_status==='approved' || op.status==='approved') && (
                         <button className="qr-btn" onClick={()=>generateQR(op)}>
                           <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="10" y="10" width="4" height="4" rx=".5" stroke="currentColor" strokeWidth="1.2"/></svg>
                           Gate Pass QR
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>
              }
            </div>
          </div>
        </main>
      </div>

      {/* Form Overlay Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-t">➕ Submit Outpass Request</h2>
            {error && <div className="err">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field full">
                  <label className="lbl">Outpass Reason</label>
                  <input className="inp" required placeholder="e.g. Official Duty, Personal Work" value={form.reason}
                    onChange={e=>setForm({...form,reason:e.target.value})}/>
                </div>
                <div className="field full">
                  <label className="lbl">Destination</label>
                  <input className="inp" required placeholder="e.g. Vizianagaram Town, Bank" value={form.destination}
                    onChange={e=>setForm({...form,destination:e.target.value})}/>
                </div>
                <div className="field">
                  <label className="lbl">From Date</label>
                  <input className="inp" type="date" required value={form.from_date}
                    onChange={e=>setForm({...form,from_date:e.target.value})}/>
                </div>
                <div className="field">
                  <label className="lbl">To Date</label>
                  <input className="inp" type="date" required value={form.to_date}
                    onChange={e=>setForm({...form,to_date:e.target.value})}/>
                </div>
                <div className="field">
                  <label className="lbl">From Time (optional)</label>
                  <input className="inp" type="time" value={form.from_time}
                    onChange={e=>setForm({...form,from_time:e.target.value})}/>
                </div>
                <div className="field">
                  <label className="lbl">To Time (optional)</label>
                  <input className="inp" type="time" value={form.to_time}
                    onChange={e=>setForm({...form,to_time:e.target.value})}/>
                </div>
              </div>
              <div className="modal-btns">
                <button type="button" className="btn-c" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-s" disabled={submitting}>
                  {submitting?'Submitting…':'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal Overlay */}
      {qrModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}}>
            <h2 className="modal-t" style={{textAlign:'center'}}>Gate Pass Approved</h2>
            <div className="qr-modal-body">
              <div className="qr-box">
                <img src={qrModal.qrUrl} alt="Gate Pass QR" width={220} height={220}/>
              </div>
              <div style={{fontSize:13.5,color:'rgba(255,255,255,.8)',marginBottom:'1.5rem',lineHeight:1.6}}>
                <div style={{fontWeight:800,fontSize:15}}>{qrModal.staffName}</div>
                <div>{qrModal.role} · Dept: {qrModal.department}</div>
                <div style={{color:'rgba(255,255,255,.4)',fontSize:11.5,marginTop:4}}>Outpass ID: #{qrModal.outpass.id}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button className="qr-download" onClick={()=>{
                  const a = document.createElement('a'); a.href = qrModal.qrUrl;
                  a.download = `staff_outpass_${qrModal.outpass.id}_qr.png`; a.click();
                }}>📥 Download Gate Pass</button>
                <button className="btn-c" style={{height:40}} onClick={()=>setQrModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast.msg}</div>}
    </>
  );
}
