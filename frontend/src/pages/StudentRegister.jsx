import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetchForm } from '../lib/api';
import './Auth.css';

const COURSES = [
    'B.A. (Bachelor of Arts)',
    'B.Sc. (Bachelor of Science)',
    'B.Com. (Bachelor of Commerce)',
    'B.C.A. (Bachelor of Computer Applications)',
    'M.A. (Master of Arts)',
    'M.Sc. (Master of Science)',
    'M.Com. (Master of Commerce)',
    'Other',
];

const GROUPS = {
    'B.A. (Bachelor of Arts)': ['Arts Group A', 'Arts Group B', 'Arts Group C'],
    'B.Sc. (Bachelor of Science)': ['PCM (Physics, Chemistry, Maths)', 'PCB (Physics, Chemistry, Biology)', 'CBZ (Chemistry, Botany, Zoology)'],
    'B.Com. (Bachelor of Commerce)': ['Regular Commerce', 'Computer Application'],
    'B.C.A. (Bachelor of Computer Applications)': ['BCA Group'],
    'M.A. (Master of Arts)': ['M.A. Group A', 'M.A. Group B'],
    'M.Sc. (Master of Science)': ['M.Sc. Group A', 'M.Sc. Group B'],
    'M.Com. (Master of Commerce)': ['M.Com. Group'],
    Other: ['General Group'],
};

const MAJOR_SUBJECTS = {
    'B.Sc. (Bachelor of Science)': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Botany', 'Zoology', 'Computer Science', 'Biotechnology'],
    'B.A. (Bachelor of Arts)': ['History', 'Geography', 'Political Science', 'Economics', 'Sociology', 'Psychology', 'Hindi', 'English', 'Philosophy'],
    'B.Com. (Bachelor of Commerce)': ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Financial Management'],
    'B.C.A. (Bachelor of Computer Applications)': ['Programming in C', 'Data Structures', 'Database Management', 'Web Technology', 'Computer Networks'],
    'M.Sc. (Master of Science)': ['Advanced Physics', 'Advanced Chemistry', 'Advanced Mathematics', 'Advanced Biology', 'Computer Science'],
    'M.A. (Master of Arts)': ['Hindi Literature', 'English Literature', 'History', 'Political Science', 'Economics'],
    'M.Com. (Master of Commerce)': ['Advanced Accounting', 'Business Administration', 'Financial Management', 'Marketing Management'],
    Other: ['General Studies'],
};

const MINOR_SUBJECTS = {
    'B.Sc. (Bachelor of Science)': ['Statistics', 'Electronics', 'Microbiology', 'Biotechnology', 'Computer Applications', 'Biochemistry'],
    'B.A. (Bachelor of Arts)': ['Music', 'Drawing / Fine Arts', 'Sanskrit', 'Physical Education', 'Home Science'],
    'B.Com. (Bachelor of Commerce)': ['Statistics', 'Computer Applications', 'Banking & Finance', 'Tax Practices'],
    'B.C.A. (Bachelor of Computer Applications)': ['Mathematics', 'Statistics', 'Business Communication'],
    'M.Sc. (Master of Science)': ['Statistics', 'Electronics', 'Biotechnology'],
    'M.A. (Master of Arts)': ['Journalism', 'Public Administration', 'Sociology'],
    'M.Com. (Master of Commerce)': ['Tax Management', 'Banking', 'E-Commerce'],
    Other: ['Environmental Studies'],
};

const OE_SUBJECTS = [
    'Environmental Studies', 'Disaster Management', 'Human Rights & Duties',
    'Gender Studies', 'Digital Literacy', 'E-Commerce & Business',
    'Health & Hygiene', 'Value Education', 'Rural Development', 'Yoga & Physical Education',
];

