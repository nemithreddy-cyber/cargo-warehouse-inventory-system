import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FaPlaneArrival } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS, roleBadgeColors } from '../config/permissions';

export default function LoginPage() {
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState('Password@123');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const result = await login(email, password, remember);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message);
  };

  const fillDemo = (demoUser) => {
    setEmail(demoUser.email);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaPlaneArrival className="text-white text-3xl" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-1">Cargo Warehouse</h1>
            <p className="text-blue-200 text-sm">Inventory Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-white text-xl font-semibold mb-1">Welcome back</h2>
            <p className="text-blue-200 text-sm mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-blue-200 text-xs font-medium mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                  <MdEmail className="text-blue-300 flex-shrink-0" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@cargowarehouse.com"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-xs font-medium mb-1.5 block">Password</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                  <MdLock className="text-blue-300 flex-shrink-0" />
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-sm w-full"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-blue-300 hover:text-white transition-colors">
                    {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input id="remember-checkbox" type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-blue-200 text-sm">Remember me</span>
                </label>
                <a href="#" className="text-amber-400 text-sm hover:text-amber-300 transition-colors">Forgot password?</a>
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-amber-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Role Quick Login */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-blue-300 text-xs font-semibold text-center mb-3">
                🔑 Quick Login — Select a Role
              </p>
              <div className="space-y-1.5">
                {DEMO_USERS.map((demo) => {
                  const c = roleBadgeColors[demo.role] || {};
                  const isSelected = email === demo.email;
                  return (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => fillDemo(demo)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all text-xs ${
                        isSelected
                          ? 'bg-white/20 border border-white/30'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${c.bg || 'bg-slate-200'} ${c.text || 'text-slate-700'}`}>
                          {demo.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{demo.name}</p>
                          <p className="text-blue-300 text-[10px] truncate">{demo.email}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.bg || 'bg-slate-100'} ${c.text || 'text-slate-600'}`}>
                        {demo.role.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-blue-400/60 text-[10px] text-center mt-2">Password for all: <span className="text-blue-300 font-mono">Password@123</span></p>
            </div>
          </div>
        </div>

        <p className="text-blue-400 text-xs text-center mt-6">
          © 2026 Cargo Warehouse Inventory System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
