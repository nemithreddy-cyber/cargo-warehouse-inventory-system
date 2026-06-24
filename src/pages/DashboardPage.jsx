import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdInventory, MdFlightLand, MdWarehouse, MdLocalShipping,
  MdCheckCircle, MdTrendingUp, MdAdd, MdVisibility, MdArrowForward,
  MdWarning, MdError, MdLightbulb, MdNotifications, MdCheck,
  MdAssignment, MdPending, MdPlayArrow, MdCalendarToday,
  MdPeople, MdAssessment, MdBarChart, MdReceipt, MdRefresh,
} from 'react-icons/md';
import { FaBoxes, FaPlane } from 'react-icons/fa';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import { SkeletonCard, SkeletonPulse } from '../components/SkeletonLoader';
import { useNotifications } from '../context/NotificationContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getActivityColor, getActivityIcon } from '../utils/helpers';
import { ROLES } from '../config/permissions';
import api from '../utils/api';


// ─── Shared helpers ────────────────────────────────────────────
const PRIORITY_COLORS = {
  Low:    'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High:   'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};
const STATUS_COLORS = {
  'Pending':     'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed':   'bg-green-100 text-green-700',
};

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function isOverdue(dateStr, status) {
  if (!dateStr || status === 'Completed') return false;
  return new Date(dateStr) < new Date();
}

