import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';

function Toast({ msg, type, onHide }) {
    useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [onHide]);
    return <div className={`td-toast ${type}`}>{msg}</div>;
}

function today() {
    return new Date().toISOString().split('T')[0];
}

export default function AttendanceSection({ token }) {
    const [tab, setTab] = useState('register');
    const [date, setDate] = useState(today());
    const [groupFilter, setGroupFilter] = useState('all');
    const [groups, setGroups] = useState([]);
    const [attendance, setAttendance] = useState([]); // [{studentId, name, enrollmentNumber, group, status}]
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [requests, setRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const hideToast = () => setToast(null);

    // ── Fetch groups ──────────────────────────────────
    const fetchGroups = useCallback(async () => {
        try {
            const d = await apiFetch('/teacher/groups', {}, token);
            setGroups(d.groups || []);
        } catch (_) { }
    }, [token]);

    // ── Fetch attendance for a date+group ─────────────
    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ date });
            if (groupFilter !== 'all') q.set('group', groupFilter);
            const d = await apiFetch(`/teacher/attendance?${q}`, {}, token);
            setAttendance(d.attendance || []);
        } catch (_) { }
        setLoading(false);
    }, [token, date, groupFilter]);

    // ── Fetch pending correction requests ─────────────
    const fetchRequests = useCallback(async () => {
        setReqLoading(true);
        try {
            const d = await apiFetch('/teacher/attendance-requests', {}, token);
            setRequests(d.requests || []);
        } catch (_) { }
        setReqLoading(false);
    }, [token]);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);
    useEffect(() => { if (tab === 'register') fetchAttendance(); }, [fetchAttendance, tab]);
    useEffect(() => { if (tab === 'requests') fetchRequests(); }, [fetchRequests, tab]);

    // toggle a student's attendance status
    const toggle = (studentId, status) => {
        setAttendance(prev => prev.map(s => s.studentId.toString() === studentId.toString() ? { ...s, status } : s));
    };

    // mark all
    const markAll = (status) => setAttendance(prev => prev.map(s => ({ ...s, status })));

    // submit batch
    const handleSubmit = async () => {
        const unmarked = attendance.filter(s => !s.status);
        if (unmarked.length > 0) {
            return showToast(`${unmarked.length} students not marked yet`, 'error');
        }
        setSaving(true);
        try {
            const records = attendance.map(s => ({ studentId: s.studentId, status: s.status }));
            const d = await apiFetch('/teacher/attendance', {
                method: 'POST',
                body: JSON.stringify({ date, records }),
            }, token);
            showToast(d.message || 'Attendance saved ✅');
        } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };

    // approve / reject request
    const handleRequest = async (id, status) => {
        try {
            await apiFetch(`/teacher/attendance-requests/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }, token);
            setRequests(prev => prev.filter(r => r._id !== id));
            showToast(`Request ${status} ✅`);
        } catch (e) { showToast(e.message, 'error'); }
    };

    const present = attendance.filter(s => s.status === 'present').length;
    const absent = attendance.filter(s => s.status === 'absent').length;

    return (
        <div className="td-section">
            {toast && <Toast msg={toast.msg} type={toast.type} onHide={hideToast} />}

            <div className="td-section-header">
                <div><h1>📅 Attendance</h1><p>Mark daily attendance and manage correction requests</p></div>
            </div>

            {/* Tabs */}
            <div className="td-tabs">
                <button className={`td-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
                    📋 Daily Register
                </button>
                <button className={`td-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
                    🔔 Pending Requests {requests.length > 0 && <span className="td-nav-badge" style={{ marginLeft: 6 }}>{requests.length}</span>}
                </button>
            </div>

            {/* ── DAILY REGISTER ────────────────────────── */}
            {tab === 'register' && (
                <>
                    {/* Filters */}
                    <div className="td-form-card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Date</label>
                                <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Group</label>
                                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}>
                                    <option value="all">All Groups</option>
                                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={fetchAttendance}>🔄 Refresh</button>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }} onClick={() => markAll('present')}>✅ Mark All Present</button>
                                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }} onClick={() => markAll('absent')}>❌ Mark All Absent</button>
                            </div>
                        </div>

                        {/* Stats */}
                        {attendance.length > 0 && (
                            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                <div style={{ padding: '10px 18px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', fontWeight: 700, fontSize: '0.875rem' }}>✅ Present: {present}</div>
                                <div style={{ padding: '10px 18px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontWeight: 700, fontSize: '0.875rem' }}>❌ Absent: {absent}</div>
                                <div style={{ padding: '10px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.875rem' }}>⏳ Unmarked: {attendance.length - present - absent}</div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="td-empty"><span>⏳</span><p>Loading students…</p></div>
                    ) : attendance.length === 0 ? (
                        <div className="td-empty"><span>🎓</span><p>No approved students found for selected filters</p></div>
                    ) : (
                        <>
                            <div className="td-table-wrap">
                                <table className="td-table" style={{ minWidth: 600 }}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Enrollment No.</th>
                                            <th>Group</th>
                                            <th>Mark Attendance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map((s, i) => (
                                            <tr key={s.studentId} className={s.status === 'present' ? 'att-row-present' : s.status === 'absent' ? 'att-row-absent' : ''}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                                                <td><strong>{s.name}</strong></td>
                                                <td><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{s.enrollmentNumber || '—'}</code></td>
                                                <td>{s.group || '—'}</td>
                                                <td>
                                                    <div className="att-toggle">
                                                        <button className={`att-btn present ${s.status === 'present' ? 'active' : ''}`} onClick={() => toggle(s.studentId, 'present')}>✅ Present</button>
                                                        <button className={`att-btn absent ${s.status === 'absent' ? 'active' : ''}`} onClick={() => toggle(s.studentId, 'absent')}>❌ Absent</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ padding: '11px 28px' }}>
                                    {saving ? 'Saving…' : '💾 Submit Attendance'}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── CORRECTION REQUESTS ───────────────────── */}
            {tab === 'requests' && (
                reqLoading ? (
                    <div className="td-empty"><span>⏳</span><p>Loading requests…</p></div>
                ) : requests.length === 0 ? (
                    <div className="td-empty"><span>🎉</span><p>No pending correction requests</p></div>
                ) : (
                    <div className="td-table-wrap">
                        <table className="td-table" style={{ minWidth: 650 }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student</th>
                                    <th>Enrollment</th>
                                    <th>Date</th>
                                    <th>Reason</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r, i) => (
                                    <tr key={r._id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                                        <td><strong>{r.studentId?.name || '—'}</strong></td>
                                        <td><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{r.studentId?.enrollmentNumber || '—'}</code></td>
                                        <td>{r.date}</td>
                                        <td style={{ maxWidth: 240, wordBreak: 'break-word' }}>{r.reason}</td>
                                        <td>
                                            <div className="td-action-btns">
                                                <button className="td-btn-approve" onClick={() => handleRequest(r._id, 'approved')}>Approve</button>
                                                <button className="td-btn-delete" onClick={() => handleRequest(r._id, 'rejected')}>Reject</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}
