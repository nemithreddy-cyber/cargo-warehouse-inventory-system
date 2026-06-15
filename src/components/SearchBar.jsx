import { MdSearch } from 'react-icons/md';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-400 focus-within:bg-white transition-all duration-200 ${className}`}>
      <MdSearch className="text-slate-400 text-lg flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm text-slate-700 outline-none w-full placeholder-slate-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium"
        >
          ✕
        </button>
      )}
    </div>
  );
}
