import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading ORBEM Solutions System..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
