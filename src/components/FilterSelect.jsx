import { MdFilterList } from 'react-icons/md';

export default function FilterSelect({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 transition-all duration-200 ${className}`}>
      <MdFilterList className="text-slate-400 text-lg flex-shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-slate-700 outline-none w-full cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{label ? `${label}: ${opt}` : opt}</option>
        ))}
      </select>
    </div>
  );
}
