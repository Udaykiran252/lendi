'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function SecurityDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [stats, setStats] = useState({ activeApproved: 0, currentlyOut: 0, exitedToday: 0, returnedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  // Camera QR Scanner states
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/security/outpasses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setOutpasses(d.outpasses || []);
        setStats(d.stats || { activeApproved: 0, currentlyOut: 0, exitedToday: 0, returnedToday: 0 });
      }
    } catch (err) {
      console.error('Failed to load security outpasses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['security', 'gate_staff', 'admin'].includes(parsed.role)) {
      router.push('/login');
      return;
    }
    setUser(parsed);
    loadData();
    const interval = setInterval(loadData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [router, loadData]);

  // Handle manual / QR lookup
  const handleVerify = async (outpassId, action) => {
    if (!outpassId) return;
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ outpass_id: outpassId, action })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Action processed successfully!', 'ok');
        setSelectedPass(null);
        setPasscodeInput('');
        loadData();
      } else {
        showToast(data.error || 'Verification failed', 'err');
      }
    } catch (err) {
      console.error('Verify error:', err);
      showToast('Server connection error', 'err');
    } finally {
      setVerifying(false);
    }
  };

  // Lookup pass details by ID or code
  const lookupPass = async (idOrCode) => {
    if (!idOrCode) return;
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ outpass_id: idOrCode, action: 'lookup' })
      });
      const data = await res.json();
      if (res.ok && data.outpass) {
        setSelectedPass(data.outpass);
        showToast(`Pass #${data.outpass.id} found for ${data.outpass.student_name}`, 'ok');
      } else {
        showToast(data.error || 'Outpass not found or not fully approved', 'err');
      }
    } catch (err) {
      showToast('Lookup failed', 'err');
    } finally {
      setVerifying(false);
    }
  };

  // Camera QR Scanner logic
  const startCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(scanCanvas);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      showToast('Camera access permission denied or unavailable', 'err');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const scanCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simple QR pattern scan simulation/fallback if jsQR is loaded or BarcodeDetector API exists
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        barcodeDetector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) {
            const qrText = barcodes[0].rawValue;
            stopCamera();
            const match = qrText.match(/Outpass ID\s*:\s*#?(\d+)/i) || qrText.match(/#?(\d+)/);
            if (match) lookupPass(match[1]);
            else showToast('Scanned QR Payload: ' + qrText, 'ok');
          }
        }).catch(() => {});
      }
    }
    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(scanCanvas);
    }
  };

  const filteredOutpasses = outpasses.filter(o => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      o.student_name?.toLowerCase().includes(q) ||
      o.roll_no?.toLowerCase().includes(q) ||
      o.destination?.toLowerCase().includes(q) ||
      o.id?.toString().includes(q) ||
      o.department?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0d2340}
        .root{display:flex;min-height:100vh}
        .main{flex:1;padding:2rem 2.5rem;overflow-y:auto;background:#f8fafc}
        .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .title{font-size:1.55rem;font-weight:800;letter-spacing:-.4px;color:#0d2340}
        .title span{color:#2563eb}
        .sub{font-size:13.5px;color:#64748b;margin-top:3px;font-weight:500}

        /* Gate Scanner Bar */
        .scanner-card{
          background:#ffffff;border:1px solid #93c5fd;border-top:3px solid #2563eb;
          border-radius:18px;padding:1.5rem;margin-bottom:2rem;
          box-shadow:0 4px 20px rgba(37,99,235,0.06);
        }
        .scanner-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:12px}
        .scanner-title{font-size:15px;font-weight:800;color:#0d2340;display:flex;align-items:center;gap:8px}
        .scanner-box{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .inp-code{
          flex:1;min-width:240px;height:46px;padding:0 16px;
          background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;
          color:#0d2340;font-size:14px;font-weight:700;outline:none;
          transition:all .2s;font-family:monospace;
        }
        .inp-code:focus{border-color:#2563eb;background:#ffffff;box-shadow:0 0 0 3px rgba(37,99,235,0.15)}
        .btn-scan{
          height:46px;padding:0 20px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;
          font-size:13.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;
          transition:all .2s;box-shadow:0 4px 12px rgba(37,99,235,0.2);
        }
        .btn-scan:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(37,99,235,0.3)}

        /* Camera Box */
        .cam-box{
          position:relative;width:100%;max-width:480px;margin:1rem auto 0;
          background:#000000;border-radius:16px;overflow:hidden;border:2px solid #2563eb;
        }
        .cam-video{width:100%;height:280px;object-fit:cover;display:block}
        .cam-overlay{
          position:absolute;inset:0;border:2px dashed rgba(59,130,246,0.8);
          margin:30px;border-radius:12px;pointer-events:none;
          display:flex;align-items:center;justify-content:center;
          color:#ffffff;font-size:12px;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.8);
        }
        .btn-cam-close{
          position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.6);color:#fff;
          border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-weight:800;
        }

        /* Stats Grid */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:2rem}
        .sc{background:#ffffff;border:1px solid #93c5fd;border-top:3px solid #2563eb;border-radius:16px;padding:1.3rem;transition:all .2s;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .sc:hover{border-color:#2563eb;transform:translateY(-2px);box-shadow:0 8px 20px rgba(37,99,235,0.12)}
        .sc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem}
        .sc-ico{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px}
        .sc-val{font-size:1.9rem;font-weight:800;color:#0d2340;line-height:1;margin-bottom:3px}
        .sc-lbl{font-size:12.5px;color:#64748b;font-weight:500}
        .tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px}

        /* Table & List */
        .panel{background:#ffffff;border:1px solid #93c5fd;border-top:3px solid #2563eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03)}
        .ph{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.4rem;border-bottom:1.5px solid #dbeafe;background:#ffffff;flex-wrap:wrap;gap:12px}
        .pt{font-size:15px;font-weight:800;color:#0d2340;display:flex;align-items:center;gap:8px}
        .sb-box{position:relative;width:280px}
        .sb-inp{width:100%;height:38px;padding:0 12px 0 34px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;color:#0d2340;font-size:13px;outline:none;font-family:inherit}
        .sb-inp:focus{border-color:#2563eb;background:#ffffff}
        .sb-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#64748b;font-size:13px}

        .tbl-wrap{width:100%;overflow-x:auto}
        table{width:100%;border-collapse:collapse}
        thead th{padding:12px 16px;text-align:left;font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
        tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s}
        tbody tr:hover{background:#f8fafc}
        tbody td{padding:13px 16px;font-size:13.5px;color:#334155}

        .st-badge{font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:5px}
        .btn-action{padding:7px 14px;border-radius:9px;font-size:12.5px;font-weight:700;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
        .btn-exit{background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd}
        .btn-exit:hover{background:#2563eb;color:#ffffff}
        .btn-entry{background:#dcfce7;color:#15803d;border:1px solid #86efac}
        .btn-entry:hover{background:#16a34a;color:#ffffff}

        /* Modal Popup */
        .modal-bg{position:fixed;inset:0;z-index:200;background:rgba(13,35,64,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:1.5rem}
        .modal-card{width:100%;max-width:520px;background:#ffffff;border:1px solid #93c5fd;border-top:4px solid #2563eb;border-radius:20px;padding:2rem;box-shadow:0 20px 50px rgba(0,0,0,0.15);animation:fadeUp .3s ease}
        .modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.2rem}
        .modal-title{font-size:1.3rem;font-weight:800;color:#0d2340}
        .modal-sub{font-size:12.5px;color:#64748b;margin-top:2px}
        .modal-close{background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer}
        .pass-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:1.5rem}
        .info-lbl{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase}
        .info-val{font-size:13.5px;font-weight:800;color:#0d2340;margin-top:2px}

        .toast{position:fixed;bottom:2rem;right:2rem;z-index:300;padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:700;color:#ffffff;box-shadow:0 10px 30px rgba(0,0,0,0.2)}
        .toast.ok{background:#0d2340;border:1px solid #2563eb}
        .toast.err{background:#dc2626;border:1px solid #fca5a5}
        .empty{text-align:center;padding:3rem;color:#94a3b8;font-size:13.5px}

        @media(max-width:900px){.stats{grid-template-columns:1fr 1fr}.main{padding:1.2rem;padding-bottom:80px}}
      `}</style>

      {toast.msg && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="root">
        <Sidebar />
        <main className="main">
          <div className="topbar">
            <div>
              <div className="title">🛡️ Security Gate Monitor — <span>Main Campus</span></div>
              <div className="sub">Live Verification Portal · Strictly Fully Approved Active Outpasses</div>
            </div>
            <div style={{fontSize:12.5,fontWeight:700,color:'#2563eb',background:'rgba(37,99,235,0.1)',padding:'8px 14px',borderRadius:10,border:'1px solid #93c5fd'}}>
              🔒 Security Guard: {user?.name || 'Gate Guard'}
            </div>
          </div>

          {/* Quick Scanner & Verification Bar */}
          <div className="scanner-card">
            <div className="scanner-header">
              <div className="scanner-title">
                <span>📷 Gate Pass QR & Passcode Scanner</span>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:'#64748b'}}>
                Enter Outpass ID / Scan Student Pass QR
              </div>
            </div>

            <div className="scanner-box">
              <input
                className="inp-code"
                placeholder="Enter Outpass ID (e.g. 104)..."
                value={passcodeInput}
                onChange={e => setPasscodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') lookupPass(passcodeInput); }}
              />
              <button className="btn-scan" onClick={() => lookupPass(passcodeInput)} disabled={verifying}>
                🔍 Verify Pass ID
              </button>
              <button className="btn-scan" style={{background: scanning ? '#dc2626' : '#0d2340'}} onClick={scanning ? stopCamera : startCamera}>
                {scanning ? '🛑 Stop Camera' : '📷 Scan QR Code'}
              </button>
            </div>

            {/* Live Camera Box */}
            {scanning && (
              <div className="cam-box">
                <video ref={videoRef} className="cam-video" playsInline muted />
                <canvas ref={canvasRef} style={{display:'none'}} />
                <div className="cam-overlay">Align QR Code within frame</div>
                <button className="btn-cam-close" onClick={stopCamera}>✕</button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="stats">
            {[
              { ico: '🎫', label: 'Active Approved Passes', val: loading ? '…' : stats.activeApproved, bg: 'rgba(37,99,235,.1)', tagColor: '#2563eb', tagBg: 'rgba(37,99,235,.1)', tagLabel: 'Valid Today' },
              { ico: '🚶', label: 'Currently Out of Campus', val: loading ? '…' : stats.currentlyOut, bg: 'rgba(217,119,6,.1)', tagColor: '#d97706', tagBg: 'rgba(217,119,6,.1)', tagLabel: 'Out at Gate' },
              { ico: '🚪', label: 'Gate Exits Logged Today', val: loading ? '…' : stats.exitedToday, bg: 'rgba(147,51,234,.1)', tagColor: '#9333ea', tagBg: 'rgba(147,51,234,.1)', tagLabel: 'Exited Today' },
              { ico: '🏠', label: 'Campus Returns Logged', val: loading ? '…' : stats.returnedToday, bg: 'rgba(22,163,74,.1)', tagColor: '#16a34a', tagBg: 'rgba(22,163,74,.1)', tagLabel: 'Returned Today' },
            ].map((s, i) => (
              <div key={i} className="sc">
                <div className="sc-top">
                  <div className="sc-ico" style={{ background: s.bg }}>{s.ico}</div>
                  <span className="tag" style={{ color: s.tagColor, background: s.tagBg }}>{s.tagLabel}</span>
                </div>
                <div className="sc-val">{s.val}</div>
                <div className="sc-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Active Outpasses Panel */}
          <div className="panel">
            <div className="ph">
              <div className="pt">
                <span>📋 Active Approved Gate Passes ({filteredOutpasses.length})</span>
              </div>
              <div className="sb-box">
                <span className="sb-ico">🔍</span>
                <input
                  className="sb-inp"
                  placeholder="Search name, roll no, destination..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="tbl-wrap">
              {loading ? (
                <div className="empty">Loading active gate passes…</div>
              ) : filteredOutpasses.length === 0 ? (
                <div className="empty">
                  🛡️ No active fully-approved outpasses at gate.<br/>
                  <span style={{fontSize:12,color:'#94a3b8'}}>Expired and completed past outpasses are strictly hidden.</span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Outpass ID</th>
                      <th>Student Details</th>
                      <th>Destination & Reason</th>
                      <th>Validity & Timings</th>
                      <th>Approval Status</th>
                      <th>Gate Log Status</th>
                      <th>Gate Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutpasses.map(op => {
                      const isOut = op.exit_time && !op.entry_time;
                      return (
                        <tr key={op.id}>
                          <td style={{fontWeight:800,fontFamily:'monospace',color:'#0d2340'}}>#{op.id}</td>
                          <td>
                            <div style={{fontWeight:800,color:'#0d2340'}}>{op.student_name}</div>
                            <div style={{fontSize:12,color:'#64748b',fontFamily:'monospace'}}>Roll: {op.roll_no || 'N/A'} · {op.department}</div>
                          </td>
                          <td>
                            <div style={{fontWeight:700,color:'#0d2340'}}>📍 {op.destination}</div>
                            <div style={{fontSize:12,color:'#64748b'}}>{op.reason}</div>
                          </td>
                          <td>
                            <div style={{fontSize:12.5,fontWeight:600}}>📅 {op.from_date} to {op.to_date}</div>
                            <div style={{fontSize:11.5,color:'#64748b'}}>⏰ {op.from_time || 'N/A'} – {op.to_time || 'N/A'}</div>
                          </td>
                          <td>
                            <span className="st-badge" style={{background:'rgba(22,163,74,0.12)',color:'#16a34a'}}>
                              ✅ 3-Level Approved
                            </span>
                          </td>
                          <td>
                            {isOut ? (
                              <span className="st-badge" style={{background:'rgba(217,119,6,0.12)',color:'#d97706'}}>
                                🚶 Out since {new Date(op.exit_time).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
                              </span>
                            ) : (
                              <span className="st-badge" style={{background:'rgba(37,99,235,0.12)',color:'#2563eb'}}>
                                ⏳ Waiting Gate Exit
                              </span>
                            )}
                          </td>
                          <td>
                            {!op.exit_time ? (
                              <button className="btn-action btn-exit" onClick={() => handleVerify(op.id, 'exit')}>
                                🚪 Log Exit
                              </button>
                            ) : !op.entry_time ? (
                              <button className="btn-action btn-entry" onClick={() => handleVerify(op.id, 'entry')}>
                                🏠 Log Entry
                              </button>
                            ) : (
                              <span style={{fontSize:12,color:'#16a34a',fontWeight:700}}>✅ Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Modal Popup for Scanned / Selected Pass */}
          {selectedPass && (
            <div className="modal-bg">
              <div className="modal-card">
                <div className="modal-head">
                  <div>
                    <div className="modal-title">🛡️ Gate Pass Verification</div>
                    <div className="modal-sub">Outpass #{selectedPass.id} · Fully Approved</div>
                  </div>
                  <button className="modal-close" onClick={() => setSelectedPass(null)}>✕</button>
                </div>

                <div className="pass-info-grid">
                  <div>
                    <div className="info-lbl">Student Name</div>
                    <div className="info-val">{selectedPass.student_name}</div>
                  </div>
                  <div>
                    <div className="info-lbl">Roll Number</div>
                    <div className="info-val">{selectedPass.roll_no || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="info-lbl">Department & Class</div>
                    <div className="info-val">{selectedPass.department} · Yr {selectedPass.year||3}-{selectedPass.section||'A'}</div>
                  </div>
                  <div>
                    <div className="info-lbl">Destination</div>
                    <div className="info-val">📍 {selectedPass.destination}</div>
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <div className="info-lbl">Reason</div>
                    <div className="info-val">{selectedPass.reason}</div>
                  </div>
                  <div>
                    <div className="info-lbl">Valid Date</div>
                    <div className="info-val">{selectedPass.from_date}</div>
                  </div>
                  <div>
                    <div className="info-lbl">Time Window</div>
                    <div className="info-val">{selectedPass.from_time} – {selectedPass.to_time}</div>
                  </div>
                </div>

                <div style={{display:'flex',gap:12}}>
                  {!selectedPass.exit_time ? (
                    <button className="btn-action btn-exit" style={{flex:1,height:46,justifyContent:'center',fontSize:14}} onClick={() => handleVerify(selectedPass.id, 'exit')}>
                      🚪 Confirm Gate Exit
                    </button>
                  ) : !selectedPass.entry_time ? (
                    <button className="btn-action btn-entry" style={{flex:1,height:46,justifyContent:'center',fontSize:14}} onClick={() => handleVerify(selectedPass.id, 'entry')}>
                      🏠 Confirm Gate Return (Entry)
                    </button>
                  ) : (
                    <div style={{width:'100%',textAlign:'center',padding:12,background:'#dcfce7',color:'#16a34a',borderRadius:12,fontWeight:800}}>
                      ✅ Pass Completed & Closed
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
