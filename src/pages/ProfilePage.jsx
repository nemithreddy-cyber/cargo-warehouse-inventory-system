import { useState } from 'react';
import { MdEdit, MdSave, MdPerson, MdEmail, MdPhone, MdBusiness, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import ToastContainer from '../components/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/helpers';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toasts, success, error: toastError, removeToast } = useToast();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    updateUser(form);
    setSaving(false);
    setEditing(false);
    success('Profile updated successfully!');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    if (passForm.current !== 'password123') { setPassError('Current password is incorrect.'); return; }
    if (passForm.newPass.length < 8) { setPassError('New password must be at least 8 characters.'); return; }
    if (passForm.newPass !== passForm.confirm) { setPassError('Passwords do not match.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setPassForm({ current: '', newPass: '', confirm: '' });
    success('Password changed successfully!');
  };

  const toggle = (field) => setShowPass(p => ({ ...p, [field]: !p[field] }));

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors";
  const readonlyClass = "w-full px-4 py-3 rounded-xl border border-slate-100 text-sm text-slate-700 bg-slate-50";

  return (
    <div className="space-y-6 max-w-4xl">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-blue-200">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{user?.role}</span>
              <span className="text-blue-200 text-sm">{user?.department}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">48</p>
            <p className="text-blue-200 text-xs">Total Actions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">12</p>
            <p className="text-blue-200 text-xs">Cargo Managed</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{formatDate(user?.lastLogin?.split(' ')[0])}</p>
            <p className="text-blue-200 text-xs">Last Login</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Personal Information</h3>
            <button
              onClick={() => setEditing(!editing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${editing ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              <MdEdit className="text-base" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', icon: MdPerson, type: 'text' },
                { label: 'Email Address', key: 'email', icon: MdEmail, type: 'email' },
                { label: 'Phone Number', key: 'phone', icon: MdPhone, type: 'tel' },
                { label: 'Department', key: 'department', icon: MdBusiness, type: 'text' },
              ].map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{label}</label>
                  {editing ? (
                    <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                      <Icon className="text-slate-400 flex-shrink-0" />
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="bg-transparent text-sm text-slate-700 outline-none w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <Icon className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{user?.[key] || form[key] || '—'}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Read-only fields */}
              {[
                { label: 'Role', value: user?.role },
                { label: 'Member Since', value: formatDate(user?.joinedDate) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{label}</label>
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-600">{value}</span>
                  </div>
                </div>
              ))}

              {editing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
                >
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
                  ) : (
                    <><MdSave /> Save Changes</>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Change Password</h3>
            <p className="text-slate-400 text-xs mt-0.5">Demo hint: current password is "password123"</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {passError}
                </div>
              )}
              {[
                { label: 'Current Password', key: 'current' },
                { label: 'New Password', key: 'newPass' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{label}</label>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                    <MdLock className="text-slate-400 flex-shrink-0" />
                    <input
                      type={showPass[key] ? 'text' : 'password'}
                      value={passForm[key]}
                      onChange={(e) => setPassForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                      className="bg-transparent text-sm text-slate-700 outline-none w-full"
                    />
                    <button type="button" onClick={() => toggle(key)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass[key] ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password requirements */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">Password Requirements</p>
                {[
                  { text: 'At least 8 characters', met: passForm.newPass.length >= 8 },
                  { text: 'Contains a number', met: /\d/.test(passForm.newPass) },
                  { text: 'Passwords match', met: passForm.newPass && passForm.newPass === passForm.confirm },
                ].map((req) => (
                  <div key={req.text} className="flex items-center gap-2 text-xs mt-1">
                    <span className={req.met ? 'text-green-500' : 'text-slate-400'}>
                      {req.met ? '✓' : '○'}
                    </span>
                    <span className={req.met ? 'text-green-600' : 'text-slate-500'}>{req.text}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Updating...</>
                ) : (
                  <><MdLock /> Change Password</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
