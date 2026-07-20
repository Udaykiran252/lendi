'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PrincipalStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notifs, setNotifs] = useState([]);
  const [pendingOutpasses, setPendingOutpasses] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (JSON.parse(u).role !== 'principal') { router.push('/login'); return; }
    fetch('/api/hod?type=students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=>setStudents(d.students||[])).finally(()=>setLoading(false));
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
    fetch('/api/teacher?filter=pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>{
        const ops = d.outpasses||[];
        setPendingOutpasses(ops.filter(o=>o.status==='pending_principal').length);
      });
  }, [router]);

  const unread = notifs.filter(n=>!n.is_read).length;

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.roll_no.toLowerCase().includes(search.toLowerCase()) ||
                        s.department.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterType==='all' ||
                        (filterType==='active' && (s.approved_outpasses||0) > 0) ||
                        (filterType==='frequent' && (s.approved_outpasses||0) >= 2) ||
                        (filterType==='none' && (!s.approved_outpasses || s.approved_outpasses === 0));
    return matchSearch && matchFilter;
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
        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
        .sb-box{position:relative;flex:1;max-width:320px}
        .sb-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none;line-height:0}
        .sb-inp{width:100%;height:42px;padding:0 14px 0 40px;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s;font-weight:500}
        .sb-inp::placeholder{color:#94a3b8}
        .sb-inp:focus{border-color:#0d2340;background:#ffffff}
        .fb{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .fb.on{background:#0d2340;color:#ffffff;box-shadow:0 2px 8px rgba(13,35,64,.15)}
        .fb.off{background:#ffffff;color:#64748b;border:1px solid #e2e8f0}
        .fb.off:hover{background:#f1f5f9;color:#0d2340}
        .count{font-size:13px;color:#64748b;margin-left:auto;font-weight:600}

        .summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.5rem}
        .sum-card{background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sum-n{font-size:1.5rem;font-weight:800;margin-bottom:3px;color:#0d2340}
        .sum-l{font-size:11.5px;color:#64748b;font-weight:600}

        .tbl-wrap{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        table{width:100%;border-collapse:collapse}
        thead th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s}
        tbody tr:hover{background:#f8fafc}
        tbody td{padding:11px 14px;font-size:13.5px;color:#334155}
        .av{width:32px;height:32px;border-radius:9px;background:#0d2340;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#ffffff}
        .nc{display:flex;align-items:center;gap:10px}
        .nm{font-weight:800;color:#0d2340}
        .em{font-size:11.5px;color:#64748b;margin-top:1px}
        .badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}
        .skel{background:#f1f5f9;border-radius:8px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.tbl-wrap{overflow-x:auto}.summary-row{grid-template-columns:1fr 1fr}}
      `}</style>
      <div className="root">
        <Sidebar unreadCount={unread} pendingCount={pendingOutpasses} />
        <main className="main">
          <div className="page-title">🎓 Institutional Students Outpass Monitor</div>
          <div className="page-sub">Full overview of all students and outpass activity across all departments</div>

          <div className="summary-row">
            {[
              { n: students.length, l: 'Total Students', color: '#fff' },
              { n: students.filter(s=>(s.approved_outpasses||0)>0).length, l: 'With Approved Passes', color: '#4ade80' },
              { n: students.filter(s=>(s.approved_outpasses||0)>=2).length, l: 'Frequent Applicants', color: '#fbbf24' },
              { n: students.filter(s=>!s.approved_outpasses || s.approved_outpasses===0).length, l: 'No Outpasses', color: 'rgba(255,255,255,.5)' },
            ].map((s,i)=>(
              <div key={i} className="sum-card">
                <div className="sum-n" style={{color:s.color}}>{loading?'…':s.n}</div>
                <div className="sum-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="sb-box">
              <span className="sb-ico">🔍</span>
              <input className="sb-inp" placeholder="Search name, roll no, department..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {[
              { id: 'all', label: 'All Students' },
              { id: 'active', label: 'With Passes' },
              { id: 'frequent', label: 'Frequent' },
              { id: 'none', label: 'No Passes' },
            ].map(f=>(
              <button key={f.id} className={`fb ${filterType===f.id?'on':'off'}`} onClick={()=>setFilterType(f.id)}>
                {f.label}
              </button>
            ))}
            <div className="count">Showing {filtered.length} students</div>
          </div>

          <div className="tbl-wrap">
            {loading ? <div style={{padding:20}}>{[1,2,3,4,5].map(i=><div key={i} className="skel" style={{height:40}}/>)}</div> :
             filtered.length === 0 ? <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No students found matching filters</div> :
             (
               <table>
                 <thead>
                   <tr>
                     <th>Student</th>
                     <th>Roll Number</th>
                     <th>Department</th>
                     <th>Year &amp; Section</th>
                     <th>Outpass Status</th>
                     <th>Approved Passes</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filtered.map(s=>{
                     const approved = s.approved_outpasses || 0;
                     const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                     const statusTag = approved >= 2
                       ? { label: 'Frequent Applicant', color: '#fbbf24', bg: 'rgba(251,191,36,.12)' }
                       : approved > 0
                       ? { label: 'Active User', color: '#4ade80', bg: 'rgba(74,222,128,.12)' }
                       : { label: 'Regular', color: 'rgba(255,255,255,.4)', bg: 'rgba(255,255,255,.06)' };
                     return (
                       <tr key={s.user_id}>
                         <td>
                           <div className="nc">
                             <div className="av">{initials}</div>
                             <div>
                               <div className="nm">{s.name}</div>
                               <div className="em">{s.email}</div>
                             </div>
                           </div>
                         </td>
                         <td style={{fontFamily:'monospace',fontWeight:600}}>{s.roll_no}</td>
                         <td style={{fontWeight:700}}>{s.department}</td>
                         <td>Yr {s.year} · Sec {s.section||'A'}</td>
                         <td>
                           <span className="badge" style={{color:statusTag.color,background:statusTag.bg}}>
                             {statusTag.label}
                           </span>
                         </td>
                         <td style={{fontWeight:700}}><span className="badge" style={{background:'rgba(74,222,128,.1)',color:'#4ade80'}}>{approved} approved</span></td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             )}
          </div>
        </main>
      </div>
    </>
  );
}
