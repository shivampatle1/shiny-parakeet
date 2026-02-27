import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, avatarUrl } from '../lib/api';
import {
    Users, BookOpen, FolderOpen, CalendarCheck,
    GraduationCap, LogOut, ChevronRight, MessageSquare, Camera
} from 'lucide-react';
import StudentsSection from './teacher/StudentsSection';
import AcademicSection from './teacher/AcademicSection';
import MaterialsSection from './teacher/MaterialsSection';
import AttendanceSection from './teacher/AttendanceSection';
import InboxSection from './teacher/InboxSection';
import GalleryUploadModal from '../components/GalleryUploadModal';
import './TeacherDashboard.css';

const NAV = [
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'academic', icon: BookOpen, label: 'Academic Hub' },
    { id: 'materials', icon: FolderOpen, label: 'Materials' },
    { id: 'attendance', icon: CalendarCheck, label: 'Attendance' },
    { id: 'inbox', icon: MessageSquare, label: 'Inbox' },
];

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { user, token, logout } = useAuth();
    const [active, setActive] = useState('students');
    const [pendingCount, setPendingCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showGalleryUpload, setShowGalleryUpload] = useState(false);
    const [galleryToast, setGalleryToast] = useState('');

    const fetchPendingCount = useCallback(async () => {
        try {
            const d = await apiFetch('/teacher/pending', {}, token);
            setPendingCount(d.students?.length || 0);
        } catch (_) { }
    }, [token]);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const d = await apiFetch('/messages/unread-count', {}, token);
            setUnreadCount(d.count || 0);
        } catch (_) { }
    }, [token]);

    useEffect(() => {
        fetchPendingCount();
        fetchUnreadCount();
        const i = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(i);
    }, [fetchPendingCount, fetchUnreadCount]);

    const handleLogout = () => { logout(); navigate('/'); };

    const picUrl = avatarUrl(user?.profilePicture);

    return (
        <div className="td-layout">
            {showGalleryUpload && (
                <GalleryUploadModal
                    token={token}
                    onClose={() => setShowGalleryUpload(false)}
                    onUploaded={() => { setShowGalleryUpload(false); setGalleryToast('Photo added to gallery successfully!'); setTimeout(() => setGalleryToast(''), 3000); }}
                />
            )}
            {galleryToast && <div className="td-toast success" style={{ zIndex: 700 }}>{galleryToast}</div>}
            {/* ── SIDEBAR ─────────────────────────── */}
            <aside className="td-sidebar">
                <div className="td-sidebar-brand">
                    <div className="td-sidebar-logo-wrap">
                        <GraduationCap size={22} strokeWidth={1.8} />
                    </div>
                    <div>
                        <strong>GDC Chhindwara</strong>
                        <small>Faculty Portal</small>
                    </div>
                </div>

                <nav className="td-nav">
                    {NAV.map(n => {
                        const Icon = n.icon;
                        return (
                            <button
                                key={n.id}
                                className={`td-nav-item ${active === n.id ? 'active' : ''}`}
                                onClick={() => setActive(n.id)}
                            >
                                <Icon size={17} strokeWidth={1.8} className="td-nav-icon-svg" />
                                <span className="td-nav-label">{n.label}</span>
                                {n.id === 'students' && pendingCount > 0 && (
                                    <span className="td-nav-badge">{pendingCount}</span>
                                )}
                                {n.id === 'inbox' && unreadCount > 0 && (
                                    <span className="td-nav-badge">{unreadCount}</span>
                                )}
                                {active === n.id && <ChevronRight size={14} className="td-nav-chevron" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="td-sidebar-user">
                    <div className="td-user-avatar">
                        {picUrl
                            ? <img src={picUrl} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <span>{user?.name?.[0]?.toUpperCase() || 'T'}</span>
                        }
                    </div>
                    <div className="td-user-info">
                        <strong>{user?.name}</strong>
                        <small>{user?.designation || 'Faculty'}</small>
                        <small>{user?.department || ''}</small>
                    </div>
                    <button
                        onClick={() => setShowGalleryUpload(true)}
                        title="Add to Gallery"
                        style={{ background: 'rgba(108,62,184,0.2)', border: '1px solid rgba(108,62,184,0.35)', color: 'var(--primary-light)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    ><Camera size={15} strokeWidth={1.8} /></button>
                    <button className="td-logout" onClick={handleLogout} title="Logout">
                        <LogOut size={16} strokeWidth={1.8} />
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ────────────────────── */}
            <main className="td-main">
                {active === 'students' && <StudentsSection token={token} onCountChange={fetchPendingCount} />}
                {active === 'academic' && <AcademicSection token={token} />}
                {active === 'materials' && <MaterialsSection token={token} />}
                {active === 'attendance' && <AttendanceSection token={token} />}
                {active === 'inbox' && <InboxSection token={token} currentUser={user} />}
            </main>
        </div>
    );
}
