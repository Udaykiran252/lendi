'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AttendancePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u || '{}');
    if (parsed.role && parsed.role !== 'student') {
      // Non-students don't have individual attendance — redirect to their dashboard
      if (parsed.role === 'class_teacher') router.push('/teacher/dashboard');
      else if (parsed.role === 'hod') router.push('/hod/dashboard');
      else if (parsed.role === 'principal') router.push('/principal/dashboard');
      else if (parsed.role === 'admin') router.push('/admin/dashboard');
      else router.push('/dashboard');
      return;
    }
    fetch('/api/attendance', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=>{ setData(d); if(d.subjects?.length) setSelected(d.subjects[0]); })
      .finally(()=>setLoading(false));
  }, []);

  const gc = p => p>=75?'#4ade80':p>=60?'#fbbf24':'#f87171';
  const gs = p => p>=75?'Safe':p>=60?'At Risk':'Danger';
  const gsbg = p => p>=75?'rgba(74,222,128,.12)':p>=60?'rgba(251,191,36,.12)':'rgba(248,113,113,.12)';
  const needed = s => { if(!s||s.percentage>=75) return 0; let x=0,p=s.present,t=s.total; while(((p+x)/(t+x))*100<75)x++; return x; };
  const canMiss = s => { if(!s||s.percentage<75) return 0; let x=0,p=s.present,t=s.total; while(((p)/(t+x+1))*100>=75)x++; return x; };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#07111f;color:#fff}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem}
        .page-sub{font-size:13.5px;color:rgba(255,255,255,.42);margin-bottom:1.8rem}

        .overall{background:linear-gradient(135deg,rgba(255,200,60,.1),rgba(255,200,60,.03));border:1px solid rgba(255,200,60,.2);border-radius:18px;padding:1.8rem;display:flex;align-items:center;gap:2rem;margin-bottom:2rem;flex-wrap:wrap}
        .ring-wrap{position:relative;width:110px;height:110px;flex-shrink:0}
        .ring-svg{transform:rotate(-90deg)}
        .ring-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .ring-pct{font-size:1.7rem;font-weight:800;color:#ffc83c;line-height:1}
        .ring-lbl{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
        .ov-info h3{font-size:1.05rem;font-weight:700;color:#fff;margin-bottom:.4rem}
        .ov-info p{font-size:13px;color:rgba(255,255,255,.5);line-height:1.7;max-width:380px}
        .ov-stats{display:flex;gap:1.4rem;margin-top:.9rem;flex-wrap:wrap}
        .ovs{text-align:center}
        .ovs-n{font-size:1.3rem;font-weight:800;color:#fff}
        .ovs-l{font-size:10.5px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.6px}

        .layout{display:grid;grid-template-columns:1fr 1.5fr;gap:1.5rem}
        .subj-list{display:flex;flex-direction:column;gap:8px}
        .subj-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;cursor:pointer;transition:all .2s}
        .subj-card:hover{border-color:rgba(255,200,60,.25);background:rgba(255,255,255,.07)}
        .subj-card.active{border-color:rgba(255,200,60,.4);background:rgba(255,200,60,.07)}
        .sj-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .sj-name{font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
        .sj-code{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
        .sj-bar{height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-top:6px}
        .sj-fill{height:100%;border-radius:4px;transition:width .5s}
        .stag{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:7px;white-space:nowrap}

        .detail{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.6rem;position:sticky;top:1rem;height:fit-content;max-height:calc(100vh - 2rem);overflow-y:auto}
        .dt{font-size:1.05rem;font-weight:800;color:#fff;margin-bottom:.3rem}
        .dc{font-size:12px;color:rgba(255,200,60,.7);margin-bottom:.2rem}
        .df{font-size:12.5px;color:rgba(255,255,255,.4);margin-bottom:1.3rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,.06)}
        .d-ring-row{display:flex;align-items:center;gap:1.3rem;margin-bottom:1.3rem}
        .d-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;flex:1}
        .ds{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:11px;text-align:center}
        .ds-n{font-size:1.3rem;font-weight:800;color:#fff}
        .ds-l{font-size:10.5px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px}
        .advice{padding:12px 14px;border-radius:10px;margin-bottom:1.3rem;font-size:13px;line-height:1.6}
        .adv-safe{background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);color:#86efac}
        .adv-risk{background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.2);color:#fde68a}
        .adv-danger{background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.2);color:#fca5a5}
        .cal-title{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px}
        .cal-grid{display:flex;flex-wrap:wrap;gap:5px}
        .cal-dot{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
        .dot-p{background:rgba(74,222,128,.18);color:#4ade80}
        .dot-a{background:rgba(248,113,113,.18);color:#f87171}

        .no-sel{text-align:center;padding:3rem 1rem;color:rgba(255,255,255,.25);font-size:13px}
        .skel{background:rgba(255,255,255,.06);border-radius:8px;animation:sh 1.5s infinite}
        @keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:1100px){.layout{grid-template-columns:1fr}.detail{position:static}}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.overall{flex-direction:column;gap:1rem}}
      `}</style>

      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="page-title">📊 Attendance Tracker</div>
          <div className="page-sub">Monitor your attendance across all subjects this semester</div>

          {loading ? (
            <>
              <div className="skel" style={{height:150,marginBottom:20,borderRadius:18}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:16}}>
                {[1,2,3,4].map(i=><div key={i} className="skel" style={{height:80}}/>)}
              </div>
            </>
          ) : (
            <>
              <div className="overall">
                <div className="ring-wrap">
                  <svg className="ring-svg" width="110" height="110" viewBox="0 0 110 110">
                    <circle fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" cx="55" cy="55" r="44"/>
                    <circle fill="none" stroke={gc(data?.overall||0)} strokeWidth="10" strokeLinecap="round"
                      cx="55" cy="55" r="44"
                      strokeDasharray={`${2*Math.PI*44}`}
                      strokeDashoffset={`${2*Math.PI*44*(1-(data?.overall||0)/100)}`}
                    />
                  </svg>
                  <div className="ring-c"><div className="ring-pct">{data?.overall||0}%</div><div className="ring-lbl">Overall</div></div>
                </div>
                <div className="ov-info">
                  <h3>Semester Attendance Summary</h3>
                  <p>{data?.overall>=75 ? `Great! Your attendance is ${data?.overall}%. You're eligible for exams. Keep it up!` : `Your attendance is ${data?.overall}%. You need at least 75% to be eligible. Please attend more classes urgently.`}</p>
                  <div className="ov-stats">
                    {[
                      {n:data?.subjects?.length||0,l:'Subjects'},
                      {n:data?.subjects?.filter(s=>s.percentage>=75).length||0,l:'Safe',c:'#4ade80'},
                      {n:data?.subjects?.filter(s=>s.percentage>=60&&s.percentage<75).length||0,l:'At Risk',c:'#fbbf24'},
                      {n:data?.subjects?.filter(s=>s.percentage<60).length||0,l:'Danger',c:'#f87171'},
                    ].map((s,i)=>(
                      <div key={i} className="ovs"><div className="ovs-n" style={{color:s.c||'#fff'}}>{s.n}</div><div className="ovs-l">{s.l}</div></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="layout">
                <div className="subj-list">
                  {data?.subjects?.map(s=>(
                    <div key={s.subject_id} className={`subj-card${selected?.subject_id===s.subject_id?' active':''}`} onClick={()=>setSelected(s)}>
                      <div className="sj-top">
                        <div><div className="sj-name">{s.subject_name}</div><div className="sj-code">{s.subject_code}</div></div>
                        <span className="stag" style={{color:gc(s.percentage),background:gsbg(s.percentage)}}>{gs(s.percentage)}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="sj-bar" style={{flex:1}}><div className="sj-fill" style={{width:`${s.percentage}%`,background:gc(s.percentage)}}/></div>
                        <span style={{fontSize:13,fontWeight:800,color:gc(s.percentage),width:36,textAlign:'right'}}>{s.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="detail">
                  {!selected ? <div className="no-sel"><div style={{fontSize:36,marginBottom:8}}>👈</div>Select a subject to view details</div> : (
                    <>
                      <div className="dt">{selected.subject_name}</div>
                      <div className="dc">{selected.subject_code}</div>
                      <div className="df">Faculty: {selected.faculty_name}</div>
                      <div className="d-ring-row">
                        <div style={{position:'relative',width:80,height:80,flexShrink:0}}>
                          <svg style={{transform:'rotate(-90deg)'}} width="80" height="80" viewBox="0 0 80 80">
                            <circle fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" cx="40" cy="40" r="32"/>
                            <circle fill="none" stroke={gc(selected.percentage)} strokeWidth="8" strokeLinecap="round"
                              cx="40" cy="40" r="32"
                              strokeDasharray={`${2*Math.PI*32}`}
                              strokeDashoffset={`${2*Math.PI*32*(1-selected.percentage/100)}`}
                            />
                          </svg>
                          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:'1.1rem',fontWeight:800,color:gc(selected.percentage)}}>{selected.percentage}%</span>
                          </div>
                        </div>
                        <div className="d-stats">
                          <div className="ds"><div className="ds-n" style={{color:'#4ade80'}}>{selected.present}</div><div className="ds-l">Present</div></div>
                          <div className="ds"><div className="ds-n" style={{color:'#f87171'}}>{selected.absent}</div><div className="ds-l">Absent</div></div>
                          <div className="ds"><div className="ds-n">{selected.total}</div><div className="ds-l">Total</div></div>
                          <div className="ds"><div className="ds-n" style={{color:gc(selected.percentage),fontSize:'1rem'}}>{gs(selected.percentage)}</div><div className="ds-l">Status</div></div>
                        </div>
                      </div>

                      {selected.records?.length > 0 && (
                        <>
                          <div className="cal-title">Recent Classes ({selected.records.length} total)</div>
                          <div className="cal-grid">
                            {selected.records.slice(0,28).map((r,i)=>(
                              <div key={i} className={`cal-dot ${r.status==='present'?'dot-p':'dot-a'}`} title={r.date}>
                                {r.status==='present'?'✓':'✗'}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
