const Cargo = require('../models/Cargo');
const Warehouse = require('../models/Warehouse');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

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

  return {
    totalCargo,
    receivedCargo,
    storedCargo,
    readyForDispatch,
    dispatchedCargo,
    deliveredCargo,
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
  };
};

module.exports = { getDashboard };
