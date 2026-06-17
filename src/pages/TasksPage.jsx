import { useState, useEffect } from 'react';
import {
  MdAssignment, MdAdd, MdClose, MdCheck, MdDelete, MdEdit,
  MdCalendarToday, MdPerson, MdInventory, MdPending,
  MdPlayArrow, MdCheckCircle, MdSearch, MdFilterList,
} from 'react-icons/md';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/permissions';
import { SkeletonPulse } from '../components/SkeletonLoader';
import api from '../utils/api';

const STATUSES = ['All', 'Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_COLORS = {
  Low:    { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  Medium: { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
  High:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Urgent: { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
};
const STATUS_COLORS = {
  'Pending':     { bg: 'bg-slate-100', text: 'text-slate-600', icon: MdPending },
  'In Progress': { bg: 'bg-blue-100',  text: 'text-blue-700',  icon: MdPlayArrow },
  'Completed':   { bg: 'bg-green-100', text: 'text-green-700', icon: MdCheckCircle },
};

// Sample users for task assignment (offline fallback)
const ASSIGNABLE_USERS = [
  { id: 1, name: 'Super Admin',         role: 'Super Admin' },
  { id: 2, name: 'Ahmed Al-Rashidi',    role: 'Warehouse Staff' },
  { id: 3, name: 'Fatima Al-Zahra',     role: 'Operations Staff' },
  { id: 4, name: 'Hassan Mohammed',     role: 'Documentation Executive' },
  { id: 5, name: 'Mariam Khalid',       role: 'Accounts Staff' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'Completed') return false;
  return new Date(dateStr) < new Date();
}

export default function TasksPage() {
  const { tasks, myTasks, loading, createTask, updateTask, deleteTask, pendingCount, inProgressCount, completedCount } = useTasks();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN;

  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const res = await api.get('/users/active');
        const usersList = res.data?.users || res.data?.data?.users || res.data?.data || [];
        setActiveUsers(Array.isArray(usersList) ? usersList : []);
      } catch (err) {
        console.error('Failed to fetch active users', err);
      }
    };
    if (isAdmin) {
      fetchActiveUsers();
    }
  }, [isAdmin, showModal]);

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '', cargo_id: '',
  });

  const displayTasks = isAdmin ? tasks : myTasks;
  const totalCount = displayTasks.length;

  // Filter by tab + search
  const filtered = displayTasks.filter((t) => {
    const matchTab = activeTab === 'All' || t.status === activeTab;
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_to_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.cargo_id || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '', cargo_id: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      cargo_id: task.cargo_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: form.title,
          description: form.description,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          priority: form.priority,
          due_date: form.due_date || null,
          cargo_id: form.cargo_id || null,
        });
      } else {
        await createTask({
          title: form.title,
          description: form.description,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          assigned_by: user?.id,
          priority: form.priority,
          due_date: form.due_date || null,
          cargo_id: form.cargo_id || null,
        });
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteTask(id); } finally { setDeletingId(null); }
  };

  const tabCounts = {
    All: totalCount,
    Pending: pendingCount,
    'In Progress': inProgressCount,
    Completed: completedCount,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <SkeletonPulse key={i} className="h-20 rounded-2xl w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdAssignment className="text-blue-600" />
            {isAdmin ? 'Task Management' : 'My Tasks'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? `${totalCount} total tasks across all team members` : `${totalCount} tasks assigned to you`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
          >
            <MdAdd className="text-lg" />
            Assign Task
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalCount, color: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
          { label: 'Pending', value: pendingCount, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'In Progress', value: inProgressCount, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'Completed', value: completedCount, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.color}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <MdSearch className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, assignees, cargo ID..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <MdClose className="text-sm" />
            </button>
          )}
        </div>
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === s
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
              <span className="ml-1.5 text-[10px] font-bold opacity-70">{tabCounts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
            <MdAssignment className="text-slate-300 text-6xl mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No tasks found</p>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab !== 'All' ? `No ${activeTab} tasks.` : 'All caught up!'}
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS['Pending'];
            const StatusIcon = statusStyle.icon;
            const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Medium'];
            const overdue = isOverdue(task.due_date, task.status);

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  {/* Priority indicator bar */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                    task.priority === 'Urgent' ? 'bg-red-500' :
                    task.priority === 'High' ? 'bg-amber-500' :
                    task.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-300'
                  }`} />

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-slate-800 text-sm leading-snug mb-1 ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                          {task.priority}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="text-[10px]" />
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-2.5 flex-wrap text-xs text-slate-500">
                      {isAdmin && task.assigned_to_name && (
                        <span className="flex items-center gap-1">
                          <MdPerson className="text-blue-400" />
                          {task.assigned_to_name}
                        </span>
                      )}
                      {!isAdmin && task.assigned_by_name && (
                        <span className="flex items-center gap-1">
                          <MdPerson className="text-slate-400" />
                          Assigned by {task.assigned_by_name}
                        </span>
                      )}
                      {task.cargo_id && (
                        <span className="flex items-center gap-1">
                          <MdInventory className="text-amber-400" />
                          {task.cargo_id}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                          {overdue && <FaExclamationTriangle className="text-red-500 text-[10px]" />}
                          <MdCalendarToday className={overdue ? 'text-red-400' : 'text-slate-400'} />
                          {overdue ? 'Overdue · ' : 'Due '}{formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status changer */}
                    {task.status !== 'Completed' && (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}
                    {task.status === 'Completed' && (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                        <MdCheckCircle /> Done
                      </span>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit task"
                        >
                          <MdEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deletingId === task.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete task"
                        >
                          <MdDelete className="text-base" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{editingTask ? 'Edit Task' : 'Assign New Task'}</h3>
                <p className="text-blue-200 text-xs mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white p-1 rounded-lg">
                <MdClose className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Task Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Verify cargo weight for CRG-20240001"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details or instructions..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Assign To</label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">Select user...</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Due date */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Linked cargo */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Linked Cargo ID</label>
                  <input
                    type="text"
                    value={form.cargo_id}
                    onChange={(e) => setForm({ ...form, cargo_id: e.target.value })}
                    placeholder="e.g. CRG-20240001"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <MdCheck />}
                  {editingTask ? 'Save Changes' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
