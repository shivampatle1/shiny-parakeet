import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import './Auth.css';

export default function TeacherLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ ...form, role: 'teacher' }),
            });
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

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.1))', borderColor: 'rgba(6,182,212,0.5)' }}>
                        👩‍🏫
                    </div>
                    <p className="college-name" style={{ color: 'var(--accent)' }}>GDC Chhindwara · Faculty Portal</p>
                    <h1>Teacher Login</h1>
                    <p>Access the faculty management dashboard</p>
                </div>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form className="auth-form" onSubmit={submit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handle}
                            placeholder="faculty@gdc-chhindwara.ac.in"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handle}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
                    >
                        {loading ? <><span className="spinner" />Logging in...</> : '🔓 Faculty Login'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <div className="auth-footer">
                    New faculty member?{' '}
                    <span onClick={() => navigate('/teacher/register')}>Register here</span>
                </div>
                <div className="auth-footer" style={{ marginTop: 6 }}>
                    Are you a student?{' '}
                    <span onClick={() => navigate('/student/login')}>Student Login</span>
                </div>
            </div>
        </div>
    );
}
