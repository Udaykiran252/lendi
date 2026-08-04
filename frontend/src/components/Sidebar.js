'use client';
import { useState, useEffect, useRef } from 'react';
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
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];

const NAV_ADMIN = [
  { href: '/admin/dashboard', label: 'Dashboard', ico: '🏠' },
  { href: '/admin/users', label: 'Manage Users', ico: '👤' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];

const NAV_SECURITY = [
  { href: '/security/dashboard', label: 'Gate Security', ico: '🛡️' },
  { href: '/notifications', label: 'Notifications', ico: '🔔', badge: true },
];

export default function Sidebar({ unreadCount = 0, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setUser(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const updateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updatedUser = { ...user, availability_status: newStatus };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error(e);
    }
    setUpdatingStatus(false);
    setStatusMenuOpen(false);
  };

  const role = user?.role || 'student';
  const isFaculty = ['class_teacher', 'hod', 'principal'].includes(role);
  const nav = role === 'admin' ? NAV_ADMIN : role === 'principal' ? NAV_PRINCIPAL : role === 'class_teacher' ? NAV_TEACHER : role === 'hod' ? NAV_HOD : ['security', 'gate_staff'].includes(role) ? NAV_SECURITY : NAV_STUDENT;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  const roleLabel = { student: 'Student', class_teacher: 'Class Teacher', hod: 'HOD', principal: 'Principal', admin: 'Admin', security: 'Security Guard', gate_staff: 'Security Guard' }[role] || role;
  const roleColor = { student: '#60a5fa', class_teacher: '#4ade80', hod: '#fbbf24', principal: '#a78bfa', admin: '#f87171', security: '#2563eb', gate_staff: '#2563eb' }[role] || '#60a5fa';

  const rawStatus = user?.availability_status || 'available';
  const isAvailable = rawStatus !== 'absent';
  const currentStatusKey = isAvailable ? 'available' : 'absent';

  return (
    <>
      <style>{`
        .sb{
          width:${collapsed?'68px':'240px'};min-height:100vh;
          background:#ffffff;
          border-right:1px solid #e2e8f0;
          display:flex;flex-direction:column;
          transition:width .3s cubic-bezier(.4,0,.2,1);
          flex-shrink:0;position:sticky;top:0;height:100vh;overflow:hidden;
          ${collapsed?'cursor:pointer;':''}
        }
        .sb-head{
          padding:${collapsed?'16px 0':'16px 18px'};
          border-bottom:1px solid #e2e8f0;
          display:flex;align-items:center;gap:12px;min-height:68px;
          background:#ffffff;justify-content:${collapsed?'center':'flex-start'};
        }
        .sb-logo{
          width:40px;height:40px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
        }
        .sb-brand{overflow:hidden;transition:all .25s;opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};white-space:nowrap}
        .sb-name{font-size:14.5px;font-weight:800;color:#0d2340;letter-spacing:-.3px}
        .sb-role{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
        .sb-toggle{margin-left:auto;background:none;border:none;cursor:pointer;color:#94a3b8;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;border-radius:8px}
        .sb-toggle:hover{color:#0d2340;background:#f1f5f9}
        .sb-nav{flex:1;padding:14px 8px;display:flex;flex-direction:column;gap:4px;overflow-y:auto}
        .nav-item{
          display:flex;align-items:center;gap:10px;
          padding:${collapsed?'10px':'10px 11px'};
          border-radius:10px;text-decoration:none;
          color:#475569;font-size:13.5px;font-weight:600;
          transition:all .2s;white-space:nowrap;position:relative;
          justify-content:${collapsed?'center':'flex-start'};
        }
        .nav-item:hover{background:#f8fafc;color:#0d2340}
        .nav-item.active{background:#eff6ff;color:#2563eb;font-weight:700;border-left:3px solid #2563eb;border-radius:0 10px 10px 0}
        .nav-ico{font-size:17px;flex-shrink:0}
        .nav-lbl{opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};overflow:hidden;transition:all .25s}
        .nav-badge{
          margin-left:auto;background:#d9232d;color:#fff;
          font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;
          display:${collapsed?'none':'inline-flex'};flex-shrink:0;
        }
        .nav-dot{
          position:absolute;top:7px;right:7px;width:7px;height:7px;
          background:#d9232d;border-radius:50%;
          display:${collapsed?'block':'none'};
        }
        .sb-footer{padding:10px 8px;border-top:1px solid #f1f5f9;background:#ffffff;position:relative}
        .user-box{
          display:flex;align-items:center;gap:10px;
          padding:${collapsed?'8px':'10px 11px'};border-radius:10px;
          background:#f8fafc;border:1px solid #e2e8f0;
          margin-bottom:7px;justify-content:${collapsed?'center':'flex-start'};
          position:relative;
        }
        .user-av-wrap{position:relative;flex-shrink:0}
        .user-av{
          width:32px;height:32px;border-radius:9px;
          background:linear-gradient(135deg,#0d2340,#1e293b);
          color:#ffffff;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;
        }
        .status-dot-badge{
          position:absolute;bottom:-2px;right:-2px;width:100%;height:10px;width:10px;
          border-radius:50%;border:2px solid #fff;
        }
        .status-dot-badge.available{background:#22c55e}
        .status-dot-badge.absent{background:#ef4444}
        .user-info{overflow:hidden;transition:all .25s;opacity:${collapsed?0:1};width:${collapsed?'0':'auto'}}
        .user-nm{font-size:12px;font-weight:700;color:#0d2340;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
        .user-rl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        
        /* Status selector widget */
        .status-trigger-btn{
          width:100%;margin-bottom:8px;padding:7px 10px;
          border-radius:8px;border:1px solid #e2e8f0;
          background:${isAvailable ? '#f0fdf4' : '#fef2f2'};
          display:${collapsed?'none':'flex'};align-items:center;justify-content:space-between;
          cursor:pointer;font-family:inherit;transition:all .2s;
        }
        .status-trigger-btn:hover{border-color:#cbd5e1;transform:translateY(-1px)}
        .status-pill-left{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:${isAvailable ? '#15803d' : '#b91c1c'}}
        .status-dot{width:8px;height:8px;border-radius:50%;background:${isAvailable ? '#22c55e' : '#ef4444'}}
        .status-menu-popover{
          position:absolute;bottom:75px;left:8px;right:8px;
          background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
          box-shadow:0 12px 32px rgba(0,0,0,0.12);z-index:200;padding:6px;
          display:flex;flex-direction:column;gap:4px;
        }
        .status-opt{
          display:flex;align-items:center;gap:10px;padding:9px 12px;
          border-radius:8px;cursor:pointer;border:none;background:none;
          width:100%;text-align:left;font-family:inherit;transition:all .15s;
        }
        .status-opt:hover{background:#f8fafc}
        .status-opt.selected{background:#eff6ff}
        .status-opt-title{font-size:12.5px;font-weight:700;color:#0d2340;display:flex;align-items:center;gap:6px}
        .status-opt-desc{font-size:11px;color:#64748b;margin-top:1px}

        .logout-btn{
          width:100%;display:flex;align-items:center;gap:10px;
          justify-content:${collapsed?'center':'flex-start'};
          padding:${collapsed?'9px':'9px 11px'};
          background:none;border:none;border-radius:10px;
          color:#64748b;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all .2s;
        }
        .logout-btn:hover{background:#fee2e2;color:#dc2626}
        .logout-lbl{opacity:${collapsed?0:1};width:${collapsed?'0':'auto'};overflow:hidden;transition:all .25s;white-space:nowrap}
        
        /* Mobile elements */
        .mob-top-bar{
          display:none;position:sticky;top:0;z-index:100;
          background:#ffffff;border-bottom:1px solid #e2e8f0;
          padding:10px 16px;align-items:center;justify-content:space-between;
          box-shadow:0 2px 8px rgba(0,0,0,0.03);
        }
        .mob-top-brand{display:flex;align-items:center;gap:10px}
        .mob-top-logo{width:32px;height:32px;display:flex;align-items:center;justify-content:center}
        .mob-top-title{font-size:14px;font-weight:800;color:#0d2340}
        .mob-top-role{font-size:10px;font-weight:700;text-transform:uppercase}

        .mob-status-btn{
          display:flex;align-items:center;gap:6px;padding:6px 12px;
          border-radius:20px;border:1px solid;font-size:12px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all .2s;
        }
        .mob-popover{
          top:50px;bottom:auto;right:16px;left:auto;width:220px;
        }

        .mob-bar{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.97);backdrop-filter:blur(20px);border-top:1px solid #e2e8f0;padding:6px 0;z-index:100}
        .mob-nav{display:flex;justify-content:space-around}
        .mob-item{display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:#64748b;padding:6px 10px;border-radius:8px;transition:color .2s;font-size:10px;font-weight:600;position:relative;background:none;border:none;cursor:pointer;font-family:inherit}
        .mob-item.active{color:#2563eb;font-weight:700}
        .mob-logout-btn{color:#ef4444}
        .mob-logout-btn:hover{color:#dc2626}
        .mob-dot{position:absolute;top:4px;right:6px;width:6px;height:6px;background:#ef4444;border-radius:50%}
        
        @media(max-width:900px){
          .sb{display:none !important}
          .mob-top-bar{display:flex}
          .mob-bar{display:block}
        }
      `}</style>

      {/* Mobile Top Header with presence status toggle */}
      <div className="mob-top-bar" ref={menuRef}>
        <div className="mob-top-brand">
          <div className="mob-top-logo">
            <img 
              src="/lendi-crest.png" 
              alt="Lendi" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.src = '/lendi-logo.png'; }}
            />
          </div>
          <div>
            <div className="mob-top-title">Lendi Portal</div>
            <div className="mob-top-role" style={{ color: roleColor }}>{roleLabel}</div>
          </div>
        </div>

        {isFaculty && (
          <div style={{ position: 'relative' }}>
            <button 
              className="mob-status-btn"
              style={{
                background: isAvailable ? '#f0fdf4' : '#fef2f2',
                borderColor: isAvailable ? '#86efac' : '#fca5a5',
                color: isAvailable ? '#15803d' : '#b91c1c',
              }}
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={updatingStatus}
            >
              <span className="status-dot" style={{ background: isAvailable ? '#22c55e' : '#ef4444' }}></span>
              <span>{isAvailable ? 'Available' : 'Absent'}</span>
              <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
            </button>

            {statusMenuOpen && (
              <div className="status-menu-popover mob-popover">
                <button 
                  className={`status-opt ${isAvailable ? 'selected' : ''}`}
                  onClick={() => updateStatus('available')}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}></span>
                  <div className="status-opt-title">
                    Available {isAvailable && <span style={{ color: '#2563eb', fontSize: 11 }}>✓</span>}
                  </div>
                </button>

                <button 
                  className={`status-opt ${!isAvailable ? 'selected' : ''}`}
                  onClick={() => updateStatus('absent')}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}></span>
                  <div className="status-opt-title">
                    Absent {!isAvailable && <span style={{ color: '#2563eb', fontSize: 11 }}>✓</span>}
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="sb" onClick={() => { if (collapsed) setCollapsed(false); }}>
        <div className="sb-head">
          <div className="sb-logo">
            <img 
              src="/lendi-crest.png" 
              alt="Lendi Emblem" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = '/lendi-logo.png';
              }}
            />
          </div>
          <div className="sb-brand">
            <div className="sb-name">Lendi Portal</div>
            <div className="sb-role" style={{ color: roleColor }}>{roleLabel}</div>
          </div>
          {!collapsed && (
            <button className="sb-toggle" onClick={() => setCollapsed(true)}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M10 3L5 7.5l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
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

        <div className="sb-footer" ref={menuRef}>
          {isFaculty && (
            <>
              <button 
                className="status-trigger-btn"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                disabled={updatingStatus}
                title="Change your presence status for outpass approvals"
              >
                <div className="status-pill-left">
                  <span className="status-dot"></span>
                  <span>{isAvailable ? 'Available' : 'Absent'}</span>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>▼</span>
              </button>

              {statusMenuOpen && (
                <div className="status-menu-popover">
                  <button 
                    className={`status-opt ${isAvailable ? 'selected' : ''}`}
                    onClick={() => updateStatus('available')}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}></span>
                    <div className="status-opt-title">
                      Available {isAvailable && <span style={{ color: '#2563eb', fontSize: 11 }}>✓</span>}
                    </div>
                  </button>

                  <button 
                    className={`status-opt ${!isAvailable ? 'selected' : ''}`}
                    onClick={() => updateStatus('absent')}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}></span>
                    <div className="status-opt-title">
                      Absent {!isAvailable && <span style={{ color: '#2563eb', fontSize: 11 }}>✓</span>}
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          <div className="user-box">
            <div className="user-av-wrap">
              <div className="user-av">{initials}</div>
              {isFaculty && <span className={`status-dot-badge ${currentStatusKey}`}></span>}
            </div>
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
          <button onClick={logout} className="mob-item mob-logout-btn" title="Sign Out">
            <span style={{ fontSize: 18 }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
