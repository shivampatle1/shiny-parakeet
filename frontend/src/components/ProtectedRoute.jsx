import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="page-wrapper" style={{ justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 48, height: 48 }} />
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
    }

    return children;
}
