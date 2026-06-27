import { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdPeople, MdVerifiedUser, MdBlock } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { SkeletonTable, SkeletonPulse } from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/ToastContainer';
import api from '../utils/api';
import { ROLES, roleBadgeColors } from '../config/permissions';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals and Dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Warehouse Staff',
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    is_active: 1,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      // Backend returns { success: true, data: { users: [...] } }
      const fetched = res.data.data?.users || res.data.users || [];
      setUsers(fetched);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.username || !addForm.email || !addForm.password) {
      toastError('All fields are required.');
      return;
    }
    
    try {
      await api.post('/users', addForm);
      success(`User "${addForm.name}" created successfully.`);
      setShowAddModal(false);
      setAddForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'Warehouse Staff',
      });
      fetchUsers();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.username || !editForm.email || !editForm.role) {
      toastError('All fields are required.');
      return;
    }

    try {
      await api.patch(`/users/${selectedUser.id}`, editForm);
      success(`User "${editForm.name}" updated successfully.`);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleDeleteClick = (user) => {
    if (user.id === currentUser.id) {
      toastError('You cannot delete your own account.');
      return;
    }
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      success(`User "${selectedUser.name}" deleted successfully.`);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active === 1 || u.is_active === true).length;
  const adminCount = users.filter((u) => u.role === ROLES.SUPER_ADMIN).length;

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && (u.is_active === 1 || u.is_active === true)) ||
      (statusFilter === 'Inactive' && (u.is_active === 0 || u.is_active === false));

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage dashboard users, update roles, and suspend/activate accounts.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-amber-500/20"
        >
          <MdAdd className="text-lg" />
          Add New User
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            <MdPeople />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</p>
            {loading ? <SkeletonPulse className="w-10 h-6 mt-1" /> : <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalCount}</h3>}
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            <MdVerifiedUser />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Staff</p>
            {loading ? <SkeletonPulse className="w-10 h-6 mt-1" /> : <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{activeCount}</h3>}
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            <MdBlock className="text-red-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Administrators</p>
            {loading ? <SkeletonPulse className="w-10 h-6 mt-1" /> : <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{adminCount}</h3>}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <MdSearch className="text-slate-400 flex-shrink-0 text-xl" />
          <input
            type="text"
            placeholder="Search by name, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-500"
            >
              <option value="All">All Roles</option>
              {Object.values(ROLES).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users table / Loading */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const badgeColors = roleBadgeColors[u.role] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">@{u.username}</td>
                        <td className="px-6 py-4 text-slate-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors.bg} ${badgeColors.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeColors.dot}`}></span>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.is_active === 1 || u.is_active === true ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(u)}
                              className="p-1.5 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-slate-400 transition-colors"
                              title="Edit User"
                            >
                              <MdEdit className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                              title="Delete User"
                              disabled={u.id === currentUser.id}
                            >
                              <MdDelete className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User Account"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">Full Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Ahmed Al-Rashidi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">Username</label>
              <input
                type="text"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                placeholder="ahmed123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 text-xs font-semibold mb-1 block">Email Address</label>
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="ahmed@cargowarehouse.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 text-xs font-semibold mb-1 block">Initial Password</label>
            <input
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 text-xs font-semibold mb-1 block">System Access Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            >
              {Object.values(ROLES).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-amber-500/20"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User Account"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ahmed Al-Rashidi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="ahmed123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 text-xs font-semibold mb-1 block">Email Address</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="ahmed@cargowarehouse.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">System Access Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              >
                {Object.values(ROLES).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 text-xs font-semibold mb-1 block">Account Access Status</label>
              <select
                value={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
              >
                <option value={1}>Active</option>
                <option value={0}>Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-amber-500/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete User Account"
        message={`Are you sure you want to delete user account "${selectedUser?.name}"? All associated tasks and activity logs for this user will be removed permanently. This action cannot be undone.`}
        confirmLabel="Delete Account"
        confirmColor="red"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
