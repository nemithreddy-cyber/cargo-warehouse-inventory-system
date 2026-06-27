import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import OrbemLogo from '../components/OrbemLogo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate 20-25 random particle configurations with negative delay so they are pre-distributed
    const count = 22;
    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 2}px`, // 2-4px
      delay: `${Math.random() * -15}s`,
      duration: `${Math.random() * 12 + 8}s`, // 8s to 20s
      opacity: Math.random() * 0.1 + 0.15, // 15% to 25%
      drift: `${Math.random() * 60 - 30}px`
    }));
    setParticles(generated);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0f2e] to-[#1a237e] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background blobs / orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl animate-drift-orb-1" />
        <div className="absolute -bottom-40 -left-40 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl animate-drift-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl animate-drift-orb-3" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 z-0" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bg-white rounded-full animate-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              '--particle-duration': p.duration,
              '--particle-opacity': p.opacity,
              '--particle-drift': p.drift,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="bg-slate-950/40 backdrop-blur-xl rounded-3xl interactive-login-card shadow-2xl overflow-hidden"
        >
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-8 text-center border-b border-white/5 relative">
            {/* Halo ring */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border border-dashed border-blue-400/30 animate-halo-rotate pointer-events-none" />

            <div className="w-16 h-16 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10 animate-logo-spin">
              <div className="animate-logo-float">
                <OrbemLogo className="w-10 h-10 text-white" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h1 className="text-white text-xl font-bold mb-1 leading-tight">ORBEM Solutions</h1>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Warehouse Inventory System</p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-white text-lg font-semibold mb-1">Welcome back</h2>
            <p className="text-blue-200 text-xs mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
              >
                <label className="text-blue-200 text-xs font-semibold mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-450 focus-within:shadow-[0_0_0_3px_rgba(99,179,237,0.25)] transition-all duration-200">
                  <MdEmail className="text-blue-300 flex-shrink-0" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@cargowarehouse.com"
                    className="bg-transparent text-white placeholder-blue-300/40 outline-none text-xs w-full font-sans"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }}
              >
                <label className="text-blue-200 text-xs font-semibold mb-1.5 block">Password</label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-450 focus-within:shadow-[0_0_0_3px_rgba(99,179,237,0.25)] transition-all duration-200">
                  <MdLock className="text-blue-300 flex-shrink-0" />
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-white placeholder-blue-300/40 outline-none text-xs w-full font-mono"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-blue-300 hover:text-white transition-transform hover:rotate-[5deg] duration-200">
                    {showPass ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                  </button>
                </div>
              </motion.div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input id="remember-checkbox" type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                  <span className="text-blue-200">Remember me</span>
                </label>
                <a href="#" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">Forgot password?</a>
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-75 disabled:cursor-not-allowed mt-2 ripple-btn animate-btn-pulse hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-blue-400 text-xs text-center mt-6 font-medium"
        >
          © 2026 ORBEM Solutions Private Limited Company. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
}
