'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'CSE',
    roll_no: '',
    year: '1',
    semester: '1',
    section: 'A'
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const semOptions = form.year ? [(parseInt(form.year)-1)*2+1, (parseInt(form.year)-1)*2+2] : [1, 2];

  const loadUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'admin') { router.push('/login'); return; }

    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam) {
      setFilterRole(roleParam);
    }

    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      showToast(`✅ Deleted user: ${name}`);
      loadUsers();
    } else {
      const d = await res.json();
      showToast(`❌ Delete failed: ${d.error}`);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    // Clean fields before submit
    const submitData = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: ['principal', 'admin'].includes(form.role) ? null : form.department,
    };

    if (form.role === 'student') {
      submitData.roll_no = form.roll_no;
      submitData.year = form.year;
      submitData.semester = form.semester;
      submitData.section = form.section;
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    });

    if (res.ok) {
      showToast('✅ User created successfully!');
      setShowAddForm(false);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: 'CSE',
        roll_no: '',
        year: '1',
        semester: '1',
        section: 'A'
      });
      loadUsers();
    } else {
      const d = await res.json();
      showToast(`❌ Error: ${d.error}`);
    }
    setSubmitting(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.roll_no && u.roll_no.toLowerCase().includes(search.toLowerCase())) ||
                        (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .page-title{font-size:1.5rem;font-weight:800;margin-bottom:.3rem;display:flex;align-items:center;justify-content:space-between;color:#0d2340}
        .page-sub{font-size:13.5px;color:#64748b;margin-bottom:1.5rem}

        .toolbar{display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
        .sb-box{position:relative;flex:1;max-width:320px}
        .sb-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none;line-height:0}
        .sb-inp{width:100%;height:42px;padding:0 14px 0 40px;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s;font-weight:500}
        .sb-inp:focus{border-color:#0d2340;background:#ffffff}
        .fb{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
        .fb.on{background:#0d2340;color:#ffffff;box-shadow:0 2px 8px rgba(13,35,64,.15)}
        .fb.off{background:#ffffff;color:#64748b;border:1px solid #e2e8f0}
        .fb.off:hover{background:#f1f5f9;color:#0d2340}
        
        .add-btn{padding:8px 16px;background:#0d2340;border:none;border-radius:10px;color:#ffffff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 12px rgba(13,35,64,.15)}
        .add-btn:hover{background:#d9232d}

        .tbl-wrap{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        table{width:100%;border-collapse:collapse}
        thead th{padding:10px 14px;text-align:left;font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s}
        tbody tr:hover{background:#f8fafc}
        tbody td{padding:11px 14px;font-size:13.5px;color:#334155}
        .av{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;background:#0d2340!important;color:#ffffff!important}
        .nc{display:flex;align-items:center;gap:10px}
        .nm{font-weight:800;color:#0d2340}
        .em{font-size:11.5px;color:#64748b;margin-top:1px}
        .badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase}
        
        .del-btn{background:none;border:none;color:#dc2626;cursor:pointer;padding:6px;border-radius:6px;font-weight:700;font-size:12px;transition:all .2s}
        .del-btn:hover{background:#fee2e2}

        /* Form Modal */
        .modal-overlay{position:fixed;inset:0;background:rgba(13,35,64,.4);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:150}
        .modal{background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:2rem;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,0.15)}
        .modal-t{font-size:1.3rem;font-weight:800;margin-bottom:1.2rem;color:#0d2340}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{display:flex;flex-direction:column;gap:5px;margin-bottom:1rem}
        .field.full{grid-column:1 / -1}
        .label{font-size:11.5px;font-weight:700;color:#0d2340;text-transform:uppercase}
        .inp, .sel{width:100%;height:44px;padding:0 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:9px;color:#0d2340;font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s;font-weight:500}
        .inp:focus, .sel:focus{border-color:#0d2340;background:#ffffff}
        .modal-btns{display:flex;justify-content:flex-end;gap:10px;margin-top:1rem}
        .btn-c{height:44px;padding:0 18px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:9px;color:#475569;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-s{height:44px;padding:0 22px;background:#0d2340;border:none;border-radius:9px;color:#fff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(13,35,64,.2)}
        .btn-s:disabled{opacity:.5}

        .toast{position:fixed;bottom:2rem;right:2rem;z-index:200;background:#0d2340;border:1px solid #1e293b;border-radius:12px;padding:13px 18px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.2);animation:si .3s ease}
        @keyframes si{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
        .skel{background:#f1f5f9;border-radius:8px;animation:sh 1.5s infinite;margin-bottom:8px}
        @media(max-width:768px){.main{padding:1.2rem;padding-bottom:80px}.tbl-wrap{overflow-x:auto}}
      `}</style>
      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="page-title">
            <span>👥 User Administration</span>
            <button className="add-btn" onClick={() => setShowAddForm(true)}>+ Add New User</button>
          </div>
          <div className="page-sub">Manage system access roles, departments, and credentials</div>

          <div className="toolbar">
            <div className="sb-box">
              <span className="sb-ico">🔍</span>
              <input className="sb-inp" placeholder="Search name, email, roll no..."
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            {['all', 'student', 'class_teacher', 'hod', 'principal', 'admin'].map(r => (
              <button key={r} className={`fb ${filterRole === r ? 'on' : 'off'}`} onClick={() => setFilterRole(r)}>
                {r === 'all' ? 'All Roles' : r === 'class_teacher' ? 'Teachers' : r.toUpperCase()}
              </button>
            ))}
            <div style={{marginLeft:'auto',fontSize:13,color:'rgba(255,255,255,.3)'}}>Showing {filtered.length} users</div>
          </div>

          <div className="tbl-wrap">
            {loading ? <div style={{padding:20}}>{[1,2,3,4,5].map(i=><div key={i} className="skel" style={{height:40}}/>)}</div> :
             filtered.length === 0 ? <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No users found</div> :
             (
               <table>
                 <thead>
                   <tr>
                     <th>Name &amp; Email</th>
                     <th>Role</th>
                     <th>Department</th>
                     <th>Student Details</th>
                     <th>Created At</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filtered.map(u => {
                     const initials = u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'US';
                     const roleColors = {student:'#60a5fa', class_teacher:'#4ade80', hod:'#fbbf24', principal:'#a78bfa', admin:'#f87171'};
                     const roleColor = roleColors[u.role] || '#fff';
                     return (
                       <tr key={u.id}>
                         <td>
                           <div className="nc">
                             <div className="av" style={{background:`${roleColor}18`,color:roleColor}}>{initials}</div>
                             <div>
                               <div className="nm">{u.name}</div>
                               <div className="em">{u.email}</div>
                             </div>
                           </div>
                         </td>
                         <td>
                           <span className="badge" style={{color:roleColor,background:`${roleColor}12`}}>
                             {u.role==='class_teacher'?'Teacher':u.role}
                           </span>
                         </td>
                         <td style={{fontWeight:700}}>{u.department || '—'}</td>
                         <td>
                           {u.role === 'student' ? (
                             <span style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>
                               Roll: <strong>{u.roll_no}</strong> · Yr: <strong>{u.year}</strong> · Sec: <strong>{u.section}</strong>
                             </span>
                           ) : '—'}
                         </td>
                         <td>{new Date(u.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</td>
                         <td>
                           {u.role !== 'admin' && (
                             <button className="del-btn" onClick={() => handleDelete(u.id, u.name)}>🗑️ Delete</button>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             )}
          </div>
        </main>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-t">➕ Register New System User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-grid">
                <div className="field full">
                  <label className="label">Full Name</label>
                  <input className="inp" required value={form.name} placeholder="e.g. John Doe"
                    onChange={e => setForm({...form, name: e.target.value})}/>
                </div>
                <div className="field">
                  <label className="label">Email Address</label>
                  <input className="inp" type="email" required value={form.email} placeholder="name@lendi.edu.in"
                    onChange={e => setForm({...form, email: e.target.value})}/>
                </div>
                <div className="field">
                  <label className="label">Password</label>
                  <input className="inp" type="password" required value={form.password} placeholder="Minimum 8 characters"
                    onChange={e => setForm({...form, password: e.target.value})}/>
                </div>
                <div className="field">
                  <label className="label">System Role</label>
                  <select className="sel" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="student">Student</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="hod">HOD</option>
                    <option value="principal">Principal</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                {!['principal', 'admin'].includes(form.role) && (
                  <div className="field">
                    <label className="label">Department</label>
                    <select className="sel" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="IT">IT</option>
                      <option value="AIDS">AIDS</option>
                      <option value="AIML">AIML</option>
                      <option value="DS">DS</option>
                      <option value="CSBS">CSBS</option>
                      <option value="CSIT">CSIT</option>
                    </select>
                  </div>
                )}

                {form.role === 'student' && (
                  <>
                    <div className="field">
                      <label className="label">Roll Number</label>
                      <input className="inp" required value={form.roll_no} placeholder="e.g. 21KD1A0501"
                        onChange={e => setForm({...form, roll_no: e.target.value})}/>
                    </div>
                    <div className="field">
                      <label className="label">Year</label>
                      <select className="sel" value={form.year} onChange={e => {
                        const y = e.target.value;
                        const firstSem = (parseInt(y)-1)*2+1;
                        setForm({...form, year: y, semester: String(firstSem)});
                      }}>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="label">Semester</label>
                      <select className="sel" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                        {semOptions.map(s => (
                          <option key={s} value={String(s)}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label">Section</label>
                      <select className="sel" value={form.section} onChange={e => setForm({...form, section: e.target.value})}>
                        <option value="A">A Section</option>
                        <option value="B">B Section</option>
                        <option value="C">C Section</option>
                        <option value="D">D Section</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-btns">
                <button type="button" className="btn-c" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-s" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
