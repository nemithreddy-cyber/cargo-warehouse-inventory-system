const Cargo = require('../models/Cargo');
const Warehouse = require('../models/Warehouse');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { calculateWeights, paginate, paginatedResponse, generateId } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * Build WHERE clause from filter params.
 */
const buildWhere = ({ status, zone_id, search }) => {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  if (zone_id) {
    conditions.push('c.zone_id = ?');
    params.push(zone_id);
  }
  if (search) {
    conditions.push('(c.cargo_id LIKE ? OR c.customer_name LIKE ? OR c.customer_phone LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

/**
 * List cargo with pagination and filters.
 */
const listCargo = async ({ page, limit, status, zone_id, search }) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const { where, params } = buildWhere({ status, zone_id, search });

  const [total, data] = await Promise.all([
    Cargo.count(where, params),
    Cargo.findAll(where, params, l, offset),
  ]);

  return paginatedResponse(data, total, p, l);
};

/**
 * Get a single cargo item.
 */
const getCargo = async (id) => {
  const cargo = await Cargo.findById(id);
  if (!cargo) throw createError('Cargo not found.', 404);
  return cargo;
};

/**
 * Create a new cargo entry.
 */
const createCargo = async (data, userId) => {
  // Auto-generate cargo_id
  const seq = await Cargo.getMaxSequence();
  const cargo_id = generateId('CRG', seq + 1);

  // Business logic: calculate weights
  const { chargeable_weight, billing_weight } = calculateWeights(
    data.weight,
    data.length,
    data.width,
    data.height
  );

  const id = await Cargo.create({
    ...data,
    cargo_id,
    chargeable_weight,
    billing_weight,
    status: data.status || 'Received',
    created_by: userId,
  });

  const cargo = await Cargo.findById(id);

  // Activity log
  await ActivityLog.create({
    user_id: userId,
    action: 'CARGO_CREATED',
    description: `Cargo ${cargo_id} created for ${data.customer_name}`,
  });

  // Notification
  await Notification.create({
    title: 'New Cargo Received',
    message: `Cargo ${cargo_id} from ${data.customer_name} has been received.`,
    type: 'new_cargo',
  });

  // Update zone occupancy if assigned
  if (data.zone_id) {
    await Warehouse.updateZoneOccupancy(data.zone_id, 1);
    // Mark location occupied
    if (data.location_id) {
      await Warehouse.updateLocationStatus(data.location_id, 'Occupied');
    }
    // Check capacity warning
    const zone = await Warehouse.findZoneById(data.zone_id);
    if (zone && zone.capacity > 0) {
      const pct = (zone.occupied / zone.capacity) * 100;
      if (pct >= 80) {
        await Notification.create({
          title: 'Warehouse Capacity Warning',
          message: `${zone.zone_name} is at ${pct.toFixed(0)}% capacity. Consider rebalancing.`,
          type: 'capacity_warning',
        });
      }
    }
  }

  return cargo;
};

/**
 * Update a cargo entry.
 */
const updateCargo = async (id, data, userId) => {
  const existing = await Cargo.findById(id);
  if (!existing) throw createError('Cargo not found.', 404);

  // Recalculate weights if dimensions/weight changed
  const w = data.weight ?? existing.weight;
  const l = data.length ?? existing.length;
  const wi = data.width ?? existing.width;
  const h = data.height ?? existing.height;

  const { chargeable_weight, billing_weight } = calculateWeights(w, l, wi, h);
  data.chargeable_weight = chargeable_weight;
  data.billing_weight = billing_weight;

  // Handle zone reassignment
  if (data.zone_id && data.zone_id !== existing.zone_id) {
    if (existing.zone_id) await Warehouse.updateZoneOccupancy(existing.zone_id, -1);
    await Warehouse.updateZoneOccupancy(data.zone_id, 1);
  }

  // Handle location change
  if (data.location_id && data.location_id !== existing.location_id) {
    if (existing.location_id) await Warehouse.updateLocationStatus(existing.location_id, 'Available');
    await Warehouse.updateLocationStatus(data.location_id, 'Occupied');
  }

  await Cargo.update(existing.id, data);

  // Status-based notifications
  if (data.status === 'Ready For Dispatch') {
    await Notification.create({
      title: 'Cargo Ready For Dispatch',
      message: `Cargo ${existing.cargo_id} is ready for dispatch. Assign a driver.`,
      type: 'cargo_ready',
    });
  }
  if (data.status === 'Delivered') {
    await Notification.create({
      title: 'Cargo Delivered',
      message: `Cargo ${existing.cargo_id} has been successfully delivered.`,
      type: 'cargo_delivered',
    });
  }

  await ActivityLog.create({
    user_id: userId,
    action: 'CARGO_UPDATED',
    description: `Cargo ${existing.cargo_id} updated`,
  });

  return Cargo.findById(existing.id);
};

/**
 * Delete a cargo entry.
 */
const deleteCargo = async (id, userId) => {
  const existing = await Cargo.findById(id);
  if (!existing) throw createError('Cargo not found.', 404);

  if (existing.zone_id) await Warehouse.updateZoneOccupancy(existing.zone_id, -1);
  if (existing.location_id) await Warehouse.updateLocationStatus(existing.location_id, 'Available');

  await Cargo.delete(existing.id);

  await ActivityLog.create({
    user_id: userId,
    action: 'CARGO_DELETED',
    description: `Cargo ${existing.cargo_id} deleted`,
  });
};

module.exports = { listCargo, getCargo, createCargo, updateCargo, deleteCargo };
