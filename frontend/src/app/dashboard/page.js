'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    Promise.all([
      fetch('/api/outpass', { headers: h }),
      fetch('/api/notifications', { headers: h }),
    ]).then(async ([r1,r2]) => {
      if (r1.ok) { const d = await r1.json(); setOutpasses(d.outpasses||[]); }
      if (r2.ok) { const d = await r2.json(); setNotifs(d.notifications||[]); }
      setLoading(false);
    });
  }, [router]);

  const unread = notifs.filter(n=>!n.is_read).length;
  const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

  const statusMap = {
    pending_teacher:   { label:'Awaiting Teacher',   color:'#fbbf24', ico:'⏳' },
    pending_hod:       { label:'Awaiting HOD',       color:'#60a5fa', ico:'📋' },
    pending_principal: { label:'Awaiting Principal', color:'#a78bfa', ico:'👑' },
    approved:          { label:'Approved',           color:'#4ade80', ico:'✅' },
    rejected:          { label:'Rejected',           color:'#f87171', ico:'❌' },
  };

  const approvedCount = outpasses.filter(o=>o.status==='approved').length;
  const pendingCount = outpasses.filter(o=>o.status.startsWith('pending')).length;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}

        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .greet{font-size:1.55rem;font-weight:800;letter-spacing:-.4px;color:#0d2340}
        .greet span{color:#d9232d}
        .greet-sub{font-size:13.5px;color:#64748b;margin-top:3px;font-weight:500}
        .top-right{display:flex;align-items:center;gap:10px}
        .date-chip{padding:8px 15px;border-radius:10px;background:#ffffff;border:1px solid #e2e8f0;font-size:12.5px;color:#0d2340;font-weight:600;box-shadow:0 2px 5px rgba(0,0,0,0.02)}
        .notif-btn{width:40px;height:40px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#475569;text-decoration:none;position:relative;transition:all .2s;box-shadow:0 2px 5px rgba(0,0,0,0.02)}
        .notif-btn:hover{background:#f1f5f9;color:#0d2340}
        .nbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center}

        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:2rem}
        .sc{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:1.3rem;transition:all .2s;text-decoration:none;display:block;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sc:hover{border-color:#f59e0b;transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.06)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#0d2340;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:#64748b;font-weight:500}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
        .panel{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .ph{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid #f1f5f9;background:#ffffff}
        .pt{font-size:14px;font-weight:800;color:#0d2340}
        .pl{font-size:12.5px;color:#d9232d;text-decoration:none;font-weight:700}
        .pl:hover{text-decoration:underline}
        .pb{padding:1.1rem 1.4rem}

        .op-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9}
        .op-row:last-child{border-bottom:none}
        .op-ico{font-size:22px;flex-shrink:0}
        .op-info{flex:1}
        .op-reason{font-size:13px;font-weight:700;color:#0d2340}
        .op-dest{font-size:11.5px;color:#64748b;margin-top:2px}
        .op-badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:7px;white-space:nowrap}

        .notif-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9}
        .notif-row:last-child{border-bottom:none}
        .nd{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0}
        .nm{font-size:13px;color:#475569;line-height:1.5}
        .nm.unread{color:#0d2340;font-weight:700}
        .nt{font-size:11px;color:#94a3b8;margin-top:3px}

        .empty{text-align:center;padding:2rem;color:#94a3b8;font-size:13px}
        .empty-ico{font-size:32px;margin-bottom:.5rem}
        .skel{background:#f1f5f9;border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}

        .apply-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:8px 16px;background:#0d2340;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:9px;transition:all .2s;box-shadow:0 4px 10px rgba(13,35,64,0.15)}
        .apply-btn:hover{background:#d9232d}

        @media(max-width:1100px){.stats{grid-template-columns:1fr 1fr}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}}
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
              <Link href="/notifications" className="notif-btn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 00-5 5v3L2.5 12.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>
                {unread>0 && <span className="nbadge">{unread}</span>}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="stats" style={{gridTemplateColumns:'1fr 1fr'}}>
            {[
              { href:'/outpass', ico:'🚪', label:'Total Outpasses', val: loading?'…':outpasses.length, bg:'rgba(74,222,128,.12)', tag: !loading&&{c:'#16a34a',bg:'rgba(74,222,128,.12)',l:`${approvedCount} Approved`} },
              { href:'/outpass', ico:'⏳', label:'Pending Approvals', val: loading?'…':pendingCount, bg:'rgba(251,191,36,.12)', tag: !loading&&(pendingCount>0?{c:'#d97706',bg:'rgba(251,191,36,.12)',l:'In Progress'}:{c:'#16a34a',bg:'rgba(74,222,128,.12)',l:'None'}) },
            ].map((s,i)=>(
              <Link key={i} href={s.href} className="sc">
                <div className="sc-top">
                  <div className="sc-ico" style={{background:s.bg}}>{s.ico}</div>
                  {s.tag && <span className="tag" style={{color:s.tag.c,background:s.tag.bg}}>{s.tag.l}</span>}
                </div>
                <div className="sc-val">{s.val}</div>
                <div className="sc-lbl">{s.label}</div>
              </Link>
            ))}
          </div>

          <div style={{marginTop:'1.5rem'}}>
            {/* Outpass */}
            <div className="panel">
              <div className="ph"><span className="pt">🚪 My Outpasses</span><Link href="/outpass" className="pl">Apply / View →</Link></div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:50,marginBottom:8}}/>) :
                 outpasses.length ? outpasses.slice(0,5).map(op=>{
                   const st = statusMap[op.status]||{label:op.status,color:'#fff',ico:'📋'};
                   return (
                     <div key={op.id} className="op-row">
                       <div className="op-ico">{st.ico}</div>
                       <div className="op-info"><div className="op-reason">{op.reason}</div><div className="op-dest">→ {op.destination} · {op.from_date}</div></div>
                       <span className="op-badge" style={{color:st.color,background:`${st.color}18`}}>{st.label}</span>
                     </div>
                   );
                 }) : (
                   <div className="empty">
                     <div className="empty-ico">🚪</div>No outpasses yet
                     <br/><Link href="/outpass" className="apply-btn">+ Apply for Outpass</Link>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
