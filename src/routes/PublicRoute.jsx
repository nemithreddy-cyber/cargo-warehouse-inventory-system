import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * PublicRoute — only accessible when NOT logged in.
 * Handles redirection between /login and /register depending on if users exist.
 */
export default function PublicRoute() {
  const { user, loading, hasUsers } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  // If no users exist, redirect to /register
  if (!hasUsers && location.pathname !== '/register') {
    return <Navigate to="/register" replace />;
  }

  // If users already exist, redirect from /register to /login
  if (hasUsers && location.pathname === '/register') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
