'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u || '{}');
    if (parsed.role !== 'student') {
      if (parsed.role === 'class_teacher') router.push('/teacher/dashboard');
      else if (parsed.role === 'hod') router.push('/hod/dashboard');
      else if (parsed.role === 'principal') router.push('/principal/dashboard');
      else if (parsed.role === 'admin') router.push('/admin/dashboard');
      else router.push('/hod/dashboard');
      return;
    }
    setUser(parsed);
    const h = { Authorization: `Bearer ${token}` };
    fetch('/api/notifications', { headers: h })
      .then(async (r) => { if (r.ok) { const d = await r.json(); setNotifs(d.notifications||[]); } })
      .finally(() => setLoading(false));
  }, [router]);

  const unread = notifs.filter(n=>!n.is_read).length;
  const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

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
        showToast('✅ Outpass submitted! Your teacher will review it shortly.');
        setForm({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' });
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

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc;display:flex;flex-direction:column}

        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .greet{font-size:1.55rem;font-weight:800;letter-spacing:-.4px;color:#0d2340}
        .greet span{color:#d9232d}
        .greet-sub{font-size:13.5px;color:#64748b;margin-top:3px;font-weight:500}
        .top-right{display:flex;align-items:center;gap:10px}
        .date-chip{padding:8px 15px;border-radius:10px;background:#ffffff;border:1px solid #e2e8f0;font-size:12.5px;color:#0d2340;font-weight:600;box-shadow:0 2px 5px rgba(0,0,0,0.02)}
        .notif-btn{width:40px;height:40px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#475569;text-decoration:none;position:relative;transition:all .2s;box-shadow:0 2px 5px rgba(0,0,0,0.02)}
        .notif-btn:hover{background:#f1f5f9;color:#0d2340}
        .nbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center}

        /* Centered content area */
        .center-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1}

        /* Apply Form Card */
        .form-card{background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:2rem;width:100%;max-width:560px;box-shadow:0 4px 20px rgba(0,0,0,0.04)}
        .form-head{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem}
        .form-title{font-size:1.2rem;font-weight:800;color:#0d2340}
        .form{display:flex;flex-direction:column;gap:.95rem}
        .field{display:flex;flex-direction:column;gap:5px}
        .lbl{font-size:12px;font-weight:700;color:#0d2340;letter-spacing:.3px}
        .inp,.textarea{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:14px;outline:none;transition:border-color .2s;font-family:inherit;font-weight:500}
        .inp{height:46px;padding:0 14px}
        .textarea{padding:12px 14px;resize:none;min-height:80px}
        .inp::placeholder,.textarea::placeholder{color:#94a3b8}
        .inp:focus,.textarea:focus{border-color:#0d2340;background:#ffffff}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .alert-err{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:10px;font-size:13px;background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;margin-bottom:.5rem}
        .form-btns{display:flex;gap:10px;margin-top:4px}
        .btn-cancel{flex:1;height:48px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;color:#475569;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600;transition:all .2s}
        .btn-cancel:hover{background:#e2e8f0;color:#0d2340}
        .btn-submit{flex:2;height:48px;background:#0d2340;border:none;border-radius:12px;color:#ffffff;font-size:14.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;transition:all .2s;box-shadow:0 4px 12px rgba(13,35,64,.2)}
        .btn-submit:hover{background:#d9232d}
        .btn-submit:disabled{opacity:.55;cursor:not-allowed}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#ffffff;border-radius:50%;animation:rot .7s linear infinite;flex-shrink:0}
        @keyframes rot{to{transform:rotate(360deg)}}

        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2340;border:1px solid #1e293b;border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.2);animation:si .3s ease}
        @keyframes si{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}

        .view-link{display:inline-flex;align-items:center;gap:6px;margin-top:1.5rem;padding:10px 18px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:11px;color:#0d2340;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s}
        .view-link:hover{background:#e2e8f0;border-color:#cbd5e1}

        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.form-card{padding:1.5rem}.two{grid-template-columns:1fr}}
      `}</style>


      <div className="root">
        <Sidebar unreadCount={unread} />
        <main className="main">
          <div className="topbar">
            <div>
              <div className="greet">{greet()}, <span>{user?.name?.split(' ')[0] || 'Student'}</span> 👋</div>
              <div className="greet-sub">{user?.department} · {user?.student?.roll_no || 'Student'} · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            <div className="top-right">
              <div className="date-chip">{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
              <a href="/notifications" className="notif-btn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 00-5 5v3L2.5 12.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>
                {unread>0 && <span className="nbadge">{unread}</span>}
              </a>
            </div>
          </div>

          {/* Apply for Outpass Form - Centered on Dashboard */}
          <div className="center-wrap">
            <div className="form-card">
              <div className="form-head">
                <span style={{fontSize:'1.4rem'}}>🚪</span>
                <div className="form-title">Apply for Outpass</div>
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
                  <button type="button" className="btn-cancel" onClick={()=>setForm({ reason:'', destination:'', from_date:'', to_date:'', from_time:'', to_time:'' })}>Cancel</button>
                  <button type="submit" className="btn-submit" disabled={submitting}>{submitting?<><span className="spin"/>Submitting…</>:'Submit Request'}</button>
                </div>
              </form>
            </div>

            <a href="/outpass" className="view-link">
              📋 View My Outpasses →
            </a>
          </div>
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
