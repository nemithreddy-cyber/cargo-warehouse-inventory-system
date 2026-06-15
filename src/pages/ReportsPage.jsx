import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MdDownload, MdAssessment, MdLocalShipping, MdWarehouse, MdCalendarToday, MdTrendingUp } from 'react-icons/md';
import { FaFilePdf, FaFileCsv } from 'react-icons/fa';
import ToastContainer from '../components/ToastContainer';
import { SkeletonChart, SkeletonPulse } from '../components/SkeletonLoader';
import { useToast } from '../hooks/useToast';
import { cargoData, dispatchRecords, warehouseZones, dashboardStats, cargoTypeDistribution } from '../data/dummyData';

// ─── Chart Data ───────────────────────────────────────────────────────────────
const monthlyData = [
  { month: 'Jan', shipments: 18, weight: 4200, revenue: 31500 },
  { month: 'Feb', shipments: 24, weight: 5800, revenue: 42100 },
  { month: 'Mar', shipments: 31, weight: 7100, revenue: 56000 },
  { month: 'Apr', shipments: 28, weight: 6300, revenue: 48900 },
  { month: 'May', shipments: 35, weight: 8200, revenue: 63400 },
  { month: 'Jun', shipments: 12, weight: 2900, revenue: 21600 },
];

const statusData = [
  { name: 'Received', value: 3, color: '#3b82f6' },
  { name: 'Stored', value: 3, color: '#8b5cf6' },
  { name: 'Ready', value: 2, color: '#f59e0b' },
  { name: 'Dispatched', value: 2, color: '#f97316' },
  { name: 'Delivered', value: 2, color: '#22c55e' },
];

const zoneUtilization = warehouseZones.map((z) => ({
  name: z.name,
  occupied: z.occupiedLocations,
  available: z.totalLocations - z.occupiedLocations,
  capacity: Math.round((z.currentLoad / z.maxCapacity) * 100),
}));

const cargoTypePieData = cargoTypeDistribution.map((c, i) => ({
  ...c,
  color: ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6],
}));

const reportCards = [
  {
    title: 'Cargo Report',
    icon: MdAssessment,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Complete inventory of all cargo items, statuses, and weights.',
    stats: [
      { label: 'Total Cargo', value: dashboardStats.totalCargo },
      { label: 'Active', value: dashboardStats.receivedCargo + dashboardStats.storedCargo + dashboardStats.readyForDispatch },
      { label: 'Completed', value: dashboardStats.deliveredCargo },
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
      { label: 'Dispatched', value: dispatchRecords.length },
      { label: 'In Transit', value: dispatchRecords.filter((r) => r.status === 'In Transit').length },
      { label: 'Delivered', value: dispatchRecords.filter((r) => r.status === 'Delivered').length },
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
      { label: 'Total Zones', value: warehouseZones.length },
      { label: 'Total Locations', value: warehouseZones.reduce((a, z) => a + z.totalLocations, 0) },
      { label: 'Occupied', value: warehouseZones.reduce((a, z) => a + z.occupiedLocations, 0) },
    ],
  },
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

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const handleDownload = (type, format) => {
    success(`${type} downloading as ${format}... (Demo mode)`);
  };

  const chartKeys = [
    { key: 'shipments', label: 'Shipments', color: '#3b82f6' },
    { key: 'weight', label: 'Weight (kg)', color: '#8b5cf6' },
    { key: 'revenue', label: 'Revenue (AED)', color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports &amp; Analytics</h2>
          <p className="text-slate-500 text-sm">Generate and download comprehensive cargo operations reports</p>
        </div>
        <button
          onClick={() => handleDownload('Full Report', 'PDF')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <MdDownload className="text-lg" /> Export All
        </button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportCards.map((r) => (
          <div
            key={r.title}
            className={`bg-white rounded-2xl border-2 ${r.borderColor} shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
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
                    <p className={`text-2xl font-bold ${r.color}`}>{s.value}</p>
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
          </div>
        ))}
      </div>

      {/* Monthly Trend Chart (Recharts) */}
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
            <ResponsiveContainer width="100%" height={280}>
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
                const pct = Math.round((row.value / dashboardStats.totalCargo) * 100);
                const weights = { Received: 2310, Stored: 955.5, Ready: 600, Dispatched: 3300, Delivered: 1830 };
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
