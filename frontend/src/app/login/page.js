'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (params.get('registered')) setSuccess('Account created! Please sign in.');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      const u = JSON.parse(user);
      redirectByRole(u.role);
    }
  }, []);


  const redirectByRole = (role) => {
    if (role === 'student') router.push('/dashboard');
    else if (role === 'class_teacher') router.push('/teacher/dashboard');
    else if (role === 'hod') router.push('/hod/dashboard');
    else if (role === 'principal') router.push('/principal/dashboard');
    else if (role === 'admin') router.push('/admin/dashboard');
    else router.push('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'rahul.kumar@lendi.edu.in', pass: 'password123', icon: '🎓', color: '#60a5fa' },
    { label: 'Teacher', email: 'teacher.cse@lendi.edu.in', pass: 'password123', icon: '👨‍🏫', color: '#4ade80' },
    { label: 'HOD', email: 'hod.cse@lendi.edu.in', pass: 'password123', icon: '🏛️', color: '#fbbf24' },
    { label: 'Principal', email: 'principal@lendi.edu.in', pass: 'password123', icon: '🎖️', color: '#a78bfa' },
    { label: 'Admin', email: 'admin@lendi.edu.in', pass: 'admin123', icon: '⚙️', color: '#f87171' },
  ];

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif}
        .page{min-height:100vh;display:flex;background:#f8fafc;position:relative;overflow:hidden}

        /* Lendi campus background */
        .bg{
          position:fixed;inset:0;z-index:0;
          background:
            linear-gradient(135deg,rgba(248,250,252,0.96) 0%,rgba(241,245,249,0.92) 50%,rgba(248,250,252,0.96) 100%),
            url('https://www.lendi.edu.in/assets/img/clg-img1.jpg') center/cover no-repeat;
        }
        .bg-dots{
          position:fixed;inset:0;z-index:1;
          background-image:radial-gradient(rgba(13,35,64,0.05) 1px,transparent 1px);
          background-size:32px 32px;
        }
        .glow1{position:fixed;top:-150px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(245,158,11,0.1),transparent 70%);z-index:1;pointer-events:none}
        .glow2{position:fixed;bottom:-200px;left:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(217,35,45,0.08),transparent 70%);z-index:1;pointer-events:none}

        .layout{position:relative;z-index:10;display:flex;width:100%;min-height:100vh}

        /* ── Left brand ── */
        .brand{
          width:480px;flex-shrink:0;
          display:flex;flex-direction:column;justify-content:center;
          padding:3.5rem 3.5rem;
          border-right:1px solid #e2e8f0;
          background:#ffffff;
        }

        .logo-row{display:flex;align-items:center;gap:14px;margin-bottom:2rem}
        .logo-img{height:60px;object-fit:contain}
        .logo-text .ln{font-size:17px;font-weight:800;color:#0d2340;line-height:1.2}
        .logo-text .ls{font-size:10.5px;color:#d9232d;letter-spacing:1.2px;text-transform:uppercase;margin-top:2px;font-weight:700}

        .brand-title{font-size:2.1rem;font-weight:800;color:#0d2340;line-height:1.25;letter-spacing:-.5px;margin-bottom:.8rem}
        .brand-title span{color:#d9232d}
        .brand-desc{font-size:.95rem;color:#475569;line-height:1.75;margin-bottom:2rem}

        .pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:2rem}
        .pill{
          display:inline-flex;align-items:center;gap:6px;
          padding:6px 14px;border-radius:30px;
          border:1px solid #e2e8f0;background:#f8fafc;
          font-size:12px;font-weight:700;color:#0d2340;
        }

        .divider{height:1px;background:linear-gradient(90deg,#e2e8f0,transparent);margin-bottom:2rem}

        .stats-row{
          display:flex;gap:0;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:14px;overflow:hidden;margin-bottom:2rem;
        }
        .stat{flex:1;text-align:center;padding:1rem 0;border-right:1px solid #e2e8f0}
        .stat:last-child{border-right:none}
        .stat-n{font-size:1.7rem;font-weight:800;color:#0d2340;line-height:1}
        .stat-l{font-size:10.5px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-top:3px;font-weight:700}

        /* Role info */
        .roles-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
        .role-chips{display:flex;flex-direction:column;gap:8px}
        .role-chip{
          display:flex;align-items:center;gap:10px;
          padding:10px 14px;border-radius:10px;
          background:#f8fafc;border:1px solid #e2e8f0;
        }
        .role-chip-ico{font-size:18px;flex-shrink:0}
        .role-chip-name{font-size:13px;font-weight:700;color:#0d2340}
        .role-chip-desc{font-size:11px;color:#64748b;margin-top:1px}

        /* ── Right form ── */
        .form-side{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem}

        .card{
          width:100%;max-width:430px;
          background:#ffffff;
          border:1px solid #e2e8f0;border-radius:24px;
          padding:2.8rem 2.4rem;
          box-shadow:0 10px 30px rgba(0,0,0,0.06);
          animation:fadeUp .5s ease both;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}

        .card-ico{
          width:56px;height:56px;border-radius:16px;
          background:#0d2340;
          border:1px solid #0d2340;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:1.2rem;
        }
        .card-title{font-size:1.55rem;font-weight:800;color:#0d2340;letter-spacing:-.4px;margin-bottom:5px}
        .card-sub{font-size:13.5px;color:#64748b;margin-bottom:1.8rem}

        .alert{display:flex;align-items:center;gap:9px;padding:11px 13px;border-radius:11px;font-size:13px;font-weight:500;margin-bottom:1.2rem}
        .err{background:#fee2e2;border:1px solid #fca5a5;color:#dc2626}
        .ok{background:#dcfce7;border:1px solid #86efac;color:#16a34a}

        .form{display:flex;flex-direction:column;gap:1.1rem}
        .field{display:flex;flex-direction:column;gap:5px}
        .label{font-size:12px;font-weight:700;color:#0d2340;letter-spacing:.3px}
        .ibox{position:relative;display:flex;align-items:center}
        .iico{position:absolute;left:13px;color:#64748b;pointer-events:none;line-height:0}
        .inp{
          width:100%;height:50px;padding:0 46px;
          background:#f8fafc;border:1px solid #cbd5e1;
          border-radius:12px;color:#0d2340;font-size:14px;outline:none;
          transition:all .2s;font-family:inherit;font-weight:500;
        }
        .inp::placeholder{color:#94a3b8}
        .inp:focus{border-color:#0d2340;background:#ffffff;box-shadow:0 0 0 3px rgba(13,35,64,0.08)}
        .hint{font-size:11.5px;color:#64748b}
        .eye{position:absolute;right:13px;background:none;border:none;cursor:pointer;color:#64748b;padding:4px;display:flex;align-items:center;line-height:0}
        .eye:hover{color:#0d2340}

        .btn{
          height:52px;width:100%;
          background:#0d2340;
          border:none;border-radius:14px;color:#ffffff;font-size:15px;font-weight:800;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
          transition:all .25s;font-family:inherit;margin-top:.3rem;
          box-shadow:0 4px 15px rgba(13,35,64,0.2);
        }
        .btn:hover:not(:disabled){background:#d9232d;transform:translateY(-2px);box-shadow:0 8px 20px rgba(217,35,45,0.25)}
        .btn:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{width:20px;height:20px;border:2px solid rgba(255,255,255,.3);border-top-color:#ffffff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .foot{text-align:center;margin-top:1.4rem;font-size:13.5px;color:#64748b}
        .lnk{color:#d9232d;text-decoration:none;font-weight:700}
        .lnk:hover{text-decoration:underline}

        /* Demo quick-login */
        .demo-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-top:1.5rem;margin-bottom:.7rem}
        .demo-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .demo-btn{
          padding:8px 10px;border-radius:9px;cursor:pointer;
          background:#f8fafc;border:1px solid #e2e8f0;
          font-size:12px;font-weight:600;color:#0d2340;
          display:flex;align-items:center;gap:6px;font-family:inherit;
          transition:all .2s;
        }
        .demo-btn:hover{background:#0d2340;color:#ffffff;border-color:#0d2340}

        .stamp{
          margin-top:1.6rem;padding-top:1.2rem;
          border-top:1px solid #f1f5f9;
          text-align:center;font-size:11px;color:#94a3b8;letter-spacing:.4px;
        }

        @media(max-width:900px){.brand{display:none}}
        @media(max-width:768px){.form-side{padding:1.5rem}.card{padding:2rem 1.5rem}}
      `}</style>


      <div className="page">
        <div className="bg"/><div className="bg-dots"/>
        <div className="glow1"/><div className="glow2"/>

        <div className="layout">
          {/* Brand */}
          <aside className="brand">
            <div className="logo-row">
              <img src="https://www.lendi.edu.in/assets/img/black-logo.png" alt="Lendi" className="logo-img" onError={e=>e.target.style.display='none'}/>
              <div className="logo-text">
                <div className="ln">Lendi College</div>
                <div className="ls">Engineering &amp; Technology</div>
              </div>
            </div>

            <h1 className="brand-title">Welcome to<br/><span>Lendi Portal</span></h1>
            <p className="brand-desc">
              Unified management system for students, teachers, and HODs.<br/>
              Track attendance, manage outpasses, and stay connected with campus.
            </p>

            <div className="pills">
              <span className="pill">🏅 NAAC Accredited</span>
              <span className="pill">📊 NIRF Ranked</span>
              <span className="pill">📍 Vizianagaram, AP</span>
            </div>

            <div className="divider"/>

            <div className="stats-row">
              <div className="stat"><div className="stat-n">5K+</div><div className="stat-l">Students</div></div>
              <div className="stat"><div className="stat-n">250+</div><div className="stat-l">Faculty</div></div>
              <div className="stat"><div className="stat-n">7</div><div className="stat-l">Depts</div></div>
              <div className="stat"><div className="stat-n">14+</div><div className="stat-l">Years</div></div>
            </div>

            <div className="roles-title">Portal Access For</div>
            <div className="role-chips">
              {[
                {ico:'🎓',name:'Students',desc:'Attendance, outpass, notifications'},
                {ico:'👨‍🏫',name:'Class Teachers',desc:'Approve outpasses, monitor students'},
                {ico:'🏛️',name:'HOD / Principal',desc:'Department overview, final approvals'},
              ].map(r=>(
                <div key={r.name} className="role-chip">
                  <div className="role-chip-ico">{r.ico}</div>
                  <div><div className="role-chip-name">{r.name}</div><div className="role-chip-desc">{r.desc}</div></div>
                </div>
              ))}
            </div>
          </aside>

          {/* Form */}
          <main className="form-side">
            <div className="card">
              <div className="card-ico">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M13 3L23 8.5v9L13 23 3 17.5v-9L13 3z" stroke="#ffc83c" strokeWidth="1.5" fill="rgba(255,200,60,0.15)"/>
                  <path d="M9 13h8M13 9v8" stroke="#ffc83c" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="card-title">Sign In</div>
              <div className="card-sub">Access your Lendi College portal</div>

              {error && <div className="alert err">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5V8M7.5 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>}
              {success && <div className="alert ok">✅ {success}</div>}

              <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                  <label className="label">Email Address</label>
                  <div className="ibox">
                    <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="1.5" y="4" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/></svg></span>
                    <input className="inp" type="email" placeholder="yourname@lendi.edu.in"
                      value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Password</label>
                  <div className="ibox">
                    <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="3" y="8" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 8V6.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.3"/></svg></span>
                    <input className="inp" type={showPass?'text':'password'} placeholder="Enter password"
                      value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                    <button type="button" className="eye" onClick={()=>setShowPass(!showPass)}>
                      <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1 8.5S3.5 4 8.5 4s7.5 4.5 7.5 4.5-2.5 4.5-7.5 4.5S1 8.5 1 8.5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>{showPass&&<path d="M2 2l13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>}</svg>
                    </button>
                  </div>
                  <span className="hint">All passwords: <strong>password123</strong></span>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading?<><span className="spin"/>Signing in…</>:'Sign In to Portal'}
                </button>
              </form>

              <div className="foot">New student? <Link href="/register" className="lnk">Register here</Link></div>

              <div className="demo-title">Quick Demo Login</div>
              <div className="demo-btns">
                {demoAccounts.map(d=>(
                  <button key={d.label} className="demo-btn"
                    onClick={()=>setForm({email:d.email,password:d.pass})}>
                    <span>{d.icon}</span><span>{d.label}</span>
                  </button>
                ))}
              </div>

              <div className="stamp">Lendi College of Engineering &amp; Technology · Est. 1999</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#07111f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

