import { useState, useEffect } from 'react';
import { MdAdd, MdWarehouse, MdLocationOn, MdAssignment } from 'react-icons/md';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ToastContainer from '../components/ToastContainer';
import { SkeletonCard, SkeletonPulse } from '../components/SkeletonLoader';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';

export default function WarehouseManagementPage() {
  const [loading, setLoading] = useState(true);
  const [warehouseZones, setWarehouseZones] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [activeZone, setActiveZone] = useState('All');
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', temperature: '', maxCapacity: '' });
  const [locationForm, setLocationForm] = useState({ id: '', zone: '', row: '', column: '', capacity: '' });
  const [unassignedCargo, setUnassignedCargo] = useState([]);
  const [selectedCargoToAssign, setSelectedCargoToAssign] = useState('');
  const [assigningCargo, setAssigningCargo] = useState(false);
  const { toasts, success, error: toastError, removeToast } = useToast();

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const [zonesRes, locationsRes] = await Promise.all([
        api.get('/warehouse/zones'),
        api.get('/warehouse/locations'),
      ]);
      
      const dbZones = zonesRes.data.data?.zones || zonesRes.data.zones || [];
      const zoneColors = { 1: '#3b82f6', 2: '#10b981', 3: '#f59e0b', 4: '#ef4444', 5: '#8b5cf6' };
      const zoneDescriptions = { 1: 'General Cargo - Dry Storage', 2: 'Temperature Controlled', 3: 'Heavy Cargo & Machinery', 4: 'High Value & Secure Storage', 5: 'Pharmaceuticals & Medical' };
      const zoneTemperatures = { 1: 'Ambient', 2: '2-8°C', 3: 'Ambient', 4: 'Controlled', 5: '15-25°C' };

      const mappedZones = dbZones.map((z) => ({
        id: z.id,
        name: z.zone_name.split(' - ')[0],
        description: zoneDescriptions[z.id] || z.zone_name,
        totalLocations: z.capacity,
        occupiedLocations: z.occupied,
        maxCapacity: z.capacity * 50,
        currentLoad: z.occupied * 50,
        temperature: zoneTemperatures[z.id] || 'Ambient',
        color: zoneColors[z.id] || '#6b7280',
      }));
      setWarehouseZones(mappedZones);

      const dbLocations = locationsRes.data.data?.locations || locationsRes.data.locations || [];
      const mappedLocations = dbLocations.map((l) => ({
        id: l.location_code,
        db_id: l.id,
        zone: l.zone_name ? l.zone_name.split(' - ')[0] : '',
        row: l.location_code.split('-')[0],
        column: parseInt(l.location_code.split('-')[1] || 0, 10),
        status: l.status,
        cargoId: l.cargo_id || null,
        capacity: 500,
        currentLoad: l.status === 'Occupied' ? 450 : 0,
      }));
      setStorageLocations(mappedLocations);
    } catch (err) {
      console.error('Failed to load warehouse data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouseData(); }, []);

  // Fetch cargo without a location (for assignment)
  const fetchUnassignedCargo = async () => {
    try {
      const res = await api.get('/cargo', { params: { limit: 100 } });
      const list = res.data.data || [];
      const unassigned = list.filter((c) =>
        ['Received', 'Stored'].includes(c.status) && !c.location_code
      );
      setUnassignedCargo(unassigned);
    } catch { /* non-fatal */ }
  };

  const handleOpenLocation = (loc) => {
    setSelectedLocation(loc);
    setSelectedCargoToAssign('');
    if (loc.status === 'Available') fetchUnassignedCargo();
  };

  const handleAssignCargo = async () => {
    if (!selectedCargoToAssign || !selectedLocation) return;
    setAssigningCargo(true);
    try {
      const cargo = unassignedCargo.find((c) => c.id === parseInt(selectedCargoToAssign, 10));
      if (!cargo) throw new Error('Cargo not found');

      // Find the zone ID from the location
      const zone = warehouseZones.find((z) => z.name === selectedLocation.zone);

      await api.put(`/cargo/${cargo.id}`, {
        location_id: selectedLocation.db_id,
        zone_id: zone?.id || null,
        status: 'Stored',
      });

      success(`Cargo ${cargo.cargo_id} assigned to ${selectedLocation.id} successfully!`);
      setSelectedLocation(null);
      fetchWarehouseData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to assign cargo to location');
    } finally {
      setAssigningCargo(false);
    }
  };

  const filteredLocations = activeZone === 'All'
    ? storageLocations
    : storageLocations.filter((l) => l.zone === activeZone);

  const allZoneOptions = ['All', ...warehouseZones.map((z) => z.name)];

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouse/zones', {
        zone_name: zoneForm.name,
        capacity: parseInt(zoneForm.maxCapacity, 10) || 100,
      });
      success(`Zone "${zoneForm.name}" created successfully!`);
      fetchWarehouseData();
      setShowZoneModal(false);
      setZoneForm({ name: '', description: '', temperature: '', maxCapacity: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      const zoneNamePart = locationForm.zone;
      const zonesRes = await api.get('/warehouse/zones');
      const dbZones = zonesRes.data.data?.zones || zonesRes.data.zones || [];
      const foundZone = dbZones.find(z => z.zone_name.startsWith(zoneNamePart));
      if (!foundZone) {
        throw new Error('Zone not found');
      }

      await api.post('/warehouse/locations', {
        zone_id: foundZone.id,
        location_code: locationForm.id,
        status: 'Available',
      });
      success(`Storage location "${locationForm.id}" created in ${locationForm.zone}!`);
      fetchWarehouseData();
      setShowLocationModal(false);
      setLocationForm({ id: '', zone: '', row: '', column: '', capacity: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Warehouse Management</h2>
          <p className="text-slate-500 text-sm">Manage zones, storage locations, and occupancy</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowZoneModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <MdAdd /> New Zone
          </button>
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <MdAdd /> New Location
          </button>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && warehouseZones.map((zone) => {
          const pct = Math.round((zone.occupiedLocations / zone.totalLocations) * 100);
          const loadPct = Math.round((zone.currentLoad / zone.maxCapacity) * 100);
          return (
            <div
              key={zone.id}
              onClick={() => setActiveZone(zone.name === activeZone ? 'All' : zone.name)}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${activeZone === zone.name ? 'border-blue-500 shadow-md' : 'border-slate-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: zone.color }}>
                  {zone.name.split(' ')[1]}
                </div>
                <span className="text-xs font-bold text-slate-600">{pct}% full</span>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">{zone.name}</h4>
              <p className="text-xs text-slate-500 mb-3 leading-tight">{zone.description}</p>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: zone.color }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{zone.occupiedLocations} occupied</span>
                <span>{zone.totalLocations - zone.occupiedLocations} free</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">{zone.temperature}</p>
                <p className="text-xs text-slate-500 font-medium">{zone.currentLoad.toLocaleString()} / {zone.maxCapacity.toLocaleString()} kg</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Locations', value: storageLocations.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Occupied', value: storageLocations.filter(l => l.status === 'Occupied').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Available', value: storageLocations.filter(l => l.status === 'Available').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Maintenance', value: storageLocations.filter(l => l.status === 'Maintenance').length, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-600 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Storage Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Storage Locations</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeZone === 'All' ? 'All zones' : activeZone} — {filteredLocations.length} locations
            </p>
          </div>
          {/* Zone filter tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {allZoneOptions.map((z) => (
              <button
                key={z}
                onClick={() => setActiveZone(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeZone === z ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleOpenLocation(loc)}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border-2 ${
                loc.status === 'Occupied' ? 'bg-red-50 border-red-200 hover:border-red-400' :
                loc.status === 'Maintenance' ? 'bg-amber-50 border-amber-200 hover:border-amber-400' :
                'bg-green-50 border-green-200 hover:border-green-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <MdLocationOn className={`text-sm ${loc.status === 'Occupied' ? 'text-red-500' : loc.status === 'Maintenance' ? 'text-amber-500' : 'text-green-500'}`} />
                <span className="text-xs text-slate-400">{loc.zone.split(' ')[1]}</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{loc.id}</p>
              <p className={`text-xs mt-0.5 font-medium ${loc.status === 'Occupied' ? 'text-red-600' : loc.status === 'Maintenance' ? 'text-amber-600' : 'text-green-600'}`}>
                {loc.status}
              </p>
              {loc.cargoId && <p className="text-xs text-slate-400 mt-0.5 truncate">{loc.cargoId}</p>}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-4">
          {[
            { color: 'bg-green-400', label: 'Available' },
            { color: 'bg-red-400', label: 'Occupied' },
            { color: 'bg-amber-400', label: 'Maintenance' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-sm text-slate-600">
              <div className={`w-3 h-3 rounded ${l.color}`}></div>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Location Detail Modal */}
      <Modal isOpen={!!selectedLocation} onClose={() => setSelectedLocation(null)} title={`Location: ${selectedLocation?.id}`} size="sm">
        {selectedLocation && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                selectedLocation.status === 'Occupied' ? 'bg-red-100' :
                selectedLocation.status === 'Maintenance' ? 'bg-amber-100' : 'bg-green-100'
              }`}>
                <MdWarehouse className={`text-3xl ${
                  selectedLocation.status === 'Occupied' ? 'text-red-500' :
                  selectedLocation.status === 'Maintenance' ? 'text-amber-500' : 'text-green-500'
                }`} />
                <p className="text-sm font-bold text-slate-700 mt-1">{selectedLocation.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Zone', value: selectedLocation.zone },
                { label: 'Status', value: <StatusBadge status={selectedLocation.status} /> },
                { label: 'Cargo ID', value: selectedLocation.cargoId || 'Empty' },
                { label: 'Capacity', value: `${selectedLocation.capacity} kg` },
              { label: 'Current Load', value: `${selectedLocation.currentLoad} kg` },
                { label: 'Utilization', value: selectedLocation.capacity ? `${Math.round((selectedLocation.currentLoad / selectedLocation.capacity) * 100)}%` : '0%' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <div className="text-sm font-semibold text-slate-800">{value}</div>
                </div>
              ))}
            </div>
            {/* Assign Cargo Section – only for Available locations */}
            {selectedLocation.status === 'Available' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <MdAssignment className="text-blue-500" /> Assign Cargo to This Location
                </h4>
                {unassignedCargo.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">No unassigned cargo available (Received/Stored without a location).</p>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedCargoToAssign}
                      onChange={(e) => setSelectedCargoToAssign(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    >
                      <option value="">Select cargo to assign...</option>
                      {unassignedCargo.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cargo_id} — {c.customer_name} ({c.cargo_type})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignCargo}
                      disabled={!selectedCargoToAssign || assigningCargo}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {assigningCargo
                        ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        : <MdAssignment />
                      }
                      {assigningCargo ? 'Assigning...' : 'Assign Cargo'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Zone Modal */}
      <Modal isOpen={showZoneModal} onClose={() => setShowZoneModal(false)} title="Create Warehouse Zone" size="sm">
        <form onSubmit={handleCreateZone} className="space-y-4">
          {[
            { label: 'Zone Name', key: 'name', placeholder: 'e.g. Zone F' },
            { label: 'Description', key: 'description', placeholder: 'e.g. Cold Storage' },
            { label: 'Temperature', key: 'temperature', placeholder: 'e.g. 2-8°C' },
            { label: 'Max Capacity (kg)', key: 'maxCapacity', placeholder: 'e.g. 5000', type: 'number' },
          ].map(({ label, key, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
              <input
                type={type}
                value={zoneForm[key]}
                onChange={(e) => setZoneForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                required
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowZoneModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Create Zone</button>
          </div>
        </form>
      </Modal>

      {/* Create Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title="Create Storage Location" size="sm">
        <form onSubmit={handleCreateLocation} className="space-y-4">
          {[
            { label: 'Location ID', key: 'id', placeholder: 'e.g. A-21' },
            { label: 'Row', key: 'row', placeholder: 'e.g. A' },
            { label: 'Column', key: 'column', placeholder: 'e.g. 21', type: 'number' },
            { label: 'Capacity (kg)', key: 'capacity', placeholder: 'e.g. 500', type: 'number' },
          ].map(({ label, key, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
              <input
                type={type}
                value={locationForm[key]}
                onChange={(e) => setLocationForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                required
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Zone</label>
            <select
              value={locationForm.zone}
              onChange={(e) => setLocationForm((p) => ({ ...p, zone: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              required
            >
              <option value="">Select zone...</option>
              {warehouseZones.map((z) => <option key={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowLocationModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">Create Location</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
