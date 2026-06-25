'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [att, setAtt] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
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
      fetch('/api/attendance', { headers: h }),
      fetch('/api/outpass', { headers: h }),
      fetch('/api/notifications', { headers: h }),
    ]).then(async ([r1,r2,r3]) => {
      if (r1.ok) setAtt(await r1.json());
      if (r2.ok) { const d = await r2.json(); setOutpasses(d.outpasses||[]); }
      if (r3.ok) { const d = await r3.json(); setNotifs(d.notifications||[]); }
      setLoading(false);
    });
  }, []);

  const unread = notifs.filter(n=>!n.is_read).length;
  const lowAtt = att?.subjects?.filter(s=>s.percentage<75)||[];
  const greet = () => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

  const statusMap = {
    pending_teacher:   { label:'Awaiting Teacher',   color:'#fbbf24', ico:'⏳' },
    pending_hod:       { label:'Awaiting HOD',       color:'#60a5fa', ico:'📋' },
    pending_principal: { label:'Awaiting Principal', color:'#a78bfa', ico:'👑' },
    approved:          { label:'Approved',           color:'#4ade80', ico:'✅' },
    rejected:          { label:'Rejected',           color:'#f87171', ico:'❌' },
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:linear-gradient(180deg,rgba(10,22,45,.4) 0%,#07111f 100%)}

        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .greet{font-size:1.55rem;font-weight:800;letter-spacing:-.4px}
        .greet span{color:#ffc83c}
        .greet-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-top:3px}
        .top-right{display:flex;align-items:center;gap:10px}
        .date-chip{padding:8px 15px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);font-size:12.5px;color:rgba(255,255,255,.5)}
        .notif-btn{width:40px;height:40px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);text-decoration:none;position:relative;transition:all .2s}
        .notif-btn:hover{background:rgba(255,255,255,.09);color:#fff}
        .nbadge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#f87171;color:#fff;font-size:10px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center}

        .warn-banner{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:12px;padding:13px 16px;display:flex;align-items:center;gap:12px;margin-bottom:1.5rem}
        .warn-text{flex:1;font-size:13.5px;color:rgba(255,255,255,.75)}
        .warn-text strong{color:#fbbf24}
        .warn-link{font-size:12.5px;color:#ffc83c;text-decoration:none;font-weight:700;white-space:nowrap}

        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.3rem;transition:all .2s;text-decoration:none;display:block}
        .sc:hover{border-color:rgba(255,200,60,.2);transform:translateY(-2px)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#fff;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:rgba(255,255,255,.42)}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
        .panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
        .ph{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,.06)}
        .pt{font-size:14px;font-weight:700;color:rgba(255,255,255,.85)}
        .pl{font-size:12.5px;color:#ffc83c;text-decoration:none;font-weight:700}
        .pl:hover{text-decoration:underline}
        .pb{padding:1.1rem 1.4rem}

        .att-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .att-row:last-child{border-bottom:none}
        .att-info{flex:1}
        .att-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.82)}
        .att-code{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
        .att-bar{width:70px;height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
        .att-fill{height:100%;border-radius:4px}
        .att-pct{font-size:13px;font-weight:800;width:36px;text-align:right}

        .op-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .op-row:last-child{border-bottom:none}
        .op-ico{font-size:22px;flex-shrink:0}
        .op-info{flex:1}
        .op-reason{font-size:13px;font-weight:700;color:rgba(255,255,255,.82)}
        .op-dest{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .op-badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:7px;white-space:nowrap}

        .notif-row{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .notif-row:last-child{border-bottom:none}
        .nd{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0}
        .nm{font-size:13px;color:rgba(255,255,255,.7);line-height:1.5}
        .nm.unread{color:#fff;font-weight:600}
        .nt{font-size:11px;color:rgba(255,255,255,.3);margin-top:3px}

        .empty{text-align:center;padding:2rem;color:rgba(255,255,255,.3);font-size:13px}
        .empty-ico{font-size:32px;margin-bottom:.5rem}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}

        .apply-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:8px 16px;background:rgba(255,200,60,.12);border:1px solid rgba(255,200,60,.28);color:#ffc83c;font-size:13px;font-weight:700;text-decoration:none;border-radius:9px;transition:background .2s}
        .apply-btn:hover{background:rgba(255,200,60,.2)}

        @media(max-width:1100px){.stats{grid-template-columns:1fr 1fr}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}}
        @media(max-width:480px){.stats{grid-template-columns:1fr}}
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

          {!loading && lowAtt.length > 0 && (
            <div className="warn-banner">
              <span style={{fontSize:22}}>⚠️</span>
              <div className="warn-text"><strong>Attendance Warning:</strong> {lowAtt.length} subject{lowAtt.length>1?'s':''} below 75% — {lowAtt.map(s=>s.subject_code).join(', ')}</div>
              <Link href="/attendance" className="warn-link">View →</Link>
            </div>
          )}

          {/* Stats */}
          <div className="stats">
            {[
              { href:'/attendance', ico:'📊', label:'Overall Attendance', val: loading?'…':`${att?.overall||0}%`, bg:'rgba(255,200,60,.12)', tag: !loading&&(att?.overall>=75?{c:'#4ade80',bg:'rgba(74,222,128,.12)',l:'✓ Good'}:{c:'#f87171',bg:'rgba(248,113,113,.12)',l:'⚠ Low'}) },
              { href:'/attendance', ico:'📚', label:'Subjects',            val: loading?'…':att?.subjects?.length||0, bg:'rgba(96,165,250,.12)', tag: !loading&&{c:'#60a5fa',bg:'rgba(96,165,250,.12)',l:'This Sem'} },
              { href:'/outpass',    ico:'🚪', label:'Outpasses',           val: loading?'…':outpasses.length, bg:'rgba(74,222,128,.12)', tag: !loading&&{c:'#4ade80',bg:'rgba(74,222,128,.12)',l:`${outpasses.filter(o=>o.status==='approved').length} Approved`} },
              { href:'/notifications', ico:'🔔', label:'Notifications',   val: loading?'…':notifs.length, bg:'rgba(248,113,113,.12)', tag: !loading&&(unread>0?{c:'#f87171',bg:'rgba(248,113,113,.12)',l:`${unread} New`}:{c:'#4ade80',bg:'rgba(74,222,128,.12)',l:'All Read'}) },
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

          <div className="grid2">
            {/* Attendance */}
            <div className="panel">
              <div className="ph"><span className="pt">📊 Attendance</span><Link href="/attendance" className="pl">View All →</Link></div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:42,marginBottom:8}}/>) :
                 att?.subjects?.length ? att.subjects.slice(0,5).map(s=>{
                   const c = s.percentage>=75?'#4ade80':s.percentage>=60?'#fbbf24':'#f87171';
                   return (
                     <div key={s.subject_id} className="att-row">
                       <div className="att-info"><div className="att-name">{s.subject_name}</div><div className="att-code">{s.subject_code} · {s.present}/{s.total}</div></div>
                       <div className="att-bar"><div className="att-fill" style={{width:`${s.percentage}%`,background:c}}/></div>
                       <div className="att-pct" style={{color:c}}>{s.percentage}%</div>
                     </div>
                   );
                 }) : <div className="empty"><div className="empty-ico">📭</div>No attendance data yet</div>}
              </div>
            </div>

            {/* Outpass */}
            <div className="panel">
              <div className="ph"><span className="pt">🚪 My Outpasses</span><Link href="/outpass" className="pl">Apply / View →</Link></div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:50,marginBottom:8}}/>) :
                 outpasses.length ? outpasses.slice(0,4).map(op=>{
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

            {/* Notifications - full width */}
            <div className="panel" style={{gridColumn:'1 / -1'}}>
              <div className="ph">
                <span className="pt">🔔 Notifications {unread>0&&<span style={{background:'#f87171',color:'#fff',fontSize:11,padding:'2px 7px',borderRadius:10,marginLeft:8}}>{unread} new</span>}</span>
                <Link href="/notifications" className="pl">View All →</Link>
              </div>
              <div className="pb" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 2rem'}}>
                {loading ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:48,marginBottom:8}}/>) :
                 notifs.length ? notifs.slice(0,6).map(n=>(
                   <div key={n.id} className="notif-row">
                     <div className="nd" style={{background:n.is_read?'rgba(255,255,255,.15)':'#60a5fa'}}/>
                     <div><div className={`nm ${!n.is_read?'unread':''}`}>{n.message}</div><div className="nt">{new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div>
                   </div>
                 )) : <div className="empty" style={{gridColumn:'1/-1'}}><div className="empty-ico">🔔</div>No notifications</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
