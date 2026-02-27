import React, { useState, useEffect, useCallback } from 'react';

const BASE_API = `${import.meta.env.VITE_API_URL}/api`;
const BASE_UPLOADS = `${import.meta.env.VITE_API_URL}/uploads`;

function Toast({ msg, type, onHide }) {
    useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [onHide]);
    return <div className={`td-toast ${type}`}>{msg}</div>;
}

function formatBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}
function fileIcon(fn) {
    const ext = fn?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['ppt', 'pptx'].includes(ext)) return '📊';
    if (['xls', 'xlsx'].includes(ext)) return '📈';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar'].includes(ext)) return '📦';
    return '📁';
}

const STATUS_CFG = {
    pending: { color: '#f59e0b', label: '⏳ Pending' },
    approved: { color: '#10b981', label: '✅ Approved' },
    rejected: { color: '#ef4444', label: '❌ Rejected' },
};

// ─── Resolve Modal (approve/reject request) ───────
function ResolveModal({ request, onClose, onDone, token }) {
    const [action, setAction] = useState('approved');
    const [rejectionReason, setRejectionReason] = useState('');
    const [sharedText, setSharedText] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('status', action);
        if (action === 'rejected') formData.append('rejectionReason', rejectionReason);
        if (action === 'approved') {
            if (sharedText) formData.append('sharedText', sharedText);
            if (file) formData.append('file', file);
        }
        try {
            const res = await fetch(`${BASE_API}/teacher/material-requests/${request._id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            onDone(d.message);
        } catch (e) { alert(e.message); }
        setLoading(false);
    };

    return (
        <div className="td-modal-overlay">
            <div className="td-modal">
                <h2>📋 Respond to Material Request</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                    <strong>{request.studentId?.name}</strong> requested: <em>{request.topic}</em>
                </p>
                {request.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>{request.description}</p>}

                <div className="td-modal-form">
                    {/* Approve / Reject toggle */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setAction('approved')}
                            style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${action === 'approved' ? '#10b981' : 'var(--border)'}`, background: action === 'approved' ? 'rgba(16,185,129,0.15)' : 'transparent', color: action === 'approved' ? '#6ee7b7' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>
                            ✅ Approve
                        </button>
                        <button onClick={() => setAction('rejected')}
                            style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${action === 'rejected' ? '#ef4444' : 'var(--border)'}`, background: action === 'rejected' ? 'rgba(239,68,68,0.15)' : 'transparent', color: action === 'rejected' ? '#fca5a5' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>
                            ❌ Reject
                        </button>
                    </div>

                    {action === 'rejected' && (
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Rejection Reason *</label>
                            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
                                placeholder="Explain why the request is rejected…"
                                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Inter' }} />
                        </div>
                    )}

                    {action === 'approved' && (
                        <>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Text Response (optional)</label>
                                <textarea value={sharedText} onChange={e => setSharedText(e.target.value)} rows={3}
                                    placeholder="Type notes, links, or explanation here…"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'Inter' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Attach File (optional)</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '2px dashed var(--border)', borderRadius: 8, cursor: 'pointer', background: 'rgba(108,62,184,0.05)' }}>
                                    <input type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                                    <span>📎</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{file ? file.name : 'Click to attach a file'}</span>
                                </label>
                            </div>
                        </>
                    )}

                    <div className="td-modal-actions">
                        <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || (action === 'rejected' && !rejectionReason.trim())}>
                            {loading ? 'Sending…' : `Send ${action === 'approved' ? 'Approval' : 'Rejection'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MaterialsSection({ token }) {
    const [tab, setTab] = useState('uploads');
    const [materials, setMaterials] = useState([]);
    const [requests, setRequests] = useState([]);
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [targetType, setTargetType] = useState('all');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [resolving, setResolving] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const hideToast = () => setToast(null);

    const loadMaterials = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_API}/teacher/uploads`, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await res.json();
            setMaterials(d.materials || []);
        } catch (_) { }
    }, [token]);

    const loadRequests = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_API}/teacher/material-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await res.json();
            setRequests(d.requests || []);
        } catch (_) { }
    }, [token]);

    const loadStudentsAndGroups = useCallback(async () => {
        try {
            const [sRes, gRes] = await Promise.all([
                fetch(`${BASE_API}/teacher/students`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${BASE_API}/teacher/groups`, { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);
            const [sD, gD] = await Promise.all([sRes.json(), gRes.json()]);
            setStudents(sD.students || []);
            setGroups(gD.groups || []);
        } catch (_) { }
    }, [token]);

    useEffect(() => { loadMaterials(); loadRequests(); loadStudentsAndGroups(); }, [loadMaterials, loadRequests, loadStudentsAndGroups]);

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const toggleGroup = (g) => setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    const toggleStudent = (id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleUpload = async () => {
        if (!file) return showToast('Please select a file', 'error');
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('targetType', targetType);
        if (targetType === 'group') formData.append('targetGroups', JSON.stringify(selectedGroups));
        if (targetType === 'students') formData.append('targetStudents', JSON.stringify(selectedStudents));

        try {
            const res = await fetch(`${BASE_API}/teacher/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            showToast(`${file.name} uploaded ✅`);
            setFile(null); setTitle(''); setTargetType('all');
            setSelectedGroups([]); setSelectedStudents([]);
            document.getElementById('mat-file-input').value = '';
            loadMaterials();
        } catch (e) { showToast(e.message, 'error'); }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${BASE_API}/teacher/uploads/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            setMaterials(m => m.filter(x => x._id !== id));
            showToast('File deleted');
        } catch (e) { showToast(e.message, 'error'); }
    };

    return (
        <div className="td-section">
            {toast && <Toast msg={toast.msg} type={toast.type} onHide={hideToast} />}
            {resolving && <ResolveModal request={resolving} token={token} onClose={() => setResolving(null)}
                onDone={(msg) => { showToast(msg); setResolving(null); loadRequests(); }} />}

            <div className="td-section-header">
                <div><h1>📁 Study Materials</h1><p>Upload, target, and respond to material requests</p></div>
            </div>

            <div className="td-tabs">
                <button className={`td-tab ${tab === 'uploads' ? 'active' : ''}`} onClick={() => setTab('uploads')}>⬆️ Upload Materials</button>
                <button className={`td-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
                    📬 Student Requests {pendingCount > 0 && <span className="td-nav-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
                </button>
                <button className={`td-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>📚 All Uploads ({materials.length})</button>
            </div>

            {/* ── UPLOAD TAB ─────────────────────────── */}
            {tab === 'uploads' && (
                <div className="td-form-card">
                    <h3>⬆️ Upload New File</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>File Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Notes — Physics"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%', fontFamily: 'Inter' }} />
                        </div>

                        {/* File picker */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Select File (max 20 MB)</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '14px 18px', border: '2px dashed var(--border)', borderRadius: 10, background: 'rgba(108,62,184,0.05)' }}>
                                <input id="mat-file-input" type="file" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); if (!title) setTitle(e.target.files[0]?.name || ''); }} />
                                <span style={{ fontSize: '1.5rem' }}>📎</span>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>{file ? file.name : 'Click to choose a file'}</strong>
                                    <small style={{ color: 'var(--text-muted)' }}>{file ? formatBytes(file.size) : 'PDF, DOCX, PPTX, images, etc.'}</small>
                                </div>
                            </label>
                        </div>

                        {/* Target selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Share With</label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                {[['all', '🌐 All Students'], ['group', '👥 Specific Groups'], ['students', '🎒 Specific Students']].map(([val, lbl]) => (
                                    <button key={val} onClick={() => { setTargetType(val); setSelectedGroups([]); setSelectedStudents([]); }}
                                        style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${targetType === val ? 'var(--primary)' : 'var(--border)'}`, background: targetType === val ? 'rgba(108,62,184,0.2)' : 'transparent', color: targetType === val ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                                        {lbl}
                                    </button>
                                ))}
                            </div>

                            {targetType === 'group' && groups.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {groups.map(g => (
                                        <button key={g} onClick={() => toggleGroup(g)}
                                            style={{ padding: '5px 12px', borderRadius: 50, fontSize: '0.78rem', fontWeight: 600, border: `1.5px solid ${selectedGroups.includes(g) ? 'var(--primary)' : 'var(--border)'}`, background: selectedGroups.includes(g) ? 'rgba(108,62,184,0.25)' : 'transparent', color: selectedGroups.includes(g) ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer' }}>
                                            {selectedGroups.includes(g) ? '✓ ' : ''}{g}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {targetType === 'students' && (
                                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {students.filter(s => s.status === 'approved').map(s => (
                                        <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selectedStudents.includes(s._id) ? 'rgba(108,62,184,0.15)' : 'transparent', transition: 'background 0.15s' }}>
                                            <input type="checkbox" checked={selectedStudents.includes(s._id)} onChange={() => toggleStudent(s._id)} style={{ accentColor: 'var(--primary)' }} />
                                            <span style={{ fontSize: '0.85rem' }}>{s.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.group}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleUpload} disabled={uploading || !file}>
                            {uploading ? 'Uploading…' : '📤 Upload & Share'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── REQUESTS TAB ───────────────────────── */}
            {tab === 'requests' && (
                requests.length === 0 ? (
                    <div className="td-empty"><span>📭</span><p>No material requests yet</p></div>
                ) : (
                    <div className="td-table-wrap">
                        <table className="td-table">
                            <thead>
                                <tr>
                                    <th>#</th><th>Student</th><th>Enrollment</th><th>Group</th><th>Topic</th><th>Description</th><th>Status</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r, i) => (
                                    <tr key={r._id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                                        <td><strong>{r.studentId?.name || '—'}</strong></td>
                                        <td><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{r.studentId?.enrollmentNumber || '—'}</code></td>
                                        <td>{r.studentId?.group || '—'}</td>
                                        <td><strong>{r.topic}</strong></td>
                                        <td style={{ maxWidth: 200, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.description || '—'}</td>
                                        <td><span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_CFG[r.status]?.color }}>{STATUS_CFG[r.status]?.label}</span></td>
                                        <td>
                                            {r.status === 'pending' && (
                                                <button className="td-btn-edit" onClick={() => setResolving(r)}>Respond</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* ── UPLOADS LIST TAB ───────────────────── */}
            {tab === 'list' && (
                materials.length === 0 ? (
                    <div className="td-empty"><span>📭</span><p>No files uploaded yet</p></div>
                ) : (
                    <div className="td-file-list">
                        {materials.map(m => (
                            <div key={m._id} className="td-file-item">
                                <span className="td-file-icon">{fileIcon(m.filename)}</span>
                                <div className="td-file-meta">
                                    <strong>{m.title || m.originalName}</strong>
                                    <small>
                                        {formatBytes(m.size)} • {new Date(m.createdAt || m.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} •{' '}
                                        <span style={{ color: m.targetType === 'all' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                            {m.targetType === 'all' ? '🌐 All' : m.targetType === 'group' ? `👥 ${m.targetGroups?.join(', ')}` : `🎒 ${m.targetStudents?.length} students`}
                                        </span>
                                    </small>
                                </div>
                                <a href={`${BASE_UPLOADS}/${m.filename}`} download target="_blank" rel="noreferrer"
                                    style={{ padding: '6px 12px', background: 'rgba(108,62,184,0.2)', border: '1px solid rgba(108,62,184,0.4)', borderRadius: 6, color: 'var(--primary-light)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                                    ⬇ Download
                                </a>
                                <button onClick={() => handleDelete(m._id)}
                                    style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 6, color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
