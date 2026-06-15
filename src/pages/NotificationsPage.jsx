import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  MdNotifications,
  MdCheck,
  MdDelete,
  MdInfo,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdDrafts,
} from 'react-icons/md';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const getNotifStyle = (type) => {
    switch (type) {
      case 'critical':
        return {
          icon: MdError,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-100',
        };
      case 'warning':
        return {
          icon: MdWarning,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-100',
        };
      case 'success':
        return {
          icon: MdCheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-100',
        };
      case 'info':
      default:
        return {
          icon: MdInfo,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notification Center</h2>
          <p className="text-slate-500 text-sm">
            You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <MdDrafts className="text-lg" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f} ({
                f === 'all'
                  ? notifications.length
                  : f === 'unread'
                  ? notifications.filter((n) => !n.read).length
                  : notifications.filter((n) => n.read).length
              })
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <MdNotifications className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No notifications found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
              There are no {filter !== 'all' ? filter : ''} notifications in your inbox at this time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => {
              const style = getNotifStyle(n.type);
              const Icon = style.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 p-5 hover:bg-slate-50/50 transition-colors ${
                    !n.read ? 'bg-slate-50/30' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} border ${style.border}`}
                  >
                    <Icon className={`text-xl ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                        {n.title}
                        {!n.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-2 font-mono">{n.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as Read"
                      >
                        <MdCheck className="text-lg" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
