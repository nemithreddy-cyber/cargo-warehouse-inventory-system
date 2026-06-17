import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdPerson, MdAccountCircle } from 'react-icons/md';
import { FaPlaneArrival } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !username || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      username,
      email,
      password,
      role: 'Super Admin',
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-center">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <FaPlaneArrival className="text-white text-2xl" />
            </div>
            <h1 className="text-white text-xl font-bold mb-0.5">Cargo Warehouse</h1>
            <p className="text-blue-200 text-xs">Create Super Admin Account</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <h2 className="text-white text-lg font-semibold mb-1">Get Started</h2>
            <p className="text-blue-200 text-xs mb-5">Create the first administrative account to initialize the system</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-blue-200 text-xs font-medium mb-1 block">Full Name</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-blue-400 transition-colors">
                  <MdPerson className="text-blue-300 flex-shrink-0" />
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-xs font-medium mb-1 block">Username</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-blue-400 transition-colors">
                  <MdAccountCircle className="text-blue-300 flex-shrink-0" />
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-xs font-medium mb-1 block">Email Address</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-blue-400 transition-colors">
                  <MdEmail className="text-blue-300 flex-shrink-0" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cargowarehouse.com"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-xs font-medium mb-1 block">Password</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-blue-400 transition-colors">
                  <MdLock className="text-blue-300 flex-shrink-0" />
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-xs w-full"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-blue-300 hover:text-white transition-colors">
                    {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-blue-200 text-xs font-medium mb-1 block">Confirm Password</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-blue-400 transition-colors">
                  <MdLock className="text-blue-300 flex-shrink-0" />
                  <input
                    id="confirm-password-input"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-white placeholder-blue-300/60 outline-none text-xs w-full"
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-blue-300 hover:text-white transition-colors">
                    {showConfirmPass ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <button
                id="register-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-amber-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-xs"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Super Admin Account'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-amber-400 text-xs hover:text-amber-300 transition-colors font-semibold"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>

        <p className="text-blue-400 text-[10px] text-center mt-6">
          © 2026 Cargo Warehouse Inventory System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
