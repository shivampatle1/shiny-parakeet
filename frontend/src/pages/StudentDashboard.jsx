import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, avatarUrl, UPLOADS } from '../lib/api';
import {
    BookOpen, Bell, FolderOpen, CalendarCheck,
    LogOut, Download, Send, AlertCircle, CheckCircle,
    XCircle, Clock, FileText, ChevronRight, User, MessageSquare, Camera
} from 'lucide-react';
import './StudentDashboard.css';
import GalleryUploadModal from '../components/GalleryUploadModal';

// ─── Circular Progress ────────────────────────────
function CircularProgress({ pct }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div className="circ-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s' }} />
            </svg>
            <div className="circ-text">
                <span className="circ-pct" style={{ color }}>{pct}%</span>
                <span className="circ-lbl">Attendance</span>
            </div>
        </div>
    );
}

function Toast({ msg, type, onHide }) {
    useEffect(() => { const t = setTimeout(onHide, 3200); return () => clearTimeout(t); }, [onHide]);
    return <div className={`sd-toast ${type}`}>{msg}</div>;
}

function CorrectionModal({ onClose, onSubmit }) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        await onSubmit(date, reason);
        setLoading(false);
    };
    return (
        <div className="sd-modal-overlay">
            <div className="sd-modal">
                <h2>Attendance Correction Request</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                    Submit a request if you were incorrectly marked absent.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label className="sd-label">Date</label><input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className="sd-input" /></div>
                    <div><label className="sd-label">Reason / Explanation</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} placeholder="e.g. I was present but signed the register late…" className="sd-input" style={{ resize: 'vertical' }} /></div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !reason.trim()}>
                            {loading ? 'Sending…' : 'Send Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MaterialRequestModal({ onClose, onSubmit }) {
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        await onSubmit(topic, description);
        setLoading(false);
    };
    return (
        <div className="sd-modal-overlay">
            <div className="sd-modal">
                <h2>Request Study Material</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                    Ask your teacher to share specific notes, resources, or materials.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label className="sd-label">Topic / Subject *</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Chapter 5 — Quantum Mechanics" className="sd-input" /></div>
                    <div><label className="sd-label">Additional Details (optional)</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Any specific details…" className="sd-input" style={{ resize: 'vertical' }} /></div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !topic.trim()}>
                            {loading ? 'Sending…' : 'Send Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const CAT_COLORS = { CCE: '#f59e0b', Project: '#06b6d4', Internship: '#10b981', Exam: '#ef4444', General: '#8b5cf6' };

function formatBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}
function fileIcon(fn) {
    const ext = fn?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={22} color="#ef4444" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={22} color="#3b82f6" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileText size={22} color="#f97316" />;
    return <FileText size={22} color="#8b5cf6" />;
}

const statusIcon = {
    pending: <Clock size={13} />,
    approved: <CheckCircle size={13} />,
    rejected: <XCircle size={13} />,
};
const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, token, logout, updateUser } = useAuth();

    const [tab, setTab] = useState('academics');
    const [announcements, setAnnouncements] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [matRequests, setMatRequests] = useState([]);
    const [attSummary, setAttSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
    const [attRecords, setAttRecords] = useState([]);
    const [corrRequests, setCorrRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showMatReqModal, setShowMatReqModal] = useState(false);
    const [matTab, setMatTab] = useState('files');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState({});
    const [showGalleryUpload, setShowGalleryUpload] = useState(false);

    // ── Contact Teacher (chat)
    const [teachers, setTeachers] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatTeacher, setChatTeacher] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [chatSending, setChatSending] = useState(false);
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const chatBottomRef = useRef(null);
    const chatPollRef = useRef(null);
    const prevUnreadRef = useRef(0);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try { const d = await apiFetch('/auth/me', {}, token); if (d.user) updateUser(d.user); } catch (_) { }
    }, [token, updateUser]);

    useEffect(() => {
        refreshUser();
        const i = setInterval(refreshUser, 10000);
        return () => clearInterval(i);
    }, [refreshUser]);

    const load = useCallback(async (key, fn) => {
        setLoading(l => ({ ...l, [key]: true }));
        try { await fn(); } catch (_) { }
        setLoading(l => ({ ...l, [key]: false }));
    }, []);

    useEffect(() => {
        load('ann', async () => { const d = await apiFetch('/student/announcements', {}, token); setAnnouncements(d.announcements || []); });
        load('mat', async () => { const d = await apiFetch('/student/materials', {}, token); setMaterials(d.materials || []); });
        load('matreq', async () => { const d = await apiFetch('/student/material-requests', {}, token); setMatRequests(d.requests || []); });
        load('att', async () => { const d = await apiFetch('/student/attendance', {}, token); setAttSummary(d.summary || { total: 0, present: 0, absent: 0, percentage: 0 }); setAttRecords(d.records || []); });
        load('req', async () => { const d = await apiFetch('/student/attendance-requests', {}, token); setCorrRequests(d.requests || []); });
        // Fetch teachers for contact feature
        apiFetch('/auth/teachers').then(d => setTeachers(d.teachers || [])).catch(() => { });
    }, [token, load]);

    // Poll unread message count for students
    const pollUnread = useCallback(async () => {
        try {
            const d = await apiFetch('/messages/unread-count', {}, token);
            const count = d.count || 0;
            if (count > prevUnreadRef.current && !chatOpen) {
                showToast(`📬 ${count} unread message${count > 1 ? 's' : ''} from a teacher — click "Contact Teacher"!`);
            }
            prevUnreadRef.current = count;
            setUnreadMsgCount(count);
        } catch (_) { }
    }, [token, chatOpen]);

    useEffect(() => {
        pollUnread();
        const i = setInterval(pollUnread, 10000);
        return () => clearInterval(i);
    }, [pollUnread]);

    const handleCorrectionSubmit = async (date, reason) => {
        try {
            const d = await apiFetch('/student/attendance-request', { method: 'POST', body: JSON.stringify({ date, reason }) }, token);
            showToast(d.message || 'Request sent');
            setShowModal(false);
            const r = await apiFetch('/student/attendance-requests', {}, token);
            setCorrRequests(r.requests || []);
        } catch (e) { showToast(e.message, 'error'); setShowModal(false); }
    };

    // ── Chat helpers
    const loadChatMessages = useCallback(async (teacherId) => {
        if (!teacherId) return;
        try {
            const d = await apiFetch(`/messages/conversation/${teacherId}`, {}, token);
            setChatMessages(d.messages || []);
        } catch (_) { }
    }, [token]);

    const openChat = (teacher) => {
        setChatTeacher(teacher);
        setChatMessages([]);
        setChatOpen(true);
        loadChatMessages(teacher._id);
    };

    const closeChat = () => {
        setChatOpen(false);
        setChatTeacher(null);
        clearInterval(chatPollRef.current);
    };

    useEffect(() => {
        if (!chatOpen || !chatTeacher) return;
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        clearInterval(chatPollRef.current);
        chatPollRef.current = setInterval(() => loadChatMessages(chatTeacher._id), 8000);
        return () => clearInterval(chatPollRef.current);
    }, [chatOpen, chatTeacher, chatMessages.length, loadChatMessages]);

    const sendChatMessage = async () => {
        if (!chatText.trim() || !chatTeacher || chatSending) return;
        setChatSending(true);
        try {
            await apiFetch('/messages/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId: chatTeacher._id, content: chatText.trim() }),
            }, token);
            setChatText('');
            await loadChatMessages(chatTeacher._id);
        } catch (e) { showToast(e.message, 'error'); }
        setChatSending(false);
    };

    const status = user?.status || 'pending';
    const statusCfg = {
        pending: { label: 'Verification Pending', cls: 'sd-badge-pending', alertCls: 'sd-alert-warning', Icon: Clock },
        approved: { label: 'Verified', cls: 'sd-badge-approved', alertCls: 'sd-alert-success', Icon: CheckCircle },
        rejected: { label: 'Rejected', cls: 'sd-badge-rejected', alertCls: 'sd-alert-error', Icon: XCircle },
    };
    const scfg = statusCfg[status];
    const StatusIcon = scfg.Icon;

    const TABS = [
        { id: 'academics', icon: BookOpen, label: 'Academics' },
        { id: 'notices', icon: Bell, label: `Notices${announcements.length ? ` (${announcements.length})` : ''}` },
        { id: 'materials', icon: FolderOpen, label: 'Materials' },
        { id: 'attendance', icon: CalendarCheck, label: 'Attendance' },
    ];

    return (
        <div className="sd-page">
            {toast && <Toast msg={toast.msg} type={toast.type} onHide={() => setToast(null)} />}
            {showModal && <CorrectionModal onClose={() => setShowModal(false)} onSubmit={handleCorrectionSubmit} />}
            {showMatReqModal && (
                <MaterialRequestModal onClose={() => setShowMatReqModal(false)}
                    onSubmit={async (topic, description) => {
                        try {
                            const d = await apiFetch('/student/material-request', { method: 'POST', body: JSON.stringify({ topic, description }) }, token);
                            showToast(d.message || 'Request sent');
                            const r = await apiFetch('/student/material-requests', {}, token);
                            setMatRequests(r.requests || []);
                        } catch (e) { showToast(e.message, 'error'); }
                        setShowMatReqModal(false);
                    }}
                />
            )}
            {showGalleryUpload && (
                <GalleryUploadModal
                    token={token}
                    onClose={() => setShowGalleryUpload(false)}
                    onUploaded={() => { showToast('Photo added to gallery!'); }}
                />
            )}

            {/* ── CONTACT TEACHER CHAT MODAL ──────────── */}
            {chatOpen && (
                <div className="sd-modal-overlay" onClick={closeChat}>
                    <div className="sd-chat-modal" onClick={e => e.stopPropagation()}>
                        {/* Header with teacher selector */}
                        <div className="sd-chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {chatTeacher?.profilePicture
                                    ? <img src={avatarUrl(chatTeacher.profilePicture)} alt={chatTeacher.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                    : <div className="sd-chat-avatar-fallback">{chatTeacher?.name?.[0]?.toUpperCase() || '?'}</div>
                                }
                                <div>
                                    <strong style={{ fontSize: '0.9rem' }}>{chatTeacher?.name || 'Select a teacher'}</strong>
                                    {chatTeacher?.department && <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{chatTeacher.department} · {chatTeacher.designation}</small>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <select
                                    className="sd-input"
                                    style={{ padding: '7px 12px', fontSize: '0.82rem', width: 'auto' }}
                                    value={chatTeacher?._id || ''}
                                    onChange={e => {
                                        const t = teachers.find(t => t._id === e.target.value);
                                        if (t) openChat(t);
                                    }}
                                >
                                    <option value="">Select teacher…</option>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name} — {t.department || 'Faculty'}</option>)}
                                </select>
                                <button onClick={closeChat} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="sd-chat-messages">
                            {!chatTeacher ? (
                                <div className="sd-chat-prompt"><MessageSquare size={36} strokeWidth={1} /><p>Select a teacher to start messaging</p></div>
                            ) : chatMessages.length === 0 ? (
                                <div className="sd-chat-prompt"><MessageSquare size={28} strokeWidth={1} /><p>No messages yet. Say hello!</p></div>
                            ) : chatMessages.map(msg => {
                                const isMe = msg.senderId._id === user?.id || msg.senderId._id === user?._id;
                                return (
                                    <div key={msg._id} className={`inbox-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                                        {!isMe && (
                                            chatTeacher.profilePicture
                                                ? <img src={avatarUrl(chatTeacher.profilePicture)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,62,184,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', flexShrink: 0 }}>{chatTeacher.name?.[0]}</div>
                                        )}
                                        <div className={`inbox-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                                            <p>{msg.content}</p>
                                            <span className="bubble-time">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatBottomRef} />
                        </div>

                        {/* Input */}
                        {chatTeacher && (
                            <div className="sd-chat-input-wrap">
                                <input
                                    className="sd-input"
                                    value={chatText}
                                    onChange={e => setChatText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                                    placeholder="Type your message…"
                                    style={{ flex: 1, margin: 0 }}
                                />
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={sendChatMessage}
                                    disabled={!chatText.trim() || chatSending}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}
                                >
                                    <Send size={14} strokeWidth={2} /> {chatSending ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── HEADER ─────────────────────────── */}
            <header className="sd-header">
                <div className="sd-header-brand">
                    <div className="sd-brand-icon"><BookOpen size={18} strokeWidth={1.8} /></div>
                    <div>
                        <strong>GDC Chhindwara</strong>
                        <small>Student Portal</small>
                    </div>
                </div>

                <div className={`sd-status-pill ${scfg.alertCls}`}>
                    <StatusIcon size={13} strokeWidth={2} />
                    {scfg.label}
                </div>

                <div className="sd-header-user">
                    <div className="sd-avatar" style={user?.profilePicture ? { padding: 0, overflow: 'hidden' } : {}}>
                        {user?.profilePicture
                            ? <img src={avatarUrl(user.profilePicture)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : user?.name?.[0]?.toUpperCase() || 'S'
                        }
                    </div>
                    <div>
                        <strong>{user?.name}</strong>
                        <small>{user?.enrollmentNumber || user?.email}</small>
                    </div>
                    <button className="sd-logout" onClick={() => { logout(); navigate('/'); }} title="Logout">
                        <LogOut size={16} strokeWidth={1.8} />
                    </button>
                </div>
            </header>

            <div className="sd-body">
                {/* ── PROFILE CARD ───────────────────── */}
                <div className="sd-profile-card card">
                    <div className="sd-profile-avatar-lg" style={user?.profilePicture ? { padding: 0, overflow: 'hidden' } : {}}>
                        {user?.profilePicture
                            ? <img src={avatarUrl(user.profilePicture)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <User size={28} strokeWidth={1.5} />
                        }
                    </div>
                    <div className="sd-profile-info">
                        <h2>{user?.name}</h2>
                        <p className="sd-enroll">{user?.enrollmentNumber || 'Enrollment not set'}</p>
                        <div className="sd-profile-tags">
                            {user?.course && <span className="sd-tag">{user.course}</span>}
                            {user?.group && <span className="sd-tag">{user.group}</span>}
                            {user?.studentType && <span className="sd-tag">{user.studentType}</span>}
                            <span className={`sd-tag ${scfg.cls}`}><StatusIcon size={11} strokeWidth={2} /> {scfg.label}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowGalleryUpload(true)}
                        className="btn btn-sm"
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.8rem', background: 'rgba(108,62,184,0.2)', border: '1px solid rgba(108,62,184,0.4)', color: 'var(--primary-light)', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <Camera size={14} strokeWidth={1.8} /> Add to Gallery
                    </button>
                </div>

                {/* ── TABS ──────────────────────────── */}
                <div className="sd-tabs">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} className={`sd-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                                <Icon size={15} strokeWidth={1.8} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── ACADEMICS TAB ──────────────────── */}
                {tab === 'academics' && (
                    <div className="sd-grid">
                        <div className="sd-subject-cards">
                            {[
                                { icon: BookOpen, label: 'Major Subject', val: user?.majorSubject, color: '#10b981' },
                                { icon: BookOpen, label: 'Minor Subject', val: user?.minorSubject, color: '#06b6d4' },
                                { icon: BookOpen, label: 'Open Elective', val: user?.openElective, color: '#f59e0b' },
                            ].map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="sd-subject-card card" style={{ borderTop: `3px solid ${s.color}` }}>
                                        <div className="sd-subject-icon-wrap" style={{ background: `${s.color}18`, border: `1.5px solid ${s.color}40` }}>
                                            <Icon size={18} strokeWidth={1.8} color={s.color} />
                                        </div>
                                        <div>
                                            <small>{s.label}</small>
                                            <strong>{s.val || <span className="sd-unset">Not assigned yet</span>}</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Contact Teacher button */}
                        {teachers.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setChatOpen(true);
                                        setChatTeacher(teachers[0]);
                                        loadChatMessages(teachers[0]._id);
                                        setUnreadMsgCount(0);
                                        prevUnreadRef.current = 0;
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.875rem', position: 'relative' }}
                                >
                                    <MessageSquare size={15} strokeWidth={2} /> Contact Teacher
                                    {unreadMsgCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: -6, right: -6,
                                            background: '#ef4444', color: '#fff',
                                            borderRadius: '50%', width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 800,
                                            border: '2px solid var(--bg)',
                                        }}>{unreadMsgCount > 9 ? '9+' : unreadMsgCount}</span>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="card sd-info-card">
                            <h3>Academic Details</h3>
                            <div className="sd-info-grid">
                                {[
                                    ['Full Name', user?.name, User],
                                    ['Enrollment No.', user?.enrollmentNumber, FileText],
                                    ['Email', user?.email, Send],
                                    ['Course', user?.course, BookOpen],
                                    ['Group', user?.group, BookOpen],
                                    ['Student Type', user?.studentType, User],
                                    ['CCE Status', user?.cceStatus, CheckCircle],
                                    ['Project Type', user?.projectType, FolderOpen],
                                ].map(([label, val, Icon]) => (
                                    <div key={label} className="sd-info-row">
                                        <div className="sd-info-icon-wrap"><Icon size={14} strokeWidth={1.8} /></div>
                                        <div>
                                            <small>{label}</small>
                                            <strong>{val || '—'}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card sd-project-card">
                            <h3>Project &amp; Internship</h3>
                            <div className="sd-project-items">
                                {[
                                    { cat: 'Project', color: '#06b6d4', status: user?.cceStatus === 'complete' ? 'Submitted' : 'In Progress', statusOk: user?.cceStatus === 'complete' },
                                    { cat: 'Internship', color: '#f59e0b', status: 'Awaiting Approval', statusOk: false },
                                ].map(p => (
                                    <div key={p.cat} className="sd-project-item" style={{ borderLeft: `3px solid ${p.color}` }}>
                                        <FolderOpen size={20} strokeWidth={1.8} color={p.color} />
                                        <div>
                                            <strong>{p.cat}</strong>
                                            <small style={{ color: p.statusOk ? '#10b981' : p.color }}>
                                                {p.statusOk ? <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} /> : <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />}
                                                {p.status}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── NOTICES TAB ────────────────────── */}
                {tab === 'notices' && (
                    <div className="sd-notices">
                        {loading.ann ? <div className="sd-empty"><div className="sd-empty-icon"><Clock size={36} strokeWidth={1} /></div><p>Loading notices…</p></div>
                            : announcements.length === 0 ? <div className="sd-empty"><div className="sd-empty-icon"><Bell size={36} strokeWidth={1} /></div><p>No notices yet</p></div>
                                : announcements.map(a => (
                                    <div key={a._id} className="sd-notice-card card">
                                        <div className="sd-notice-header">
                                            <span className="sd-notice-cat" style={{ background: `${CAT_COLORS[a.category] || '#8b5cf6'}20`, color: CAT_COLORS[a.category] || '#8b5cf6', border: `1px solid ${CAT_COLORS[a.category] || '#8b5cf6'}50` }}>
                                                {a.category}
                                            </span>
                                            <span className="sd-notice-group">{a.targetGroup === 'all' ? 'All Students' : a.targetGroup}</span>
                                            <span className="sd-notice-time">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <p className="sd-notice-text">{a.text}</p>
                                        {a.createdBy && <small className="sd-notice-by">— {a.createdBy.name} ({a.createdBy.designation || 'Faculty'})</small>}
                                    </div>
                                ))}
                    </div>
                )}

                {/* ── MATERIALS TAB ──────────────────── */}
                {tab === 'materials' && (
                    <div className="sd-materials">
                        <div className="sd-tabs" style={{ marginBottom: 18 }}>
                            <button className={`sd-tab ${matTab === 'files' ? 'active' : ''}`} onClick={() => setMatTab('files')}>
                                <FolderOpen size={14} strokeWidth={1.8} /> Available Files ({materials.length})
                            </button>
                            <button className={`sd-tab ${matTab === 'requests' ? 'active' : ''}`} onClick={() => setMatTab('requests')}>
                                <Send size={14} strokeWidth={1.8} /> My Requests ({matRequests.length})
                            </button>
                        </div>

                        {matTab === 'files' && (
                            loading.mat ? <div className="sd-empty"><div className="sd-empty-icon"><Clock size={32} strokeWidth={1} /></div><p>Loading…</p></div>
                                : materials.length === 0 ? <div className="sd-empty"><div className="sd-empty-icon"><FolderOpen size={36} strokeWidth={1} /></div><p>No materials shared yet</p></div>
                                    : materials.map(m => (
                                        <div key={m._id || m.filename} className="sd-material-row card">
                                            <span className="sd-material-icon">{fileIcon(m.filename)}</span>
                                            <div className="sd-material-meta">
                                                <strong>{m.title || m.displayName || m.filename}</strong>
                                                <small>{formatBytes(m.size)} • {new Date(m.createdAt || m.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                                            </div>
                                            <a href={`${UPLOADS}/${m.filename}`} download target="_blank" rel="noreferrer" className="sd-download-btn">
                                                <Download size={14} strokeWidth={2} /> Download
                                            </a>
                                        </div>
                                    ))
                        )}

                        {matTab === 'requests' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowMatReqModal(true)} style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Send size={14} strokeWidth={2} /> Request Material from Teacher
                                    </button>
                                </div>
                                {matRequests.length === 0 ? (
                                    <div className="sd-empty"><div className="sd-empty-icon"><Send size={36} strokeWidth={1} /></div><p>No requests yet — ask your teacher for materials!</p></div>
                                ) : matRequests.map(r => (
                                    <div key={r._id} className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div>
                                                <strong style={{ fontSize: '0.9rem' }}>{r.topic}</strong>
                                                {r.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</p>}
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor[r.status]}20`, color: statusColor[r.status], border: `1px solid ${statusColor[r.status]}40`, whiteSpace: 'nowrap' }}>
                                                {statusIcon[r.status]} {r.status}
                                            </span>
                                        </div>
                                        {r.status === 'rejected' && r.rejectionReason && (
                                            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <XCircle size={14} /> {r.rejectionReason}
                                            </div>
                                        )}
                                        {r.status === 'approved' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                                {r.sharedText && <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.875rem' }}>{r.sharedText}</div>}
                                                {r.sharedFile && <a href={`${UPLOADS}/${r.sharedFile}`} download target="_blank" rel="noreferrer" className="sd-download-btn" style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Download File</a>}
                                            </div>
                                        )}
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: 8 }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* ── ATTENDANCE TAB ─────────────────── */}
                {tab === 'attendance' && (
                    <div className="sd-attendance">
                        <div className="sd-att-widget card">
                            <CircularProgress pct={attSummary.percentage} />
                            <div className="sd-att-stats">
                                {[
                                    { val: attSummary.present, label: 'Present', color: '#10b981' },
                                    { val: attSummary.absent, label: 'Absent', color: '#ef4444' },
                                    { val: attSummary.total, label: 'Total', color: 'var(--primary-light)' },
                                ].map(s => (
                                    <div key={s.label} className="sd-att-stat">
                                        <span style={{ color: s.color, fontSize: '1.8rem', fontWeight: 800 }}>{s.val}</span>
                                        <small>{s.label}</small>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 20, width: '100%' }}>
                                {attSummary.percentage < 75 && (
                                    <div className="sd-alert-warning" style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertCircle size={15} /> Attendance is below 75%. Please attend more classes.
                                    </div>
                                )}
                                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Send size={15} strokeWidth={2} /> Request Attendance Correction
                                </button>
                            </div>
                        </div>

                        {attRecords.length > 0 && (
                            <div className="card" style={{ padding: 24, marginTop: 16 }}>
                                <h3 style={{ marginBottom: 16, fontFamily: 'Outfit', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CalendarCheck size={16} strokeWidth={1.8} /> Recent Attendance
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {attRecords.slice(0, 15).map(r => (
                                        <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: r.status === 'present' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${r.status === 'present' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                                            <span style={{ fontSize: '0.875rem' }}>{r.date}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: r.status === 'present' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                {r.status === 'present' ? <CheckCircle size={13} /> : <XCircle size={13} />} {r.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {corrRequests.length > 0 && (
                            <div className="card" style={{ padding: 24, marginTop: 16 }}>
                                <h3 style={{ marginBottom: 16, fontFamily: 'Outfit', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FileText size={16} strokeWidth={1.8} /> My Correction Requests
                                </h3>
                                {corrRequests.map(r => (
                                    <div key={r._id} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                                        <div>
                                            <strong style={{ fontSize: '0.875rem' }}>{r.date}</strong>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.reason}</p>
                                        </div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor[r.status]}20`, color: statusColor[r.status], whiteSpace: 'nowrap' }}>
                                            {statusIcon[r.status]} {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
