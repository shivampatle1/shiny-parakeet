import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import './Auth.css';

export default function StudentLogin() {
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
                body: JSON.stringify({ ...form, role: 'student' }),
            });
            login(data.user, data.token);
            navigate('/student/dashboard');
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
                    <div className="auth-avatar">🎒</div>
                    <p className="college-name">GDC Chhindwara · Student Portal</p>
                    <h1>Student Login</h1>
                    <p>Access your academic dashboard</p>
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
                            placeholder="your@email.com"
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
                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" />Logging in...</> : '🔓 Login to Portal'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <span onClick={() => navigate('/student/register')}>Register here</span>
                </div>
                <div className="auth-footer" style={{ marginTop: 6 }}>
                    Are you a teacher?{' '}
                    <span onClick={() => navigate('/teacher/login')}>Teacher Login</span>
                </div>
            </div>
        </div>
    );
}
