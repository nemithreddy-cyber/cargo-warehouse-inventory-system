export default function DashboardCard({ title, value, icon: Icon, trend, trendValue, color, bgColor, description, onClick }) {
  const isClickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all duration-300 group ${
        isClickable
          ? 'cursor-pointer active:scale-[0.98] hover:shadow-lg hover:border-slate-200 hover:-translate-y-1'
          : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-600' : trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {description && <p className="text-slate-400 text-xs mt-1">{description}</p>}
      </div>
    </div>
  );
}
