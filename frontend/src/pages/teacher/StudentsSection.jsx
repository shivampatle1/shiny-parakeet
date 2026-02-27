import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';

// ─── Toast Helper ─────────────────────────────────
function Toast({ msg, type, onHide }) {
    useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [onHide]);
    return <div className={`td-toast ${type}`}>{msg}</div>;
}

// ─── Edit Modal ───────────────────────────────────
function EditModal({ student, onSave, onClose, token }) {
    const [form, setForm] = useState({
        name: student.name || '',
        enrollmentNumber: student.enrollmentNumber || '',
        course: student.course || '',
        studentType: student.studentType || 'Regular',
        group: student.group || '',
        majorSubject: student.majorSubject || '',
        minorSubject: student.minorSubject || '',
        openElective: student.openElective || '',
        cceStatus: student.cceStatus || 'pending',
        status: student.status || 'pending',
    });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const d = await apiFetch(`/teacher/student/${student._id}`, { method: 'PATCH', body: JSON.stringify(form) }, token);
            onSave(d.student);
        } catch (e) { alert(e.message); }
        setSaving(false);
    };

    return (
        <div className="td-modal-overlay">
            <div className="td-modal">
                <h2>✏️ Edit Student — {student.name}</h2>
                <div className="td-modal-form">
                    <div className="td-modal-row">
                        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
                        <div className="form-group"><label>Enrollment No.</label><input value={form.enrollmentNumber} onChange={e => set('enrollmentNumber', e.target.value)} /></div>
                    </div>
                    <div className="td-modal-row">
                        <div className="form-group"><label>Course</label><input value={form.course} onChange={e => set('course', e.target.value)} /></div>
                        <div className="form-group"><label>Group / Stream</label><input value={form.group} onChange={e => set('group', e.target.value)} /></div>
                    </div>
                    <div className="td-modal-row">
                        <div className="form-group"><label>Student Type</label>
                            <select value={form.studentType} onChange={e => set('studentType', e.target.value)}>
                                <option value="Regular">Regular</option>
                                <option value="Private">Private</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Account Status</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div className="td-modal-row">
                        <div className="form-group"><label>Major Subject</label><input value={form.majorSubject} onChange={e => set('majorSubject', e.target.value)} /></div>
                        <div className="form-group"><label>Minor Subject</label><input value={form.minorSubject} onChange={e => set('minorSubject', e.target.value)} /></div>
                    </div>
                    <div className="td-modal-row">
                        <div className="form-group"><label>Open Elective (OE)</label><input value={form.openElective} onChange={e => set('openElective', e.target.value)} /></div>
                        <div className="form-group"><label>CCE Status</label>
                            <select value={form.cceStatus} onChange={e => set('cceStatus', e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="complete">Complete</option>
                                <option value="exempted">Exempted</option>
                            </select>
                        </div>
                    </div>
                    <div className="td-modal-actions">
                        <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────
const StatusBadge = ({ s }) => {
    const map = { approved: ['badge-approved', '✅ Approved'], pending: ['badge-pending', '⏳ Pending'], rejected: ['badge-rejected', '❌ Rejected'] };
    const [cls, label] = map[s] || ['', s];
    return <span className={`badge ${cls}`} style={{ fontSize: '0.7rem' }}>{label}</span>;
};

const CCEBadge = ({ s }) => {
    const map = { complete: '#10b981', pending: '#f59e0b', exempted: '#06b6d4' };
    return <span style={{ fontSize: '0.75rem', color: map[s] || '#94a3b8', fontWeight: 600 }}>{s}</span>;
};

const fileExt = fn => fn?.split('.').pop()?.toUpperCase() || 'FILE';

// ─── MAIN COMPONENT ───────────────────────────────
export default function StudentsSection({ token, onCountChange }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const hideToast = () => setToast(null);

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const d = await apiFetch('/teacher/students', {}, token);
            setStudents(d.students || []);
        } catch (_) { }
        setLoading(false);
    }, [token]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const handleApprove = async (id) => {
        try {
            await apiFetch(`/teacher/approve/${id}`, { method: 'PATCH' }, token);
            setStudents(s => s.map(st => st._id === id ? { ...st, status: 'approved' } : st));
            showToast('Student approved ✅');
            onCountChange?.();
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleDelete = async (student) => {
        try {
            await apiFetch(`/teacher/student/${student._id}`, { method: 'DELETE' }, token);
            setStudents(s => s.filter(st => st._id !== student._id));
            showToast(`${student.name} removed`);
            onCountChange?.();
        } catch (e) { showToast(e.message, 'error'); }
        setConfirmDelete(null);
    };

    const handleSaved = (updated) => {
        setStudents(s => s.map(st => st._id === updated._id ? updated : st));
        setEditing(null);
        showToast('Student updated ✅');
        onCountChange?.();
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.group?.toLowerCase().includes(search.toLowerCase())
    );

    const pending = students.filter(s => s.status === 'pending').length;
    const approved = students.filter(s => s.status === 'approved').length;

    return (
        <div className="td-section">
            {toast && <Toast msg={toast.msg} type={toast.type} onHide={hideToast} />}

            {/* Stats */}
            <div className="td-cards">
                <div className="td-stat-card"><span className="stat-icon">👥</span><div><div className="stat-val">{students.length}</div><div className="stat-lbl">Total Students</div></div></div>
                <div className="td-stat-card"><span className="stat-icon">⏳</span><div><div className="stat-val" style={{ color: '#f59e0b' }}>{pending}</div><div className="stat-lbl">Pending Approval</div></div></div>
                <div className="td-stat-card"><span className="stat-icon">✅</span><div><div className="stat-val" style={{ color: '#10b981' }}>{approved}</div><div className="stat-lbl">Approved</div></div></div>
            </div>

            <div className="td-section-header">
                <div><h1>🎒 Student Management</h1><p>View, approve, edit, and remove students</p></div>
                <input
                    className="td-search"
                    placeholder="🔍 Search by name, enrollment, group…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? <div className="td-empty"><span>⏳</span><p>Loading students…</p></div> :
                filtered.length === 0 ? <div className="td-empty"><span>🔍</span><p>No students found</p></div> : (
                    <div className="td-table-wrap">
                        <table className="td-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Enrollment No.</th>
                                    <th>Type</th>
                                    <th>Group</th>
                                    <th>Major</th>
                                    <th>Minor</th>
                                    <th>OE</th>
                                    <th>CCE</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, i) => (
                                    <tr key={s._id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                                        <td><strong>{s.name}</strong><br /><small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.email}</small></td>
                                        <td><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{s.enrollmentNumber || '—'}</code></td>
                                        <td>{s.studentType || '—'}</td>
                                        <td>{s.group || '—'}</td>
                                        <td>{s.majorSubject || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>{s.minorSubject || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>{s.openElective || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td><CCEBadge s={s.cceStatus || 'pending'} /></td>
                                        <td><StatusBadge s={s.status} /></td>
                                        <td>
                                            <div className="td-action-btns">
                                                {s.status === 'pending' && <button className="td-btn-approve" onClick={() => handleApprove(s._id)}>Approve</button>}
                                                <button className="td-btn-edit" onClick={() => setEditing(s)}>Edit</button>
                                                <button className="td-btn-delete" onClick={() => setConfirmDelete(s)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Edit modal */}
            {editing && <EditModal student={editing} token={token} onSave={handleSaved} onClose={() => setEditing(null)} />}

            {/* Confirm delete */}
            {confirmDelete && (
                <div className="td-modal-overlay">
                    <div className="td-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
                        <h2 style={{ marginBottom: 8 }}>Delete Student?</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                            Are you sure you want to remove <strong>{confirmDelete.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="td-modal-actions" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }} onClick={() => handleDelete(confirmDelete)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
