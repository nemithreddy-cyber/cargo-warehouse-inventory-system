import { useState } from 'react';
import { MdDownload, MdFilterList, MdClose, MdCalendarToday } from 'react-icons/md';
import SearchBar from '../components/SearchBar';
import FilterSelect from '../components/FilterSelect';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ToastContainer from '../components/ToastContainer';
import { activityLogs } from '../data/dummyData';
import { getActivityColor, getActivityIcon, paginate, totalPages } from '../utils/helpers';
import { useToast } from '../hooks/useToast';

const typeOptions = ['All', 'create', 'update', 'delete', 'dispatch', 'login', 'report'];
const PER_PAGE = 8;

function exportToCSV(data) {
  const headers = ['ID', 'User', 'Action', 'Details', 'Date', 'Time', 'Status Change', 'Type'];
  const rows = data.map((l) => [
    l.id, l.user, l.action, `"${l.details}"`, l.date, l.time, l.statusChange, l.type,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityLogsPage() {
  const { toasts, success, removeToast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const filtered = activityLogs.filter((log) => {
    const matchSearch =
      !search ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || log.type === typeFilter;
    const matchFrom = !dateFrom || log.date >= dateFrom;
    const matchTo = !dateTo || log.date <= dateTo;
    return matchSearch && matchType && matchFrom && matchTo;
  });

  const paged = paginate(filtered, page, PER_PAGE);
  const pages = totalPages(filtered, PER_PAGE);

  const hasActiveFilters = typeFilter !== 'All' || dateFrom || dateTo;

  const clearFilters = () => {
    setTypeFilter('All');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(filtered);
    success(`Exported ${filtered.length} log entries as CSV`);
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Activity Logs</h2>
          <p className="text-slate-500 text-sm">Track all user actions and system events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MdFilterList className="text-base" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 bg-white text-blue-600 rounded-full text-xs flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <MdDownload className="text-base" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {typeOptions
          .filter((t) => t !== 'All')
          .map((type) => {
            const count = activityLogs.filter((l) => l.type === type).length;
            return (
              <div
                key={type}
                onClick={() => { setTypeFilter(type === typeFilter ? 'All' : type); setPage(1); }}
                className={`cursor-pointer rounded-2xl p-3 text-center transition-all hover:scale-105 ${
                  typeFilter === type ? 'ring-2 ring-blue-500 shadow-md' : ''
                } ${getActivityColor(type)}`}
              >
                <p className="text-2xl mb-1">{getActivityIcon(type)}</p>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs capitalize">{type}</p>
              </div>
            );
          })}
      </div>

      {/* Filters Panel */}
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-0 shadow-none'}`}>
        {showFilters && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700 text-sm">Filter Options</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <MdClose className="text-sm" /> Clear Filters
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search by user, action, or details..."
                className="flex-1"
              />
              <FilterSelect
                label="Type"
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setPage(1); }}
                options={typeOptions}
                className="sm:w-40"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center gap-1">
                  <MdCalendarToday className="text-slate-400" /> From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center gap-1">
                  <MdCalendarToday className="text-slate-400" /> To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar (always visible) */}
      {!showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by user, action, or details..."
          />
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {typeFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-medium">
              Type: {typeFilter}
              <button onClick={() => { setTypeFilter('All'); setPage(1); }} className="hover:text-blue-900">
                <MdClose className="text-xs" />
              </button>
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full font-medium">
              From: {dateFrom}
              <button onClick={() => { setDateFrom(''); setPage(1); }} className="hover:text-purple-900">
                <MdClose className="text-xs" />
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full font-medium">
              To: {dateTo}
              <button onClick={() => { setDateTo(''); setPage(1); }} className="hover:text-purple-900">
                <MdClose className="text-xs" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Log Entries</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{filtered.length} entries</span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium border border-green-200 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <MdDownload className="text-sm" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#', 'User', 'Action', 'Details', 'Date', 'Time', 'Status Change', 'Type', ''].map((h, i) => (
                  <th
                    key={i}
                    className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <span className="text-3xl">📋</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No logs found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filters</p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-5 py-4 text-sm text-slate-400 font-mono">{log.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {log.user.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium whitespace-nowrap">{log.action}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 max-w-[180px] truncate">{log.details}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{log.date}</td>
                    <td className="px-5 py-4 text-sm text-slate-400 font-mono">{log.time}</td>
                    <td className="px-5 py-4">
                      {log.statusChange !== 'N/A' ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-100 whitespace-nowrap">
                          {log.statusChange}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getActivityColor(log.type)}`}
                      >
                        <span>{getActivityIcon(log.type)}</span>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-blue-600 hover:text-blue-700 font-medium">View →</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Detail"
        size="sm"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* User & Type Header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {selectedLog.user.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{selectedLog.user}</p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize mt-1 ${getActivityColor(selectedLog.type)}`}
                >
                  <span>{getActivityIcon(selectedLog.type)}</span>
                  {selectedLog.type}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{selectedLog.date}</p>
                <p className="text-xs font-mono text-slate-400">{selectedLog.time}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Log ID', value: `#${selectedLog.id}` },
                { label: 'Action', value: selectedLog.action },
                { label: 'Details', value: selectedLog.details },
                {
                  label: 'Status Change',
                  value:
                    selectedLog.statusChange !== 'N/A' ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-100">
                        {selectedLog.statusChange}
                      </span>
                    ) : (
                      <span className="text-slate-400">No status change</span>
                    ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <div className="text-sm font-medium text-slate-800">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  exportToCSV([selectedLog]);
                  success('Log entry exported as CSV');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium border border-green-200 transition-colors"
              >
                <MdDownload /> Export Entry
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
