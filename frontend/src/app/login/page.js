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
    else if (['security', 'gate_staff'].includes(role)) router.push('/security/dashboard');
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
    { label: 'Security', email: 'gate.security@lendi.edu.in', pass: 'password123', icon: '🛡️', color: '#2563eb' },
    { label: 'Admin', email: 'admin@lendi.edu.in', pass: 'admin123', icon: '⚙️', color: '#f87171' },
  ];

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif}
        html{scroll-behavior:smooth}

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

        .scroll-container{position:relative;z-index:10}

        /* ── Hero / Brand Section (Centered) ── */
        .hero{
          padding: 4rem 2rem 2rem;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          text-align:center;
        }

        .logo-row{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:1.5rem}
        .logo-img{height:70px;object-fit:contain}

        .brand-title{font-size:2.6rem;font-weight:800;color:#0d2340;line-height:1.25;letter-spacing:-.5px;margin-bottom:.8rem}
        .brand-title span{color:#d9232d}
        .brand-desc{font-size:1rem;color:#475569;line-height:1.75;margin-bottom:1.5rem;max-width:500px}

        .pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:2rem}
        .pill{
          display:inline-flex;align-items:center;gap:6px;
          padding:6px 14px;border-radius:30px;
          border:1px solid #e2e8f0;background:#ffffff;
          font-size:12px;font-weight:700;color:#0d2340;
        }

        .scroll-btn{
          background:#0d2340;border:none;border-radius:14px;
          color:#ffffff;font-size:15px;font-weight:800;
          padding:14px 32px;cursor:pointer;
          display:inline-flex;align-items:center;gap:10px;
          font-family:inherit;transition:all .25s;
          box-shadow:0 4px 15px rgba(13,35,64,0.2);
        }
        .scroll-btn:hover{background:#d9232d;transform:translateY(-2px);box-shadow:0 6px 20px rgba(217,35,45,0.25)}

        .bounce-arrow{
          animation:bounce 2s infinite;
          margin-top:1.5rem;color:#94a3b8;cursor:pointer;
        }
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}

        /* ── Login Form Section ── */
        .login-section{
          padding: 2rem 2rem 5rem;
          display:flex;align-items:center;justify-content:center;
        }

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
          background:#ffffff;
          border:1px solid #e2e8f0;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 1.2rem;padding:4px;
          box-shadow:0 2px 8px rgba(0,0,0,0.04);
        }
        .card-title{font-size:1.55rem;font-weight:800;color:#0d2340;letter-spacing:-.4px;margin-bottom:5px;text-align:center}
        .card-sub{font-size:13.5px;color:#64748b;margin-bottom:1.8rem;text-align:center}

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
          transition:all .25s;font-family:inherit;box-shadow:0 4px 15px rgba(13,35,64,0.2);
        }
        .btn:hover:not(:disabled){background:#d9232d;transform:translateY(-2px);box-shadow:0 6px 20px rgba(217,35,45,0.25)}
        .btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
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
          border-top:1.5px solid #bfdbfe;
          text-align:center;font-size:11px;color:#94a3b8;letter-spacing:.4px;
        }

        @media(max-width:768px){
          .brand-title{font-size:2rem}
          .brand-desc{font-size:.9rem}
          .login-section{padding:1.5rem}
          .card{padding:2rem 1.5rem}
        }
      `}</style>


      <div className="bg"/><div className="bg-dots"/>
      <div className="glow1"/><div className="glow2"/>

      <div className="scroll-container">
        {/* Hero / Brand Section - First Screen */}
        <section className="hero">
          <div className="logo-row">
            <img src="/lendi-logo-transparent.png" alt="Lendi" className="logo-img" onError={e=>e.target.src='/lendi-logo.png'}/>
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

          <button className="scroll-btn" onClick={scrollToLogin}>
            Sign In to Portal
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>

          <div className="bounce-arrow" onClick={scrollToLogin}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M8 12l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        </section>

        {/* Login Form Section - Second Screen (on scroll) */}
        <section className="login-section" id="login-section">
          <div className="card">
            <div className="card-ico">
              <img src="/lendi-crest.png" alt="Lendi Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

           

            <div className="demo-title">Quick Demo Login</div>
            <div className="demo-btns">
              {demoAccounts.map(d=>(
                <button key={d.label} className="demo-btn"
                  onClick={()=>setForm({email:d.email,password:d.pass})}>
                  <span>{d.icon}</span><span>{d.label}</span>
                </button>
              ))}
            </div>

            <div className="stamp">Lendi College of Engineering &amp; Technology · Est. 2008</div>
          </div>
        </section>
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
