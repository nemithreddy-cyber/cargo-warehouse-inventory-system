const db = require('../config/db');

/**
 * Rule-Based Logic Engine
 * 
 * Evaluates live data and applies simple business rules to generate:
 *  - Active alerts (capacity warnings, delays, high-priority cargo)
 *  - Storage suggestions (available zones, status recommendations)
 * 
 * This is deterministic rule-based logic, NOT conversational AI.
 */

// ─── Rule: Zones over 80% capacity ───────────────────────────────────────────
const checkCapacityAlerts = async () => {
  const [zones] = await db.query(
    `SELECT id, zone_name, capacity, occupied,
            ROUND((occupied / NULLIF(capacity, 0)) * 100, 1) AS occupancy_pct
     FROM warehouse_zones
     WHERE capacity > 0
     ORDER BY occupancy_pct DESC`
  );

  const alerts = [];
  for (const zone of zones) {
    const pct = parseFloat(zone.occupancy_pct) || 0;
    if (pct >= 80) {
      alerts.push({
        id: `cap-${zone.id}`,
        type: 'capacity_warning',
        priority: pct >= 95 ? 'critical' : 'warning',
        title: 'Near-Capacity Warehouse Zone',
        description: `${zone.zone_name} is at ${pct}% occupancy (${zone.occupied}/${zone.capacity} slots). Consider rebalancing cargo.`,
        zone: zone.zone_name,
        occupancy: pct,
      });
    }
  }
  return alerts;
};

// ─── Rule: Delayed deliveries (Received/Stored cargo older than 7 days) ───────
const checkDelayedAlerts = async () => {
  const [delayed] = await db.query(
    `SELECT cargo_id, customer_name, status, arrival_date,
            DATEDIFF(CURDATE(), DATE(arrival_date)) AS days_old
     FROM cargo
     WHERE status IN ('Received', 'Stored')
       AND arrival_date IS NOT NULL
       AND DATEDIFF(CURDATE(), DATE(arrival_date)) > 7
     ORDER BY days_old DESC
     LIMIT 5`
  );

  return delayed.map((c) => ({
    id: `delay-${c.cargo_id}`,
    type: 'delayed_delivery',
    priority: c.days_old > 14 ? 'critical' : 'warning',
    title: 'Delayed Delivery',
    description: `${c.cargo_id} (${c.customer_name}) has been ${c.status} for ${c.days_old} days without dispatch.`,
    cargoId: c.cargo_id,
    daysOld: c.days_old,
  }));
};

// ─── Rule: High-priority cargo awaiting action ────────────────────────────────
const checkHighPriorityAlerts = async () => {
  // Cargo marked as Received for more than 2 days = high priority
  const [cargo] = await db.query(
    `SELECT cargo_id, customer_name, cargo_type, status, arrival_date,
            DATEDIFF(CURDATE(), DATE(arrival_date)) AS days_old
     FROM cargo
     WHERE status = 'Received'
       AND arrival_date IS NOT NULL
       AND DATEDIFF(CURDATE(), DATE(arrival_date)) > 2
     ORDER BY days_old DESC
     LIMIT 3`
  );

  return cargo.map((c) => ({
    id: `hp-${c.cargo_id}`,
    type: 'high_priority',
    priority: 'critical',
    title: 'High-Priority Cargo Awaiting Storage',
    description: `${c.cargo_id} (${c.cargo_type} for ${c.customer_name}) received ${c.days_old} days ago — awaiting warehouse storage assignment.`,
    cargoId: c.cargo_id,
    daysOld: c.days_old,
  }));
};

// ─── Rule: Dispatch due today ─────────────────────────────────────────────────
const checkDispatchDueAlerts = async () => {
  const [dispatches] = await db.query(
    `SELECT dr.dispatch_id, c.cargo_id, c.customer_name, dr.expected_delivery, dr.status
     FROM dispatch_records dr
     JOIN cargo c ON c.id = dr.cargo_id
     WHERE dr.status IN ('Scheduled', 'In Transit')
       AND DATE(dr.expected_delivery) <= CURDATE()
     LIMIT 5`
  );

  return dispatches.map((d) => ({
    id: `disp-${d.dispatch_id}`,
    type: 'dispatch_due',
    priority: 'warning',
    title: 'Dispatch Due / Overdue',
    description: `${d.dispatch_id} for ${d.customer_name} (${d.cargo_id}) was expected to be delivered by ${d.expected_delivery}. Current status: ${d.status}.`,
    dispatchId: d.dispatch_id,
  }));
};

