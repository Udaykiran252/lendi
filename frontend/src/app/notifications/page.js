'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const TYPE_INFO = {
  action:       { ico:'🔔', color:'#f87171' },
  info:         { ico:'ℹ️', color:'#60a5fa' },
  success:      { ico:'✅', color:'#4ade80' },
  warning:      { ico:'⚠️', color:'#fbbf24' },
  attendance:   { ico:'🚪', color:'#fbbf24' },
  outpass:      { ico:'🚪', color:'#60a5fa' },
  announcement: { ico:'📢', color:'#a78bfa' },
  exam:         { ico:'📝', color:'#f87171' },
  result:       { ico:'🏆', color:'#4ade80' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=>setNotifs(d.notifications||[])).finally(()=>setLoading(false));
  }, [router]);

  const handleNotifClick = async (n) => {
    const token = localStorage.getItem('token');
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Mark as read if not already read
    if (!n.is_read) {
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
    }

    // Determine target route based on user role and outpass_id
    const outpassId = n.outpass_id;
    let targetPath = '/outpass';
    if (u.role === 'class_teacher') targetPath = '/teacher/outpass';
    else if (u.role === 'hod') targetPath = '/hod/outpass';
    else if (u.role === 'principal') targetPath = '/principal/outpass';

    if (outpassId) {
      router.push(`${targetPath}?id=${outpassId}`);
    } else {
      router.push(targetPath);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/notifications', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:'all'}) });
    setNotifs(prev=>prev.map(n=>({...n,is_read:1})));
  };

  const unread = notifs.filter(n=>!n.is_read).length;
  const filtered = filter==='unread' ? notifs.filter(n=>!n.is_read) : notifs;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .toprow{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.3rem;flex-wrap:wrap;gap:1rem}
        .page-title{font-size:1.5rem;font-weight:800}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.5rem}
        .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap}
        .fb{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .fb.on{background:rgba(255,200,60,.15);color:#ffc83c;border:1px solid rgba(255,200,60,.3)}
        .fb.off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.08)}
        .fb.off:hover{background:rgba(255,255,255,.09);color:#fff}
        .mark-all{margin-left:auto;background:none;border:none;color:#ffc83c;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;padding:8px 14px;border-radius:9px;border:1px solid rgba(255,200,60,.25);transition:background .2s}
        .mark-all:hover{background:rgba(255,200,60,.1)}

        .notif-list{display:flex;flex-direction:column;gap:8px;max-width:760px}
        .nc{display:flex;gap:14px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s}
        .nc:hover{background:rgba(255,255,255,.07);border-color:rgba(255,200,60,.3);transform:translateY(-1px)}
        .nc.unread{border-left:3px solid #60a5fa;background:rgba(96,165,250,.04)}
        .nc.unread:hover{background:rgba(96,165,250,.07)}
        .n-ico{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .n-body{flex:1}
        .n-msg{font-size:14px;color:rgba(255,255,255,.8);line-height:1.55;margin-bottom:5px}
        .nc.unread .n-msg{color:#fff;font-weight:600}
        .n-meta{display:flex;align-items:center;gap:10px}
        .n-time{font-size:11.5px;color:rgba(255,255,255,.3)}
        .n-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px}
        .open-hint{font-size:12px;font-weight:700;color:#ffc83c;margin-left:auto;white-space:nowrap}
        .n-dot{width:8px;height:8px;border-radius:50%;background:#60a5fa;flex-shrink:0;margin-top:4px}

        .empty{text-align:center;padding:4rem 2rem;max-width:400px}
        .empty-ico{font-size:48px;margin-bottom:1rem}
        .empty-t{font-size:16px;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:.4rem}
        .empty-s{font-size:13px;color:rgba(255,255,255,.3)}
        .skel{background:rgba(255,255,255,.06);border-radius:10px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.toolbar{flex-direction:column;align-items:flex-start}.mark-all{margin-left:0}}
      `}</style>

      <div className="root">
        <Sidebar unreadCount={unread} />
        <main className="main">
          <div className="toprow">
            <div>
              <div className="page-title">🔔 Notifications</div>
              <div className="page-sub">{unread>0?`${unread} unread notification${unread>1?'s':''}`:'Tap any notification to view details instantly.'}</div>
            </div>
          </div>

          <div className="toolbar">
            <button className={`fb ${filter==='all'?'on':'off'}`} onClick={()=>setFilter('all')}>All ({notifs.length})</button>
            <button className={`fb ${filter==='unread'?'on':'off'}`} onClick={()=>setFilter('unread')}>Unread ({unread})</button>
            {unread>0 && <button className="mark-all" onClick={markAllRead}>✓ Mark all read</button>}
          </div>

          <div className="notif-list">
            {loading ? [1,2,3,4,5].map(i=><div key={i} className="skel" style={{height:76}}/>) :
             filtered.length===0 ? (
               <div className="empty">
                 <div className="empty-ico">🔔</div>
                 <div className="empty-t">{filter==='unread'?'No unread notifications':'No notifications yet'}</div>
                 <div className="empty-s">{filter==='unread'?'All caught up!':'Notifications will appear here'}</div>
               </div>
             ) : filtered.map(n=>{
               const ti = TYPE_INFO[n.type]||{ico:'🔔',color:'#94a3b8'};
               return (
                 <div key={n.id} className={`nc ${!n.is_read?'unread':''}`} onClick={() => handleNotifClick(n)}>
                   <div className="n-ico">{ti.ico}</div>
                   <div className="n-body">
                     <div className="n-msg">{n.message}</div>
                     <div className="n-meta">
                       <span className="n-time">{new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                       {n.type && <span className="n-tag" style={{color:ti.color,background:`${ti.color}18`}}>{n.type}</span>}
                       <span className="open-hint">Open Request →</span>
                     </div>
                   </div>
                   {!n.is_read && <div className="n-dot"/>}
                 </div>
               );
             })}
          </div>
        </main>
      </div>
    </>
  );
}
