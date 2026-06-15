import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

const icons = {
  success: { icon: MdCheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  error: { icon: MdError, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  warning: { icon: MdWarning, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  info: { icon: MdInfo, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

function Toast({ id, message, type, onRemove }) {
  const { icon: Icon, color, bg } = icons[type] || icons.info;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bg} animate-slide-in max-w-sm`}>
      <Icon className={`text-xl flex-shrink-0 ${color}`} />
      <p className="text-sm text-slate-700 flex-1">{message}</p>
      <button onClick={() => onRemove(id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <MdClose className="text-base" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  );
}
