import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import FilterSelect from '../components/FilterSelect';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/ToastContainer';
import { SkeletonTable } from '../components/SkeletonLoader';
import { cargoData, statusOptions, zoneOptions } from '../data/dummyData';
import { formatDate, formatWeight, paginate, totalPages } from '../utils/helpers';
import { useToast } from '../hooks/useToast';

const PER_PAGE = 8;

export default function CargoListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(cargoData);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, success, removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = data.filter((c) => {
    const matchSearch = !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.cargoType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchZone = zoneFilter === 'All' || c.warehouseZone === zoneFilter;
    return matchSearch && matchStatus && matchZone;
  });

  const paged = paginate(filtered, page, PER_PAGE);
  const pages = totalPages(filtered, PER_PAGE);

  const handleDelete = () => {
    setData((prev) => prev.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
    success('Cargo record deleted successfully');
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cargo Inventory</h2>
          <p className="text-slate-500 text-sm">{filtered.length} records found</p>
        </div>
        <button
          id="add-cargo-btn"
          onClick={() => navigate('/cargo/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm hover:shadow-md"
        >
          <MdAdd className="text-xl" />
          Add New Cargo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by ID, customer, or type..."
            className="flex-1"
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={statusOptions}
            className="sm:w-48"
          />
          <FilterSelect
            label="Zone"
            value={zoneFilter}
            onChange={(v) => { setZoneFilter(v); setPage(1); }}
            options={zoneOptions}
            className="sm:w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable cols={9} rows={8} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Cargo ID</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Packages</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Weight</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Location</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Arrival</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                          <span className="text-3xl">📦</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800">No cargo records found</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                          We couldn't find any cargo matching your search criteria. Try modifying your filters or add a new shipment.
                        </p>
                        <button
                          onClick={() => navigate('/cargo/add')}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                        >
                          Add New Cargo
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-blue-600">{c.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{c.customerName}</p>
                        <p className="text-xs text-slate-400">{c.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{c.cargoType}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 text-center">{c.packageCount}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatWeight(c.weight)}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{c.storageLocation}</p>
                        <p className="text-xs text-slate-400">{c.warehouseZone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(c.arrivalDate)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/cargo/${c.id}`)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <MdVisibility className="text-base" />
                        </button>
                        <button
                          onClick={() => navigate(`/cargo/${c.id}/edit`)}
                          className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <MdEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <MdDelete className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Cargo Record"
        message={`Are you sure you want to delete ${deleteTarget}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