// ─── Rule: Storage suggestions ────────────────────────────────────────────────
const generateStorageSuggestions = async () => {
  // Available zones with free slots
  const [zones] = await db.query(
    `SELECT id, zone_name, capacity, occupied,
            (capacity - occupied) AS free_slots,
            ROUND((occupied / NULLIF(capacity, 0)) * 100, 1) AS occupancy_pct
     FROM warehouse_zones
     WHERE capacity > occupied
     ORDER BY occupancy_pct ASC
     LIMIT 3`
  );

  const suggestions = zones.map((z) => ({
    type: 'storage_available',
    text: `${z.zone_name} has ${z.free_slots} available storage slot(s) (${z.occupancy_pct}% full).`,
    action: 'Manage Zones',
    path: '/warehouse',
    zone: z.zone_name,
    freeSlots: z.free_slots,
  }));

  // Cargo that has been stored for more than 5 days and can be dispatched
  const [readyToDispatch] = await db.query(
    `SELECT cargo_id, customer_name, status, arrival_date,
            DATEDIFF(CURDATE(), DATE(arrival_date)) AS days_old
     FROM cargo
     WHERE status = 'Stored'
       AND arrival_date IS NOT NULL
       AND DATEDIFF(CURDATE(), DATE(arrival_date)) >= 5
     ORDER BY days_old DESC
     LIMIT 2`
  );

  for (const c of readyToDispatch) {
    suggestions.push({
      type: 'status_recommendation',
      text: `${c.cargo_id} (${c.customer_name}) has been stored for ${c.days_old} days — consider marking as Ready for Dispatch.`,
      action: 'Open Cargo',
      path: `/cargo/${c.cargo_id}`,
      cargoId: c.cargo_id,
    });
  }

  // Overall utilization warning
  const [overall] = await db.query(
    `SELECT ROUND(SUM(occupied) / NULLIF(SUM(capacity), 0) * 100, 1) AS overall_pct
     FROM warehouse_zones`
  );
  const overallPct = parseFloat(overall[0]?.overall_pct) || 0;
  if (overallPct >= 75) {
    suggestions.push({
      type: 'utilization_warning',
      text: `Overall warehouse utilization is at ${overallPct}%. Consider transferring or dispatching cargo to free up space.`,
      action: 'View Reports',
      path: '/reports',
      utilization: overallPct,
    });
  }

  return suggestions;
};

// ─── Status Recommendations ───────────────────────────────────────────────────
const generateStatusRecommendations = async () => {
  const recs = [];

  // Cargo received but not yet stored
  const [notStored] = await db.query(
    `SELECT COUNT(*) AS cnt FROM cargo WHERE status = 'Received' AND zone_id IS NULL`
  );
  if (parseInt(notStored[0].cnt, 10) > 0) {
    recs.push({
      type: 'action_required',
      message: `${notStored[0].cnt} cargo item(s) received but not yet assigned to a storage zone.`,
      action: 'Assign Storage',
      path: '/warehouse',
    });
  }

  // Ready-for-dispatch cargo with no dispatch record
  const [readyNoDispatch] = await db.query(
    `SELECT c.cargo_id, c.customer_name
     FROM cargo c
     LEFT JOIN dispatch_records dr ON dr.cargo_id = c.id
     WHERE c.status IN ('Ready For Dispatch', 'Ready for Dispatch')
       AND dr.id IS NULL
     LIMIT 3`
  );
  for (const c of readyNoDispatch) {
    recs.push({
      type: 'dispatch_reminder',
      message: `${c.cargo_id} (${c.customer_name}) is ready for dispatch but has no dispatch record.`,
      action: 'Create Dispatch',
      path: '/dispatch',
    });
  }

  return recs;
};

// ─── Main exports ─────────────────────────────────────────────────────────────
const getAlerts = async () => {
  const [capacity, delayed, highPriority, dispatchDue] = await Promise.all([
    checkCapacityAlerts(),
    checkDelayedAlerts(),
    checkHighPriorityAlerts(),
    checkDispatchDueAlerts(),
  ]);

  const allAlerts = [...highPriority, ...capacity, ...delayed, ...dispatchDue];
  return {
    total: allAlerts.length,
    critical: allAlerts.filter((a) => a.priority === 'critical').length,
    warnings: allAlerts.filter((a) => a.priority === 'warning').length,
    alerts: allAlerts,
  };
};

const getSuggestions = async () => {
  const [suggestions, recommendations] = await Promise.all([
    generateStorageSuggestions(),
    generateStatusRecommendations(),
  ]);
  return { suggestions, recommendations };
};

module.exports = { getAlerts, getSuggestions };
