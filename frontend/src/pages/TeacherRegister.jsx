import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetchForm } from '../lib/api';
import './Auth.css';

const DEPARTMENTS = [
    'Physics', 'Chemistry', 'Mathematics', 'Biology',
    'Commerce', 'Economics', 'Hindi', 'English',
    'History', 'Geography', 'Political Science',
    'Computer Science', 'Physical Education', 'Other',
];

const DESIGNATIONS = [
    'Professor', 'Associate Professor', 'Assistant Professor',
    'Lecturer', 'Guest Faculty', 'Head of Department',
];

export default function TeacherRegister() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        department: '', designation: '', bio: '',
    });
    const [profilePic, setProfilePic] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('email', form.email);
            fd.append('password', form.password);
            fd.append('role', 'teacher');
            fd.append('department', form.department);
            fd.append('designation', form.designation);
            if (form.bio) fd.append('bio', form.bio);
            if (profilePic) fd.append('profilePicture', profilePic);

            const data = await apiFetchForm('/auth/register', fd);
            login(data.user, data.token);
            navigate('/teacher/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <button className="back-home" onClick={() => navigate('/')}>← Back to Home</button>

            <div className="auth-card wide">
                <div className="auth-header">
                    <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.1))', borderColor: 'rgba(6,182,212,0.5)' }}>
                        🏫
                    </div>
                    <p className="college-name" style={{ color: 'var(--accent)' }}>GDC Chhindwara · Faculty Registration</p>
                    <h1>Register as Faculty</h1>
                    <p>Create your teacher account — you're approved instantly</p>
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

                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input name="name" value={form.name} onChange={handle} placeholder="Dr. / Prof. Your Name" required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={form.email} onChange={handle} placeholder="faculty@email.com" required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Department</label>
                            <select name="department" value={form.department} onChange={handle}>
                                <option value="">Select department</option>
                                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <select name="designation" value={form.designation} onChange={handle}>
                                <option value="">Select designation</option>
                                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── Bio ── */}
                    <div className="form-group">
                        <label>Short Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown on landing page)</span></label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handle}
                            rows={3}
                            placeholder="e.g. Specialist in Quantum Physics with 12 years of teaching experience…"
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={form.password} onChange={handle} placeholder="Min. 6 characters" required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="Re-enter password" required />
                        </div>
                    </div>

                    <div className="alert alert-success" style={{ marginTop: 4 }}>
                        ✅ Teacher accounts are <strong>auto-approved</strong> immediately.
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
                    >
                        {loading ? <><span className="spinner" />Registering...</> : '✅ Register Faculty Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <span onClick={() => navigate('/teacher/login')}>Login here</span>
                </div>
            </div>
        </div>
    );
}
