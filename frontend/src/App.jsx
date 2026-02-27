import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import TeacherLogin from './pages/TeacherLogin';
import TeacherRegister from './pages/TeacherRegister';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/student/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace /> : <StudentLogin />} />
      <Route path="/student/register" element={user ? <Navigate to="/student/dashboard" replace /> : <StudentRegister />} />
      <Route path="/teacher/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace /> : <TeacherLogin />} />
      <Route path="/teacher/register" element={user ? <Navigate to="/teacher/dashboard" replace /> : <TeacherRegister />} />

      {/* Protected */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
