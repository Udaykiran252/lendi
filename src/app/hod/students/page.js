'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function HodStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAtt, setFilterAtt] = useState('all');
  const [notifs, setNotifs] = useState([]);
  const [pendingOutpasses, setPendingOutpasses] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (!['hod','principal'].includes(JSON.parse(u).role)) { router.push('/login'); return; }
    fetch('/api/hod?type=students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=>setStudents(d.students||[])).finally(()=>setLoading(false));
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>setNotifs(d.notifications||[]));
    fetch('/api/teacher?filter=pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.ok ? r.json() : {}).then(d=>{
        const ops = d.outpasses||[];
        setPendingOutpasses(ops.filter(o=>o.teacher_status==='approved'&&o.hod_status==='pending').length);
      });
  }, []);

  const unread = notifs.filter(n=>!n.is_read).length;

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_no.toLowerCase().includes(search.toLowerCase());
    const matchAtt = filterAtt==='all' || (filterAtt==='safe' && s.attendance_pct>=75) || (filterAtt==='risk' && s.attendance_pct>=60&&s.attendance_pct<75) || (filterAtt==='danger' && s.attendance_pct<60);
    return matchSearch && matchAtt;
  });

  const getColor = p => p>=75?'#4ade80':p>=60?'#fbbf24':'#f87171';
  const getStatus = p => p>=75?'Safe':p>=60?'At Risk':'Danger';
  const getStatusBg = p => p>=75?'rgba(74,222,128,.12)':p>=60?'rgba(251,191,36,.12)':'rgba(248,113,113,.12)';

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.5rem}
        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
        .sb-box{position:relative;flex:1;max-width:320px}
        .sb-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.3);pointer-events:none;line-height:0}
        .sb-inp{width:100%;height:42px;padding:0 14px 0 40px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#fff;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s}
        .sb-inp::placeholder{color:rgba(255,255,255,.25)}
        .sb-inp:focus{border-color:rgba(251,191,36,.5)}
        .fb{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .fb.on{background:rgba(251,191,36,.15);color:#fbbf24;border:1px solid rgba(251,191,36,.3)}
        .fb.off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.08)}
        .fb.off:hover{background:rgba(255,255,255,.09);color:#fff}
        .count{font-size:13px;color:rgba(255,255,255,.35);margin-left:auto}

        .summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.5rem}
        .sum-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;text-align:center}
        .sum-n{font-size:1.5rem;font-weight:800;margin-bottom:3px}
        .sum-l{font-size:11.5px;color:rgba(255,255,255,.38)}

        .tbl-wrap{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden}
        table{width:100%;border-collapse:collapse}
        thead th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
        tbody tr{border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
        tbody tr:hover{background:rgba(255,255,255,.04)}
        tbody td{padding:11px 14px;font-size:13.5px;color:rgba(255,255,255,.75)}
        .av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.07));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fbbf24}
        .nc{display:flex;align-items:center;gap:10px}
        .nm{font-weight:700;color:rgba(255,255,255,.88)}
        .em{font-size:11.5px;color:rgba(255,255,255,.35);margin-top:1px}
        .ac{display:flex;align-items:center;gap:8px}
        .ab{width:60px;height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;flex-shrink:0}
        .af{height:100%;border-radius:4px}
        .ap{font-size:13px;font-weight:800;width:36px}
        .badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite;margin-bottom:8px}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.tbl-wrap{overflow-x:auto}.summary-row{grid-template-columns:1fr 1fr}}
      `}</style>
      <div className="root">
        <Sidebar unreadCount={unread} pendingCount={pendingOutpasses} />
        <main className="main">
          <div className="page-title">🎓 Students Monitor</div>
          <div className="page-sub">Full overview of all students in your department</div>

          <div className="summary-row">
            {[
              { n: students.length, l: 'Total Students', color: '#fff' },
              { n: students.filter(s=>s.attendance_pct>=75).length, l: 'Safe (≥75%)', color: '#4ade80' },
              { n: students.filter(s=>s.attendance_pct>=60&&s.attendance_pct<75).length, l: 'At Risk (60-75%)', color: '#fbbf24' },
              { n: students.filter(s=>s.attendance_pct<60).length, l: 'Danger (<60%)', color: '#f87171' },
            ].map((s,i)=>(
              <div key={i} className="sum-card">
                <div className="sum-n" style={{color:s.color}}>{loading?'…':s.n}</div>
                <div className="sum-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="sb-box">
              <span className="sb-ico"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
              <input className="sb-inp" placeholder="Search name or roll no..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {['all','safe','risk','danger'].map(f=>(
              <button key={f} className={`fb ${filterAtt===f?'on':'off'}`} onClick={()=>setFilterAtt(f)}>
                {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
            <div className="count">{filtered.length} students</div>
          </div>

          {loading ? [1,2,3,4,5].map(i=><div key={i} className="skel" style={{height:52}}/>)
          : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th><th>Roll No</th><th>Year/Sem</th><th>Section</th>
                    <th>Attendance</th><th>Status</th><th>Outpasses</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const p = s.attendance_pct || 0;
                    const color = getColor(p);
                    const initials = s.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ST';
                    return (
                      <tr key={s.user_id}>
                        <td>
                          <div className="nc">
                            <div className="av">{initials}</div>
                            <div><div className="nm">{s.name}</div><div className="em">{s.email}</div></div>
                          </div>
                        </td>
                        <td style={{fontWeight:700,color:'rgba(255,255,255,.7)',fontFamily:'monospace'}}>{s.roll_no}</td>
                        <td>Yr {s.year} · Sem {s.semester}</td>
                        <td><span className="badge" style={{background:'rgba(96,165,250,.12)',color:'#60a5fa'}}>{s.section}</span></td>
                        <td>
                          <div className="ac">
                            <div className="ab"><div className="af" style={{width:`${p}%`,background:color}}/></div>
                            <span className="ap" style={{color}}>{p}%</span>
                          </div>
                        </td>
                        <td><span className="badge" style={{color,background:getStatusBg(p)}}>{getStatus(p)}</span></td>
                        <td><span className="badge" style={{background:'rgba(74,222,128,.1)',color:'#4ade80'}}>{s.approved_outpasses} ✓</span></td>
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
