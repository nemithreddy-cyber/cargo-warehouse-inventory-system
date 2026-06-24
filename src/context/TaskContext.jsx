import { createContext, useContext, useState } from 'react';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const myTasks = [];
  const pendingCount = 0;
  const inProgressCount = 0;
  const completedCount = 0;

  const createTask = async () => {};
  const updateTask = async () => {};
  const deleteTask = async () => {};

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
        refetch: () => {},
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
