import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Bell, Phone, Mail, Users, BookOpen, FlaskConical,
    Palette, Monitor, Landmark, ClipboardList, ChevronDown, LogIn,
    Camera, X, User, Building2, Megaphone, Image as ImageIcon
} from 'lucide-react';
import { apiFetch, avatarUrl, UPLOADS } from '../lib/api';
import './Landing.css';

const contacts = [
    { Icon: User, title: 'Principal', name: 'Dr. Ramesh Kumar Sharma', phone: '+91-7162-222001', email: 'principal@gdc-chhindwara.ac.in', color: '#6c3eb8' },
    { Icon: Landmark, title: 'HOD — Science', name: 'Dr. Sunita Mishra', phone: '+91-7162-222010', email: 'hod.science@gdc-chhindwara.ac.in', color: '#06b6d4' },
    { Icon: ClipboardList, title: 'HOD — Commerce', name: 'Prof. Anil Tiwari', phone: '+91-7162-222015', email: 'hod.commerce@gdc-chhindwara.ac.in', color: '#10b981' },
    { Icon: BookOpen, title: 'HOD — Arts', name: 'Dr. Priya Yadav', phone: '+91-7162-222020', email: 'hod.arts@gdc-chhindwara.ac.in', color: '#f59e0b' },
    { Icon: ClipboardList, title: 'Admission Office', name: 'Administrative Office', phone: '+91-7162-222030', email: 'admissions@gdc-chhindwara.ac.in', color: '#ec4899' },
    { Icon: Phone, title: 'General Inquiry', name: 'Reception / Help Desk', phone: '+91-7162-222000', email: 'info@gdc-chhindwara.ac.in', color: '#8b5cf6' },
];

const DEFAULT_NOTICES = [
    { _id: '1', text: 'Semester Examinations for B.Sc. & B.Com begin on 10th March 2024' },
    { _id: '2', text: 'Annual Cultural Fest "Utsav 2024" — Register before 5th March' },
    { _id: '3', text: 'Fee payment deadline extended to 28th February 2024' },
    { _id: '4', text: 'Library will remain closed on 26th February for stock verification' },
    { _id: '5', text: 'Congratulations to students who cleared NET/SET examinations!' },
    { _id: '6', text: 'Practical examination schedule posted on the notice board' },
    { _id: '7', text: 'New bus route from Bus Stand to College effective from Monday' },
];

const floatingIcons = [BookOpen, FlaskConical, Palette, Monitor, FlaskConical, Landmark];