export default function StudentRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        enrollmentNumber: '', course: '', studentType: 'Regular', group: '',
        majorSubject: '', minorSubject: '', openElective: '', projectType: '',
    });
    const [profilePic, setProfilePic] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = (e) => {
        const { name, value } = e.target;
        if (name === 'course') {
            setForm(prev => ({ ...prev, course: value, group: '', majorSubject: '', minorSubject: '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Profile picture must be under 5 MB'); return; }
        setProfilePic(file);
        setProfilePicPreview(URL.createObjectURL(file));
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) return setError('Passwords do not match');
        if (!form.group) return setError('Please select a group');

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('email', form.email);
            fd.append('password', form.password);
            fd.append('role', 'student');
            fd.append('enrollmentNumber', form.enrollmentNumber);
            fd.append('course', form.course);
            fd.append('studentType', form.studentType);
            fd.append('group', form.group);
            if (form.majorSubject) fd.append('majorSubject', form.majorSubject);
            if (form.minorSubject) fd.append('minorSubject', form.minorSubject);
            if (form.openElective) fd.append('openElective', form.openElective);
            if (form.projectType) fd.append('projectType', form.projectType);
            if (profilePic) fd.append('profilePicture', profilePic);

            const data = await apiFetchForm('/auth/register', fd);
            login(data.user, data.token);
            navigate('/student/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const availableGroups = form.course ? GROUPS[form.course] || [] : [];
    const availableMajor = form.course ? MAJOR_SUBJECTS[form.course] || [] : [];
    const availableMinor = form.course ? MINOR_SUBJECTS[form.course] || [] : [];

    return (
        <div className="auth-page">
            <button className="back-home" onClick={() => navigate('/')}>← Back to Home</button>

            <div className="auth-card wide">
                <div className="auth-header">
                    <div className="auth-avatar">🎓</div>
                    <p className="college-name">GDC Chhindwara · New Student Registration</p>
                    <h1>Create Student Account</h1>
                    <p>Fill in your details to register. A teacher will verify your account.</p>
                </div>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form className="auth-form" onSubmit={submit}>

                    {/* ── Profile Picture ── */}
                    <div className="form-group" style={{ alignItems: 'center' }}>
                        <label>Profile Picture <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                        <div className="profile-pic-upload" onClick={() => fileRef.current?.click()}>
                            {profilePicPreview
                                ? <img src={profilePicPreview} alt="Preview" className="profile-pic-preview" />
                                : <div className="profile-pic-placeholder">📷<br /><small>Click to upload</small></div>
                            }
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                        {profilePic && <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>{profilePic.name}</small>}
                    </div>

                    {/* ── Row 1: Name + Enrollment ── */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input name="name" value={form.name} onChange={handle} placeholder="Your full name" required />
                        </div>
                        <div className="form-group">
                            <label>Enrollment Number</label>
                            <input name="enrollmentNumber" value={form.enrollmentNumber} onChange={handle} placeholder="e.g. 0701CS211001" required />
                        </div>
                    </div>

                    {/* ── Email ── */}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value={form.email} onChange={handle} placeholder="your@email.com" required />
                    </div>

                    {/* ── Row 2: Course + Group ── */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Course</label>
                            <select name="course" value={form.course} onChange={handle} required>
                                <option value="">Select course</option>
                                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Group / Stream</label>
                            <select name="group" value={form.group} onChange={handle} required disabled={!form.course}>
                                <option value="">Select group</option>
                                {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── Student Type ── */}
                    <div className="form-group">
                        <label>Student Type</label>
                        <select name="studentType" value={form.studentType} onChange={handle} required>
                            <option value="Regular">Regular</option>
                            <option value="Private">Private</option>
                        </select>
                    </div>

                    {/* ── SUBJECT SECTION ── */}
                    <div className="form-section-divider"><span>📚 Academic Subjects</span></div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Major Subject</label>
                            <select name="majorSubject" value={form.majorSubject} onChange={handle} disabled={!form.course}>
                                <option value="">Select Major Subject</option>
                                {availableMajor.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Minor Subject</label>
                            <select name="minorSubject" value={form.minorSubject} onChange={handle} disabled={!form.course}>
                                <option value="">Select Minor Subject</option>
                                {availableMinor.filter(s => s !== form.majorSubject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Open Elective (OE)</label>
                            <select name="openElective" value={form.openElective} onChange={handle}>
                                <option value="">Select Open Elective</option>
                                {OE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Project / Internship</label>
                            <select name="projectType" value={form.projectType} onChange={handle}>
                                <option value="">Select Type</option>
                                <option value="Project">📁 Project</option>
                                <option value="Internship">🏢 Internship</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Password ── */}
                    <div className="form-section-divider"><span>🔒 Security</span></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handle} placeholder="At least 6 characters" required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="Re-enter password" required />
                        </div>
                    </div>

                    <div className="alert alert-warning" style={{ marginTop: 4 }}>
                        ⏳ Your account will be <strong>Pending Verification</strong> until approved by a teacher.
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" />Registering...</> : '✅ Register & Continue'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <span onClick={() => navigate('/student/login')}>Login here</span>
                </div>
            </div>
        </div>
    );
}
