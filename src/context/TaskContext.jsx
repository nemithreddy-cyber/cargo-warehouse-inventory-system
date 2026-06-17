import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ROLES } from '../config/permissions';
import api from '../utils/api';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === ROLES.SUPER_ADMIN;

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data?.data || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Tasks assigned to current user (admin sees all tasks)
  const myTasks = isAdmin
    ? tasks
    : tasks.filter((t) => t.assigned_to === user?.id);

  const pendingCount     = myTasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount  = myTasks.filter((t) => t.status === 'In Progress').length;
  const completedCount   = myTasks.filter((t) => t.status === 'Completed').length;

  /** Create a new task (admin only) */
  const createTask = async (taskData) => {
    const res = await api.post('/tasks', taskData);
    const task = res.data.data?.task || res.data.data;
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  /** Update task status (all roles) or full update (admin) */
  const updateTask = async (id, fields) => {
    const res = await api.patch(`/tasks/${id}`, fields);
    const updated = res.data.data?.task || res.data.data;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  /** Delete a task (admin only) */
  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        myTasks,
        loading,
        useOffline: false,
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
