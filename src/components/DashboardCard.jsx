import useCountUp from '../hooks/useCountUp';

export default function DashboardCard({ title, value, icon: Icon, trend, trendValue, color, bgColor, description, onClick, isLarge }) {
  const isClickable = typeof onClick === 'function';
  const animatedValue = useCountUp(value, 1200);

  const borderColors = {
    'text-blue-600': 'border-t-4 border-t-blue-500',
    'text-cyan-600': 'border-t-4 border-t-cyan-500',
    'text-purple-600': 'border-t-4 border-t-purple-500',
    'text-amber-600': 'border-t-4 border-t-amber-500',
    'text-orange-600': 'border-t-4 border-t-orange-500',
    'text-green-600': 'border-t-4 border-t-green-500',
    'text-rose-600': 'border-t-4 border-t-rose-500',
  };
  const borderClass = borderColors[color] || 'border-t-4 border-t-slate-300';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover-lift ${borderClass} ${
        isClickable ? 'cursor-pointer' : ''
      } ${isLarge ? 'md:col-span-2 xl:col-span-2 shadow-md scale-[1.02]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full animate-pulse-once ${trend === 'up' ? 'bg-green-50 text-green-600' : trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className={`font-bold text-slate-800 ${isLarge ? 'text-4xl' : 'text-3xl'}`}>{animatedValue}</p>
        {description && <p className="text-slate-400 text-xs mt-1">{description}</p>}
      </div>
    </div>
  );
}
