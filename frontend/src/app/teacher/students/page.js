'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['class_teacher'].includes(parsed.role)) { router.push('/login'); return; }
    fetch('/api/hod?type=students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStudents(d.students || [])).finally(() => setLoading(false));
  }, [router]);

  // Get unique values for filter dropdowns
  const years = [...new Set(students.map(s => s.year).filter(Boolean))].sort();
  const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  const filtered = students.filter(s => {
    const matchSearch = search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === 'all' || String(s.year) === String(filterYear);
    const matchSection = filterSection === 'all' || s.section === filterSection;
    return matchSearch && matchYear && matchSection;
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem;color:#0d2340}
        .page-sub{font-size:13.5px;color:#64748b;margin-bottom:1.5rem}
        .toolbar{display:flex;gap:12px;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
        .search-box{position:relative;flex:1;max-width:320px}
        .search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none;line-height:0}
        .search-inp{width:100%;height:42px;padding:0 14px 0 40px;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s;font-weight:500}
        .search-inp::placeholder{color:#94a3b8}
        .search-inp:focus{border-color:#0d2340;background:#ffffff}
        .sel{height:42px;padding:0 12px;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13px;font-weight:600;outline:none;font-family:inherit;cursor:pointer;transition:border-color .2s;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .sel:focus{border-color:#0d2340}
        .count{font-size:13px;color:#64748b;display:flex;align-items:center;font-weight:600}
        .clear-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid #fca5a5;background:#fff5f5;color:#dc2626;font-family:inherit;transition:all .2s}
        .clear-btn:hover{background:#fee2e2}

        table{width:100%;border-collapse:collapse}
        thead th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s;cursor:default}
        tbody tr:hover{background:#f8fafc}
        tbody td{padding:11px 14px;font-size:13.5px;color:#334155}

        .av{width:32px;height:32px;border-radius:9px;background:#0d2340;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#ffffff}
        .name-cell{display:flex;align-items:center;gap:10px}
        .name-txt{font-weight:800;color:#0d2340}
        .email-txt{font-size:11.5px;color:#64748b;margin-top:1px}
        .badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        .tbl-wrap{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .skel{background:#f1f5f9;border-radius:8px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.tbl-wrap{overflow-x:auto}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="page-title">🎓 Students Outpass Monitor</div>
          <div className="page-sub">Monitor student details and outpass activity in your department</div>
          <div className="toolbar">
            <div className="search-box">
              <span className="search-ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
              <input className="search-inp" placeholder="Search by name or roll number..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="sel" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
              <option value="all">All Years</option>
              {years.map(y=><option key={y} value={y}>Year {y}</option>)}
            </select>
            <select className="sel" value={filterSection} onChange={e=>setFilterSection(e.target.value)}>
              <option value="all">All Sections</option>
              {sections.map(s=><option key={s} value={s}>Section {s}</option>)}
            </select>
            {(filterYear!=='all'||filterSection!=='all'||search) && (
              <button className="clear-btn" onClick={()=>{setFilterYear('all');setFilterSection('all');setSearch('');}}>✕ Clear</button>
            )}
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
                      <th>Outpass Status</th><th>Approved Passes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const approved = s.approved_outpasses || 0;
                      const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                      const statusTag = approved > 2
                        ? { label: 'Frequent Applicant', color: '#d97706', bg: 'rgba(251,191,36,.12)' }
                        : approved > 0
                        ? { label: 'Active User', color: '#16a34a', bg: 'rgba(74,222,128,.12)' }
                        : { label: 'No Passes', color: '#64748b', bg: '#f1f5f9' };
                      return (
                        <tr key={s.user_id}>
                          <td>
                            <div className="name-cell">
                              <div className="av">{initials}</div>
                              <div><div className="name-txt">{s.name}</div><div className="email-txt">{s.email}</div></div>
                            </div>
                          </td>
                          <td style={{fontWeight:700,color:'#0d2340',fontFamily:'monospace'}}>{s.roll_no}</td>
                          <td>Yr {s.year} · Sem {s.semester}</td>
                          <td><span className="badge" style={{background:'rgba(37,99,235,.1)',color:'#2563eb'}}>{s.section}</span></td>
                          <td>
                            <span className="badge" style={{color:statusTag.color,background:statusTag.bg}}>
                              {statusTag.label}
                            </span>
                          </td>
                          <td><span className="badge" style={{background:'rgba(22,163,74,.1)',color:'#16a34a'}}>{approved} approved</span></td>
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
