'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_STUDENT = [
  { href: '/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/outpass', label: 'Outpass', ico: '🚪' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];
const NAV_TEACHER = [
  { href: '/teacher/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/teacher/outpass', label: 'Outpass Requests', ico: '🚪', badge: true },
  { href: '/teacher/students', label: 'Students', ico: '🎓' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];
const NAV_HOD = [
  { href: '/hod/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/hod/outpass', label: 'Outpass Approvals', ico: '🚪', badge: true },
  { href: '/hod/students', label: 'Students Monitor', ico: '🎓' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];
const NAV_PRINCIPAL = [
  { href: '/principal/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/principal/outpass', label: 'Outpass Approvals', ico: '🚪', badge: true },
  { href: '/principal/students', label: 'Students Monitor', ico: '🎓' },
  { href: '/principal/faculty', label: 'Faculty Monitor', ico: '👨‍🏫' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];
const NAV_ADMIN = [
  { href: '/admin/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/admin/users', label: 'Manage Users', ico: '👤' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];

export default function Sidebar({ unreadCount = 0, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const role = user?.role || 'student';
  const nav = role === 'admin' ? NAV_ADMIN : role === 'principal' ? NAV_PRINCIPAL : role === 'class_teacher' ? NAV_TEACHER : role === 'hod' ? NAV_HOD : NAV_STUDENT;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  const roleLabel = { student: 'Student', class_teacher: 'Class Teacher', hod: 'HOD', principal: 'Principal', admin: 'Admin' }[role] || role;
  const roleColor = { student: '#60a5fa', class_teacher: '#4ade80', hod: '#fbbf24', principal: '#a78bfa', admin: '#f87171' }[role] || '#60a5fa';

  return (
    <>
      <style>{`
        .sb{
          width:${collapsed?'68px':'240px'};min-height:100vh;
          background:rgba(255,255,255,0.035);
          border-right:1px solid rgba(255,255,255,0.07);
          display:flex;flex-direction:column;
          transition:width .3s cubic-bezier(.4,0,.2,1);
          flex-shrink:0;position:sticky;top:0;height:100vh;overflow:hidden;
        }
        .sb-head{
          padding:${collapsed?'18px 16px':'18px 18px'};
          border-bottom:1px solid rgba(255,255,255,0.06);
          display:flex;align-items:center;gap:10px;min-height:68px;
        }
        .sb-logo{
          width:34px;height:34px;border-radius:10px;flex-shrink:0;
          background:linear-gradient(135deg,rgba(255,200,60,.2),rgba(255,200,60,.07));
          border:1px solid rgba(255,200,60,.28);
          display:flex;align-items:center;justify-content:center;
        }
        .sb-brand{overflow:hidden;transition:all .25s;opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};white-space:nowrap}
        .sb-name{font-size:13px;font-weight:800;color:#fff}
        .sb-role{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
        .sb-toggle{margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.3);padding:4px;display:flex;align-items:center;flex-shrink:0;transition:color .2s}
        .sb-toggle:hover{color:rgba(255,255,255,.7)}
        .sb-nav{flex:1;padding:14px 8px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
        .nav-item{
          display:flex;align-items:center;gap:10px;
          padding:${collapsed?'10px':'10px 11px'};
          border-radius:10px;text-decoration:none;
          color:rgba(255,255,255,.5);font-size:13.5px;font-weight:600;
          transition:all .2s;white-space:nowrap;position:relative;
          justify-content:${collapsed?'center':'flex-start'};
        }
        .nav-item:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85)}
        .nav-item.active{background:rgba(255,200,60,.11);color:#ffc83c;border:1px solid rgba(255,200,60,.18)}
        .nav-ico{font-size:17px;flex-shrink:0}
        .nav-lbl{opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};overflow:hidden;transition:all .25s}
        .nav-badge{
          margin-left:auto;background:#f87171;color:#fff;
          font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;
          display:${collapsed?'none':'inline-flex'};flex-shrink:0;
        }
        .nav-dot{
          position:absolute;top:7px;right:7px;width:7px;height:7px;
          background:#f87171;border-radius:50%;
          display:${collapsed?'block':'none'};
        }
        .sb-footer{padding:10px 8px;border-top:1px solid rgba(255,255,255,.06)}
        .user-box{
          display:flex;align-items:center;gap:10px;
          padding:${collapsed?'8px':'10px 11px'};border-radius:10px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
          margin-bottom:7px;justify-content:${collapsed?'center':'flex-start'};
        }
        .user-av{
          width:30px;height:30px;border-radius:9px;flex-shrink:0;
          background:linear-gradient(135deg,#ffc83c,#e8a400);
          color:#07111f;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;
        }
        .user-info{overflow:hidden;transition:all .25s;opacity:${collapsed?0:1};width:${collapsed?'0':'auto'}}
        .user-nm{font-size:12px;font-weight:700;color:rgba(255,255,255,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
        .user-rl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .logout-btn{
          width:100%;display:flex;align-items:center;gap:10px;
          justify-content:${collapsed?'center':'flex-start'};
          padding:${collapsed?'9px':'9px 11px'};
          background:none;border:none;border-radius:10px;
          color:rgba(255,255,255,.35);font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all .2s;
        }
        .logout-btn:hover{background:rgba(248,113,113,.1);color:#fca5a5}
        .logout-lbl{opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};overflow:hidden;transition:all .25s;white-space:nowrap}
        /* Mobile */
        .mob-bar{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(7,17,31,.97);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,.08);padding:6px 0;z-index:100}
        .mob-nav{display:flex;justify-content:space-around}
        .mob-item{display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:rgba(255,255,255,.4);padding:6px 10px;border-radius:8px;transition:color .2s;font-size:10px;font-weight:600;position:relative}
        .mob-item.active{color:#ffc83c}
        .mob-dot{position:absolute;top:4px;right:6px;width:6px;height:6px;background:#f87171;border-radius:50%}
        @media(max-width:768px){.sb{display:none}.mob-bar{display:block}}
      `}</style>

      <aside className="sb">
        <div className="sb-head">
          <div className="sb-logo">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 2L15 5.5v6L8.5 15 2 11.5v-6L8.5 2z" stroke="#ffc83c" strokeWidth="1.3" fill="rgba(255,200,60,.15)"/>
              <path d="M5.5 8.5h6M8.5 5.5v6" stroke="#ffc83c" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="sb-brand">
            <div className="sb-name">Lendi Portal</div>
            <div className="sb-role" style={{ color: roleColor }}>{roleLabel}</div>
          </div>
          <button className="sb-toggle" onClick={() => setCollapsed(!collapsed)}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d={collapsed ? "M5 3l5 4.5L5 12" : "M10 3L5 7.5l5 4.5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="sb-nav">
          {nav.map(({ href, label, ico, badge }) => {
            const isActive = pathname === href;
            const count = label.toLowerCase().includes('notif') ? unreadCount : label.toLowerCase().includes('outpass') ? pendingCount : 0;
            return (
              <Link key={href} href={href} className={`nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-ico">{ico}</span>
                <span className="nav-lbl">{label}</span>
                {badge && count > 0 && <span className="nav-badge">{count}</span>}
                {badge && count > 0 && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="user-box">
            <div className="user-av">{initials}</div>
            <div className="user-info">
              <div className="user-nm">{user?.name || 'User'}</div>
              <div className="user-rl" style={{ color: roleColor }}>{roleLabel} · {user?.department || ''}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5.5 13H3a1 1 0 01-1-1V3a1 1 0 011-1h2.5M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <span className="logout-lbl">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mob-bar">
        <div className="mob-nav">
          {nav.slice(0, 4).map(({ href, label, ico, badge }) => {
            const count = label.toLowerCase().includes('notif') ? unreadCount : label.toLowerCase().includes('outpass') ? pendingCount : 0;
            return (
              <Link key={href} href={href} className={`mob-item${pathname === href ? ' active' : ''}`}>
                <span style={{ fontSize: 20 }}>{ico}</span>
                {badge && count > 0 && <span className="mob-dot" />}
                <span>{label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
