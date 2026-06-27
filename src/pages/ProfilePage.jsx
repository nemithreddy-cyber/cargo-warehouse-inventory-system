import { useState } from 'react';
import { MdPerson, MdLock, MdEmail, MdCalendarToday } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import api from '../utils/api';
import { roleBadgeColors } from '../config/permissions';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toasts, success, error: toastError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Edit profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security / Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.username || !profileForm.email) {
      toastError('All profile fields are required.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.patch('/auth/profile', {
        name: profileForm.name,
        username: profileForm.username,
        email: profileForm.email,
      });

      const updatedUser = res.data.data?.user || res.data.user || {};
      updateUser(updatedUser);
      success('Profile updated successfully!');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.patch('/auth/profile', {
        password: newPassword,
      });

      success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleColors = roleBadgeColors[user?.role] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Profile Card Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-md">
              {user?.name?.charAt(0) || 'A'}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mt-4 leading-tight">{user?.name}</h2>
            <p className="text-slate-500 text-sm mt-1">@{user?.username}</p>
            
            <div className="mt-3 flex justify-center">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${roleColors.bg} ${roleColors.text}`}>
                <span className={`w-2 h-2 rounded-full ${roleColors.dot}`}></span>
                {user?.role}
              </span>
            </div>

            <div className="border-t border-slate-100 my-5"></div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <MdEmail className="text-slate-400 flex-shrink-0 text-lg" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <MdCalendarToday className="text-slate-400 flex-shrink-0 text-lg" />
                <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Settings Tabs */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-amber-500 text-amber-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <MdPerson className="text-lg" />
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-amber-500 text-amber-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <MdLock className="text-lg" />
              Security & Password
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* Overview & Edit Profile Tab */}
            {activeTab === 'overview' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Account Information</h3>
                  <p className="text-slate-500 text-xs">Update your personal account details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 text-xs font-semibold mb-2 block">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      placeholder="e.g. Ahmed Al-Rashidi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-xs font-semibold mb-2 block">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileChange}
                      placeholder="username"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 text-xs font-semibold mb-2 block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="email@cargowarehouse.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-70"
                  >
                    {profileLoading ? 'Saving changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Security Credentials</h3>
                  <p className="text-slate-500 text-xs">Ensure your account is using a secure password.</p>
                </div>

                <div>
                  <label className="text-slate-700 text-xs font-semibold mb-2 block">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 text-xs font-semibold mb-2 block">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-xs font-semibold mb-2 block">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-70"
                  >
                    {passwordLoading ? 'Updating password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
