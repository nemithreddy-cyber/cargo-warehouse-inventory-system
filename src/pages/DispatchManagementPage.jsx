import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdLocalShipping, MdEdit, MdVisibility, MdAdd, MdClose, MdSearch } from 'react-icons/md';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import ToastContainer from '../components/ToastContainer';
import { SkeletonTable } from '../components/SkeletonLoader';
import { formatDate } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statusFlow = ['Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'];

// ─── Create Dispatch Modal ──────────────────────────────────────
function CreateDispatchModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    cargoSearch: '',
    cargo_id: '',
    cargo_db_id: '',
    customerName: '',
    destination: '',
    vehicle_number: '',
    driver_name: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    status: 'Scheduled',
  });
  const [cargoResults, setCargoResults] = useState([]);
  const [searchingCargo, setSearchingCargo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Search available cargo (Ready for Dispatch or Stored)
  const searchCargo = async (query) => {
    if (!query || query.length < 2) { setCargoResults([]); return; }
    setSearchingCargo(true);
    try {
      const res = await api.get('/cargo', { params: { search: query, limit: 8 } });
      const list = res.data.data || [];
      setCargoResults(list.filter(c =>
        ['Ready For Dispatch', 'Ready for Dispatch', 'Stored'].includes(c.status)
      ));
    } catch { /* ignore */ } finally {
      setSearchingCargo(false);
    }
  };

  const selectCargo = (c) => {
    setForm((f) => ({
      ...f,
      cargoSearch: c.cargo_id,
      cargo_id: c.cargo_id,
      cargo_db_id: c.id,
      customerName: c.customer_name || '',
      destination: c.destination_airport || '',
    }));
    setCargoResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cargo_db_id) { setError('Please select a cargo item.'); return; }
    if (!form.vehicle_number || !form.driver_name) { setError('Vehicle and driver are required.'); return; }
    if (!form.expected_delivery) { setError('Expected delivery date is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/dispatch', {
        cargo_id: form.cargo_db_id,
        vehicle_number: form.vehicle_number,
        driver_name: form.driver_name,
        dispatch_date: form.dispatch_date,
        expected_delivery: form.expected_delivery,
        status: form.status,
      });
      // Auto-trigger notification
      try {
        await api.post('/notifications', {
          title: 'Dispatch Scheduled',
          message: `Dispatch for cargo ${form.cargo_id} (${form.customerName}) has been scheduled. Driver: ${form.driver_name}, Vehicle: ${form.vehicle_number}.`,
          type: 'dispatch_scheduled',
        });
      } catch { /* notification failure is non-fatal */ }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dispatch. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Create New Dispatch</h3>
            <p className="text-slate-500 text-xs mt-0.5">Schedule cargo for dispatch and assign a driver/vehicle</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <MdClose className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Cargo Selection */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cargo ID <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type cargo ID to search..."
                value={form.cargoSearch}
                onChange={(e) => { setForm(f => ({...f, cargoSearch: e.target.value})); searchCargo(e.target.value); }}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            </div>
            {cargoResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {searchingCargo && <div className="p-3 text-xs text-slate-500 animate-pulse">Searching...</div>}
                {cargoResults.map((c) => (
                  <button type="button" key={c.id} onClick={() => selectCargo(c)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                    <p className="text-sm font-bold text-blue-600">{c.cargo_id}</p>
                    <p className="text-xs text-slate-600">{c.customer_name} — {c.destination_airport}</p>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">{c.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-filled from cargo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer (auto-filled)</label>
              <input readOnly value={form.customerName} placeholder="Select cargo above"
                className="w-full px-3 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-sm text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination (auto-filled)</label>
              <input readOnly value={form.destination} placeholder="Select cargo above"
                className="w-full px-3 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-sm text-slate-600" />
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vehicle Number <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. TN01AB1234" value={form.vehicle_number}
                onChange={(e) => setForm(f => ({...f, vehicle_number: e.target.value}))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Driver Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Full name" value={form.driver_name}
                onChange={(e) => setForm(f => ({...f, driver_name: e.target.value}))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dispatch Date</label>
              <input type="date" value={form.dispatch_date}
                onChange={(e) => setForm(f => ({...f, dispatch_date: e.target.value}))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Delivery <span className="text-red-500">*</span></label>
              <input type="date" value={form.expected_delivery}
                onChange={(e) => setForm(f => ({...f, expected_delivery: e.target.value}))}
                min={form.dispatch_date}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Status</label>
            <select value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value}))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white">
              <option value="Scheduled">Scheduled</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {submitting ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <MdLocalShipping />}
              {submitting ? 'Creating...' : 'Create Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function DispatchManagementPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(location.state?.status || '');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toasts, success, error: toastError, removeToast } = useToast();

  useEffect(() => {
    if (location.state?.status) {
      setStatusFilter(location.state.status);
    }
  }, [location.state]);

  const canCreate = user?.role === 'Super Admin' || user?.role === 'Operations Staff';
  const canEdit   = user?.role === 'Super Admin' || user?.role === 'Operations Staff';

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dispatch?limit=100');
      const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.dispatches || res.data.dispatches || []);
      const mapped = list.map((d) => ({
        id: d.dispatch_id,
        db_id: d.id,
        cargoId: d.cargo_ref || String(d.cargo_id),
        customerName: d.customer_name || 'N/A',
        destination: d.destination_airport || 'N/A',
        vehicleNumber: d.vehicle_number,
        driverName: d.driver_name,
        dispatchDate: d.dispatch_date,
        estimatedDelivery: d.expected_delivery,
        status: d.status,
        lastLocation: d.status === 'Delivered' ? 'Delivered' : 'In Transit',
      }));
      setRecords(mapped);
    } catch (err) {
      console.error('Failed to load dispatches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDispatches(); }, []);

  const filtered = records.filter((r) => {
    if (statusFilter) {
      if (statusFilter === 'Ready') {
        if (r.status !== 'Scheduled' && r.status !== 'Pending') return false;
      } else if (statusFilter === 'Dispatched') {
        if (r.status !== 'In Transit' && r.status !== 'Dispatched') return false;
      } else {
        if (r.status !== statusFilter) return false;
      }
    }
    return (
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.cargoId.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/dispatch/${editRecord.db_id}`, { status: newStatus });
      // Trigger delayed notification if status is Delayed
      if (newStatus === 'Delayed') {
        try {
          await api.post('/notifications', {
            title: 'Delayed Delivery',
            message: `Dispatch ${editRecord.id} (${editRecord.customerName}) has been marked as Delayed.`,
            type: 'delayed_delivery',
          });
        } catch { /* non-fatal */ }
      }
      success(`Status updated to "${newStatus}"`);
      fetchDispatches();
      setEditRecord(null);
      setNewStatus('');
    } catch (err) {
      console.error(err);
      toastError('Failed to update status');
    }
  };

  const summaryStats = [
    { label: 'Total Dispatched', value: records.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'In Transit', value: records.filter(r => r.status === 'In Transit').length, color: 'bg-amber-50 text-amber-700' },
    { label: 'Delivered', value: records.filter(r => r.status === 'Delivered').length, color: 'bg-green-50 text-green-700' },
    { label: 'Pending/Scheduled', value: records.filter(r => r.status === 'Scheduled' || r.status === 'Pending').length, color: 'bg-slate-50 text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Create Dispatch Modal */}
      {showCreateModal && (
        <CreateDispatchModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { fetchDispatches(); success('Dispatch created successfully!'); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dispatch Management</h2>
          <p className="text-slate-500 text-sm">Track and manage cargo dispatch operations</p>
        </div>
        {canCreate && (
          <button
            id="create-dispatch-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm hover:shadow-md"
          >
            <MdAdd className="text-xl" />
            Create Dispatch
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <div key={s.label} className={`${s.color.split(' ')[0]} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-slate-600 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by dispatch ID, cargo ID, or customer..." />
        </div>
        <div className="flex items-center gap-2 sm:min-w-[240px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="Ready">Ready / Scheduled</option>
            <option value="Dispatched">Dispatched / In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable cols={10} rows={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Dispatch Records</h3>
            <span className="text-xs text-slate-500">{filtered.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Dispatch ID', 'Cargo ID', 'Customer', 'Destination', 'Vehicle', 'Driver', 'Dispatch Date', 'Est. Delivery', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <MdLocalShipping className="text-5xl mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-600">No dispatch records found</p>
                        {canCreate && (
                          <button onClick={() => setShowCreateModal(true)} className="mt-3 text-blue-600 text-sm font-bold hover:underline">
                            Create your first dispatch →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-blue-600">{r.id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{r.cargoId}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.customerName}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.destination}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.vehicleNumber || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.driverName || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.dispatchDate)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.estimatedDelivery)}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedRecord(r)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <MdVisibility className="text-base" />
                        </button>
                        {canEdit && (
                          <button onClick={() => { setEditRecord(r); setNewStatus(r.status); }}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Update Status">
                            <MdEdit className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedRecord && (
        <Modal title={`Dispatch Details — ${selectedRecord.id}`} onClose={() => setSelectedRecord(null)}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Dispatch ID', selectedRecord.id],
              ['Cargo ID', selectedRecord.cargoId],
              ['Customer', selectedRecord.customerName],
              ['Destination', selectedRecord.destination],
              ['Vehicle', selectedRecord.vehicleNumber || '—'],
              ['Driver', selectedRecord.driverName || '—'],
              ['Dispatch Date', formatDate(selectedRecord.dispatchDate)],
              ['Est. Delivery', formatDate(selectedRecord.estimatedDelivery)],
              ['Status', selectedRecord.status],
              ['Last Location', selectedRecord.lastLocation],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-medium mb-1">{k}</p>
                <p className="font-semibold text-slate-800">{v}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit Status Modal */}
      {editRecord && (
        <Modal title={`Update Status — ${editRecord.id}`} onClose={() => { setEditRecord(null); setNewStatus(''); }}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Current Status</p>
              <StatusBadge status={editRecord.status} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">New Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {statusFlow.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setEditRecord(null); setNewStatus(''); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateStatus}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
