import { useState, useEffect } from 'react';
import {
  MdPeople, MdAdd, MdEdit, MdDelete, MdClose, MdCheck,
  MdSearch, MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdToggleOn, MdToggleOff, MdShield, MdAccountCircle
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { ROLES, roleBadgeColors, DEMO_USERS } from '../config/permissions';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonPulse } from '../components/SkeletonLoader';

const ALL_ROLES = Object.values(ROLES);

// Seed offline users
const OFFLINE_USERS = DEMO_USERS.map((u, i) => ({
  id: i + 1,
  name: u.name,
  email: u.email,
  role: u.role,
  is_active: 1,
  created_at: '2026-06-01T00:00:00Z',
}));

const API_BASE = '/api';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RoleBadge({ role }) {
  const c = roleBadgeColors[role] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {role}
    </span>
  );
}

export default function UserManagementPage() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useOffline, setUseOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: ROLES.WAREHOUSE_STAFF });

  const headers = {
    'Content-Type': 'application/json',
    ...(token && token !== 'dummy-token' ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || data.data?.users || data.data || []);
      setUseOffline(false);
    } catch {
      setUsers(OFFLINE_USERS);
      setUseOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', username: '', email: '', password: '', role: ROLES.WAREHOUSE_STAFF });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ name: u.name, username: u.username || '', email: u.email, password: '', role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (useOffline) {
        if (editingUser) {
          setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, ...form } : u));
        } else {
          const newUser = { id: Date.now(), ...form, is_active: 1, created_at: new Date().toISOString() };
          setUsers((prev) => [newUser, ...prev]);
        }
        setShowModal(false);
        return;
      }
      if (editingUser) {
        const body = { name: form.name, username: form.username, email: form.email, role: form.role };
        const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? (data.user || data.data?.user || u) : u));
      } else {
        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST', headers, body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers((prev) => [data.user || data.data?.user || {}, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('User operation failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    const newActive = u.is_active ? 0 : 1;
    if (useOffline) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: newActive } : x));
      return;
    }
    try {
      await fetch(`${API_BASE}/users/${u.id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ is_active: newActive }),
      });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: newActive } : x));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (useOffline) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      return;
    }
    try {
      await fetch(`${API_BASE}/users/${deleteTarget.id}`, { method: 'DELETE', headers });
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    } catch (err) { console.error(err); }
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <SkeletonPulse key={i} className="h-16 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdPeople className="text-blue-600" />
            User Management
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} total users in the system</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
        >
          <MdAdd className="text-lg" />
          Add User
        </button>
      </div>

      {/* Stats per role */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ALL_ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length;
          const c = roleBadgeColors[role] || {};
          return (
            <div key={role} className={`border rounded-2xl p-3 ${c.bg || 'bg-slate-50'} border-slate-200`}>
              <p className={`text-2xl font-bold ${c.text || 'text-slate-700'}`}>{count}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">{role}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <MdSearch className="text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
          />
        </div>
        <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {['All', ...ALL_ROLES].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === r ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r === 'All' ? 'All Roles' : r.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Joined</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No users found</td></tr>
              ) : filtered.map((u) => {
                const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                            {u.name}
                            {isSelf && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {u.is_active ? <MdToggleOn className="text-xl text-green-500" /> : <MdToggleOff className="text-xl" />}
                        </button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <MdEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => !isSelf && setDeleteTarget(u)}
                          disabled={isSelf}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <MdDelete className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <MdShield /> {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <p className="text-blue-200 text-xs mt-0.5">{editingUser ? 'Update user details or role' : 'Create a new system user'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white p-1 rounded-lg">
                <MdClose className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name *</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition">
                  <MdPerson className="text-slate-400 flex-shrink-0" />
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    className="bg-transparent text-sm text-slate-700 outline-none w-full" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Username *</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition">
                  <MdAccountCircle className="text-slate-400 flex-shrink-0" />
                  <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. johnsmith"
                    className="bg-transparent text-sm text-slate-700 outline-none w-full" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address *</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition">
                  <MdEmail className="text-slate-400 flex-shrink-0" />
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@cargowarehouse.com"
                    className="bg-transparent text-sm text-slate-700 outline-none w-full" />
                </div>
              </div>
              {!editingUser && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Password *</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition">
                    <MdLock className="text-slate-400 flex-shrink-0" />
                    <input type={showPass ? 'text' : 'password'} required value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="bg-transparent text-sm text-slate-700 outline-none w-full" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-slate-600">
                      {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role *</label>
                <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdCheck />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        confirmColor="red"
      />
    </div>
  );
}
