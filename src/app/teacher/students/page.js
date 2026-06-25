'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['class_teacher'].includes(parsed.role)) { router.push('/login'); return; }
    fetch('/api/hod?type=students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStudents(d.students || [])).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(search.toLowerCase())
  );

  const getColor = p => p >= 75 ? '#4ade80' : p >= 60 ? '#fbbf24' : '#f87171';

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.5rem}
        .toolbar{display:flex;gap:12px;margin-bottom:1.5rem;flex-wrap:wrap}
        .search-box{position:relative;flex:1;max-width:360px}
        .search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.3);pointer-events:none;line-height:0}
        .search-inp{width:100%;height:42px;padding:0 14px 0 40px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#fff;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s}
        .search-inp::placeholder{color:rgba(255,255,255,.25)}
        .search-inp:focus{border-color:rgba(255,200,60,.5)}
        .count{font-size:13px;color:rgba(255,255,255,.38);display:flex;align-items:center}

        table{width:100%;border-collapse:collapse}
        thead th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
        tbody tr{border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s;cursor:default}
        tbody tr:hover{background:rgba(255,255,255,.04)}
        tbody td{padding:11px 14px;font-size:13.5px;color:rgba(255,255,255,.75)}

        .av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,rgba(96,165,250,.2),rgba(96,165,250,.07));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#60a5fa}
        .name-cell{display:flex;align-items:center;gap:10px}
        .name-txt{font-weight:700;color:rgba(255,255,255,.88)}
        .email-txt{font-size:11.5px;color:rgba(255,255,255,.35);margin-top:1px}
        .att-cell{display:flex;align-items:center;gap:8px}
        .att-bar{width:60px;height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;flex-shrink:0}
        .att-fill{height:100%;border-radius:4px}
        .att-pct{font-size:13px;font-weight:800;width:36px}
        .badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        .tbl-wrap{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.tbl-wrap{overflow-x:auto}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="page-title">🎓 My Students</div>
          <div className="page-sub">Monitor attendance and details of students in your department</div>
          <div className="toolbar">
            <div className="search-box">
              <span className="search-ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
              <input className="search-inp" placeholder="Search by name or roll number..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="count">{filtered.length} students</div>
          </div>
          {loading
            ? [1,2,3,4,5].map(i=><div key={i} className="skel" style={{height:52}}/>)
            : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th><th>Roll No</th><th>Year / Sem</th><th>Section</th>
                      <th>Attendance</th><th>Outpasses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const pct = s.attendance_pct || 0;
                      const color = getColor(pct);
                      const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                      return (
                        <tr key={s.user_id}>
                          <td>
                            <div className="name-cell">
                              <div className="av">{initials}</div>
                              <div><div className="name-txt">{s.name}</div><div className="email-txt">{s.email}</div></div>
                            </div>
                          </td>
                          <td style={{fontWeight:700,color:'rgba(255,255,255,.7)',fontFamily:'monospace'}}>{s.roll_no}</td>
                          <td>Yr {s.year} · Sem {s.semester}</td>
                          <td><span className="badge" style={{background:'rgba(96,165,250,.12)',color:'#60a5fa'}}>{s.section}</span></td>
                          <td>
                            <div className="att-cell">
                              <div className="att-bar"><div className="att-fill" style={{width:`${pct}%`,background:color}}/></div>
                              <span className="att-pct" style={{color}}>{pct}%</span>
                            </div>
                          </td>
                          <td><span className="badge" style={{background:'rgba(74,222,128,.1)',color:'#4ade80'}}>{s.approved_outpasses} approved</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </main>
      </div>
    </>
  );
}
