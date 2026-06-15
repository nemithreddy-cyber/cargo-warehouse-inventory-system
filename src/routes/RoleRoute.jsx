import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleRoute — wraps a single page element with a role guard.
 * If the user's role is not in `allowedRoles`, renders UnauthorizedPage.
 *
 * Usage:
 *   <RoleRoute allowedRoles={['Super Admin']} element={<UserManagementPage />} />
 */
export default function RoleRoute({ allowedRoles = [], element }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return element;
}
