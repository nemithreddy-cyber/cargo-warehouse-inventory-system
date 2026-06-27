import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdCalendarToday, MdList, MdLocalShipping, MdPerson,
  MdPlayArrow, MdCheck, MdCancel, MdVisibility, MdChevronLeft, MdChevronRight,
  MdClose, MdInfo, MdPhone, MdLocationOn, MdNotes, MdOutlineHourglassEmpty,
  MdSearch
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

export default function PickupSchedulerPage() {
  const [schedules, setSchedules] = useState([]);
  const [cargoList, setCargoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDaySelected, setCalendarDaySelected] = useState(null);
  
  // Modals
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    cargo_id: '',
    customer_name: '',
    pickup_type: 'airport_pickup', // airport_pickup, customer_delivery
    location: '',
    customer_address: '',
    scheduled_date: '',
    scheduled_time: '',
    assigned_driver: '',
    vehicle_number: '',
    contact_number: '',
    notes: ''
  });

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    actual_completion_time: new Date().toISOString().slice(0, 16),
    driver_notes: '',
    proof_of_delivery: ''
  });

  const { toasts, success, error: toastError, removeToast } = useToast();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pickup/list', {
        params: { search, status: statusFilter }
      });
      setSchedules(res.data.schedules || []);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch pickup schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchCargoList = async () => {
    try {
      const res = await api.get('/cargo');
      const list = res.data.data?.cargo || res.data.cargo || [];
      // Filter for 'Ready For Dispatch' status
      const readyCargo = list.filter(c => c.status === 'Ready For Dispatch' || c.status === 'Received' || c.status === 'Stored');
      setCargoList(readyCargo);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCargoList();
  }, []);

  const handleCargoChange = (cargoId) => {
    if (!cargoId) {
      setForm(prev => ({ ...prev, cargo_id: '', customer_name: '' }));
      return;
    }
    const c = cargoList.find(item => String(item.id) === String(cargoId));
    if (c) {
      setForm(prev => ({
        ...prev,
        cargo_id: cargoId,
        customer_name: c.customer_name || '',
        location: c.pickup_type === 'airport_pickup' ? c.origin_airport : c.destination_airport,
        customer_address: c.pickup_city || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cargo_id || !form.location || !form.scheduled_date || !form.scheduled_time || !form.assigned_driver || !form.vehicle_number || !form.contact_number) {
      toastError('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/pickup/create', {
        ...form,
        cargo_id: parseInt(form.cargo_id, 10)
      });
      success('Pickup schedule created successfully!');
      
      // Reset form
      setForm({
        cargo_id: '',
        customer_name: '',
        pickup_type: 'airport_pickup',
        location: '',
        customer_address: '',
        scheduled_date: '',
        scheduled_time: '',
        assigned_driver: '',
        vehicle_number: '',
        contact_number: '',
        notes: ''
      });

      fetchSchedules();
      fetchCargoList(); // Refresh dropdown
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.message || 'Failed to schedule pickup');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/pickup/status/${id}`, { status });
      success(`Status updated to ${status}`);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toastError('Failed to update status');
    }
  };

  const openCompleteModal = (schedule) => {
    setSelectedSchedule(schedule);
    setCompleteForm({
      actual_completion_time: new Date().toISOString().slice(0, 16),
      driver_notes: '',
      proof_of_delivery: ''
    });
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/pickup/status/${selectedSchedule.id}`, {
        status: 'completed',
        actual_completion_time: completeForm.actual_completion_time,
        driver_notes: completeForm.driver_notes,
        proof_of_delivery: completeForm.proof_of_delivery
      });
      success('Pickup / Delivery marked as Completed!');
      setShowCompleteModal(false);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toastError('Failed to complete scheduling');
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled pickup?')) return;
    try {
      await api.delete(`/pickup/cancel/${id}`);
      success('Schedule cancelled successfully');
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toastError('Failed to cancel schedule');
    }
  };

  const openDetailModal = async (schedule) => {
    try {
      const res = await api.get(`/pickup/detail/${schedule.id}`);
      setSelectedSchedule(res.data.schedule);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch schedule details');
    }
  };

  // Calendar View Helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const cells = [];
    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 bg-slate-50/40 border border-slate-100/60" />);
    }

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = schedules.filter(s => s.scheduled_date === cellDateStr);

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => {
            if (dayEvents.length > 0) {
              setCalendarDaySelected({ day, events: dayEvents });
            }
          }}
          className={`h-20 p-2 border border-slate-100 flex flex-col justify-between cursor-pointer transition-colors hover:bg-slate-50 bg-white ${
            dayEvents.length > 0 ? 'ring-1 ring-blue-100' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500">{day}</span>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-12 scrollbar-none">
            {dayEvents.map(ev => (
              <div
                key={ev.id}
                title={`${ev.schedule_id} - ${ev.pickup_type === 'airport_pickup' ? 'Pickup' : 'Delivery'}`}
                className={`text-[8px] font-bold px-1 py-0.5 rounded truncate ${
                  ev.status === 'completed'
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : ev.status === 'in_progress'
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : ev.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                {ev.assigned_driver}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Summaries
  const totalCount = schedules.length;
  const pendingCount = schedules.filter(s => s.status === 'scheduled').length;
  const progressCount = schedules.filter(s => s.status === 'in_progress').length;
  const completedCount = schedules.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">Pickup & Delivery Scheduler</h2>
          <p className="text-sm text-slate-500">Schedule and track airport cargo pickup and delivery operations</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-2xl flex-shrink-0">
            <MdCalendarToday />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Scheduled</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={totalCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-2xl flex-shrink-0">
            <MdOutlineHourglassEmpty />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Pickup</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={pendingCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 text-2xl flex-shrink-0">
            <MdLocalShipping />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={progressCount} /></h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover-lift">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500 text-2xl flex-shrink-0">
            <MdCheck />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed</p>
            <h4 className="text-xl font-bold text-slate-800"><SummaryValue value={completedCount} /></h4>
          </div>
        </div>
      </div>

      {/* Grid splits */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Schedule Form */}
        <div className="w-full lg:w-[40%] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden self-start">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">New Pickup Schedule</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  readOnly
                  value={form.customer_name || 'Autofilled...'}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pickup Type</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer font-bold select-none">
                  <input
                    type="radio"
                    name="pickup_type"
                    value="airport_pickup"
                    checked={form.pickup_type === 'airport_pickup'}
                    onChange={(e) => setForm({ ...form, pickup_type: e.target.value })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  Airport Pickup (Collection)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer font-bold select-none">
                  <input
                    type="radio"
                    name="pickup_type"
                    value="customer_delivery"
                    checked={form.pickup_type === 'customer_delivery'}
                    onChange={(e) => setForm({ ...form, pickup_type: e.target.value })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  Customer Delivery
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Airport / Location <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Terminal 1 Cargo Hub"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            {form.pickup_type === 'customer_delivery' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Delivery Address</label>
                <textarea
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  rows="2"
                  placeholder="Street address, City"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Driver <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.assigned_driver}
                  onChange={(e) => setForm({ ...form, assigned_driver: e.target.value })}
                  placeholder="Driver full name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.vehicle_number}
                  onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                  placeholder="Plate code / No."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                placeholder="+971 50 XXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="2"
                placeholder="Gate pass req., collect POD, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150 text-white font-bold py-2.5 rounded-xl text-xs mt-2 disabled:opacity-50"
            >
              {formLoading ? 'Scheduling...' : 'Schedule Pickup'}
            </button>
          </form>
        </div>

        {/* Right Schedule Records */}
        <div className="w-full lg:w-[60%] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-800">Schedules List</h3>

            <div className="flex items-center gap-3">
              {/* Toggles */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'list' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MdList className="text-base" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'calendar' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MdCalendarToday className="text-base" />
                </button>
              </div>

              {viewMode === 'list' && (
                <>
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                      type="text"
                      placeholder="Search Driver/ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700 font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </>
              )}
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="p-6">
                <SkeletonTable rows={4} />
              </div>
            ) : viewMode === 'list' ? (
              schedules.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-4">
                    <MdLocalShipping />
                  </div>
                  <h4 className="font-semibold text-slate-700 mb-1">No Schedules Scheduled</h4>
                  <p className="text-xs text-slate-500 max-w-xs font-sans">There are no matching schedules registered.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Cargo ID</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Driver</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                      {schedules.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-blue-650">{row.schedule_id}</td>
                          <td className="px-6 py-4 text-slate-500">{row.cargo_ref}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.pickup_type === 'airport_pickup' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {row.pickup_type === 'airport_pickup' ? 'Pickup' : 'Delivery'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{row.assigned_driver}</td>
                          <td className="px-6 py-4">
                            <div>{row.scheduled_date}</div>
                            <div className="text-[10px] text-slate-400">{row.scheduled_time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                              row.status === 'completed'
                                ? 'bg-green-50 text-green-600'
                                : row.status === 'in_progress'
                                  ? 'bg-purple-50 text-purple-600'
                                  : row.status === 'cancelled'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-blue-550/10 text-blue-600'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openDetailModal(row)}
                                title="View details"
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                              >
                                <MdVisibility className="text-base" />
                              </button>

                              {row.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(row.id, 'in_progress')}
                                    title="Mark In Transit"
                                    className="p-1 text-purple-650 hover:bg-purple-50 rounded transition-colors"
                                  >
                                    <MdPlayArrow className="text-base" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelSchedule(row.id)}
                                    title="Cancel schedule"
                                    className="p-1 text-red-650 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <MdCancel className="text-base" />
                                  </button>
                                </>
                              )}

                              {row.status === 'in_progress' && (
                                <button
                                  onClick={() => openCompleteModal(row)}
                                  title="Mark Completed"
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                >
                                  <MdCheck className="text-base" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* CALENDAR VIEW */
              <div className="p-6">
                {/* Month selectors */}
                <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-700 capitalize">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <MdChevronLeft className="text-lg" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <MdChevronRight className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 border-t border-l border-slate-100">
                  {renderCalendar()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Schedule Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500"
                >
                  <MdClose className="text-base" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Schedule ID</span>
                  <span className="font-mono font-bold text-blue-650 text-sm">{selectedSchedule.schedule_id}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Cargo ID</span>
                    <span className="font-bold text-slate-800">{selectedSchedule.cargo_ref}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Customer</span>
                    <span className="font-bold text-slate-800">{selectedSchedule.customer_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Pickup Type</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {selectedSchedule.pickup_type === 'airport_pickup' ? 'Airport Collection' : 'Customer Delivery'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Scheduled Date</span>
                    <span className="font-bold text-slate-850">
                      {selectedSchedule.scheduled_date} @ {selectedSchedule.scheduled_time}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block">Location</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedSchedule.location}</p>
                  {selectedSchedule.customer_address && (
                    <p className="text-slate-500 text-[10px] mt-1">{selectedSchedule.customer_address}</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Assigned Driver</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <MdPerson className="text-amber-500 text-sm" />
                      {selectedSchedule.assigned_driver}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Vehicle Details</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <MdLocalShipping className="text-amber-500 text-sm" />
                      {selectedSchedule.vehicle_number}
                    </span>
                  </div>
                  <div className="col-span-2 border-t pt-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Contact</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <MdPhone className="text-amber-500 text-sm" />
                      {selectedSchedule.contact_number}
                    </span>
                  </div>
                </div>

                {selectedSchedule.notes && (
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Notes</span>
                    <p className="italic text-slate-600 mt-1">{selectedSchedule.notes}</p>
                  </div>
                )}

                {selectedSchedule.status === 'completed' && (
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100 space-y-2 mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-green-700">
                      <span>COMPLETED AT:</span>
                      <span>{selectedSchedule.actual_completion_time}</span>
                    </div>
                    {selectedSchedule.driver_notes && (
                      <p className="text-[10px] text-slate-650 italic">
                        <strong>Driver Notes:</strong> {selectedSchedule.driver_notes}
                      </p>
                    )}
                    {selectedSchedule.proof_of_delivery && (
                      <p className="text-[10px] text-slate-650 font-bold">
                        <strong>POD Ref:</strong> {selectedSchedule.proof_of_delivery}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STATUS COMPLETE MODAL */}
      <AnimatePresence>
        {showCompleteModal && selectedSchedule && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Complete Pickup / Delivery</h3>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500"
                >
                  <MdClose className="text-base" />
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Date & Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={completeForm.actual_completion_time}
                    onChange={(e) => setCompleteForm({ ...completeForm, actual_completion_time: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Notes / Observations</label>
                  <textarea
                    value={completeForm.driver_notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, driver_notes: e.target.value })}
                    rows="2"
                    placeholder="Notes during handover, cargo condition details..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proof of Delivery (POD) Reference</label>
                  <input
                    type="text"
                    value={completeForm.proof_of_delivery}
                    onChange={(e) => setCompleteForm({ ...completeForm, proof_of_delivery: e.target.value })}
                    placeholder="e.g. POD-889988-SIGN"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
                >
                  Confirm Completion
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calendar Day Events Modal */}
      <AnimatePresence>
        {calendarDaySelected && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">
                  Pickups on Date: {calendarDaySelected.day}
                </h3>
                <button
                  onClick={() => setCalendarDaySelected(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500"
                >
                  <MdClose className="text-base" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                {calendarDaySelected.events.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setCalendarDaySelected(null);
                      openDetailModal(ev);
                    }}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-2xl cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-blue-650 font-mono">{ev.schedule_id}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Driver: {ev.assigned_driver} | Time: {ev.scheduled_time}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 capitalize">{ev.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
