'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'admin') { router.push('/login'); return; }
    setUser(parsed);

    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : {})
      .then(data => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = users.length;
  const students = users.filter(u => u.role === 'student').length;
  const teachers = users.filter(u => u.role === 'class_teacher').length;
  const hods = users.filter(u => u.role === 'hod').length;
  const principal = users.filter(u => u.role === 'principal').length;

  // Group users by department
  const depts = {};
  users.forEach(u => {
    if (u.department) {
      depts[u.department] = (depts[u.department] || 0) + 1;
    }
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .title{font-size:1.5rem;font-weight:800;letter-spacing:-.4px}
        .title span{color:#f87171}
        .sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-top:3px}

        .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.3rem;transition:all .2s}
        .sc:hover{border-color:rgba(248,113,113,.2);transform:translateY(-2px)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#fff;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:rgba(255,255,255,.42)}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        .content{display:grid;grid-template-columns:1fr 1.2fr;gap:1.5rem}
        .panel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
        .ph{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,.06)}
        .pt{font-size:14px;font-weight:700;color:rgba(255,255,255,.85)}
        .pl{font-size:12.5px;color:#f87171;text-decoration:none;font-weight:700}
        .pl:hover{text-decoration:underline}
        .pb{padding:1.1rem 1.4rem}

        .usr-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .usr-row:last-child{border-bottom:none}
        .av{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(248,113,113,.2),rgba(248,113,113,.07));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#f87171;flex-shrink:0}
        .usr-info{flex:1}
        .usr-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
        .usr-meta{font-size:11.5px;color:rgba(255,255,255,.38);margin-top:2px}
        .usr-role{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase}

        .dept-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .dept-row:last-child{border-bottom:none}
        .dept-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.82)}
        .dept-cnt{font-size:13px;font-weight:800;color:#f87171}

        .empty{text-align:center;padding:2rem;color:rgba(255,255,255,.3);font-size:13px}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:1200px){.stats{grid-template-columns:1fr 1fr 1fr}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats{grid-template-columns:1fr 1fr}.content{grid-template-columns:1fr}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="topbar">
            <div>
              <div className="title">System Administration — <span>Control Panel</span></div>
              <div className="sub">Administrator Dashboard · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
          </div>

          <div className="stats">
            {[
              { ico:'👥', label:'Total Users', val: loading?'…':totalUsers, bg:'rgba(255,255,255,.08)', tagColor:'#94a3b8', tagBg:'rgba(255,255,255,.08)', tagLabel:'Global', href: '/admin/users' },
              { ico:'🎓', label:'Students', val: loading?'…':students, bg:'rgba(96,165,250,.12)', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,.12)', tagLabel:'Role', href: '/admin/users?role=student' },
              { ico:'👨‍🏫', label:'Teachers', val: loading?'…':teachers, bg:'rgba(74,222,128,.12)', tagColor:'#4ade80', tagBg:'rgba(74,222,128,.12)', tagLabel:'Role', href: '/admin/users?role=class_teacher' },
              { ico:'🏛️', label:'HODs', val: loading?'…':hods, bg:'rgba(251,191,36,.12)', tagColor:'#fbbf24', tagBg:'rgba(251,191,36,.12)', tagLabel:'Role', href: '/admin/users?role=hod' },
              { ico:'👑', label:'Principal', val: loading?'…':principal, bg:'rgba(167,139,250,.12)', tagColor:'#a78bfa', tagBg:'rgba(167,139,250,.12)', tagLabel:'Role', href: '/admin/users?role=principal' },
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
                <span className="pt">🏢 Department Distribution</span>
              </div>
              <div className="pb">
                {loading ? [1,2,3].map(i=><div key={i} className="skel" style={{height:40,marginBottom:8}}/>)
                : Object.keys(depts).length === 0 ? <div className="empty">No departmental data</div>
                : Object.entries(depts).map(([dept, count])=>(
                    <div key={dept} className="dept-row">
                      <span className="dept-name">Department of {dept}</span>
                      <span className="dept-cnt">{count} user{count>1?'s':''}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="panel">
              <div className="ph">
                <span className="pt">👤 User Directory Summary</span>
                <Link href="/admin/users" className="pl">Manage Users →</Link>
              </div>
              <div className="pb">
                {loading ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:52,marginBottom:8}}/>)
                : users.length === 0 ? <div className="empty">No users registered yet</div>
                : users.slice(0,5).map(u => {
                    const initials = u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'US';
                    const roleColors = {student:'#60a5fa', class_teacher:'#4ade80', hod:'#fbbf24', principal:'#a78bfa', admin:'#f87171'};
                    const roleColor = roleColors[u.role] || '#fff';
                    return (
                      <div key={u.id} className="usr-row">
                        <div className="av" style={{background:`${roleColor}18`,color:roleColor}}>{initials}</div>
                        <div className="usr-info">
                          <div className="usr-name">{u.name}</div>
                          <div className="usr-meta">{u.email} {u.department ? `· ${u.department}` : ''}</div>
                        </div>
                        <span className="usr-role" style={{color:roleColor,background:`${roleColor}18`}}>{u.role==='class_teacher'?'Teacher':u.role}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
