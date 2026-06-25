'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function HodDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['hod','principal'].includes(parsed.role)) { router.push('/login'); return; }
    setUser(parsed);
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/hod?type=stats', { headers: h }),
      fetch('/api/teacher?filter=pending', { headers: h }),
      fetch('/api/hod?type=students', { headers: h }),
      fetch('/api/notifications', { headers: h }),
    ]).then(async ([r1,r2,r3,r4]) => {
      if (r1.ok) setStats(await r1.json());
      if (r2.ok) { const d = await r2.json(); setOutpasses(d.outpasses||[]); }
      if (r3.ok) { const d = await r3.json(); setStudents(d.students||[]); }
      if (r4.ok) { const d = await r4.json(); setNotifs(d.notifications||[]); }
      setLoading(false);
    });
  }, []);

  const unread = notifs.filter(n=>!n.is_read).length;
  // HOD sees outpasses where teacher approved but HOD pending
  const hodPending = outpasses.filter(o => o.teacher_status === 'approved' && o.hod_status === 'pending');
  const lowAtt = students.filter(s => s.attendance_pct < 75);

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .title{font-size:1.5rem;font-weight:800;letter-spacing:-.4px}
        .title span{color:#fbbf24}
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

        .content{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
        .panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
        .ph{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,.06)}
        .pt{font-size:14px;font-weight:700;color:rgba(255,255,255,.85)}
        .pl{font-size:12.5px;color:#fbbf24;text-decoration:none;font-weight:700}
        .pl:hover{text-decoration:underline}
        .pb{padding:1.1rem 1.4rem}

        .op-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .op-row:last-child{border-bottom:none}
        .av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.07));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fbbf24;flex-shrink:0}
        .op-info{flex:1}
        .op-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
        .op-meta{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .action-link{font-size:12px;color:#fbbf24;text-decoration:none;font-weight:700;padding:5px 11px;border:1px solid rgba(251,191,36,.3);border-radius:8px;background:rgba(251,191,36,.08);transition:all .2s}
        .action-link:hover{background:rgba(251,191,36,.15)}

        .std-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .std-row:last-child{border-bottom:none}
        .std-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,rgba(248,113,113,.2),rgba(248,113,113,.07));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#f87171;flex-shrink:0}
        .std-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.82)}
        .std-roll{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
        .warn-pct{font-size:13px;font-weight:800;color:#f87171}

        .empty{text-align:center;padding:2rem;color:rgba(255,255,255,.3);font-size:13px}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:1100px){.stats{grid-template-columns:1fr 1fr}.content{grid-template-columns:1fr}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}}
      `}</style>
      <div className="root">
        <Sidebar unreadCount={unread} pendingCount={hodPending.length} />
        <main className="main">
          <div className="topbar">
            <div>
              <div className="title">HOD Dashboard — <span>{user?.department}</span></div>
              <div className="sub">{user?.role === 'principal' ? 'Principal' : 'Head of Department'} · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            <Link href="/notifications" className="notif-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 00-5 5v3L2.5 12.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>
              {unread > 0 && <span className="nbadge">{unread}</span>}
            </Link>
          </div>

          <div className="stats">
            {[
              { ico:'🎓', label:'Total Students', val: loading?'…':stats?.totalStudents||0, bg:'rgba(96,165,250,.12)', tagCls:'', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,.12)', tagLabel:user?.department, href: '/hod/students' },
              { ico:'⏳', label:'Pending Approvals', val: loading?'…':hodPending.length, bg:'rgba(251,191,36,.12)', tagColor:'#fbbf24', tagBg:'rgba(251,191,36,.12)', tagLabel:'Need Action', href: '/hod/outpass' },
              { ico:'⚠️', label:'Low Attendance', val: loading?'…':lowAtt.length, bg:'rgba(248,113,113,.12)', tagColor:'#f87171', tagBg:'rgba(248,113,113,.12)', tagLabel:'< 75%', href: '/hod/students' },
              { ico:'✅', label:'Approved Today', val: loading?'…':stats?.approvedToday||0, bg:'rgba(74,222,128,.12)', tagColor:'#4ade80', tagBg:'rgba(74,222,128,.12)', tagLabel:'Today', href: '/hod/outpass?filter=approved' },
            ].map((s,i)=>(
              <Link href={s.href} key={i} className="sc" style={{textDecoration:'none',color:'inherit',display:'block'}}>
                <div className="sc-top">
                  <div className="sc-ico" style={{background:s.bg}}>{s.ico}</div>
                  <span className="tag" style={{color:s.tagColor,background:s.tagBg}}>{s.tagLabel}</span>
                </div>
                <div className="sc-val">{s.val}</div>
                <div className="sc-lbl">{s.label}</div>
              </Link>
            ))}
          </div>

          <div className="content">
            <div className="panel">
              <div className="ph">
                <span className="pt">⏳ Awaiting HOD Approval {hodPending.length>0 && <span style={{background:'#f87171',color:'#fff',fontSize:11,padding:'2px 7px',borderRadius:10,marginLeft:8}}>{hodPending.length}</span>}</span>
                <Link href="/hod/outpass" className="pl">Review All →</Link>
              </div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:52,marginBottom:8}}/>)
                : hodPending.length === 0 ? <div className="empty">✅ No pending approvals</div>
                : hodPending.slice(0,5).map(op=>{
                    const initials = op.student_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                    return (
                      <div key={op.id} className="op-row">
                        <div className="av">{initials}</div>
                        <div className="op-info">
                          <div className="op-name">{op.student_name} · <span style={{color:'rgba(255,255,255,.4)',fontWeight:400}}>{op.roll_no}</span></div>
                          <div className="op-meta">📍 {op.destination} · {op.from_date} · {op.reason?.slice(0,45)}{op.reason?.length>45?'…':''}</div>
                        </div>
                        <Link href="/hod/outpass" className="action-link">Review</Link>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="panel">
              <div className="ph">
                <span className="pt">⚠️ Low Attendance Students</span>
                <Link href="/hod/students" className="pl">View All →</Link>
              </div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:46,marginBottom:8}}/>)
                : lowAtt.length === 0 ? <div className="empty">✅ All students above 75%</div>
                : lowAtt.slice(0,6).map(s=>{
                    const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                    return (
                      <div key={s.user_id} className="std-row">
                        <div className="std-av">{initials}</div>
                        <div style={{flex:1}}>
                          <div className="std-name">{s.name}</div>
                          <div className="std-roll">{s.roll_no} · Yr {s.year}</div>
                        </div>
                        <div className="warn-pct">{s.attendance_pct}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="panel" style={{marginTop:'1.5rem'}}>
            <div className="ph">
              <span className="pt">🔔 Recent Notifications {unread > 0 && <span style={{background:'#f87171',color:'#fff',fontSize:11,padding:'2px 7px',borderRadius:10,marginLeft:8}}>{unread} new</span>}</span>
              <Link href="/notifications" className="pl">View All →</Link>
            </div>
            <div className="pb">
              {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:52,marginBottom:8}}/>)
              : notifs.length === 0 ? <div className="empty">🔔 No notifications yet</div>
              : notifs.slice(0,6).map(n=>{
                  const typeMap = {action:'🔔',info:'ℹ️',success:'✅',warning:'⚠️',attendance:'📊',outpass:'🚪',announcement:'📢'};
                  const typeIco = typeMap[n.type]||'🔔';
                  const typeColorMap = {action:'#f87171',info:'#60a5fa',success:'#4ade80',warning:'#fbbf24'};
                  const typeColor = typeColorMap[n.type]||'#94a3b8';
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(n.created_at).getTime();
                    const mins = Math.floor(diff/60000);
                    if (mins < 1) return 'Just now';
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins/60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs/24)}d ago`;
                  })();
                  return (
                    <div key={n.id} className="op-row" style={{opacity: n.is_read ? 0.55 : 1}}>
                      <div className="std-av" style={{background:`${typeColor}18`,color:typeColor,fontSize:16,width:38,height:38,borderRadius:11}}>{typeIco}</div>
                      <div className="op-info" style={{flex:1}}>
                        <div className="op-name" style={{color: n.is_read ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.9)'}}>
                          {n.title || 'Notification'}
                          {!n.is_read && <span style={{display:'inline-block',width:7,height:7,background:'#60a5fa',borderRadius:'50%',marginLeft:8,verticalAlign:'middle'}}/>}
                        </div>
                        <div className="op-meta">{n.message?.slice(0,65)}{n.message?.length>65?'…':''}</div>
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',whiteSpace:'nowrap',flexShrink:0}}>{timeAgo}</div>
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
