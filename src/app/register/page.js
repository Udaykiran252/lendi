'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEPTS = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIDS','AIML','DS','CSBS','CSIT'];
const DEPT_FULL = { CSE:'Computer Science & Engineering', ECE:'Electronics & Communication', EEE:'Electrical & Electronics', MECH:'Mechanical Engineering', CIVIL:'Civil Engineering', IT:'Information Technology', AIDS:'AI & Data Science', AIML:'AI & Machine Learning', DS:'Data Science', CSBS:'CS & Business Systems', CSIT:'Computer Science & Information Technology' };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', emailPrefix:'', password:'', confirmPassword:'', roll_no:'', year:'', semester:'', section:'', department:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const email = form.emailPrefix ? `${form.emailPrefix}@lendi.edu.in` : '';
  const semOptions = form.year ? [(parseInt(form.year)-1)*2+1, (parseInt(form.year)-1)*2+2] : [];

  const strength = (() => {
    const p = form.password; if (!p) return 0;
    return [p.length>=8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  })();
  const strengthColors = ['','#f87171','#fbbf24','#34d399','#22c55e'];
  const strengthLabels = ['','Weak','Fair','Good','Strong'];

  const v1 = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.emailPrefix.trim()) return 'Email prefix is required';
    if (!/^[a-zA-Z0-9._-]+$/.test(form.emailPrefix)) return 'Invalid characters in email prefix';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };
  const v2 = () => {
    if (!form.roll_no.trim()) return 'Roll number is required';
    if (!form.department) return 'Department is required';
    if (!form.year) return 'Year is required';
    if (!form.semester) return 'Semester is required';
    return null;
  };

  const nextStep = (e) => {
    e.preventDefault();
    const err = v1(); if (err) { setError(err); return; }
    setError(''); setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = v2(); if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email, password: form.password, roll_no: form.roll_no.toUpperCase().trim(), year: parseInt(form.year), semester: parseInt(form.semester), section: form.section||'A', department: form.department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/login?registered=1');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif}
        .page{min-height:100vh;display:flex;background:#07111f;position:relative;overflow:hidden}
        .bg{
          position:fixed;inset:0;z-index:0;
          background:
            linear-gradient(135deg,rgba(7,17,31,0.96) 0%,rgba(8,22,48,0.88) 50%,rgba(7,17,31,0.95) 100%),
            url('https://www.lendi.edu.in/assets/img/clg-img1.jpg') center/cover no-repeat;
        }
        .bg-dots{position:fixed;inset:0;z-index:1;background-image:radial-gradient(rgba(255,200,60,0.05) 1px,transparent 1px);background-size:32px 32px}
        .glow1{position:fixed;top:-150px;right:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,200,60,0.08),transparent 70%);z-index:1;pointer-events:none}
        .glow2{position:fixed;bottom:-200px;left:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(20,60,160,0.1),transparent 70%);z-index:1;pointer-events:none}
        .layout{position:relative;z-index:10;display:flex;width:100%;min-height:100vh}

        /* Brand */
        .brand{width:460px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;padding:3.5rem 3.5rem;border-right:1px solid rgba(255,200,60,0.1)}
        .logo-row{display:flex;align-items:center;gap:14px;margin-bottom:2rem}
        .logo-img{height:58px;object-fit:contain;filter:brightness(0) invert(1)}
        .ln{font-size:16px;font-weight:800;color:#fff;line-height:1.2}
        .ls{font-size:10.5px;color:rgba(255,200,60,.75);letter-spacing:1.2px;text-transform:uppercase;margin-top:2px}
        .brand-title{font-size:2rem;font-weight:800;color:#fff;line-height:1.25;letter-spacing:-.5px;margin-bottom:.8rem}
        .brand-title span{color:#ffc83c}
        .brand-desc{font-size:.92rem;color:rgba(255,255,255,.47);line-height:1.75;margin-bottom:1.8rem}
        .divider{height:1px;background:linear-gradient(90deg,rgba(255,200,60,.3),transparent);margin-bottom:1.8rem}
        .feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.8rem}
        .feat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;transition:background .2s}
        .feat:hover{background:rgba(255,255,255,.06)}
        .feat-ico{font-size:21px;margin-bottom:6px}
        .feat-t{font-size:12px;font-weight:700;color:rgba(255,255,255,.85)}
        .feat-d{font-size:11px;color:rgba(255,255,255,.35);margin-top:2px;line-height:1.4}
        .domain-box{background:rgba(255,200,60,.06);border:1px solid rgba(255,200,60,.18);border-radius:12px;padding:14px 16px;font-size:12.5px;color:rgba(255,255,255,.5);line-height:1.7}
        .domain-box strong{color:#ffc83c}

        /* Form side */
        .form-side{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem}
        .card{width:100%;max-width:460px;background:rgba(255,255,255,.055);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:2.5rem 2.2rem;box-shadow:0 30px 80px rgba(0,0,0,.5);animation:fu .5s ease both}
        @keyframes fu{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}

        .card-head{display:flex;align-items:center;gap:12px;margin-bottom:1.4rem}
        .card-ico{width:52px;height:52px;border-radius:15px;flex-shrink:0;background:linear-gradient(135deg,rgba(255,200,60,.22),rgba(255,200,60,.07));border:1px solid rgba(255,200,60,.3);display:flex;align-items:center;justify-content:center}
        .card-title{font-size:1.35rem;font-weight:800;color:#fff;letter-spacing:-.3px}
        .card-sub{font-size:12.5px;color:rgba(255,255,255,.4);margin-top:2px}

        /* Steps */
        .steps{display:flex;align-items:center;margin-bottom:1.3rem}
        .sdot{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;transition:all .3s}
        .sdot.done{background:#ffc83c;color:#07111f;border:none}
        .sdot.active{background:rgba(255,200,60,.18);border:2px solid rgba(255,200,60,.5);color:#ffc83c}
        .sdot.todo{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.35)}
        .sline{flex:1;height:2px;background:rgba(255,255,255,.09);transition:background .3s}
        .sline.filled{background:rgba(255,200,60,.4)}

        .alert{display:flex;align-items:center;gap:9px;padding:11px 13px;border-radius:11px;font-size:13px;font-weight:500;margin-bottom:1.1rem}
        .err{background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.28);color:#fca5a5}

        .form{display:flex;flex-direction:column;gap:.95rem}
        .field{display:flex;flex-direction:column;gap:5px}
        .lbl{font-size:12px;font-weight:600;color:rgba(255,255,255,.55);letter-spacing:.3px}
        .ibox{position:relative;display:flex;align-items:center}
        .iico{position:absolute;left:13px;color:rgba(255,255,255,.28);pointer-events:none;line-height:0}
        .inp{width:100%;height:48px;padding:0 44px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:11px;color:#fff;font-size:14px;outline:none;transition:all .2s;font-family:inherit}
        .inp.ni{padding:0 14px}
        .inp::placeholder{color:rgba(255,255,255,.22)}
        .inp:focus{border-color:rgba(255,200,60,.5);background:rgba(255,255,255,.1);box-shadow:0 0 0 3px rgba(255,200,60,.07)}
        select.inp{-webkit-appearance:none;cursor:pointer}
        select.inp option{background:#0d2240}
        .eye{position:absolute;right:13px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.3);padding:4px;display:flex;align-items:center;line-height:0}
        .eye:hover{color:rgba(255,255,255,.65)}
        .hint{font-size:11.5px}
        .hg{color:rgba(255,200,60,.65)}
        .hok{color:#86efac}
        .hbad{color:#fca5a5}

        .email-row{display:flex;align-items:center;gap:8px}
        .domain-pill{background:rgba(255,200,60,.14);border:1px solid rgba(255,200,60,.28);color:#ffc83c;font-size:12.5px;font-weight:700;padding:0 12px;height:48px;border-radius:11px;display:flex;align-items:center;white-space:nowrap;flex-shrink:0}

        .pass-bar{display:flex;gap:4px;margin-top:5px}
        .ps{height:3px;flex:1;border-radius:3px;background:rgba(255,255,255,.09);transition:background .3s}

        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}

        .review{background:rgba(255,200,60,.05);border:1px solid rgba(255,200,60,.14);border-radius:11px;padding:12px 14px}
        .rev-title{font-size:10.5px;font-weight:700;color:rgba(255,200,60,.65);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
        .rev-row{display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0}
        .rev-row span:first-child{color:rgba(255,255,255,.38)}
        .rev-row span:last-child{color:rgba(255,255,255,.82);font-weight:600}

        .btn-row{display:flex;gap:8px;margin-top:.3rem}
        .btn-back{height:48px;padding:0 16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.6);font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;transition:background .2s;white-space:nowrap}
        .btn-back:hover{background:rgba(255,255,255,.1)}
        .btn-next{height:48px;width:100%;background:linear-gradient(135deg,#d4940a,#ffc83c);border:none;border-radius:12px;color:#07111f;font-size:14.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;font-family:inherit;box-shadow:0 4px 20px rgba(255,200,60,.22)}
        .btn-next:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,200,60,.3)}
        .btn-sub{flex:1;height:48px;background:linear-gradient(135deg,#d4940a,#ffc83c);border:none;border-radius:12px;color:#07111f;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;font-family:inherit;box-shadow:0 4px 20px rgba(255,200,60,.2)}
        .btn-sub:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,200,60,.3)}
        .btn-sub:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .spin{width:18px;height:18px;border:2px solid rgba(7,17,31,.2);border-top-color:#07111f;border-radius:50%;animation:rot .7s linear infinite;flex-shrink:0}
        @keyframes rot{to{transform:rotate(360deg)}}

        .foot{text-align:center;margin-top:1.3rem;font-size:13px;color:rgba(255,255,255,.38)}
        .lnk{color:#ffc83c;text-decoration:none;font-weight:700}
        .lnk:hover{text-decoration:underline}

        @media(max-width:900px){.brand{display:none}}
        @media(max-width:768px){.form-side{padding:1.5rem}.card{padding:2rem 1.5rem}.two{grid-template-columns:1fr}}
      `}</style>

      <div className="page">
        <div className="bg"/><div className="bg-dots"/>
        <div className="glow1"/><div className="glow2"/>
        <div className="layout">
          {/* Brand */}
          <aside className="brand">
            <div className="logo-row">
              <img src="https://www.lendi.edu.in/assets/img/black-logo.png" alt="Lendi" className="logo-img" onError={e=>e.target.style.display='none'}/>
              <div><div className="ln">Lendi College</div><div className="ls">Engineering &amp; Technology</div></div>
            </div>
            <h1 className="brand-title">Join the<br/><span>Lendi Family</span></h1>
            <p className="brand-desc">Create your student account to access attendance tracking, digital outpass, campus notifications and much more.</p>
            <div className="divider"/>
            <div className="feat-grid">
              {[
                {ico:'📊',t:'Live Attendance',d:'Subject-wise tracking'},
                {ico:'🚪',t:'Digital Outpass',d:'Apply online instantly'},
                {ico:'🔔',t:'Campus Alerts',d:'Instant notifications'},
                {ico:'📱',t:'QR Gate Pass',d:'Scan at college gate'},
              ].map(f=>(
                <div key={f.t} className="feat">
                  <div className="feat-ico">{f.ico}</div>
                  <div className="feat-t">{f.t}</div>
                  <div className="feat-d">{f.d}</div>
                </div>
              ))}
            </div>
            <div className="domain-box">
              🔒 Registration is exclusive to <strong>@lendi.edu.in</strong> college email addresses only. Faculty accounts are created by the administration.
            </div>
          </aside>

          {/* Form */}
          <main className="form-side">
            <div className="card">
              <div className="card-head">
                <div className="card-ico">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" stroke="#ffc83c" strokeWidth="1.4" fill="none"/></svg>
                </div>
                <div>
                  <div className="card-title">Create Account</div>
                  <div className="card-sub">Step {step} of 2 — {step===1?'Personal Information':'Academic Details'}</div>
                </div>
              </div>

              <div className="steps">
                <div className={`sdot ${step>1?'done':step===1?'active':'todo'}`}>
                  {step>1?<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#07111f" strokeWidth="1.7" strokeLinecap="round"/></svg>:'1'}
                </div>
                <div className={`sline ${step>=2?'filled':''}`}/>
                <div className={`sdot ${step===2?'active':'todo'}`}>2</div>
              </div>

              {error && (
                <div className="alert err">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5V8M7.5 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {error}
                </div>
              )}

              {step === 1 ? (
                <form className="form" onSubmit={nextStep}>
                  <div className="field">
                    <label className="lbl">Full Name</label>
                    <div className="ibox">
                      <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 15c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5" stroke="currentColor" strokeWidth="1.3"/></svg></span>
                      <input className="inp" type="text" placeholder="Your full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                    </div>
                  </div>

                  <div className="field">
                    <label className="lbl">College Email</label>
                    <div className="email-row">
                      <div className="ibox" style={{flex:1}}>
                        <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="1.5" y="4" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/></svg></span>
                        <input className="inp" type="text" placeholder="firstname.lastname" value={form.emailPrefix} onChange={e=>setForm({...form,emailPrefix:e.target.value.toLowerCase().replace(/\s/g,'')})} required/>
                      </div>
                      <div className="domain-pill">@lendi.edu.in</div>
                    </div>
                    {email && <span className="hint hg">→ {email}</span>}
                  </div>

                  <div className="field">
                    <label className="lbl">Password</label>
                    <div className="ibox">
                      <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="3" y="8" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 8V6.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.3"/></svg></span>
                      <input className="inp" type={showPass?'text':'password'} placeholder="Min. 8 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                      <button type="button" className="eye" onClick={()=>setShowPass(!showPass)}>
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1 8.5S3.5 4 8.5 4s7.5 4.5 7.5 4.5-2.5 4.5-7.5 4.5S1 8.5 1 8.5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>{showPass&&<path d="M2 2l13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>}</svg>
                      </button>
                    </div>
                    {form.password && (
                      <>
                        <div className="pass-bar">
                          {[1,2,3,4].map(i=><div key={i} className="ps" style={{background:strength>=i?strengthColors[strength]:undefined}}/>)}
                        </div>
                        <span className="hint" style={{color:strengthColors[strength]}}>{strengthLabels[strength]}</span>
                      </>
                    )}
                  </div>

                  <div className="field">
                    <label className="lbl">Confirm Password</label>
                    <div className="ibox">
                      <span className="iico"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="3" y="8" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 8V6.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.3"/><path d="M6 12l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></span>
                      <input className="inp" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} required/>
                    </div>
                    {form.password && form.confirmPassword && (
                      <span className={`hint ${form.password===form.confirmPassword?'hok':'hbad'}`}>
                        {form.password===form.confirmPassword?'✓ Passwords match':'✗ Passwords do not match'}
                      </span>
                    )}
                  </div>

                  <button type="submit" className="btn-next">Continue to Academic Details →</button>
                </form>
              ) : (
                <form className="form" onSubmit={handleSubmit}>
                  <div className="two">
                    <div className="field">
                      <label className="lbl">Roll Number</label>
                      <input className="inp ni" type="text" placeholder="e.g. 23CS1A0501" value={form.roll_no} onChange={e=>setForm({...form,roll_no:e.target.value})} required/>
                    </div>
                    <div className="field">
                      <label className="lbl">Section</label>
                      <input className="inp ni" type="text" placeholder="A / B / C" value={form.section} onChange={e=>setForm({...form,section:e.target.value.toUpperCase().slice(0,1)})} maxLength={1}/>
                    </div>
                  </div>

                  <div className="field">
                    <label className="lbl">Department</label>
                    <select className="inp ni" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} required>
                      <option value="">Select your department</option>
                      {DEPTS.map(d=><option key={d} value={d}>{d} — {DEPT_FULL[d]}</option>)}
                    </select>
                  </div>

                  <div className="two">
                    <div className="field">
                      <label className="lbl">Year</label>
                      <select className="inp ni" value={form.year} onChange={e=>setForm({...form,year:e.target.value,semester:''})} required>
                        <option value="">Year</option>
                        {[1,2,3,4].map(y=><option key={y} value={y}>{['1st','2nd','3rd','4th'][y-1]} Year</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="lbl">Semester</label>
                      <select className="inp ni" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} required>
                        <option value="">Sem</option>
                        {semOptions.map(s=><option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="review">
                    <div className="rev-title">Account Summary</div>
                    {[['Name',form.name],['Email',email],['Department',form.department],['Roll No',form.roll_no.toUpperCase()],['Year / Sem',`Year ${form.year} · Sem ${form.semester}`]].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} className="rev-row"><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>

                  <div className="btn-row">
                    <button type="button" className="btn-back" onClick={()=>{setStep(1);setError('')}}>← Back</button>
                    <button type="submit" className="btn-sub" disabled={loading}>
                      {loading?<><span className="spin"/>Creating Account…</>:'🎓 Create My Account'}
                    </button>
                  </div>
                </form>
              )}

              <div className="foot">Already have an account? <Link href="/login" className="lnk">Sign in</Link></div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
