import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ROLES } from '../config/permissions';

const TaskContext = createContext(null);

const API_BASE = 'http://localhost:5000/api';

// ─── Sample offline data (used when backend is unavailable) ───
const SAMPLE_TASKS = [
  { id: 1,  title: 'Inspect Zone A Storage Slots',       description: 'Conduct a full inspection of all Zone A storage slots.',      assigned_to: 2, assigned_by: 1, assigned_to_name: 'Ahmed Al-Rashidi',  assigned_by_name: 'Super Admin', status: 'Pending',     priority: 'High',   due_date: '2026-06-20', cargo_id: null,          created_at: '2026-06-15T08:00:00Z' },
  { id: 2,  title: 'Verify CRG-20240001 Weight Entry',   description: 'Double check the chargeable weight for CRG-20240001.',       assigned_to: 2, assigned_by: 1, assigned_to_name: 'Ahmed Al-Rashidi',  assigned_by_name: 'Super Admin', status: 'In Progress', priority: 'Medium', due_date: '2026-06-16', cargo_id: 'CRG-20240001', created_at: '2026-06-14T08:00:00Z' },
  { id: 3,  title: 'Prepare June Dispatch Report',       description: 'Compile all June dispatch records into the monthly summary.',  assigned_to: 3, assigned_by: 1, assigned_to_name: 'Fatima Al-Zahra',  assigned_by_name: 'Super Admin', status: 'Pending',     priority: 'High',   due_date: '2026-06-25', cargo_id: null,          created_at: '2026-06-15T08:00:00Z' },
  { id: 4,  title: 'Coordinate DSP-20240003 Delivery',   description: 'Follow up with driver and update delivery status.',          assigned_to: 3, assigned_by: 1, assigned_to_name: 'Fatima Al-Zahra',  assigned_by_name: 'Super Admin', status: 'In Progress', priority: 'Urgent', due_date: '2026-06-15', cargo_id: 'CRG-20240008', created_at: '2026-06-14T08:00:00Z' },
  { id: 5,  title: 'Draft Cargo Documentation CRG-006',  description: 'Prepare export documentation and customs clearance forms.',  assigned_to: 4, assigned_by: 1, assigned_to_name: 'Hassan Mohammed',  assigned_by_name: 'Super Admin', status: 'Pending',     priority: 'High',   due_date: '2026-06-18', cargo_id: 'CRG-20240006', created_at: '2026-06-15T08:00:00Z' },
  { id: 6,  title: 'Archive May 2026 Shipment Docs',     description: 'Scan, label, and archive all May 2026 shipment docs.',       assigned_to: 4, assigned_by: 1, assigned_to_name: 'Hassan Mohammed',  assigned_by_name: 'Super Admin', status: 'Completed',   priority: 'Low',    due_date: '2026-06-10', cargo_id: null,          created_at: '2026-06-09T08:00:00Z' },
  { id: 7,  title: 'Reconcile June Cargo Billing',       description: 'Match chargeable weight entries against customer invoices.',  assigned_to: 5, assigned_by: 1, assigned_to_name: 'Mariam Khalid',    assigned_by_name: 'Super Admin', status: 'In Progress', priority: 'High',   due_date: '2026-06-22', cargo_id: null,          created_at: '2026-06-14T08:00:00Z' },
  { id: 8,  title: 'Process Invoice for Global Traders', description: 'Generate and send invoice for CRG-20240002.',               assigned_to: 5, assigned_by: 1, assigned_to_name: 'Mariam Khalid',    assigned_by_name: 'Super Admin', status: 'Pending',     priority: 'Medium', due_date: '2026-06-19', cargo_id: 'CRG-20240002', created_at: '2026-06-14T08:00:00Z' },
  { id: 9,  title: 'Update Zone B Capacity Records',     description: 'Record new storage capacity numbers for Zone B.',           assigned_to: 2, assigned_by: 1, assigned_to_name: 'Ahmed Al-Rashidi',  assigned_by_name: 'Super Admin', status: 'Completed',   priority: 'Low',    due_date: '2026-06-12', cargo_id: null,          created_at: '2026-06-10T08:00:00Z' },
  { id: 10, title: 'Audit Activity Logs — June 2026',    description: 'Review and flag suspicious activity in system logs.',        assigned_to: 1, assigned_by: 1, assigned_to_name: 'Super Admin',       assigned_by_name: 'Super Admin', status: 'Pending',     priority: 'Medium', due_date: '2026-06-30', cargo_id: null,          created_at: '2026-06-15T08:00:00Z' },
];

const USER_ID_MAP = {
  'admin@cargowarehouse.com':    1,
  'warehouse@cargowarehouse.com':2,
  'ops@cargowarehouse.com':      3,
  'docs@cargowarehouse.com':     4,
  'accounts@cargowarehouse.com': 5,
};

export const TaskProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useOffline, setUseOffline] = useState(false);

  const isAdmin = user?.role === ROLES.SUPER_ADMIN;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && token !== 'dummy-token' ? { Authorization: `Bearer ${token}` } : {}),
  });

  // Filter tasks for offline mode based on role
  const getOfflineTasks = useCallback(() => {
    if (!user) return [];
    if (isAdmin) return SAMPLE_TASKS;
    const userId = USER_ID_MAP[user.email] || user.id;
    return SAMPLE_TASKS.filter((t) => t.assigned_to === userId);
  }, [user, isAdmin]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, { headers: getHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setTasks(data.data?.data || data.data || []);
      setUseOffline(false);
    } catch {
      // Fall back to offline sample data
      setTasks(getOfflineTasks());
      setUseOffline(true);
    } finally {
      setLoading(false);
    }
  }, [user, token, getOfflineTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Tasks assigned to current user
  const myTasks = isAdmin
    ? tasks
    : tasks.filter((t) => {
        const userId = USER_ID_MAP[user?.email] || user?.id;
        return t.assigned_to === userId || t.assigned_to === user?.id;
      });

  const pendingCount     = myTasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount  = myTasks.filter((t) => t.status === 'In Progress').length;
  const completedCount   = myTasks.filter((t) => t.status === 'Completed').length;

  /** Create a new task (admin only, offline-aware) */
  const createTask = async (taskData) => {
    if (useOffline) {
      const newTask = {
        ...taskData,
        id: Date.now(),
        assigned_to_name: 'Staff',
        assigned_by_name: user?.name || 'Admin',
        created_at: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    }
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to create task');
    const data = await res.json();
    const task = data.data?.task || data.data;
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  /** Update task status (all roles) or full update (admin) */
  const updateTask = async (id, fields) => {
    if (useOffline) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
      return;
    }
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const data = await res.json();
    const updated = data.data?.task || data.data;
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  /** Delete a task (admin only) */
  const deleteTask = async (id) => {
    if (useOffline) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        myTasks,
        loading,
        useOffline,
        pendingCount,
        inProgressCount,
        completedCount,
        createTask,
        updateTask,
        deleteTask,
        refetch: fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
