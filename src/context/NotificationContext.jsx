import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

const defaultNotifications = [
  {
    id: 'notif-1',
    title: 'Cargo Ready for Dispatch',
    text: '2 cargo items are now ready for dispatch in Zone A.',
    time: '5m ago',
    type: 'warning',
    read: false,
    date: '2026-06-12 09:50:00',
  },
  {
    id: 'notif-2',
    title: 'Cargo Delivered',
    text: 'Cargo CW-2024-005 has been successfully delivered to Hong Kong.',
    time: '1h ago',
    type: 'success',
    read: false,
    date: '2026-06-12 08:45:00',
  },
  {
    id: 'notif-3',
    title: 'Warehouse Capacity Alert',
    text: 'Warehouse Zone C utilization has reached 82% capacity.',
    time: '2h ago',
    type: 'critical',
    read: false,
    date: '2026-06-12 07:30:00',
  },
  {
    id: 'notif-4',
    title: 'New Cargo Received',
    text: 'New cargo shipment CW-2024-012 from New York has been checked in.',
    time: '3h ago',
    type: 'info',
    read: false,
    date: '2026-06-12 06:15:00',
  },
  {
    id: 'notif-5',
    title: 'Dispatch Delayed',
    text: 'Dispatch DIS-003 is experiencing custom clearance delays.',
    time: '5h ago',
    type: 'critical',
    read: true,
    date: '2026-06-12 04:00:00',
  },
  {
    id: 'notif-6',
    title: 'New Report Generated',
    text: 'Monthly logistics operations report for June 2026 is ready.',
    time: '1d ago',
    type: 'info',
    read: true,
    date: '2026-06-11 15:30:00',
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('cwis_notifications');
    return stored ? JSON.parse(stored) : defaultNotifications;
  });

  useEffect(() => {
    localStorage.setItem('cwis_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      read: false,
      date: new Date().toISOString(),
      time: 'Just now',
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
