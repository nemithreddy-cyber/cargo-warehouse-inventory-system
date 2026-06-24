import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdMenu, MdNotifications, MdSearch, MdPerson, MdLogout, MdSettings } from 'react-icons/md';
import OrbemLogo from './OrbemLogo';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/cargo': 'Cargo List',
  '/cargo/add': 'Add New Cargo',
  '/warehouse': 'Warehouse Management',
  '/dispatch': 'Dispatch Management',
  '/reports': 'Reports',
  '/activity-logs': 'Activity Logs',
  '/notifications': 'Notification Center',
  '/profile': 'Profile',
  '/tasks': 'My Tasks',
  '/users': 'User Management',
  '/unauthorized': 'Access Denied',
};

export default function Navbar() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const title = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/cargo/') ? 'Cargo Details' : 'ORBEM Solutions');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'success': return 'bg-green-500';
      case 'info':
      default: return 'bg-blue-500';
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { toggleSidebar(); toggleMobileSidebar(); }}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          id="mobile-menu-btn"
        >
          <MdMenu className="text-slate-600 text-xl" />
        </button>
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 transition-colors"
          id="sidebar-toggle-btn"
        >
          <MdMenu className="text-slate-600 text-xl" />
        </button>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <OrbemLogo className="w-5 h-5 text-amber-500 hidden sm:block" />
          </Link>
          <h2 className="text-slate-800 font-semibold text-base lg:text-lg">{title}</h2>
        </div>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-2">
        {/* Search (desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-48 lg:w-64">
          <MdSearch className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Quick search..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            id="notif-btn"
          >
            <MdNotifications className="text-slate-600 text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                )}
              </div>
              {recentNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-400 text-sm">
                  No notifications
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors ${!n.read ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotifColor(n.type)}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="px-4 py-3 text-center border-t border-slate-50">
                <button
                  onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            id="user-menu-btn"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name?.split(' ')[0]}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 w-full text-left transition-colors"
              >
                <MdLogout className="text-red-500" />
                <span className="text-sm text-red-600">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
