import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLocalShipping, MdEdit, MdVisibility, MdCheckCircle, MdFlightLand } from 'react-icons/md';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import ToastContainer from '../components/ToastContainer';
import { SkeletonTable } from '../components/SkeletonLoader';
import { dispatchRecords } from '../data/dummyData';
import { formatDate } from '../utils/helpers';
import { useToast } from '../hooks/useToast';

const statusFlow = ['Pending', 'In Transit', 'Customs Clearance', 'Out for Delivery', 'Delivered'];

export default function DispatchManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState(dispatchRecords);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const { toasts, success, removeToast } = useToast();

  const filtered = records.filter((r) =>
    !search ||
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.cargoId.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    setRecords((prev) => prev.map((r) => r.id === editRecord.id ? { ...r, status: newStatus } : r));
    success(`Status updated to "${newStatus}"`);
    setEditRecord(null);
    setNewStatus('');
  };

  const summaryStats = [
    { label: 'Total Dispatched', value: records.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'In Transit', value: records.filter(r => r.status === 'In Transit').length, color: 'bg-amber-50 text-amber-700' },
    { label: 'Delivered', value: records.filter(r => r.status === 'Delivered').length, color: 'bg-green-50 text-green-700' },
    { label: 'Pending', value: records.filter(r => r.status === 'Pending').length, color: 'bg-slate-50 text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dispatch Management</h2>
          <p className="text-slate-500 text-sm">Track and manage cargo dispatch operations</p>
        </div>
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

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by dispatch ID, cargo ID, or customer..." />
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable cols={10} rows={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Dispatch Records</h3>
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
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                          <MdLocalShipping className="text-3xl text-slate-400" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">No dispatch records available</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                          No dispatch logs matched your search filters. Modify your search and try again.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-blue-600">{r.id}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.cargoId}</td>
                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">{r.customerName}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.destination}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.vehicleNumber}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{r.driverName}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.dispatchDate)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.estimatedDelivery)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/cargo/${r.cargoId}`)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <MdVisibility className="text-base" />
                        </button>
                        <button onClick={() => { setEditRecord(r); setNewStatus(r.status); }} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Update Status">
                          <MdEdit className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch History Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Dispatch History Timeline</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {records.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate(`/cargo/${r.cargoId}`)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.status === 'Delivered' ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {r.status === 'Delivered' ? <MdCheckCircle className="text-green-600 text-xl" /> : <MdLocalShipping className="text-amber-600 text-xl" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{r.id}</span>
                    <span className="text-xs text-slate-500">→</span>
                    <span className="text-sm text-slate-600">{r.cargoId}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{r.customerName}</p>
                  <p className="text-xs text-slate-400">{r.lastLocation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{formatDate(r.dispatchDate)}</p>
                  <p className="text-xs text-slate-400">Est. {formatDate(r.estimatedDelivery)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Record Modal */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title={`Dispatch Record: ${selectedRecord?.id}`}>
        {selectedRecord && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Cargo ID', value: selectedRecord.cargoId },
              { label: 'Customer', value: selectedRecord.customerName },
              { label: 'Destination', value: selectedRecord.destination },
              { label: 'Vehicle Number', value: selectedRecord.vehicleNumber },
              { label: 'Driver Name', value: selectedRecord.driverName },
              { label: 'Dispatch Date', value: formatDate(selectedRecord.dispatchDate) },
              { label: 'Est. Delivery', value: formatDate(selectedRecord.estimatedDelivery) },
              { label: 'Last Location', value: selectedRecord.lastLocation },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
            <div className="col-span-2 bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <StatusBadge status={selectedRecord.status} size="md" />
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={!!editRecord} onClose={() => setEditRecord(null)} title="Update Dispatch Status" size="sm">
        {editRecord && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Dispatch ID</p>
              <p className="font-bold text-slate-800">{editRecord.id}</p>
              <p className="text-sm text-slate-600">{editRecord.cargoId} — {editRecord.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">New Status</label>
              <div className="space-y-2">
                {statusFlow.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${newStatus === s ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${newStatus === s ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <span className="text-sm font-medium text-slate-700">{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditRecord(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleUpdateStatus} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Update Status</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
