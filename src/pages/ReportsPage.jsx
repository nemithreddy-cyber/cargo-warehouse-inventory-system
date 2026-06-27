import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  MdDownload, MdAssessment, MdLocalShipping, MdWarehouse, 
  MdTrendingUp, MdBarChart, MdCalendarToday, MdSave, 
  MdRefresh, MdSearch, MdFilterList, MdInfo 
} from 'react-icons/md';
import { FaFilePdf, FaFileCsv } from 'react-icons/fa';
import ToastContainer from '../components/ToastContainer';
import { SkeletonChart, SkeletonPulse } from '../components/SkeletonLoader';
import { useToast } from '../hooks/useToast';
import useCountUp from '../hooks/useCountUp';
import api from '../utils/api';

function SummaryNum({ value, className }) {
  const animated = useCountUp(value, 1200);
  return <span className={className}>{animated}</span>;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const cardScaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } }
};
import {
  downloadCSV, printReport,
  CARGO_COLUMNS, DISPATCH_COLUMNS, WAREHOUSE_COLUMNS,
  prepareWarehouseReportData,
} from '../utils/exportHelpers';

// ─── Chart Data ───────────────────────────────────────────────────────────────
const monthlyData = [
  { month: 'Jan', shipments: 18, weight: 4200, revenue: 31500 },
  { month: 'Feb', shipments: 24, weight: 5800, revenue: 42100 },
  { month: 'Mar', shipments: 31, weight: 7100, revenue: 56000 },
  { month: 'Apr', shipments: 28, weight: 6300, revenue: 48900 },
  { month: 'May', shipments: 35, weight: 8200, revenue: 63400 },
  { month: 'Jun', shipments: 12, weight: 2900, revenue: 21600 },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-slate-700">Count: <span className="font-bold">{payload[0].value}</span></p>
        <p className="text-slate-500">{payload[0].payload.percentage}%</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { toasts, success, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('shipments');
  const [cargoList, setCargoList] = useState([]);
  const [originalCargoList, setOriginalCargoList] = useState([]);
  const [dispatchList, setDispatchList] = useState([]);
  const [originalDispatchList, setOriginalDispatchList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [statsData, setStatsData] = useState(null);

  // Spreadsheet view states
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'spreadsheet'
  const [activeSheet, setActiveSheet] = useState('cargo'); // 'cargo' | 'dispatch' | 'warehouse'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Track modified rows
  const [dirtyCargoIds, setDirtyCargoIds] = useState(new Set());
  const [dirtyDispatchIds, setDirtyDispatchIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { id, field }

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [cargoRes, dispatchRes, zonesRes, dashboardRes] = await Promise.all([
        api.get('/cargo?limit=1000'),
        api.get('/dispatch?limit=1000'),
        api.get('/warehouse/zones'),
        api.get('/dashboard'),
      ]);
      
      const cargos = cargoRes.data.data?.cargo || cargoRes.data.cargo || cargoRes.data.data || [];
      const dispatches = dispatchRes.data.data?.dispatches || dispatchRes.data.dispatches || [];
      const zones = zonesRes.data.data?.zones || zonesRes.data.zones || [];
      const stats = dashboardRes.data.data || dashboardRes.data;

      setCargoList(JSON.parse(JSON.stringify(cargos)));
      setOriginalCargoList(JSON.parse(JSON.stringify(cargos)));
      setDispatchList(JSON.parse(JSON.stringify(dispatches)));
      setOriginalDispatchList(JSON.parse(JSON.stringify(dispatches)));
      setZonesList(zones);
      setStatsData(stats);
      
      // Reset dirty tracking
      setDirtyCargoIds(new Set());
      setDirtyDispatchIds(new Set());
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Sync edits back to database
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const promises = [];
      
      // Save edited cargo rows
      dirtyCargoIds.forEach(id => {
        const item = cargoList.find(c => c.cargo_id === id);
        if (item) {
          promises.push(api.put(`/cargo/${id}`, {
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
            cargo_type: item.cargo_type,
            origin_airport: item.origin_airport,
            destination_airport: item.destination_airport,
            package_count: parseInt(item.package_count) || 1,
            weight: parseFloat(item.weight) || 1,
            status: item.status
          }));
        }
      });

      // Save edited dispatch rows
      dirtyDispatchIds.forEach(id => {
        const item = dispatchList.find(d => d.dispatch_id === id);
        if (item) {
          promises.push(api.put(`/dispatch/${id}`, {
            driver_name: item.driver_name,
            vehicle_number: item.vehicle_number,
            dispatch_date: item.dispatch_date,
            expected_delivery: item.expected_delivery,
            status: item.status
          }));
        }
      });

      await Promise.all(promises);
      success('Spreadsheet updates synced to the cloud database!');
      
      // Update original copies to current state
      setOriginalCargoList(JSON.parse(JSON.stringify(cargoList)));
      setOriginalDispatchList(JSON.parse(JSON.stringify(dispatchList)));
      setDirtyCargoIds(new Set());
      setDirtyDispatchIds(new Set());
    } catch (err) {
      console.error('Failed to save spreadsheet data', err);
      // fallback message
      toasts.push({ id: Date.now(), type: 'error', message: 'Error saving changes: Please verify all fields are valid.' });
    } finally {
      setSaving(false);
    }
  };

  // Revert all edits
  const handleRevertChanges = () => {
    setCargoList(JSON.parse(JSON.stringify(originalCargoList)));
    setDispatchList(JSON.parse(JSON.stringify(originalDispatchList)));
    setDirtyCargoIds(new Set());
    setDirtyDispatchIds(new Set());
    success('Discarded local changes.');
  };

  // Cell edit handlers
  const handleCargoCellEdit = (cargoId, field, value) => {
    const updated = cargoList.map(item => {
      if (item.cargo_id === cargoId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setCargoList(updated);
    setDirtyCargoIds(prev => new Set(prev).add(cargoId));
  };

  const handleDispatchCellEdit = (dispatchId, field, value) => {
    const updated = dispatchList.map(item => {
      if (item.dispatch_id === dispatchId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setDispatchList(updated);
    setDirtyDispatchIds(prev => new Set(prev).add(dispatchId));
  };

  // Data processing for original visual dashboard reports
  const zoneUtilization = zonesList.map((z) => ({
    name: z.zone_name.split(' - ')[0],
    occupied: z.occupied,
    available: z.capacity - z.occupied,
    capacity: z.capacity ? Math.round((z.occupied / z.capacity) * 100) : 0,
  }));

  const typeCounts = {};
  cargoList.forEach((c) => {
    typeCounts[c.cargo_type] = (typeCounts[c.cargo_type] || 0) + 1;
  });
  const cargoTypePieData = Object.entries(typeCounts).map(([type, count], i) => ({
    type,
    count,
    percentage: cargoList.length ? Math.round((count / cargoList.length) * 100) : 0,
    color: ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6],
  }));

  const totalCargoCount = statsData?.totalCargo || 0;
  const activeCargoCount = (statsData?.receivedCargo || 0) + (statsData?.storedCargo || 0) + (statsData?.readyForDispatch || 0);
  const completedCargoCount = statsData?.deliveredCargo || 0;

  const reportCards = [
    {
      title: 'Cargo Report',
      icon: MdAssessment,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Complete inventory of all cargo items, statuses, and weights.',
      stats: [
        { label: 'Total Cargo', value: totalCargoCount },
        { label: 'Active', value: activeCargoCount },
        { label: 'Completed', value: completedCargoCount },
      ],
    },
    {
      title: 'Dispatch Report',
      icon: MdLocalShipping,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'All dispatch records, routes, delivery statuses, and performance.',
      stats: [
        { label: 'Dispatched', value: dispatchList.length },
        { label: 'In Transit', value: dispatchList.filter((r) => r.status === 'In Transit').length },
        { label: 'Delivered', value: dispatchList.filter((r) => r.status === 'Delivered').length },
      ],
    },
    {
      title: 'Warehouse Report',
      icon: MdWarehouse,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Warehouse zone utilization, storage capacity, and occupancy data.',
      stats: [
        { label: 'Total Zones', value: zonesList.length },
        { label: 'Total Locations', value: zonesList.reduce((a, z) => a + z.capacity, 0) },
        { label: 'Occupied', value: zonesList.reduce((a, z) => a + z.occupied, 0) },
      ],
    },
    {
      title: 'Cargo Status Report',
      icon: MdBarChart,
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Breakdown of all cargo by status — received, stored, dispatched, and delivered counts.',
      stats: [
        { label: 'Total Items', value: statsData?.totalCargo || 0 },
        { label: 'Delivered', value: statsData?.deliveredCargo || 0 },
        { label: 'In Warehouse', value: (statsData?.receivedCargo || 0) + (statsData?.storedCargo || 0) },
      ],
    },
  ];

  const statusCounts = { Received: 0, Stored: 0, 'Ready For Dispatch': 0, Dispatched: 0, Delivered: 0 };
  cargoList.forEach((c) => {
    const s = c.status === 'Ready for Dispatch' ? 'Ready For Dispatch' : c.status;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusColors = { Received: '#3b82f6', Stored: '#8b5cf6', 'Ready For Dispatch': '#f59e0b', Dispatched: '#f97316', Delivered: '#22c55e' };
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name === 'Ready For Dispatch' ? 'Ready' : name,
    value,
    color: statusColors[name] || '#6b7280',
  }));

  const weightsByStatus = {};
  cargoList.forEach((c) => {
    const s = c.status === 'Ready for Dispatch' ? 'Ready For Dispatch' : c.status;
    weightsByStatus[s] = (weightsByStatus[s] || 0) + parseFloat(c.weight || 0);
  });

  const cargoStatusReport = [
    { status: 'Received', count: statsData?.receivedCargo || 0, color: '#3b82f6' },
    { status: 'Stored', count: statsData?.storedCargo || 0, color: '#8b5cf6' },
    { status: 'Ready For Dispatch', count: statsData?.readyForDispatch || 0, color: '#f59e0b' },
    { status: 'Dispatched', count: statsData?.dispatchedCargo || 0, color: '#f97316' },
    { status: 'Delivered', count: statsData?.deliveredCargo || 0, color: '#22c55e' },
  ];

  const handleDownload = (type, format) => {
    const now = new Date().toISOString().split('T')[0];
    try {
      if (type === 'Cargo Report') {
        if (format === 'CSV') {
          downloadCSV(cargoList, `cargo_report_${now}.csv`, CARGO_COLUMNS);
        } else {
          printReport('Cargo Inventory Report', CARGO_COLUMNS, cargoList);
        }
      } else if (type === 'Dispatch Report') {
        if (format === 'CSV') {
          downloadCSV(dispatchList, `dispatch_report_${now}.csv`, DISPATCH_COLUMNS);
        } else {
          printReport('Dispatch Management Report', DISPATCH_COLUMNS, dispatchList);
        }
      } else if (type === 'Warehouse Report') {
        const warehouseData = prepareWarehouseReportData(zonesList);
        if (format === 'CSV') {
          downloadCSV(warehouseData, `warehouse_report_${now}.csv`, WAREHOUSE_COLUMNS);
        } else {
          printReport('Warehouse Occupancy Report', WAREHOUSE_COLUMNS, warehouseData);
        }
      } else if (type === 'Cargo Status Report') {
        const statusCols = [
          { key: 'status', label: 'Status' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage' },
        ];
        const total = cargoStatusReport.reduce((a, b) => a + b.count, 0);
        const statusTableData = cargoStatusReport.map((s) => ({
          status: s.status,
          count: s.count,
          percentage: total ? `${Math.round((s.count / total) * 100)}%` : '0%',
        }));
        if (format === 'CSV') {
          downloadCSV(statusTableData, `cargo_status_report_${now}.csv`, statusCols);
        } else {
          printReport('Cargo Status Distribution Report', statusCols, statusTableData,
            `Generated from ${total} total cargo items as of ${now}`);
        }
      } else {
        downloadCSV(cargoList, `cargo_inventory_${now}.csv`, CARGO_COLUMNS);
        success('Exported cargo inventory CSV. Opening print view...');
        setTimeout(() => printReport('All Dispatch Records', DISPATCH_COLUMNS, dispatchList), 1000);
        return;
      }
      success(`${type} ${format} generated successfully!`);
    } catch (err) {
      console.error('Export error', err);
      success(`${format} export started for ${type}`);
    }
  };

  const chartKeys = [
    { key: 'shipments', label: 'Shipments', color: '#3b82f6' },
    { key: 'weight', label: 'Weight (kg)', color: '#8b5cf6' },
    { key: 'revenue', label: 'Revenue (AED)', color: '#22c55e' },
  ];

  // ─── Spreadsheet Data Filtering ─────────────────────────────────────────────
  const getFilteredCargo = () => {
    return cargoList.filter(item => {
      const matchesSearch = searchQuery === '' || 
        String(item.cargo_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.customer_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.origin_airport).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.destination_airport).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      const matchesType = filterType === 'All' || item.cargo_type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const getFilteredDispatch = () => {
    return dispatchList.filter(item => {
      const matchesSearch = searchQuery === '' ||
        String(item.dispatch_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.cargo_ref || item.cargo_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.driver_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.vehicle_number).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredWarehouse = () => {
    return zonesList.filter(item => {
      return searchQuery === '' || String(item.zone_name).toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const filteredCargo = getFilteredCargo();
  const filteredDispatch = getFilteredDispatch();
  const filteredWarehouse = getFilteredWarehouse();

  // ─── Formula Calculations ───────────────────────────────────────────────────
  // Cargo Math
  const cargoTotalPackages = filteredCargo.reduce((sum, item) => sum + (parseInt(item.package_count) || 0), 0);
  const cargoTotalWeight = filteredCargo.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
  const cargoAverageWeight = filteredCargo.length ? Math.round(cargoTotalWeight / filteredCargo.length) : 0;
  
  // Dispatch Math
  const dispatchTotal = filteredDispatch.length;
  const dispatchActive = filteredDispatch.filter(d => d.status === 'In Transit' || d.status === 'Scheduled').length;
  const dispatchDelivered = filteredDispatch.filter(d => d.status === 'Delivered').length;

  // Warehouse Math
  const warehouseTotalCapacity = filteredWarehouse.reduce((sum, item) => sum + (parseInt(item.capacity) || 0), 0);
  const warehouseTotalOccupied = filteredWarehouse.reduce((sum, item) => sum + (parseInt(item.occupied) || 0), 0);
  const warehouseAverageOccupancy = warehouseTotalCapacity 
    ? Math.round((warehouseTotalOccupied / warehouseTotalCapacity) * 100) 
    : 0;

  // Has unsaved edits?
  const hasUnsavedEdits = dirtyCargoIds.size > 0 || dirtyDispatchIds.size > 0;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports &amp; Analytics Workspace</h2>
          <p className="text-slate-500 text-sm">Interactive analytics, real-time spreadsheets formulas, and automated reports export.</p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'spreadsheet' && hasUnsavedEdits && (
            <>
              <button
                onClick={handleRevertChanges}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-md shadow-amber-500/10"
              >
                <MdSave className="text-lg animate-pulse" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
          <button
            onClick={() => handleDownload(activeSheet === 'cargo' ? 'Cargo Report' : activeSheet === 'dispatch' ? 'Dispatch Report' : 'Warehouse Report', 'PDF')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <MdDownload className="text-lg" /> Export Sheet
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewMode('dashboard')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            viewMode === 'dashboard'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MdTrendingUp className="text-lg" /> Dashboard View
        </button>
        <button
          onClick={() => setViewMode('spreadsheet')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            viewMode === 'spreadsheet'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaFileCsv className="text-lg animate-pulse" /> Spreadsheet Analytics
        </button>
      </div>

      {/* RENDER VIEW: DASHBOARD (ORIGINAL VISUAL OVERVIEW) */}
      {viewMode === 'dashboard' && (
        <>
          {/* Report Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          >
            {reportCards.map((r) => (
              <motion.div
                variants={cardScaleVariants}
                key={r.title}
                className={`bg-white rounded-2xl border-2 ${r.borderColor} shadow-sm overflow-hidden hover-lift`}
              >
                <div className={`${r.bg} px-6 py-5 flex items-center gap-4`}>
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <r.icon className={`text-2xl ${r.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{r.title}</h3>
                    <p className="text-xs text-slate-500">June 2026</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-slate-600 mb-4">{r.description}</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {r.stats.map((s) => (
                      <div key={s.label} className="text-center">
                        <p className={`text-2xl font-bold ${r.color}`}>
                          <SummaryNum value={s.value} />
                        </p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(r.title, 'PDF')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors border border-red-200"
                    >
                      <FaFilePdf className="text-base" /> PDF
                    </button>
                    <button
                      onClick={() => handleDownload(r.title, 'CSV')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors border border-green-200"
                    >
                      <FaFileCsv className="text-base" /> CSV
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Monthly Trend Chart */}
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MdTrendingUp className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Monthly Trend (2026)</h3>
                    <p className="text-xs text-slate-400">January – June performance overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chartKeys.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setActiveChart(c.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeChart === c.key
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDownload('Monthly Report', 'PDF')}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium ml-2 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <MdDownload /> Download
                  </button>
                </div>
              </div>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChart}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey={activeChart}
                          name={chartKeys.find((c) => c.key === activeChart)?.label}
                          fill={chartKeys.find((c) => c.key === activeChart)?.color}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Two-column charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cargo Type Distribution Pie */}
            {loading ? (
              <SkeletonChart />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Cargo Type Distribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Breakdown by cargo category</p>
                </div>
                <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={cargoTypePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="type"
                      >
                        {cargoTypePieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieCustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {cargoTypePieData.map((item) => (
                      <div key={item.type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-700">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">{item.count}</span>
                          <span className="text-xs text-slate-400 w-8 text-right">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Zone Utilization Bar Chart */}
            {loading ? (
              <SkeletonChart />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Zone Occupancy</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Occupied vs available storage slots</p>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={zoneUtilization} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={52} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Bar dataKey="occupied" name="Occupied" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={20} />
                      <Bar dataKey="available" name="Available" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Performance Line Chart */}
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-800">Delivery Performance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Shipments vs deliveries comparison per month</p>
                </div>
                <button
                  onClick={() => handleDownload('Performance Report', 'CSV')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FaFileCsv /> CSV
                </button>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="shipments"
                      name="Shipments"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight (×10 kg)"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                      dot={{ fill: '#22c55e', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Status Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Cargo Status Summary</h3>
              <button
                onClick={() => handleDownload('Status Summary', 'CSV')}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <MdDownload /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Status', 'Count', 'Percentage', 'Total Weight (kg)', 'Action'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {statusData.map((row) => {
                    const pct = totalCargoCount ? Math.round((row.value / totalCargoCount) * 100) : 0;
                    const weights = {
                      Received: weightsByStatus['Received'] || 0,
                      Stored: weightsByStatus['Stored'] || 0,
                      Ready: weightsByStatus['Ready For Dispatch'] || 0,
                      Dispatched: weightsByStatus['Dispatched'] || 0,
                      Delivered: weightsByStatus['Delivered'] || 0,
                    };
                    return (
                      <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                            <span className="text-sm font-medium text-slate-700">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{row.value}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: row.color }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {(weights[row.name] || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownload(`${row.name} Report`, 'CSV')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <MdDownload className="text-base" /> Export
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* RENDER VIEW: SPREADSHEETS (DYNAMIC EDITING & ANALYTICS) */}
      {viewMode === 'spreadsheet' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Spreadsheet grid (75%) */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-w-0">
            {/* Sheet Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <MdSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search active sheet (e.g. ID, name)...`}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                >
                  Clear
                </button>
              </div>

              {/* Status/Type Filter Selectors for current sheet */}
              <div className="flex items-center gap-2">
                {activeSheet === 'cargo' && (
                  <>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Types</option>
                      <option value="General Cargo">General Cargo</option>
                      <option value="Perishable">Perishable</option>
                      <option value="Hazardous">Hazardous</option>
                      <option value="Fragile">Fragile</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Received">Received</option>
                      <option value="Stored">Stored</option>
                      <option value="Ready For Dispatch">Ready For Dispatch</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </>
                )}

                {activeSheet === 'dispatch' && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                )}

                <button
                  onClick={fetchReportData}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                  title="Reload data from server"
                >
                  <MdRefresh className="text-base" />
                </button>
              </div>
            </div>

            {/* Formula Bar */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-mono select-none">
              <span className="text-blue-600 font-bold italic mr-1">fx</span>
              <div className="w-16 text-slate-500 text-right pr-2 border-r border-slate-200 truncate">
                {activeCell ? `${activeCell.field}:${activeCell.id}` : 'Formula'}
              </div>
              <div className="flex-1 text-slate-700 truncate px-2 font-medium bg-white border border-slate-200/80 rounded py-0.5 shadow-inner">
                {activeSheet === 'cargo' && (
                  <span>SUM(G2:G{filteredCargo.length + 1}) = {cargoTotalPackages} pkgs | SUM(H2:H{filteredCargo.length + 1}) = {cargoTotalWeight.toLocaleString()} kg | AVERAGE(H2:H{filteredCargo.length + 1}) = {cargoAverageWeight.toLocaleString()} kg</span>
                )}
                {activeSheet === 'dispatch' && (
                  <span>COUNT(H2:H{filteredDispatch.length + 1}) = {dispatchTotal} | ACTIVE = {dispatchActive} | DELIVERED = {dispatchDelivered}</span>
                )}
                {activeSheet === 'warehouse' && (
                  <span>SUM(B2:B{filteredWarehouse.length + 1}) = {warehouseTotalCapacity} slots | SUM(C2:C{filteredWarehouse.length + 1}) = {warehouseTotalOccupied} | AVERAGE(E2:E{filteredWarehouse.length + 1}) = {warehouseAverageOccupancy}%</span>
                )}
              </div>
            </div>

            {/* Spreadsheet Grid Container */}
            <div className="overflow-auto max-h-[500px] scrollbar-thin">
              <table className="w-full border-collapse table-fixed text-left font-mono">
                
                {/* Columns headers indices (A, B, C...) */}
                <thead className="sticky top-0 bg-slate-100 z-20 text-[10px] text-slate-500 font-semibold select-none border-b border-slate-300">
                  <tr>
                    <th className="w-10 bg-slate-200 border-r border-slate-300 text-center py-1"></th>
                    {activeSheet === 'cargo' && (
                      <>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">A (Cargo ID)</th>
                        <th className="w-44 border-r border-slate-200 px-2 py-1 text-center">B (Customer)</th>
                        <th className="w-32 border-r border-slate-200 px-2 py-1 text-center">C (Phone)</th>
                        <th className="w-32 border-r border-slate-200 px-2 py-1 text-center">D (Cargo Type)</th>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">E (Origin)</th>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">F (Dest)</th>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">G (Packages)</th>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">H (Weight)</th>
                        <th className="w-40 border-r border-slate-200 px-2 py-1 text-center">I (Status)</th>
                        <th className="w-32 border-r border-slate-200 px-2 py-1 text-center">J (Zone)</th>
                        <th className="w-32 px-2 py-1 text-center">K (Location)</th>
                      </>
                    )}
                    {activeSheet === 'dispatch' && (
                      <>
                        <th className="w-28 border-r border-slate-200 px-2 py-1 text-center">A (Dispatch ID)</th>
                        <th className="w-24 border-r border-slate-200 px-2 py-1 text-center">B (Cargo ID)</th>
                        <th className="w-44 border-r border-slate-200 px-2 py-1 text-center">C (Customer)</th>
                        <th className="w-36 border-r border-slate-200 px-2 py-1 text-center">D (Driver)</th>
                        <th className="w-32 border-r border-slate-200 px-2 py-1 text-center">E (Vehicle)</th>
                        <th className="w-40 border-r border-slate-200 px-2 py-1 text-center">F (Dispatch Date)</th>
                        <th className="w-40 border-r border-slate-200 px-2 py-1 text-center">G (Est. Delivery)</th>
                        <th className="w-40 px-2 py-1 text-center">H (Status)</th>
                      </>
                    )}
                    {activeSheet === 'warehouse' && (
                      <>
                        <th className="w-48 border-r border-slate-200 px-2 py-1 text-center">A (Zone Name)</th>
                        <th className="w-36 border-r border-slate-200 px-2 py-1 text-center">B (Capacity)</th>
                        <th className="w-36 border-r border-slate-200 px-2 py-1 text-center">C (Occupied Slots)</th>
                        <th className="w-36 border-r border-slate-200 px-2 py-1 text-center">D (Available Slots)</th>
                        <th className="w-36 px-2 py-1 text-center">E (Occupancy %)</th>
                      </>
                    )}
                  </tr>
                </thead>

                {/* Spreadsheet cells grid body */}
                <tbody className="divide-y divide-slate-200/80 bg-white text-xs">
                  
                  {/* Cargo rows */}
                  {activeSheet === 'cargo' && filteredCargo.map((item, idx) => {
                    const isDirty = dirtyCargoIds.has(item.cargo_id);
                    return (
                      <tr key={item.cargo_id} className="hover:bg-slate-50/50">
                        {/* Row Index */}
                        <td className="bg-slate-50 border-r border-slate-300 text-[10px] text-slate-400 font-semibold text-center select-none py-1.5">{idx + 2}</td>
                        
                        {/* Cargo ID (Read-only) */}
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-medium select-text">{item.cargo_id}</td>
                        
                        {/* Customer Name */}
                        <td className={`px-2 border-r border-slate-200 relative ${isDirty && 'bg-amber-50/40'}`}>
                          <input
                            type="text"
                            value={item.customer_name || ''}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'B' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'customer_name', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                          {isDirty && <div className="absolute top-0 right-0 border-[3px] border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent" />}
                        </td>

                        {/* Customer Phone */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.customer_phone || ''}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'C' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'customer_phone', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Cargo Type */}
                        <td className="px-2 border-r border-slate-200">
                          <select
                            value={item.cargo_type || 'General Cargo'}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'D' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'cargo_type', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                          >
                            <option value="General Cargo">General Cargo</option>
                            <option value="Perishable">Perishable</option>
                            <option value="Hazardous">Hazardous</option>
                            <option value="Fragile">Fragile</option>
                          </select>
                        </td>

                        {/* Origin Airport */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.origin_airport || ''}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'E' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'origin_airport', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono uppercase py-0.5 text-xs text-slate-850 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Destination Airport */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.destination_airport || ''}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'F' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'destination_airport', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono uppercase py-0.5 text-xs text-slate-850 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Package Count */}
                        <td className="px-2 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            value={item.package_count || 1}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'G' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'package_count', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono py-0.5 text-xs text-right text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Weight */}
                        <td className="px-2 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            value={item.weight || 0}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'H' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'weight', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono py-0.5 text-xs text-right text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Status dropdown */}
                        <td className="px-2 border-r border-slate-200">
                          <select
                            value={item.status || 'Received'}
                            onFocus={() => setActiveCell({ id: item.cargo_id, field: 'I' })}
                            onChange={(e) => handleCargoCellEdit(item.cargo_id, 'status', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-850 font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                          >
                            <option value="Received">Received</option>
                            <option value="Stored">Stored</option>
                            <option value="Ready For Dispatch">Ready For Dispatch</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>

                        {/* Zone Name (Read Only) */}
                        <td className="px-2 border-r border-slate-200 text-slate-400 font-sans truncate">{item.zone_name || '—'}</td>

                        {/* Location (Read Only) */}
                        <td className="px-2 text-slate-400 font-mono truncate">{item.location_code || '—'}</td>
                      </tr>
                    );
                  })}

                  {/* Dispatch rows */}
                  {activeSheet === 'dispatch' && filteredDispatch.map((item, idx) => {
                    const isDirty = dirtyDispatchIds.has(item.dispatch_id);
                    return (
                      <tr key={item.dispatch_id} className="hover:bg-slate-50/50">
                        {/* Row Index */}
                        <td className="bg-slate-50 border-r border-slate-300 text-[10px] text-slate-400 font-semibold text-center select-none py-1.5">{idx + 2}</td>

                        {/* Dispatch ID */}
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-medium">{item.dispatch_id}</td>

                        {/* Cargo ID */}
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-mono">{item.cargo_ref || item.cargo_id}</td>

                        {/* Customer */}
                        <td className="px-2 border-r border-slate-200 text-slate-400 font-sans truncate">{item.customer_name || '—'}</td>

                        {/* Driver Name */}
                        <td className={`px-2 border-r border-slate-200 relative ${isDirty && 'bg-amber-50/40'}`}>
                          <input
                            type="text"
                            value={item.driver_name || ''}
                            onFocus={() => setActiveCell({ id: item.dispatch_id, field: 'D' })}
                            onChange={(e) => handleDispatchCellEdit(item.dispatch_id, 'driver_name', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                          {isDirty && <div className="absolute top-0 right-0 border-[3px] border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent" />}
                        </td>

                        {/* Vehicle Number */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.vehicle_number || ''}
                            onFocus={() => setActiveCell({ id: item.dispatch_id, field: 'E' })}
                            onChange={(e) => handleDispatchCellEdit(item.dispatch_id, 'vehicle_number', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono py-0.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </td>

                        {/* Dispatch Date */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="date"
                            value={item.dispatch_date ? item.dispatch_date.split('T')[0] : ''}
                            onFocus={() => setActiveCell({ id: item.dispatch_id, field: 'F' })}
                            onChange={(e) => handleDispatchCellEdit(item.dispatch_id, 'dispatch_date', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono py-0.5 text-xs text-slate-850 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                          />
                        </td>

                        {/* Expected Delivery Date */}
                        <td className="px-2 border-r border-slate-200">
                          <input
                            type="date"
                            value={item.expected_delivery ? item.expected_delivery.split('T')[0] : ''}
                            onFocus={() => setActiveCell({ id: item.dispatch_id, field: 'G' })}
                            onChange={(e) => handleDispatchCellEdit(item.dispatch_id, 'expected_delivery', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-mono py-0.5 text-xs text-slate-850 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                          />
                        </td>

                        {/* Dispatch Status */}
                        <td className="px-2">
                          <select
                            value={item.status || 'Scheduled'}
                            onFocus={() => setActiveCell({ id: item.dispatch_id, field: 'H' })}
                            onChange={(e) => handleDispatchCellEdit(item.dispatch_id, 'status', e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-sans py-0.5 text-xs text-slate-850 font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-0.5"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Warehouse rows */}
                  {activeSheet === 'warehouse' && filteredWarehouse.map((item, idx) => {
                    const occupancy = item.capacity ? Math.round((item.occupied / item.capacity) * 100) : 0;
                    return (
                      <tr key={item.zone_id || item.zone_name} className="hover:bg-slate-50/50">
                        {/* Row Index */}
                        <td className="bg-slate-50 border-r border-slate-300 text-[10px] text-slate-400 font-semibold text-center select-none py-1.5">{idx + 2}</td>

                        {/* Zone Name (A) */}
                        <td className="px-2 border-r border-slate-200 text-slate-700 font-medium font-sans py-1.5">{item.zone_name}</td>

                        {/* Capacity (B) */}
                        <td className="px-2 border-r border-slate-200 text-right font-mono text-slate-600 pr-4">{item.capacity}</td>

                        {/* Occupied slots (C) */}
                        <td className="px-2 border-r border-slate-200 text-right font-mono text-slate-600 pr-4">{item.occupied}</td>

                        {/* Available Slots (D) */}
                        <td className="px-2 border-r border-slate-200 text-right font-mono text-slate-500 pr-4">{item.capacity - item.occupied}</td>

                        {/* Occupancy % (E) */}
                        <td className="px-2 font-mono text-right text-slate-700 pr-4 font-semibold">
                          <span className={occupancy > 80 ? 'text-red-600' : occupancy > 50 ? 'text-amber-600' : 'text-green-600'}>
                            {occupancy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* BOTTOM FORMULAS/SUMMARY ROWS */}
                  {/* Row indices continue */}
                  
                  {activeSheet === 'cargo' && (
                    <>
                      {/* Packages SUM Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-300 z-10 sticky bottom-8">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T1</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">TOTAL (SUM)</td>
                        <td colSpan="4" className="border-r border-slate-200"></td>
                        <td className="px-2 border-r border-slate-200 text-right text-blue-700">{cargoTotalPackages}</td>
                        <td className="px-2 border-r border-slate-200 text-right text-blue-700">{cargoTotalWeight.toLocaleString()}</td>
                        <td colSpan="3"></td>
                      </tr>
                      {/* Weight AVERAGE Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-200 z-10 sticky bottom-0">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T2</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">AVG (AVERAGE)</td>
                        <td colSpan="4" className="border-r border-slate-200"></td>
                        <td className="px-2 border-r border-slate-200"></td>
                        <td className="px-2 border-r border-slate-200 text-right text-blue-700">{cargoAverageWeight.toLocaleString()}</td>
                        <td colSpan="3"></td>
                      </tr>
                    </>
                  )}

                  {activeSheet === 'dispatch' && (
                    <>
                      {/* Active count Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-300 z-10 sticky bottom-8">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T1</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">TOTAL ACTIVE</td>
                        <td colSpan="5" className="border-r border-slate-200"></td>
                        <td className="px-2 text-amber-600">{dispatchActive}</td>
                      </tr>
                      {/* Delivered count Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-200 z-10 sticky bottom-0">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T2</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">DELIVERED (SUM)</td>
                        <td colSpan="5" className="border-r border-slate-200"></td>
                        <td className="px-2 text-green-600">{dispatchDelivered}</td>
                      </tr>
                    </>
                  )}

                  {activeSheet === 'warehouse' && (
                    <>
                      {/* Total capacity Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-300 z-10 sticky bottom-8">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T1</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">TOTALS (SUM)</td>
                        <td className="px-2 border-r border-slate-200 text-right pr-4 text-purple-700">{warehouseTotalCapacity}</td>
                        <td className="px-2 border-r border-slate-200 text-right pr-4 text-purple-700">{warehouseTotalOccupied}</td>
                        <td className="px-2 border-r border-slate-200 text-right pr-4 text-purple-700">{warehouseTotalCapacity - warehouseTotalOccupied}</td>
                        <td className="px-2"></td>
                      </tr>
                      {/* Occupancy Average Row */}
                      <tr className="bg-slate-100 font-bold border-t border-slate-200 z-10 sticky bottom-0">
                        <td className="bg-slate-200 text-[10px] text-slate-500 text-center select-none py-1 border-r border-slate-300">T2</td>
                        <td className="px-2 border-r border-slate-200 text-slate-500 font-sans">AVG OCCUPANCY</td>
                        <td colSpan="3" className="border-r border-slate-200"></td>
                        <td className="px-2 text-right pr-4 text-purple-700">{warehouseAverageOccupancy}%</td>
                      </tr>
                    </>
                  )}

                </tbody>
              </table>
            </div>

            {/* Bottom Excel-style sheet tabs */}
            <div className="bg-slate-100 border-t border-slate-300 px-4 py-1.5 flex gap-2 select-none items-center">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider mr-2">SHEETS:</span>
              <button
                onClick={() => { setActiveSheet('cargo'); setFilterStatus('All'); setFilterType('All'); setSearchQuery(''); }}
                className={`px-3 py-1 border text-xs font-semibold rounded transition-all ${
                  activeSheet === 'cargo'
                    ? 'bg-white border-slate-300 border-t-blue-500 border-t-2 text-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                📂 Cargo Inventory
              </button>
              <button
                onClick={() => { setActiveSheet('dispatch'); setFilterStatus('All'); setFilterType('All'); setSearchQuery(''); }}
                className={`px-3 py-1 border text-xs font-semibold rounded transition-all ${
                  activeSheet === 'dispatch'
                    ? 'bg-white border-slate-300 border-t-blue-500 border-t-2 text-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                🚚 Dispatch Records
              </button>
              <button
                onClick={() => { setActiveSheet('warehouse'); setFilterStatus('All'); setFilterType('All'); setSearchQuery(''); }}
                className={`px-3 py-1 border text-xs font-semibold rounded transition-all ${
                  activeSheet === 'warehouse'
                    ? 'bg-white border-slate-300 border-t-blue-500 border-t-2 text-blue-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                🏢 Warehouse Capacity
              </button>
            </div>
          </div>

          {/* Right Live Analytics Panel (25%) */}
          <div className="w-full lg:w-72 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-sm tracking-wide text-amber-400 uppercase flex items-center gap-1.5">
                <MdAssessment /> Live Analytics Panel
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Updates in real-time as you filter or modify the spreadsheet.</p>
            </div>

            {/* Render contextual sidebar analytics */}
            {activeSheet === 'cargo' && (
              <div className="space-y-5">
                {/* Weight progress gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Weight Storage Limit</span>
                    <span className="font-bold text-amber-400">{Math.round((cargoTotalWeight / 50000) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2 shadow-inner overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cargoTotalWeight / 50000) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">{cargoTotalWeight.toLocaleString()} kg of 50,000 kg capacity</p>
                </div>

                {/* Total pkgs KPI */}
                <div className="bg-slate-800/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Package Volume</p>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">{cargoTotalPackages}</h4>
                  </div>
                  <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs">
                    PKGS
                  </div>
                </div>

                {/* Average Weight KPI */}
                <div className="bg-slate-800/80 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Avg Weight</p>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">{cargoAverageWeight.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></h4>
                  </div>
                  <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 font-bold text-xs">
                    AVG
                  </div>
                </div>

                {/* Live Status Counts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-350">Distribution by Status</h4>
                  <div className="space-y-1.5">
                    {Object.entries(
                      filteredCargo.reduce((acc, c) => {
                        acc[c.status] = (acc[c.status] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-xs bg-slate-800/40 px-2.5 py-1 rounded-lg">
                        <span className="text-slate-350">{status}</span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSheet === 'dispatch' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/85 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase">Total Runs</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">{dispatchTotal}</p>
                  </div>
                  <div className="bg-slate-800/85 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase">Active Runs</p>
                    <p className="text-2xl font-extrabold text-amber-400 mt-0.5">{dispatchActive}</p>
                  </div>
                </div>

                {/* Dispatch status bars */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-300">Delivery Success Rate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Delivered</span>
                      <span className="font-bold text-green-400">
                        {dispatchTotal ? Math.round((dispatchDelivered / dispatchTotal) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${dispatchTotal ? (dispatchDelivered / dispatchTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-[11px] text-slate-300 space-y-2 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <MdInfo className="text-sm text-blue-400" />
                    <span>Operations Memo</span>
                  </div>
                  <p>Check the scheduled and in-transit dispatch records to match driver allocations. Re-assign drivers if delayed alerts pop up.</p>
                </div>
              </div>
            )}

            {activeSheet === 'warehouse' && (
              <div className="space-y-5">
                {/* Total Capacity Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-350">Overall Occupancy</span>
                    <span className={`font-bold ${warehouseAverageOccupancy > 80 ? 'text-red-400' : warehouseAverageOccupancy > 50 ? 'text-amber-400' : 'text-green-400'}`}>
                      {warehouseAverageOccupancy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        warehouseAverageOccupancy > 80 
                          ? 'bg-red-500' 
                          : warehouseAverageOccupancy > 50 
                            ? 'bg-amber-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${warehouseAverageOccupancy}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">
                    {warehouseTotalOccupied} occupied of {warehouseTotalCapacity} slots
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/85 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase">Total Zones</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{filteredWarehouse.length}</p>
                  </div>
                  <div className="bg-slate-800/85 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase">Available Slots</p>
                    <p className="text-xl font-extrabold text-green-400 mt-0.5">{warehouseTotalCapacity - warehouseTotalOccupied}</p>
                  </div>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-semibold text-amber-400 mb-1.5">Capacity Warning!</h4>
                  <div className="space-y-1">
                    {filteredWarehouse.map(z => {
                      const pct = z.capacity ? Math.round((z.occupied / z.capacity) * 100) : 0;
                      if (pct > 75) {
                        return (
                          <div key={z.zone_name} className="flex justify-between text-[10px] text-red-300">
                            <span>{z.zone_name.split(' - ')[0]}</span>
                            <span>{pct}% Full</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MdCalendarToday className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Schedule Automated Reports</h3>
            <p className="text-blue-200 text-sm">Get reports delivered to your inbox automatically</p>
          </div>
          <button
            onClick={() => success('Report scheduling coming soon!')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors flex-shrink-0"
          >
            Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
}
