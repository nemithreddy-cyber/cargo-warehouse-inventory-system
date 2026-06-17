const Cargo = require('../models/Cargo');
const Warehouse = require('../models/Warehouse');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Dispatch = require('../models/Dispatch');
const db = require('../config/db');

const zoneColors = {
  1: '#3b82f6', // Zone A
  2: '#10b981', // Zone B
  3: '#f59e0b', // Zone C
  4: '#ef4444', // Zone D
  5: '#8b5cf6', // Zone E
};

const zoneDescriptions = {
  1: 'General Cargo - Dry Storage',
  2: 'Temperature Controlled',
  3: 'Heavy Cargo & Machinery',
  4: 'High Value & Secure Storage',
  5: 'Pharmaceuticals & Medical',
};

const zoneTemperatures = {
  1: 'Ambient',
  2: '2-8°C',
  3: 'Ambient',
  4: 'Controlled',
  5: '15-25°C',
};

/**
 * Aggregate all dashboard metrics in a single call.
 */
const getDashboard = async () => {
  // Cargo counts by status
  const statusCounts = await Cargo.countByStatus();
  const counts = {};
  statusCounts.forEach(({ status, count }) => {
    counts[status] = parseInt(count, 10);
  });

  const totalCargo       = Object.values(counts).reduce((a, b) => a + b, 0);
  const receivedCargo    = counts['Received']           || 0;
  const storedCargo      = counts['Stored']             || 0;
  const readyForDispatch = counts['Ready For Dispatch'] || 0;
  const dispatchedCargo  = counts['Dispatched']         || 0;
  const deliveredCargo   = counts['Delivered']          || 0;

  // Warehouse occupancy
  const occupancy = await Warehouse.getOccupancySummary();

  // Recent activities (last 10)
  const recentActivities = await ActivityLog.findRecent(10);

  // Unread notifications
  const notifications = await Notification.findAll(20);
  const unreadCount   = await Notification.countUnread();

  // Query recent cargo
  const dbCargo = await Cargo.findAll('', [], 10, 0);
  const recentCargoMapped = dbCargo.map((c) => ({
    id: c.cargo_id,
    db_id: c.id,
    customerName: c.customer_name,
    cargoType: c.cargo_type,
    originAirport: c.origin_airport,
    destinationAirport: c.destination_airport,
    arrivalDate: c.arrival_date,
    status: c.status,
    weight: parseFloat(c.weight),
    chargeableWeight: parseFloat(c.chargeable_weight),
    billingWeight: parseFloat(c.billing_weight),
    storageLocation: c.location_code,
    warehouseZone: c.zone_name ? c.zone_name.split(' - ')[0] : 'Unassigned',
  }));

  // Query dispatch records
  const dbDispatches = await Dispatch.findAll('', [], 10, 0);
  const dispatchRecordsMapped = dbDispatches.map((d) => ({
    id: d.dispatch_id,
    cargoId: d.cargo_ref,
    customerName: d.customer_name,
    destination: d.destination_airport,
    vehicleNumber: d.vehicle_number,
    driverName: d.driver_name,
    dispatchDate: d.dispatch_date,
    estimatedDelivery: d.expected_delivery,
    status: d.status,
    lastLocation: d.status === 'Delivered' ? 'Delivered' : 'In Transit',
  }));

  // Query warehouse zones details
  const dbZones = await Warehouse.findAllZones();
  const warehouseZonesMapped = dbZones.map((z) => ({
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

  // Calculate total weight of stored/received cargo
  const weightResult = await Cargo.count("WHERE status IN ('Received', 'Stored', 'Ready For Dispatch')", []);
  // We can just calculate total cargo weight
  const [totalWeightRow] = await db.query("SELECT SUM(weight) AS total_weight FROM cargo WHERE status != 'Delivered'");
  const totalWeight = parseFloat(totalWeightRow[0]?.total_weight || 0);

  return {
    totalCargo,
    receivedCargo,
    storedCargo,
    readyForDispatch,
    dispatchedCargo,
    deliveredCargo,
    totalWeight,
    monthlyGrowth: 18.4, // Keep growth constant or compute from history
    warehouseOccupancy: {
      totalCapacity: occupancy.total_capacity || 0,
      totalOccupied: occupancy.total_occupied || 0,
      occupancyPct:  occupancy.occupancy_pct  || 0,
    },
    recentActivities,
    notifications: {
      unreadCount,
      items: notifications,
    },
    recentCargo: recentCargoMapped,
    dispatchRecords: dispatchRecordsMapped,
    warehouseZones: warehouseZonesMapped,
  };
};

module.exports = { getDashboard };
