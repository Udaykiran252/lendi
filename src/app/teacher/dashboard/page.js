'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['class_teacher','hod','principal'].includes(parsed.role)) { router.push('/dashboard'); return; }
    setUser(parsed);
    fetchData(token);
  }, []);

  const fetchData = async (token) => {
    const h = { Authorization: `Bearer ${token}` };
    const [r1, r2, r3] = await Promise.all([
      fetch('/api/teacher?filter=all', { headers: h }),
      fetch('/api/hod?type=stats', { headers: h }),
      fetch('/api/notifications', { headers: h }),
    ]);
    if (r1.ok) setData(await r1.json());
    if (r3.ok) { const d = await r3.json(); setNotifs(d.notifications || []); }
    setLoading(false);
  };

  const pending = data?.outpasses?.filter(o => o.teacher_status === 'pending') || [];
  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:linear-gradient(180deg,rgba(10,22,45,.4) 0%,#07111f 100%)}
        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .title{font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-.4px}
        .title span{color:#ffc83c}
        .sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-top:3px}
        .notif-btn{width:40px;height:40px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);text-decoration:none;position:relative;transition:all .2s}
        .notif-btn:hover{background:rgba(255,255,255,.09);color:#fff}
        .nbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#f87171;color:#fff;font-size:10px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.3rem;transition:all .2s}
        .sc:hover{border-color:rgba(255,200,60,.2);transform:translateY(-2px)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#fff;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:rgba(255,255,255,.42)}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}
        .tag-warn{background:rgba(251,191,36,.12);color:#fbbf24}
        .tag-ok{background:rgba(74,222,128,.12);color:#4ade80}
        .tag-red{background:rgba(248,113,113,.12);color:#f87171}
        .tag-blue{background:rgba(96,165,250,.12);color:#60a5fa}

        .section{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;margin-bottom:1.5rem}
        .sec-head{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,.06)}
        .sec-title{font-size:14px;font-weight:700;color:rgba(255,255,255,.85)}
        .sec-link{font-size:12.5px;color:#ffc83c;text-decoration:none;font-weight:700}
        .sec-link:hover{text-decoration:underline}
        .sec-body{padding:1.1rem 1.4rem}

        .op-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .op-row:last-child{border-bottom:none}
        .op-av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(255,200,60,.2),rgba(255,200,60,.07));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#ffc83c;flex-shrink:0}
        .op-info{flex:1}
        .op-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
        .op-meta{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .op-actions{display:flex;gap:7px;flex-shrink:0}
        .btn-approve{padding:6px 13px;border-radius:8px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);color:#4ade80;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-approve:hover{background:rgba(74,222,128,.25)}
        .btn-reject{padding:6px 13px;border-radius:8px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.25);color:#f87171;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-reject:hover{background:rgba(248,113,113,.22)}
        .view-btn{padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center}

        .std-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .std-row:last-child{border-bottom:none}
        .std-av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,rgba(96,165,250,.2),rgba(96,165,250,.07));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#60a5fa;flex-shrink:0}
        .std-info{flex:1}
        .std-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.82)}
        .std-roll{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
        .att-bar{width:70px;height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-top:3px}
        .att-fill{height:100%;border-radius:4px}

        .empty{text-align:center;padding:2.5rem;color:rgba(255,255,255,.3);font-size:13px}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:1100px){.stats{grid-template-columns:1fr 1fr}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr 1fr}}
      `}</style>
      <div className="root">
        <Sidebar unreadCount={unread} pendingCount={pending.length} />
        <main className="main">
          <div className="topbar">
            <div>
              <div className="title">Welcome, <span>{user?.name?.split(' ')[0]}</span> 👋</div>
              <div className="sub">{user?.department} Dept · Class Teacher · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            <Link href="/notifications" className="notif-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 00-5 5v3L2.5 12.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>
              {unread > 0 && <span className="nbadge">{unread}</span>}
            </Link>
          </div>

          {/* Stats */}
          <div className="stats">
            {[
              { ico: '🎓', label: 'My Students', val: loading ? '…' : data?.students?.length || 0, bg: 'rgba(96,165,250,.12)', tag: 'tag-blue', tagLabel: user?.department, href: '/teacher/students' },
              { ico: '⏳', label: 'Pending Requests', val: loading ? '…' : pending.length, bg: 'rgba(251,191,36,.12)', tag: 'tag-warn', tagLabel: 'Need Action', href: '/teacher/outpass' },
              { ico: '✅', label: 'Approved Today', val: loading ? '…' : data?.outpasses?.filter(o => o.teacher_status === 'approved' && o.teacher_action_at?.startsWith(new Date().toISOString().slice(0,10))).length || 0, bg: 'rgba(74,222,128,.12)', tag: 'tag-ok', tagLabel: 'Today', href: '/teacher/outpass?filter=approved' },
              { ico: '🔔', label: 'Notifications', val: loading ? '…' : notifs.length, bg: 'rgba(248,113,113,.12)', tag: unread > 0 ? 'tag-red' : 'tag-ok', tagLabel: unread > 0 ? `${unread} New` : 'All Read', href: '/notifications' },
            ].map((s, i) => (
              <Link href={s.href} key={i} className="sc" style={{textDecoration:'none',color:'inherit',display:'block'}}>
                <div className="sc-top">
                  <div className="sc-ico" style={{ background: s.bg }}>{s.ico}</div>
                  <span className={`tag ${s.tag}`}>{s.tagLabel}</span>
                </div>
                <div className="sc-val">{s.val}</div>
                <div className="sc-lbl">{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Pending outpasses */}
          <div className="section">
            <div className="sec-head">
              <span className="sec-title">⏳ Pending Outpass Requests {pending.length > 0 && <span style={{background:'#f87171',color:'#fff',fontSize:11,padding:'2px 7px',borderRadius:10,marginLeft:8}}>{pending.length}</span>}</span>
              <Link href="/teacher/outpass" className="sec-link">View All →</Link>
            </div>
            <div className="sec-body">
              {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:52,marginBottom:8}}/>) :
               pending.length === 0 ? <div className="empty">✅ No pending requests</div> :
               pending.slice(0,5).map(op => {
                 const initials = op.student_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'ST';
                 return (
                   <div key={op.id} className="op-row">
                     <div className="op-av">{initials}</div>
                     <div className="op-info">
                       <div className="op-name">{op.student_name} <span style={{color:'rgba(255,255,255,.35)',fontWeight:400}}>· {op.roll_no}</span></div>
                       <div className="op-meta">📍 {op.destination} · 📅 {op.from_date} · {op.reason?.slice(0,50)}{op.reason?.length>50?'…':''}</div>
                     </div>
                     <div className="op-actions">
                       <Link href="/teacher/outpass" className="view-btn">View</Link>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Students overview */}
          <div className="section">
            <div className="sec-head">
              <span className="sec-title">🎓 {user?.department} Students</span>
              <Link href="/teacher/students" className="sec-link">View All →</Link>
            </div>
            <div className="sec-body">
              {loading ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:46,marginBottom:8}}/>) :
               (data?.students||[]).slice(0,6).map(s => {
                 const pct = s.attendance_pct || 0;
                 const color = pct >= 75 ? '#4ade80' : pct >= 60 ? '#fbbf24' : '#f87171';
                 const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'ST';
                 return (
                   <div key={s.user_id} className="std-row">
                     <div className="std-av">{initials}</div>
                     <div className="std-info">
                       <div className="std-name">{s.name}</div>
                       <div className="std-roll">Roll: {s.roll_no} · Yr {s.year} · Sec {s.section}</div>
                     </div>
                     <div style={{textAlign:'right'}}>
                       <div style={{fontSize:13,fontWeight:800,color}}>{pct}%</div>
                       <div className="att-bar"><div className="att-fill" style={{width:`${pct}%`,background:color}}/></div>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
