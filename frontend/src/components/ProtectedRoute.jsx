import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects to login if not authenticated
// Redirects to correct dashboard based on role if role does not match
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
