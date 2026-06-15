export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} rounded-full border-blue-200 border-t-blue-600 animate-spin`}></div>
      {text && <p className="text-slate-500 text-sm">{text}</p>}
    </div>
  );
}
