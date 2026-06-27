import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDescription, MdAdd, MdSearch, MdVisibility, MdCancel,
  MdPrint, MdClose, MdOutlineHourglassEmpty, MdCheckCircle, MdInfo
} from 'react-icons/md';
import api from '../utils/api';
import useCountUp from '../hooks/useCountUp';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { SkeletonTable } from '../components/SkeletonLoader';

const SummaryValue = ({ value }) => {
  const count = useCountUp(value, 1000);
  return <span>{count}</span>;
};

export default function AirwayBillPage() {
  const [awbs, setAwbs] = useState([]);
  const [cargoList, setCargoList] = useState([]);
  const [nextAwbNum, setNextAwbNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [selectedAwb, setSelectedAwb] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    cargo_id: '',
    shipper_name: '',
    shipper_address: '',
    consignee_name: '',
    consignee_address: '',
    origin_airport: '',
    destination_airport: '',
    cargo_description: '',
    pieces: '',
    actual_weight: '',
    chargeable_weight: '',
    declared_value: '0',
    special_instructions: '',
    issue_date: new Date().toISOString().split('T')[0]
  });

  const { toasts, success, error: toastError, removeToast } = useToast();

  const fetchAwbs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/awb/list', {
        params: { search, status: statusFilter }
      });
      setAwbs(res.data.data || []);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch Airway Bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchCargoList = async () => {
    try {
      const res = await api.get('/cargo');
      const rawList = res.data.data || [];
      const list = Array.isArray(rawList) ? rawList : (rawList.cargo || res.data.cargo || []);
      setCargoList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNextAwbNum = async () => {
    try {
      const res = await api.get('/awb/generate-number');
      setNextAwbNum(res.data.awbNumber || '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAwbs();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCargoList();
    fetchNextAwbNum();
  }, []);

  // Handle Cargo Change to Autofill fields
  const handleCargoChange = (cargoId) => {
    if (!cargoId) {
      setForm(prev => ({
        ...prev,
        cargo_id: '',
        shipper_name: '',
        shipper_address: '',
        origin_airport: '',
        destination_airport: '',
        cargo_description: '',
        pieces: '',
        actual_weight: '',
        chargeable_weight: ''
      }));
      return;
    }

    const c = cargoList.find(item => String(item.id) === String(cargoId));
    if (c) {
      setForm(prev => ({
        ...prev,
        cargo_id: cargoId,
        shipper_name: c.customer_name || '',
        shipper_address: c.pickup_city || 'Warehouse Origin',
        consignee_name: c.customer_name || '',
        consignee_address: 'Destination City: ' + c.pickup_city,
        origin_airport: c.origin_airport || '',
        destination_airport: c.destination_airport || '',
        cargo_description: c.cargo_type || '',
        pieces: c.package_count || 1,
        actual_weight: c.weight || '',
        chargeable_weight: c.billing_weight || c.weight || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cargo_id || !form.shipper_name || !form.consignee_name || !form.origin_airport || !form.destination_airport) {
      toastError('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/awb/create', {
        ...form,
        cargo_id: parseInt(form.cargo_id, 10),
        pieces: parseInt(form.pieces, 10) || 1,
        actual_weight: parseFloat(form.actual_weight) || 0,
        chargeable_weight: parseFloat(form.chargeable_weight) || 0,
        declared_value: parseFloat(form.declared_value) || 0
      });
      success('Airway Bill generated successfully!');
      
      // Reset form
      setForm({
        cargo_id: '',
        shipper_name: '',
        shipper_address: '',
        consignee_name: '',
        consignee_address: '',
        origin_airport: '',
        destination_airport: '',
        cargo_description: '',
        pieces: '',
        actual_weight: '',
        chargeable_weight: '',
        declared_value: '0',
        special_instructions: '',
        issue_date: new Date().toISOString().split('T')[0]
      });

      // Refetch
      fetchAwbs();
      fetchNextAwbNum();
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.message || 'Failed to generate Airway Bill');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelAwb = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this Airway Bill?')) return;
    try {
      await api.patch(`/awb/cancel/${id}`);
      success('Airway Bill cancelled successfully');
      fetchAwbs();
    } catch (err) {
      console.error(err);
      toastError('Failed to cancel Airway Bill');
    }
  };

  const openAwbModal = async (awb) => {
    try {
      const res = await api.get(`/awb/detail/${awb.id}`);
      setSelectedAwb(res.data.awb);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch Airway Bill details');
    }
  };

  const printAwb = () => {
    window.print();
  };

  // Aggregated Summary values
  const totalCount = awbs.length;
  const pendingCount = awbs.filter(a => a.status === 'draft').length;
  const issuedCount = awbs.filter(a => a.status === 'issued' || a.status === 'Generated').length;
  const cancelledCount = awbs.filter(a => a.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Airway Bill Management</h2>
          <p className="text-sm text-slate-500">Generate and manage airway bill documents for air cargo shipments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-2xl flex-shrink-0">
            <MdDescription />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total AWBs</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={totalCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-2xl flex-shrink-0">
            <MdOutlineHourglassEmpty />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending AWBs</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={pendingCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500 text-2xl flex-shrink-0">
            <MdCheckCircle />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Issued AWBs</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={issuedCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-2xl flex-shrink-0">
            <MdCancel />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Cancelled AWBs</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={cancelledCount} /></h4>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Generate AWB Form */}
        <div className="w-full lg:w-[40%] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col self-start">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Generate Airway Bill</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">AWB Number</label>
                <input
                  type="text"
                  readOnly
                  value={nextAwbNum || 'Auto-Generating...'}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Cargo ID <span className="text-red-500">*</span></label>
                <select
                  value={form.cargo_id}
                  onChange={(e) => handleCargoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Choose Cargo --</option>
                  {cargoList.map(c => (
                    <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipper Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.shipper_name}
                  onChange={(e) => setForm({ ...form, shipper_name: e.target.value })}
                  placeholder="Shipper Company/Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consignee Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.consignee_name}
                  onChange={(e) => setForm({ ...form, consignee_name: e.target.value })}
                  placeholder="Consignee Company/Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipper Address</label>
                <textarea
                  value={form.shipper_address}
                  onChange={(e) => setForm({ ...form, shipper_address: e.target.value })}
                  rows="2"
                  placeholder="Street address, City, Country"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consignee Address</label>
                <textarea
                  value={form.consignee_address}
                  onChange={(e) => setForm({ ...form, consignee_address: e.target.value })}
                  rows="2"
                  placeholder="Street address, City, Country"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Airport <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.origin_airport}
                  onChange={(e) => setForm({ ...form, origin_airport: e.target.value.toUpperCase() })}
                  placeholder="BOM - Mumbai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Airport <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.destination_airport}
                  onChange={(e) => setForm({ ...form, destination_airport: e.target.value.toUpperCase() })}
                  placeholder="DEL - Delhi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo Description <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.cargo_description}
                onChange={(e) => setForm({ ...form, cargo_description: e.target.value })}
                placeholder="Electronics, Spare parts, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pieces</label>
                <input
                  type="number"
                  value={form.pieces}
                  onChange={(e) => setForm({ ...form, pieces: e.target.value })}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Act. Wt (kg)</label>
                <input
                  type="number"
                  value={form.actual_weight}
                  onChange={(e) => setForm({ ...form, actual_weight: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chg. Wt (kg)</label>
                <input
                  type="number"
                  value={form.chargeable_weight}
                  onChange={(e) => setForm({ ...form, chargeable_weight: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Value (AED)</label>
                <input
                  type="number"
                  value={form.declared_value}
                  onChange={(e) => setForm({ ...form, declared_value: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Instructions</label>
              <textarea
                value={form.special_instructions}
                onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                rows="2"
                placeholder="Keep dry, handle with care, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150 text-white font-bold py-2.5 rounded-xl text-xs mt-2 disabled:opacity-50"
            >
              {formLoading ? 'Generating AWB...' : 'Generate AWB'}
            </button>
          </form>
        </div>

        {/* AWB Records List */}
        <div className="w-full lg:w-[60%] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-800">AWB Records</h3>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  placeholder="Search AWB/Shipper..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <SkeletonTable rows={5} />
              </div>
            ) : awbs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-4">
                  <MdDescription />
                </div>
                <h4 className="font-semibold text-slate-700 mb-1">No Airway Bills Found</h4>
                <p className="text-xs text-slate-500 max-w-xs">There are no generated airway bill records matching this search query.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">AWB Number</th>
                    <th className="px-6 py-4">Cargo ID</th>
                    <th className="px-6 py-4">Shipper</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {awbs.map((awb) => (
                    <tr key={awb.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-650">{awb.awb_number}</td>
                      <td className="px-6 py-4 text-slate-500">{awb.cargo_ref || 'CRG-N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{awb.shipper_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{awb.origin_airport}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold">{awb.destination_airport}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{awb.issue_date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          awb.status === 'cancelled'
                            ? 'bg-red-50 text-red-600'
                            : awb.status === 'issued' || awb.status === 'Generated'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {awb.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openAwbModal(awb)}
                            title="View Detail"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-[0.9]"
                          >
                            <MdVisibility className="text-base" />
                          </button>
                          
                          {awb.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelAwb(awb.id)}
                              title="Cancel AWB"
                              className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg transition-colors active:scale-[0.9]"
                            >
                              <MdCancel className="text-base" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* AWB DETAIL MODAL */}
      <AnimatePresence>
        {showModal && selectedAwb && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden print:p-0 my-8"
            >
              {/* Modal controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 print:hidden">
                <h3 className="font-semibold text-slate-800">Airway Bill Document</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={printAwb}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl active:scale-[0.97]"
                  >
                    <MdPrint className="text-base" />
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-xl transition-all"
                  >
                    <MdClose className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet */}
              <div id="awb-print-sheet" className="p-8 space-y-6 font-sans">
                
                {/* Header block */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 flex items-center justify-center rounded-xl">
                      <span className="text-white font-extrabold text-lg">O</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base leading-tight">ORBEM Solutions</h2>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Air Cargo Logistics Division</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Original Airway Bill</span>
                    <h3 className="font-mono font-extrabold text-xl text-blue-650 mt-1">{selectedAwb.awb_number}</h3>
                  </div>
                </div>

                {/* Shipper & Consignee Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-200 pb-5">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shipper Account Details</span>
                    <h4 className="font-bold text-slate-800 text-xs mb-1">{selectedAwb.shipper_name}</h4>
                    <p className="text-slate-500 text-[11px] whitespace-pre-line leading-relaxed">{selectedAwb.shipper_address}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Consignee Delivery Details</span>
                    <h4 className="font-bold text-slate-800 text-xs mb-1">{selectedAwb.consignee_name}</h4>
                    <p className="text-slate-500 text-[11px] whitespace-pre-line leading-relaxed">{selectedAwb.consignee_address}</p>
                  </div>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-3 items-center gap-4 text-center border-b border-slate-200 pb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Origin Airport</span>
                    <span className="font-extrabold text-slate-800 text-base">{selectedAwb.origin_airport}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full h-[2px] bg-slate-200 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-slate-350 rounded-full flex items-center justify-center text-[9px] font-semibold text-slate-500">✈</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Destination Airport</span>
                    <span className="font-extrabold text-slate-800 text-base">{selectedAwb.destination_airport}</span>
                  </div>
                </div>

                {/* Cargo Details Grid Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                        <th className="px-4 py-3">Description of Goods</th>
                        <th className="px-4 py-3 text-center">Pieces</th>
                        <th className="px-4 py-3 text-center">Gross Weight</th>
                        <th className="px-4 py-3 text-center">Chargeable Weight</th>
                        <th className="px-4 py-3 text-right">Declared Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                      <tr>
                        <td className="px-4 py-3.5 font-semibold">{selectedAwb.cargo_description}</td>
                        <td className="px-4 py-3.5 text-center">{selectedAwb.pieces}</td>
                        <td className="px-4 py-3.5 text-center">{selectedAwb.actual_weight} kg</td>
                        <td className="px-4 py-3.5 text-center font-bold text-blue-650">{selectedAwb.chargeable_weight} kg</td>
                        <td className="px-4 py-3.5 text-right">{selectedAwb.declared_value} AED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Instructions & Declarations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="text-[11px] text-slate-500 space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">Special Instructions:</span>
                      <p className="italic leading-relaxed">{selectedAwb.special_instructions || 'No special handling instructions declared.'}</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2">
                      <MdInfo className="text-blue-500 text-base flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-800 leading-normal">
                        It is certified that the particulars on the face hereof are correct and that carriage is subject to the terms and conditions defined herein.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AWB Generation Date</span>
                      <span className="font-bold text-slate-700 text-xs">{selectedAwb.issue_date}</span>
                    </div>

                    <div className="w-56 border-t border-slate-300 text-center pt-2 mt-8">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Authorized Signature</span>
                      <span className="font-mono text-slate-400 italic text-[11px] block mt-1">ORBEM Logistics Exec</span>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
