import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPin from './pages/auth/ForgotPin';
import ResetPin from './pages/auth/ResetPin';

// Admin pages — these will be filled in later stages
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import History from './pages/admin/History';
import Settings from './pages/admin/Settings';

// Member pages
import MemberDashboard from './pages/member/MemberDashboard';
import MemberHistory from './pages/member/MemberHistory';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-pin" element={<ForgotPin />} />
          <Route path="/reset-pin" element={<ResetPin />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin/members" element={
            <ProtectedRoute requiredRole="admin"><Members /></ProtectedRoute>
          } />
          <Route path="/admin/history" element={
            <ProtectedRoute requiredRole="admin"><History /></ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>
          } />

          {/* Member routes */}
          <Route path="/member/dashboard" element={
            <ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>
          } />
          <Route path="/member/history" element={
            <ProtectedRoute requiredRole="member"><MemberHistory /></ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
