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
  }, [router]);

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
  const allOutpasses = data?.outpasses || [];
  const unread = notifs.filter(n => !n.is_read).length;

  const statusMap = {
    pending_teacher:   { label:'Awaiting Teacher',   color:'#fbbf24', bg:'rgba(251,191,36,.12)' },
    pending_hod:       { label:'Awaiting HOD',       color:'#60a5fa', bg:'rgba(96,165,250,.12)' },
    pending_principal: { label:'Awaiting Principal', color:'#a78bfa', bg:'rgba(167,139,250,.12)' },
    approved:          { label:'Approved',           color:'#4ade80', bg:'rgba(74,222,128,.12)' },
    rejected:          { label:'Rejected',           color:'#f87171', bg:'rgba(248,113,113,.12)' },
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .title{font-size:1.5rem;font-weight:800;color:#0d2340;letter-spacing:-.4px}
        .title span{color:#d9232d}
        .sub{font-size:13.5px;color:#64748b;margin-top:3px;font-weight:500}
        .notif-btn{width:40px;height:40px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#475569;text-decoration:none;position:relative;transition:all .2s;box-shadow:0 2px 5px rgba(0,0,0,0.02)}
        .notif-btn:hover{background:#f1f5f9;color:#0d2340}
        .nbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:1.3rem;transition:all .2s;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sc:hover{border-color:#f59e0b;transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.06)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#0d2340;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:#64748b;font-weight:500}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}
        .tag-warn{background:#fef3c7;color:#d97706}
        .tag-ok{background:#dcfce7;color:#16a34a}
        .tag-red{background:#fee2e2;color:#dc2626}
        .tag-blue{background:#dbeafe;color:#2563eb}

        .section{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:1.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sec-head{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid #f1f5f9;background:#ffffff}
        .sec-title{font-size:14px;font-weight:800;color:#0d2340}
        .sec-link{font-size:12.5px;color:#d9232d;text-decoration:none;font-weight:700}
        .sec-link:hover{text-decoration:underline}
        .sec-body{padding:1.1rem 1.4rem}

        .op-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f1f5f9}
        .op-row:last-child{border-bottom:none}
        .op-av{width:36px;height:36px;border-radius:10px;background:#0d2340;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#ffffff;flex-shrink:0}
        .op-info{flex:1}
        .op-name{font-size:13px;font-weight:700;color:#0d2340}
        .op-meta{font-size:11.5px;color:#64748b;margin-top:2px}
        .op-actions{display:flex;gap:7px;flex-shrink:0}
        .view-btn{padding:6px 11px;border-radius:8px;background:#f8fafc;border:1px solid #cbd5e1;color:#0d2340;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;transition:all .2s}
        .view-btn:hover{background:#0d2340;color:#ffffff;border-color:#0d2340}

        .empty{text-align:center;padding:2.5rem;color:#94a3b8;font-size:13px}
        .skel{background:#f1f5f9;border-radius:8px;animation:sh 1.5s infinite}
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
          <div className="stats" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
            {[
              { ico: '🎓', label: 'My Students', val: loading ? '…' : data?.students?.length || 0, bg: 'rgba(96,165,250,.12)', tag: 'tag-blue', tagLabel: user?.department, href: '/teacher/students' },
              { ico: '⏳', label: 'Pending Requests', val: loading ? '…' : pending.length, bg: 'rgba(251,191,36,.12)', tag: 'tag-warn', tagLabel: 'Need Action', href: '/teacher/outpass' },
              { ico: '✅', label: 'Approved Today', val: loading ? '…' : data?.outpasses?.filter(o => o.teacher_status === 'approved' && o.teacher_action_at?.startsWith(new Date().toISOString().slice(0,10))).length || 0, bg: 'rgba(74,222,128,.12)', tag: 'tag-ok', tagLabel: 'Today', href: '/teacher/outpass?filter=approved' },
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
                       <Link href={`/teacher/outpass?id=${op.id}`} className="view-btn">Review →</Link>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Student Outpass Monitor */}
          <div className="section">
            <div className="sec-head">
              <span className="sec-title">🚪 Department Outpass Monitor</span>
              <Link href="/teacher/students" className="sec-link">Students Monitor →</Link>
            </div>
            <div className="sec-body">
              {loading ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:46,marginBottom:8}}/>) :
               allOutpasses.length === 0 ? <div className="empty">🚪 No outpass history</div> :
               allOutpasses.slice(0,6).map(op => {
                 const st = statusMap[op.status] || { label: op.status, color: '#fff', bg: 'rgba(255,255,255,.1)' };
                 const initials = op.student_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'ST';
                 return (
                   <div key={op.id} className="op-row">
                     <div className="op-av" style={{background:`${st.color}18`,color:st.color}}>{initials}</div>
                     <div className="op-info">
                       <div className="op-name">{op.student_name} <span style={{color:'rgba(255,255,255,.35)',fontWeight:400}}>· {op.roll_no}</span></div>
                       <div className="op-meta">📍 {op.destination} · 📅 {op.from_date} · {op.reason?.slice(0,40)}{op.reason?.length>40?'…':''}</div>
                     </div>
                     <div style={{textAlign:'right'}}>
                       <span style={{fontSize:11,fontWeight:700,padding:'4px 9px',borderRadius:7,color:st.color,background:st.bg}}>
                         {st.label}
                       </span>
                     </div>
                     <Link href={`/teacher/outpass?id=${op.id}`} className="view-btn" style={{marginLeft:8}}>View →</Link>
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
