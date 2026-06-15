import { useNavigate } from 'react-router-dom';
import { MdLock, MdArrowBack, MdDashboard } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { roleBadgeColors } from '../config/permissions';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleColors = roleBadgeColors[user?.role] || {};

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MdLock className="text-red-500 text-5xl" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-6 leading-relaxed">
          You don't have permission to view this page.
          {user?.role && (
            <span className="block mt-1 text-sm">
              Your current role is{' '}
              <span className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${roleColors.bg || 'bg-slate-100'} ${roleColors.text || 'text-slate-700'}`}>
                {user.role}
              </span>
            </span>
          )}
        </p>

        {/* Help text */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
          <p className="text-amber-800 text-sm font-semibold mb-1">Need access?</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Contact your Super Admin to request access to this section. Only authorized roles can view this page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all"
          >
            <MdArrowBack />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            <MdDashboard />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
