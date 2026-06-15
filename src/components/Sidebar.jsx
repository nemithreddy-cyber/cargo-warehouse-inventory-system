import { NavLink, useNavigate } from 'react-router-dom';
import { MdLogout, MdClose } from 'react-icons/md';
import { FaPlaneArrival } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTasks } from '../context/TaskContext';
import { getRoleNav, roleBadgeColors } from '../config/permissions';

export default function Sidebar() {
  const { isOpen, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { pendingCount, inProgressCount } = useTasks();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = getRoleNav(user?.role);
  const taskBadgeCount = pendingCount + inProgressCount;
  const roleColors = roleBadgeColors[user?.role] || roleBadgeColors['Warehouse Staff'];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <FaPlaneArrival className="text-white text-lg" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-white font-bold text-sm leading-tight">Cargo Warehouse</h1>
          <p className="text-blue-300 text-xs">Inventory System</p>
        </div>
      </div>

      {/* User info with role badge */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleColors.bg} ${roleColors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${roleColors.dot}`}></span>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-2 mb-3">Main Menu</p>
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group w-full ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="text-lg flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>

                {/* Notification badge */}
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
                {/* Task badge */}
                {label === 'My Tasks' && taskBadgeCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-xs font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                    {taskBadgeCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 w-full"
        >
          <MdLogout className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 z-50 transform transition-transform duration-300 lg:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={closeMobileSidebar}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <MdClose className="text-xl" />
        </button>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        {sidebarContent}
      </div>
    </>
  );
}