// ─── Rule-Based Alerts Panel (shared across roles) ────────────
function RuleAlertsPanel({ alerts, suggestions, loadingAlerts, onRefresh }) {
  const navigate = useNavigate();
  const getAlertStyles = (priority) => {
    if (priority === 'critical') return {
      bg: 'bg-red-50 border-red-200', text: 'text-red-800',
      badge: 'bg-red-500 text-white', icon: MdError, iconColor: 'text-red-500'
    };
    return {
      bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800',
      badge: 'bg-amber-500 text-white', icon: MdWarning, iconColor: 'text-amber-500'
    };
  };

  if (loadingAlerts) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="h-6 bg-slate-100 rounded w-48 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const displayAlerts = alerts.length > 0 ? alerts : [
    { id: 'ok', priority: 'warning', title: 'System Healthy', description: 'No critical alerts detected. All warehouse zones and cargo statuses are within normal thresholds.', type: 'ok' }
  ];

  return (
    <div className="space-y-4">
      {/* Alerts */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>🚨 Critical Alerts & Priorities</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              alerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>{alerts.length} Active</span>
          </h3>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
            title="Refresh alerts"
          >
            <MdRefresh className="text-base" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayAlerts.slice(0, 4).map((alert) => {
            const styles = getAlertStyles(alert.priority);
            const AlertIcon = styles.icon;
            return (
              <div key={alert.id} className={`border rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md ${styles.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <AlertIcon className={`text-lg ${styles.iconColor}`} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{alert.title}</span>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${styles.badge}`}>
                    {alert.priority === 'critical' ? '!' : '⚠'}
                  </span>
                </div>
                <p className={`text-xs font-semibold mt-3 ${styles.text}`}>{alert.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Recommendations */}
      {suggestions.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
            <MdLightbulb className="text-amber-500 text-lg" /> Smart Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.slice(0, 3).map((rec, i) => (
              <div key={i} className="p-3 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border border-slate-100 rounded-xl hover:shadow-sm transition-all flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MdLightbulb className="text-blue-600 text-xs" />
                  </div>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">{rec.text}</p>
                </div>
                <button onClick={() => navigate(rec.path)} className="text-[10px] text-blue-600 hover:text-blue-700 font-bold self-start flex items-center gap-0.5">
                  {rec.action} <MdArrowForward className="text-[8px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks Widget (shared across all dashboards) ──────────────
function AssignedTasksWidget({ myTasks, navigate }) {
  const displayTasks = myTasks.filter((t) => t.status !== 'Completed').slice(0, 5);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <MdAssignment className="text-blue-500 text-lg" />
          <span>Assigned Tasks</span>
          {displayTasks.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{displayTasks.length}</span>
          )}
        </h3>
        <button onClick={() => navigate('/tasks')} className="text-xs text-blue-600 hover:text-blue-700 font-bold">View All</button>
      </div>
      <div className="divide-y divide-slate-50 flex-1">
        {displayTasks.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <MdCheckCircle className="text-green-400 text-3xl" />
            <p>All caught up! No pending tasks.</p>
          </div>
        ) : displayTasks.map((t) => {
          const overdue = isOverdue(t.due_date, t.status);
          return (
            <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate('/tasks')}>
              <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                t.priority === 'Urgent' ? 'bg-red-500' : t.priority === 'High' ? 'bg-amber-500' : t.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                  {t.due_date && (
                    <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                      <MdCalendarToday className="text-[9px]" />
                      {overdue ? 'Overdue' : formatShortDate(t.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Super Admin Dashboard (full view) ────────────────────────
function SuperAdminDashboard({ navigate, notifications, data, alerts, suggestions, loadingAlerts, onRefreshAlerts }) {
  const { myTasks, pendingCount, inProgressCount } = useTasks();
  const cargoData = data.recentCargo || [];
  const warehouseZones = data.warehouseZones || [];
  const dashboardStats = data;
  const recentCargo = cargoData.slice(0, 5);

  const stats = [
    { title: 'Total Cargo', value: dashboardStats.totalCargo, icon: FaBoxes, bgColor: 'bg-blue-50', color: 'text-blue-600', trend: 'up', trendValue: '+18.4%', description: 'vs last month', onClick: () => navigate('/cargo') },
    { title: 'Received', value: dashboardStats.receivedCargo, icon: MdFlightLand, bgColor: 'bg-cyan-50', color: 'text-cyan-600', trend: 'up', trendValue: '+2 today', onClick: () => navigate('/cargo/add') },
    { title: 'Stored', value: dashboardStats.storedCargo, icon: MdWarehouse, bgColor: 'bg-purple-50', color: 'text-purple-600', trend: 'neutral', trendValue: 'stable', onClick: () => navigate('/warehouse') },
    { title: 'Ready for Dispatch', value: dashboardStats.readyForDispatch, icon: MdInventory, bgColor: 'bg-amber-50', color: 'text-amber-600', trend: 'up', trendValue: 'urgent', onClick: () => navigate('/dispatch', { state: { status: 'Ready' } }) },
    { title: 'Dispatched', value: dashboardStats.dispatchedCargo, icon: MdLocalShipping, bgColor: 'bg-orange-50', color: 'text-orange-600', trend: 'up', trendValue: '+1 today', onClick: () => navigate('/dispatch', { state: { status: 'Dispatched' } }) },
    { title: 'Delivered', value: dashboardStats.deliveredCargo, icon: MdCheckCircle, bgColor: 'bg-green-50', color: 'text-green-600', trend: 'up', trendValue: '+33%', onClick: () => navigate('/reports') },
  ];
  const quickActions = [
    { label: 'Receive Cargo', icon: MdAdd, color: 'bg-blue-600 hover:bg-blue-700', to: '/cargo/add' },
    { label: 'View Inventory', icon: MdVisibility, color: 'bg-purple-600 hover:bg-purple-700', to: '/cargo' },
    { label: 'Manage Users', icon: MdPeople, color: 'bg-amber-500 hover:bg-amber-600', to: '/users' },
    { label: 'Reports', icon: MdTrendingUp, color: 'bg-green-600 hover:bg-green-700', to: '/reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => <DashboardCard key={s.title} {...s} />)}
      </div>

      {/* Dynamic Rule-Based Alerts Panel */}
      <RuleAlertsPanel
        alerts={alerts}
        suggestions={suggestions}
        loadingAlerts={loadingAlerts}
        onRefresh={onRefreshAlerts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssignedTasksWidget myTasks={myTasks} navigate={navigate} />
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 flex-1 items-center">
            {quickActions.map((qa) => (
              <button key={qa.label} onClick={() => navigate(qa.to)}
                className={`${qa.color} text-white rounded-xl p-3.5 flex flex-col items-center justify-center gap-2.5 transition-all duration-200 hover:scale-105 hover:shadow-lg h-24`}>
                <qa.icon className="text-2xl" />
                <span className="text-xs font-semibold text-center leading-tight">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Cargo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Cargo</h3>
          <button onClick={() => navigate('/cargo')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold">View all <MdArrowForward /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Cargo ID','Customer','Type','Route','Status','Arrival'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentCargo.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/cargo/${c.id}`)}>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-blue-600">{c.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{c.customerName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.cargoType}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.originAirport} → {c.destinationAirport}</td>
                  <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(c.arrivalDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Occupancy */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Warehouse Occupancy</h3>
          <button onClick={() => navigate('/warehouse')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold">Manage <MdArrowForward /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {warehouseZones.map((zone) => {
            const pct = Math.round((zone.occupiedLocations / zone.totalLocations) * 100);
            return (
              <div key={zone.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-xs truncate max-w-[80px]">{zone.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${pct >= 80 ? 'bg-red-500' : 'bg-green-500'}`}>{pct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#ef4444' : zone.color }} />
                </div>
                <p className="text-[10px] text-slate-500 mb-1 truncate">{zone.description}</p>
                <p className="text-[10px] text-slate-600"><span className="font-semibold">{zone.occupiedLocations}</span> / {zone.totalLocations} locations</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Warehouse Staff Dashboard ─────────────────────────────────
function WarehouseStaffDashboard({ navigate, data }) {
  const { myTasks, pendingCount, inProgressCount, completedCount } = useTasks();
  const cargoData = data.recentCargo || [];
  const warehouseZones = data.warehouseZones || [];
  const dashboardStats = data;
  const storedCargo = cargoData.filter((c) => c.status === 'Stored');
  const readyCargo = cargoData.filter((c) => c.status === 'Ready for Dispatch' || c.status === 'Ready For Dispatch');

  const stats = [
    { title: 'Stored Cargo', value: dashboardStats.storedCargo, icon: MdWarehouse, bgColor: 'bg-purple-50', color: 'text-purple-600', trend: 'neutral', trendValue: 'stable', onClick: () => navigate('/warehouse') },
    { title: 'Received Today', value: dashboardStats.receivedCargo, icon: MdFlightLand, bgColor: 'bg-cyan-50', color: 'text-cyan-600', trend: 'up', trendValue: '+2 today', onClick: () => navigate('/cargo/add') },
    { title: 'Ready for Dispatch', value: dashboardStats.readyForDispatch, icon: MdInventory, bgColor: 'bg-amber-50', color: 'text-amber-600', trend: 'up', trendValue: 'urgent', onClick: () => navigate('/dispatch', { state: { status: 'Ready' } }) },
    { title: 'My Pending Tasks', value: pendingCount, icon: MdAssignment, bgColor: 'bg-blue-50', color: 'text-blue-600', trend: 'neutral', trendValue: 'assigned' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <DashboardCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssignedTasksWidget myTasks={myTasks} navigate={navigate} />
        {/* Zone Occupancy */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Warehouse Zone Status</h3>
            <button onClick={() => navigate('/warehouse')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold">Manage <MdArrowForward /></button>
          </div>
          <div className="p-5 space-y-3">
            {warehouseZones.map((zone) => {
              const pct = Math.round((zone.occupiedLocations / zone.totalLocations) * 100);
              return (
                <div key={zone.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium text-xs">{zone.name} — {zone.description}</span>
                    <span className="font-bold text-xs" style={{ color: zone.color }}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: zone.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Stored Cargo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Cargo in Storage</h3>
          <button onClick={() => navigate('/cargo')} className="text-sm text-blue-600 font-semibold flex items-center gap-1">View All <MdArrowForward /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Cargo ID','Customer','Type','Location','Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {storedCargo.slice(0, 6).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/cargo/${c.id}`)}>
                  <td className="px-6 py-3 text-sm font-mono font-bold text-blue-600">{c.id}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-700">{c.customerName}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.cargoType}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.storageLocation} — {c.warehouseZone}</td>
                  <td className="px-6 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Operations Staff Dashboard ────────────────────────────────
function OperationsStaffDashboard({ navigate, data }) {
  const { myTasks } = useTasks();
  const cargoData = data.recentCargo || [];
  const dispatchRecords = data.dispatchRecords || [];
  const dashboardStats = data;
  const dispatched = dispatchRecords.filter((d) => d.status === 'In Transit');
  const readyCargo = cargoData.filter((c) => c.status === 'Ready for Dispatch' || c.status === 'Ready For Dispatch');

  const stats = [
    { title: 'In Transit', value: dispatched.length, icon: MdLocalShipping, bgColor: 'bg-orange-50', color: 'text-orange-600', trend: 'up', trendValue: 'active', onClick: () => navigate('/dispatch', { state: { status: 'Dispatched' } }) },
    { title: 'Ready for Dispatch', value: readyCargo.length, icon: MdInventory, bgColor: 'bg-amber-50', color: 'text-amber-600', trend: 'up', trendValue: 'urgent', onClick: () => navigate('/dispatch', { state: { status: 'Ready' } }) },
    { title: 'Delivered', value: dashboardStats.deliveredCargo, icon: MdCheckCircle, bgColor: 'bg-green-50', color: 'text-green-600', trend: 'up', trendValue: '+33%', onClick: () => navigate('/reports') },
    { title: 'Total Cargo', value: dashboardStats.totalCargo, icon: FaBoxes, bgColor: 'bg-blue-50', color: 'text-blue-600', trend: 'up', trendValue: 'managed', onClick: () => navigate('/cargo') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <DashboardCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssignedTasksWidget myTasks={myTasks} navigate={navigate} />
        {/* Active Dispatches */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><MdLocalShipping className="text-orange-500" /> Active Dispatches</h3>
            <button onClick={() => navigate('/dispatch')} className="text-xs text-blue-600 font-bold">Manage</button>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {dispatched.map((d) => (
              <div key={d.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/dispatch')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-600">{d.id}</p>
                    <p className="text-xs text-slate-700 font-semibold">{d.customerName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">📍 {d.lastLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">{d.status}</span>
                    <p className="text-[10px] text-slate-500 mt-1">ETA: {formatDate(d.estimatedDelivery)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Cargo', icon: MdAdd, color: 'bg-blue-600 hover:bg-blue-700', to: '/cargo/add' },
            { label: 'Dispatch Mgmt', icon: MdLocalShipping, color: 'bg-orange-500 hover:bg-orange-600', to: '/dispatch' },
            { label: 'View Reports', icon: MdAssessment, color: 'bg-green-600 hover:bg-green-700', to: '/reports' },
            { label: 'Cargo List', icon: MdVisibility, color: 'bg-purple-600 hover:bg-purple-700', to: '/cargo' },
          ].map((qa) => (
            <button key={qa.label} onClick={() => navigate(qa.to)}
              className={`${qa.color} text-white rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg h-20`}>
              <qa.icon className="text-2xl" />
              <span className="text-xs font-semibold">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Documentation Executive Dashboard ────────────────────────
function DocumentationDashboard({ navigate, data }) {
  const { myTasks } = useTasks();
  const cargoData = data.recentCargo || [];
  const dashboardStats = data;
  const recentCargo = cargoData.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Cargo', value: dashboardStats.totalCargo, icon: FaBoxes, bgColor: 'bg-blue-50', color: 'text-blue-600', trend: 'up', trendValue: '12 items', onClick: () => navigate('/cargo') },
          { title: 'Dispatched', value: dashboardStats.dispatchedCargo, icon: MdLocalShipping, bgColor: 'bg-orange-50', color: 'text-orange-600', trend: 'up', trendValue: 'in transit', onClick: () => navigate('/dispatch', { state: { status: 'Dispatched' } }) },
          { title: 'Delivered', value: dashboardStats.deliveredCargo, icon: MdCheckCircle, bgColor: 'bg-green-50', color: 'text-green-600', trend: 'up', trendValue: 'complete', onClick: () => navigate('/reports') },
          { title: 'Pending Docs', value: myTasks.filter((t) => t.status !== 'Completed').length, icon: MdAssignment, bgColor: 'bg-purple-50', color: 'text-purple-600', trend: 'neutral', trendValue: 'tasks' },
        ].map((s) => <DashboardCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssignedTasksWidget myTasks={myTasks} navigate={navigate} />
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Cargo Records (Read-Only)</h3>
            <button onClick={() => navigate('/cargo')} className="text-sm text-blue-600 font-semibold flex items-center gap-1">View All <MdArrowForward /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Cargo ID','Customer','Type','Route','Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentCargo.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/cargo/${c.id}`)}>
                    <td className="px-5 py-3 text-sm font-mono font-bold text-blue-600">{c.id}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-700">{c.customerName}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.cargoType}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{c.originAirport} → {c.destinationAirport}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Cargo Records', icon: MdInventory, color: 'bg-blue-600 hover:bg-blue-700', to: '/cargo' },
            { label: 'Reports', icon: MdAssessment, color: 'bg-green-600 hover:bg-green-700', to: '/reports' },
            { label: 'My Tasks', icon: MdAssignment, color: 'bg-purple-600 hover:bg-purple-700', to: '/tasks' },
          ].map((qa) => (
            <button key={qa.label} onClick={() => navigate(qa.to)}
              className={`${qa.color} text-white rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-105 hover:shadow-lg`}>
              <qa.icon className="text-2xl" />
              <span className="text-sm font-semibold">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Staff Dashboard ──────────────────────────────────
function AccountsDashboard({ navigate, data }) {
  const { myTasks } = useTasks();
  const cargoData = data.recentCargo || [];
  const dashboardStats = data;
  const totalWeight = dashboardStats.totalWeight;
  const totalChargeableWeight = cargoData.reduce((s, c) => s + (c.chargeableWeight || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Cargo', value: dashboardStats.totalCargo, icon: FaBoxes, bgColor: 'bg-blue-50', color: 'text-blue-600', trend: 'up', trendValue: '12 items', onClick: () => navigate('/cargo') },
          { title: 'Total Weight', value: `${(totalWeight/1000).toFixed(1)}t`, icon: MdBarChart, bgColor: 'bg-purple-50', color: 'text-purple-600', trend: 'up', trendValue: 'kg managed' },
          { title: 'Chargeable Wt.', value: `${(totalChargeableWeight/1000).toFixed(1)}t`, icon: MdReceipt, bgColor: 'bg-amber-50', color: 'text-amber-600', trend: 'up', trendValue: 'billable' },
          { title: 'My Tasks', value: myTasks.filter((t) => t.status !== 'Completed').length, icon: MdAssignment, bgColor: 'bg-rose-50', color: 'text-rose-600', trend: 'neutral', trendValue: 'pending' },
        ].map((s) => <DashboardCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssignedTasksWidget myTasks={myTasks} navigate={navigate} />
        {/* Billing summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><MdReceipt className="text-rose-500" /> Cargo Billing Summary</h3>
            <button onClick={() => navigate('/reports')} className="text-sm text-blue-600 font-semibold flex items-center gap-1">Reports <MdArrowForward /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Cargo ID','Customer','Weight (kg)','Chargeable (kg)','Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cargoData.slice(0, 7).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs font-mono font-bold text-blue-600">{c.id}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-700">{c.customerName}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{c.weight?.toFixed(1)}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-amber-700">{c.chargeableWeight?.toFixed(1)}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Cargo Records', icon: MdInventory, color: 'bg-blue-600 hover:bg-blue-700', to: '/cargo' },
            { label: 'Reports', icon: MdAssessment, color: 'bg-green-600 hover:bg-green-700', to: '/reports' },
            { label: 'My Tasks', icon: MdAssignment, color: 'bg-rose-500 hover:bg-rose-600', to: '/tasks' },
          ].map((qa) => (
            <button key={qa.label} onClick={() => navigate(qa.to)}
              className={`${qa.color} text-white rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-105 hover:shadow-lg`}>
              <qa.icon className="text-2xl" />
              <span className="text-sm font-semibold">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Greeting helper ───────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Role banner colors ────────────────────────────────────────
const BANNER_COLORS = {
  [ROLES.SUPER_ADMIN]:        'from-blue-600 via-blue-700 to-slate-800',
  [ROLES.WAREHOUSE_STAFF]:    'from-cyan-600 via-cyan-700 to-slate-800',
  [ROLES.OPERATIONS_STAFF]:   'from-orange-500 via-orange-600 to-slate-800',
  [ROLES.DOCUMENTATION_EXEC]: 'from-purple-600 via-purple-700 to-slate-800',
  [ROLES.ACCOUNTS_STAFF]:     'from-rose-500 via-rose-600 to-slate-800',
};

// ─── Main Dashboard Page ───────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rule-based alerts state
  const [alertData, setAlertData] = useState({ alerts: [], suggestions: [] });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setDashboardData(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const [alertRes, suggestRes] = await Promise.all([
        api.get('/rules/alerts'),
        api.get('/rules/suggestions'),
      ]);
      const allAlerts = alertRes.data?.data?.alerts || [];
      const allSuggestions = [
        ...(suggestRes.data?.data?.suggestions || []),
        ...(suggestRes.data?.data?.recommendations || []),
      ];
      setAlertData({ alerts: allAlerts, suggestions: allSuggestions });
    } catch (err) {
      console.error('Failed to load rule-based alerts', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAlerts();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);


  const role = user?.role || ROLES.WAREHOUSE_STAFF;
  const bannerGradient = BANNER_COLORS[role] || BANNER_COLORS[ROLES.WAREHOUSE_STAFF];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-200 animate-pulse rounded-2xl h-40 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonPulse key={i} className="w-full h-12 rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            <SkeletonPulse className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const displayWeight = dashboardData.totalWeight || 0;
  const displayGrowth = dashboardData.monthlyGrowth || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r ${bannerGradient} rounded-2xl p-6 text-white relative overflow-hidden shadow-sm`}>
        <div className="absolute inset-0 opacity-10">
          <FaPlane className="absolute top-4 right-8 text-8xl rotate-45" />
        </div>
        <div className="relative">
          <h2 className="text-2xl font-bold mb-1">{getGreeting()}, {user?.name?.split(' ')[0]}! ✈️</h2>
          <p className="text-blue-200 text-sm">{today}</p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-200">Role</p>
              <p className="text-sm font-bold">{role}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-200">Total Weight</p>
              <p className="text-sm font-bold">{(displayWeight / 1000).toFixed(1)}t</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-200">Monthly Growth</p>
              <p className="text-sm font-bold text-green-300">+{displayGrowth}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-scoped content */}
      {role === ROLES.SUPER_ADMIN        && <SuperAdminDashboard navigate={navigate} notifications={notifications} data={dashboardData} alerts={alertData.alerts} suggestions={alertData.suggestions} loadingAlerts={loadingAlerts} onRefreshAlerts={fetchAlerts} />}
      {role === ROLES.WAREHOUSE_STAFF    && <WarehouseStaffDashboard navigate={navigate} data={dashboardData} alerts={alertData.alerts} suggestions={alertData.suggestions} loadingAlerts={loadingAlerts} onRefreshAlerts={fetchAlerts} />}
      {role === ROLES.OPERATIONS_STAFF   && <OperationsStaffDashboard navigate={navigate} data={dashboardData} alerts={alertData.alerts} suggestions={alertData.suggestions} loadingAlerts={loadingAlerts} onRefreshAlerts={fetchAlerts} />}
      {role === ROLES.DOCUMENTATION_EXEC && <DocumentationDashboard navigate={navigate} data={dashboardData} alerts={alertData.alerts} suggestions={alertData.suggestions} loadingAlerts={loadingAlerts} onRefreshAlerts={fetchAlerts} />}
      {role === ROLES.ACCOUNTS_STAFF     && <AccountsDashboard navigate={navigate} data={dashboardData} alerts={alertData.alerts} suggestions={alertData.suggestions} loadingAlerts={loadingAlerts} onRefreshAlerts={fetchAlerts} />}
    </div>
  );
}