export default function Landing() {
    const [notices, setNotices] = useState(DEFAULT_NOTICES);
    const [teachers, setTeachers] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [lightbox, setLightbox] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        apiFetch('/notices').then((d) => { if (d.notices?.length) setNotices(d.notices); }).catch(() => { });
        apiFetch('/auth/teachers').then((d) => { if (d.teachers?.length) setTeachers(d.teachers); }).catch(() => { });
        apiFetch('/gallery').then((d) => { if (d.images?.length) setGallery(d.images); }).catch(() => { });
    }, []);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const marqueeText = notices.map((n) => n.text).join('   •   ');

    return (
        <div className="landing">
            {/* ── NAVBAR ──────────────────────────────────────────── */}
            <nav className="navbar">
                <div className="nav-brand">
                    <div className="nav-logo"><GraduationCap size={22} strokeWidth={1.8} /></div>
                    <div>
                        <span className="nav-college">Govt. Degree College</span>
                        <span className="nav-uni">Chhindwara University</span>
                    </div>
                </div>
                <div className="nav-links">
                    <a onClick={(e) => { e.preventDefault(); document.getElementById('notices')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Notices</a>
                    <a onClick={(e) => { e.preventDefault(); document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Gallery</a>
                    <a onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Contact</a>
                    <div className="login-dropdown-wrap" ref={dropdownRef}>
                        <button className="btn btn-primary" onClick={() => setDropdownOpen((o) => !o)}>
                            Login Portal <ChevronDown size={14} strokeWidth={2.5} />
                        </button>
                        {dropdownOpen && (
                            <div className="login-dropdown">
                                <button onClick={() => navigate('/student/login')}>
                                    <GraduationCap size={15} /> Student Login
                                </button>
                                <button onClick={() => navigate('/teacher/login')}>
                                    <Users size={15} /> Teacher Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── NOTICE BAR ──────────────────────────────────────── */}
            {notices.length > 0 && (
                <section className="notice-bar">
                    <div className="notice-label">
                        <Megaphone size={13} strokeWidth={2} /> LIVE NOTICES
                    </div>
                    <div className="notice-track-wrap">
                        <div className="notice-track">
                            <span>{marqueeText} &nbsp;&nbsp;&nbsp; {marqueeText}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* ── HERO ────────────────────────────────────────────── */}
            <section className="hero">
                <div className="hero-bg-orbs">
                    <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
                </div>
                <div className="hero-content fade-in">
                    <div className="hero-badge">
                        <Building2 size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 6 }} />
                        Est. 1988 &bull; Affiliated to Chhindwara University
                    </div>
                    <h1 className="hero-title">
                        Government Degree College
                        <span className="gradient-text"> Chhindwara</span>
                    </h1>
                    <p className="hero-sub">
                        Empowering Minds &middot; Shaping Futures &middot; Building Character<br />
                        <em>ज्ञानं परमं बलम्</em> — Knowledge is the Greatest Strength
                    </p>
                    <div className="hero-stats">
                        {[['2000+', 'Students'], ['50+', 'Faculty'], ['15+', 'Courses'], ['35+', 'Years']].map(([val, label]) => (
                            <div key={label} className="stat-box"><strong>{val}</strong><span>{label}</span></div>
                        ))}
                    </div>
                    <div className="hero-cta">
                        <div className="login-dropdown-wrap" ref={null}>
                            <button className="btn btn-secondary" onClick={() => setDropdownOpen((o) => !o)}>
                                <LogIn size={15} strokeWidth={2} /> Login Portal <ChevronDown size={14} />
                            </button>
                            {dropdownOpen && (
                                <div className="login-dropdown">
                                    <button onClick={() => { setDropdownOpen(false); navigate('/student/login'); }}>
                                        <GraduationCap size={15} /> Student Login
                                    </button>
                                    <button onClick={() => { setDropdownOpen(false); navigate('/teacher/login'); }}>
                                        <Users size={15} /> Teacher Login
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="btn btn-outline" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                            <Phone size={14} strokeWidth={2} /> Contact Us
                        </button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="campus-illustration">
                        <div className="building">
                            <div className="building-top"><Landmark size={36} strokeWidth={1} color="#c4b5fd" /></div>
                            <div className="building-windows">
                                {[...Array(9)].map((_, i) => <div key={i} className="window" />)}
                            </div>
                            <div className="building-door" />
                        </div>
                        <div className="floating-icons">
                            {floatingIcons.map((Icon, i) => (
                                <span key={i} className="f-icon" style={{ animationDelay: `${i * 0.4}s` }}>
                                    <Icon size={18} strokeWidth={1.5} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FACULTY DIRECTORY ──────────────────────────────── */}
            {teachers.length > 0 && (
                <section id="faculty" className="faculty-section">
                    <div className="section-header">
                        <h2><Users size={22} strokeWidth={1.8} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Meet Our Faculty</h2>
                        <p>Dedicated educators shaping the future of our students</p>
                    </div>
                    <div className="faculty-grid">
                        {teachers.map((t) => {
                            const pic = avatarUrl(t.profilePicture);
                            const initials = t.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                            return (
                                <div key={t._id} className="faculty-card card">
                                    <div className="faculty-avatar-wrap">
                                        {pic ? <img src={pic} alt={t.name} className="faculty-avatar-img" />
                                            : <div className="faculty-avatar-initials">{initials}</div>}
                                    </div>
                                    <div className="faculty-info">
                                        <h4 className="faculty-name">{t.name}</h4>
                                        {t.designation && <span className="faculty-desig">{t.designation}</span>}
                                        {t.department && (
                                            <span className="faculty-dept">
                                                <Building2 size={11} strokeWidth={2} style={{ marginRight: 4 }} />{t.department}
                                            </span>
                                        )}
                                        {t.bio && <p className="faculty-bio">{t.bio}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── GALLERY SECTION ─────────────────────────────────── */}
            {gallery.length > 0 && (
                <section id="gallery" className="gallery-section">
                    <div className="section-header">
                        <h2><Camera size={22} strokeWidth={1.8} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />College Gallery</h2>
                        <p>Moments captured by our students and faculty</p>
                    </div>
                    <div className="gallery-grid">
                        {gallery.map(img => (
                            <div key={img._id} className="gallery-item" onClick={() => setLightbox(img)}>
                                <img src={`${UPLOADS}/${img.filename}`} alt={img.title || 'Gallery'} />
                                <div className="gallery-item-overlay">
                                    {img.title && <strong>{img.title}</strong>}
                                    {img.description && <p>{img.description}</p>}
                                    <span className={`gallery-role-pill ${img.uploaderRole}`}>
                                        {img.uploaderRole === 'teacher'
                                            ? <Users size={10} style={{ marginRight: 4 }} />
                                            : <GraduationCap size={10} style={{ marginRight: 4 }} />}
                                        {img.uploaderName}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="gallery-lightbox" onClick={() => setLightbox(null)}>
                    <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={18} /></button>
                    <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
                        <img src={`${UPLOADS}/${lightbox.filename}`} alt={lightbox.title || 'Gallery'} />
                        {(lightbox.title || lightbox.description) && (
                            <div className="lightbox-caption">
                                {lightbox.title && <strong>{lightbox.title}</strong>}
                                {lightbox.description && <p>{lightbox.description}</p>}
                                <small>
                                    {lightbox.uploaderRole === 'teacher' ? <Users size={11} /> : <GraduationCap size={11} />}
                                    {' '}{lightbox.uploaderName}
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── NOTICES SECTION ─────────────────────────────────── */}
            <section id="notices" className="notices-section">
                <div className="section-header">
                    <h2><Bell size={22} strokeWidth={1.8} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Notice Board</h2>
                    <p>Latest announcements and updates from the college</p>
                </div>
                <div className="notices-grid">
                    {notices.map((n, i) => (
                        <div key={n._id || i} className="notice-item card">
                            <span className="notice-num">{String(i + 1).padStart(2, '0')}</span>
                            <p>{n.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CONTACT DIRECTORY ───────────────────────────────── */}
            <section id="contact" className="contact-section">
                <div className="section-header">
                    <h2><Phone size={22} strokeWidth={1.8} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />Contact Directory</h2>
                    <p>Reach out to the right department quickly</p>
                </div>
                <div className="contact-grid">
                    {contacts.map((c) => {
                        const ContactIcon = c.Icon;
                        return (
                            <div key={c.title} className="contact-card card">
                                <div className="contact-icon" style={{ background: `${c.color}25`, border: `1.5px solid ${c.color}60` }}>
                                    <ContactIcon size={22} strokeWidth={1.8} color={c.color} />
                                </div>
                                <div className="contact-info">
                                    <h4>{c.title}</h4>
                                    <p className="contact-name">{c.name}</p>
                                    <a href={`tel:${c.phone}`} className="contact-phone">
                                        <Phone size={12} strokeWidth={2} /> {c.phone}
                                    </a>
                                    <a href={`mailto:${c.email}`} className="contact-email">
                                        <Mail size={12} strokeWidth={2} /> {c.email}
                                    </a>
                                </div>
                                <div className="contact-color-bar" style={{ background: c.color }} />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────── */}
            <footer className="footer">
                <div className="footer-content">
                    <div>
                        <h3><GraduationCap size={18} strokeWidth={1.8} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Govt. Degree College, Chhindwara</h3>
                        <p>Affiliated to Chhindwara University, Madhya Pradesh</p>
                    </div>
                    <div className="footer-links">
                        <a onClick={(e) => { e.preventDefault(); document.getElementById('notices')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Notices</a>
                        <a onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Contact</a>
                        <a onClick={() => navigate('/student/login')} style={{ cursor: 'pointer' }}>Student Portal</a>
                        <a onClick={() => navigate('/teacher/login')} style={{ cursor: 'pointer' }}>Teacher Portal</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Govt. Degree College, Chhindwara. Affiliated to Chhindwara University.</p>
                </div>
            </footer>
        </div>
    );
}
