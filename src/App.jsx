import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { NotificationProvider } from './context/NotificationContext';
import { TaskProvider } from './context/TaskContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import RoleRoute from './routes/RoleRoute';
import { ROLES } from './config/permissions';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CargoListPage from './pages/CargoListPage';
import AddCargoPage from './pages/AddCargoPage';
import CargoDetailsPage from './pages/CargoDetailsPage';
import WarehouseManagementPage from './pages/WarehouseManagementPage';
import DispatchManagementPage from './pages/DispatchManagementPage';
import ReportsPage from './pages/ReportsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import TasksPage from './pages/TasksPage';
import UserManagementPage from './pages/UserManagementPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <NotificationProvider>
            <TaskProvider>
              <Routes>
                {/* Public routes — redirect to dashboard if already logged in */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Tasks — all roles */}
                  <Route path="/tasks" element={<TasksPage />} />

                  {/* Cargo — Warehouse, Operations, Super Admin */}
                  <Route path="/cargo" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_EXEC, ROLES.ACCOUNTS_STAFF]}
                      element={<CargoListPage />}
                    />
                  } />
                  <Route path="/cargo/add" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS_STAFF]}
                      element={<AddCargoPage />}
                    />
                  } />
                  <Route path="/cargo/:id" element={<CargoDetailsPage />} />
                  <Route path="/cargo/:id/edit" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS_STAFF]}
                      element={<AddCargoPage />}
                    />
                  } />

                  {/* Warehouse — Warehouse Staff + Super Admin */}
                  <Route path="/warehouse" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF]}
                      element={<WarehouseManagementPage />}
                    />
                  } />

                  {/* Dispatch — Operations + Warehouse + Super Admin */}
                  <Route path="/dispatch" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS_STAFF]}
                      element={<DispatchManagementPage />}
                    />
                  } />

                  {/* Reports — Operations, Documentation, Accounts, Super Admin */}
                  <Route path="/reports" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_EXEC, ROLES.ACCOUNTS_STAFF]}
                      element={<ReportsPage />}
                    />
                  } />

                  {/* Activity Logs — Super Admin only */}
                  <Route path="/activity-logs" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN]}
                      element={<ActivityLogsPage />}
                    />
                  } />

                  {/* User Management — Super Admin only */}
                  <Route path="/users" element={
                    <RoleRoute
                      allowedRoles={[ROLES.SUPER_ADMIN]}
                      element={<UserManagementPage />}
                    />
                  } />
                </Route>

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </TaskProvider>
          </NotificationProvider>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
