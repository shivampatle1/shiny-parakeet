import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';

function Toast({ msg, type, onHide }) {
    useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [onHide]);
    return <div className={`td-toast ${type}`}>{msg}</div>;
}

const GROUPS = ['PCM', 'PCB', 'PCMB', 'Arts', 'Commerce', 'PCM (Physics, Chemistry, Maths)', 'PCB (Physics, Chemistry, Biology)', 'PCMB (Physics, Chemistry, Maths, Biology)', 'B.Com', 'B.A.'];
const CATEGORIES = ['General', 'CCE', 'Project', 'Internship', 'Exam'];
const CAT_COLORS = { CCE: '#f59e0b', Project: '#06b6d4', Internship: '#10b981', Exam: '#ef4444', General: '#8b5cf6' };

export default function AcademicSection({ token }) {
    const [groups, setGroups] = useState([]);
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const hideToast = () => setToast(null);

    // Subject assignment state
    const [subj, setSubj] = useState({ group: '', majorSubject: '', minorSubject: '', openElective: '' });
    const [subjLoading, setSubjLoading] = useState(false);

    // Announcement state
    const [ann, setAnn] = useState({ text: '', category: 'General', targetGroup: 'all' });
    const [annLoading, setAnnLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const d = await apiFetch('/teacher/announcements', {}, token);
            setAnnouncements(d.announcements || []);
        } catch (_) { }
    }, [token]);

    const fetchGroups = useCallback(async () => {
        try {
            const d = await apiFetch('/teacher/groups', {}, token);
            setGroups(d.groups || []);
        } catch (_) { }
    }, [token]);

    useEffect(() => { fetchAnnouncements(); fetchGroups(); }, [fetchAnnouncements, fetchGroups]);

    const handleSubjectAssign = async () => {
        if (!subj.group) return showToast('Please select a group', 'error');
        setSubjLoading(true);
        try {
            const d = await apiFetch('/teacher/assign-subjects', { method: 'POST', body: JSON.stringify(subj) }, token);
            showToast(d.message || 'Subjects assigned');
        } catch (e) { showToast(e.message, 'error'); }
        setSubjLoading(false);
    };

    const handleAnnounce = async () => {
        if (!ann.text.trim()) return showToast('Please enter a message', 'error');
        setAnnLoading(true);
        try {
            await apiFetch('/teacher/announce', { method: 'POST', body: JSON.stringify(ann) }, token);
            showToast('Announcement sent 📢');
            setAnn({ text: '', category: 'General', targetGroup: 'all' });
            fetchAnnouncements();
        } catch (e) { showToast(e.message, 'error'); }
        setAnnLoading(false);
    };

    const allGroups = [...new Set([...groups, ...GROUPS])];

    return (
        <div className="td-section">
            {toast && <Toast msg={toast.msg} type={toast.type} onHide={hideToast} />}

            <div className="td-section-header">
                <div><h1>📚 Academic Hub</h1><p>Assign subjects and send announcements to students</p></div>
            </div>

            {/* Subject Assignment */}
            <div className="td-form-card">
                <h3>📐 Subject Assignment</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                    Assign Major, Minor and Open Elective subjects to an entire group at once.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Group / Stream *</label>
                        <select
                            value={subj.group}
                            onChange={e => setSubj(s => ({ ...s, group: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }}
                        >
                            <option value="">Select Group</option>
                            {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Major Subject</label>
                        <input value={subj.majorSubject} onChange={e => setSubj(s => ({ ...s, majorSubject: e.target.value }))}
                            placeholder="e.g. Physics, Mathematics…"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Minor Subject</label>
                        <input value={subj.minorSubject} onChange={e => setSubj(s => ({ ...s, minorSubject: e.target.value }))}
                            placeholder="e.g. Chemistry, Statistics…"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Open Elective (OE)</label>
                        <input value={subj.openElective} onChange={e => setSubj(s => ({ ...s, openElective: e.target.value }))}
                            placeholder="e.g. Environmental Studies…"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }} />
                    </div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={handleSubjectAssign} disabled={subjLoading}>
                    {subjLoading ? 'Assigning…' : '✅ Assign to Group'}
                </button>
            </div>

            {/* Notice / Announcement */}
            <div className="td-form-card">
                <h3>📢 Send Notice / Announcement</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Message *</label>
                        <textarea value={ann.text} onChange={e => setAnn(a => ({ ...a, text: e.target.value }))}
                            placeholder="Type your announcement here…"
                            rows={4}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '12px 14px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Category</label>
                            <select value={ann.category} onChange={e => setAnn(a => ({ ...a, category: e.target.value }))}
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Target Group</label>
                            <select value={ann.targetGroup} onChange={e => setAnn(a => ({ ...a, targetGroup: e.target.value }))}
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%' }}>
                                <option value="all">All Students</option>
                                {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleAnnounce} disabled={annLoading}>
                        {annLoading ? 'Sending…' : '📤 Send Announcement'}
                    </button>
                </div>
            </div>

            {/* Announcement history */}
            {announcements.length > 0 && (
                <div className="td-form-card">
                    <h3>📋 Recent Announcements</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {announcements.slice(0, 10).map(a => (
                            <div key={a._id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: `${CAT_COLORS[a.category] || '#8b5cf6'}25`, color: CAT_COLORS[a.category] || '#8b5cf6', border: `1px solid ${CAT_COLORS[a.category] || '#8b5cf6'}60` }}>{a.category}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>→ {a.targetGroup === 'all' ? '🌐 All Students' : a.targetGroup}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{a.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
