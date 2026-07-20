'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PrincipalFacultyMonitor() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [stats, setStats] = useState({ total: 0, teachers: 0, hods: 0, totalLeaves: 0 });

  const load = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/hod?type=staff_attendance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const d = await res.json();
      const list = d.staff || [];
      setStaff(list);
      
      // Calculate staff stats
      const total = list.length;
      const teachers = list.filter(s => s.role === 'class_teacher').length;
      const hods = list.filter(s => s.role === 'hod').length;
      const totalLeaves = list.reduce((sum, s) => sum + (s.leave_days || 0), 0);
      setStats({ total, teachers, hods, totalLeaves });
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'principal') { router.push('/login'); return; }
    load();
  }, []);

  const filteredStaff = staff.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || 
                        s.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    const matchRole = roleFilter === 'All' || 
                      (roleFilter === 'HOD' && s.role === 'hod') || 
                      (roleFilter === 'Teacher' && s.role === 'class_teacher');
    return matchSearch && matchDept && matchRole;
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.8rem}

        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .card-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.2rem;display:flex;flex-direction:column;gap:4px}
        .stat-val{font-size:1.6rem;font-weight:800;color:#fff}
        .stat-lbl{font-size:12px;color:rgba(255,255,255,.42)}

        .controls{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.2rem;margin-bottom:1.5rem;display:flex;gap:15px;align-items:center;flex-wrap:wrap}
        .search-inp{flex:1;min-width:200px;height:44px;padding:0 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:#fff;font-size:13.5px;outline:none;font-family:inherit}
        .search-inp:focus{border-color:rgba(167,139,250,.5)}
        .sel-box{height:44px;padding:0 12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:#fff;font-size:13.5px;outline:none;font-family:inherit;cursor:pointer}
        .sel-box option{background:#07111f;color:#fff}

        .tbl-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden}
        .tbl-wrap{overflow-x:auto}
        table{width:100%;border-collapse:collapse;text-align:left}
        th{padding:14px 18px;background:rgba(255,255,255,.05);font-size:11.5px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase}
        td{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.04);font-size:13.5px;color:rgba(255,255,255,.85)}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:rgba(255,255,255,.02)}

        .av-wrap{display:flex;align-items:center;gap:10px}
        .av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(167,139,250,.07));display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:800;color:#a78bfa}
        .role-badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;display:inline-block}

        .empty{text-align:center;padding:4rem;color:rgba(255,255,255,.3);font-size:14px}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.stats-grid{grid-template-columns:1fr 1fr}.controls{flex-direction:column;align-items:stretch}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="title">👨‍🏫 Faculty Attendance &amp; Leave Monitor</div>
          <div className="sub">Track presence, roles, and leave logs for all college teaching staff</div>

          <div className="stats-grid">
            {[
              { l: 'Total Faculty Members', v: loading ? '…' : stats.total },
              { l: 'Registered HODs', v: loading ? '…' : stats.hods },
              { l: 'Registered Teachers', v: loading ? '…' : stats.teachers },
              { l: 'Cumulative Leaves Taken', v: loading ? '…' : stats.totalLeaves },
            ].map((s, i) => (
              <div key={i} className="card-stat">
                <span className="stat-lbl">{s.l}</span>
                <span className="stat-val">{s.v}</span>
              </div>
            ))}
          </div>

          <div className="controls">
            <input className="search-inp" placeholder="Search by name or email..." 
              value={search} onChange={e => setSearch(e.target.value)} />
            
            <select className="sel-box" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>

            <select className="sel-box" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="HOD">HOD Only</option>
              <option value="Teacher">Teacher Only</option>
            </select>
          </div>

          <div className="tbl-card">
            {loading ? <div className="empty">Loading staff data…</div> :
             filteredStaff.length === 0 ? <div className="empty">🔍 No matching faculty members found.</div> :
             <div className="tbl-wrap">
               <table>
                 <thead>
                   <tr>
                     <th>Faculty Member</th>
                     <th>Role</th>
                     <th>Department</th>
                     <th>Email ID</th>
                     <th>Leaves Taken</th>
                     <th>Present Days</th>
                     <th>Tracked Duty Days</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredStaff.map(s => {
                     const initials = s.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FC';
                     const isHOD = s.role === 'hod';
                     const roleLbl = isHOD ? 'HOD' : 'Teacher';
                     const roleColor = isHOD ? '#fbbf24' : '#4ade80';
                     const roleBg = isHOD ? 'rgba(251,191,36,.1)' : 'rgba(74,222,128,.1)';
                     
                     // Leaves color coding
                     const lColor = s.leave_days === 0 ? '#4ade80' : s.leave_days <= 1 ? '#fbbf24' : '#f87171';

                     return (
                       <tr key={s.id}>
                         <td>
                           <div className="av-wrap">
                             <div className="av" style={{
                               background: isHOD ? 'linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.05))' : 'linear-gradient(135deg,rgba(74,222,128,.2),rgba(74,222,128,.05))',
                               color: roleColor
                             }}>{initials}</div>
                             <span style={{fontWeight:700}}>{s.name}</span>
                           </div>
                         </td>
                         <td>
                           <span className="role-badge" style={{color: roleColor, background: roleBg}}>{roleLbl}</span>
                         </td>
                         <td style={{fontWeight:600}}>{s.department}</td>
                         <td style={{color:'rgba(255,255,255,.6)'}}>{s.email}</td>
                         <td style={{fontWeight:800, color: lColor}}>{s.leave_days} {s.leave_days === 1 ? 'day' : 'days'}</td>
                         <td style={{fontWeight:600}}>{s.present_days} {s.present_days === 1 ? 'day' : 'days'}</td>
                         <td style={{color:'rgba(255,255,255,.5)'}}>{s.total_days} days</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
            }
          </div>
        </main>
      </div>
    </>
  );
}
