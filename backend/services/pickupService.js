const Pickup = require('../models/Pickup');
const Cargo = require('../models/Cargo');
const ActivityLog = require('../models/ActivityLog');
const { createError } = require('../middleware/errorHandler');

const generateScheduleId = async () => {
  const year = new Date().getFullYear();
  const maxSeq = await Pickup.getMaxSequence(year);
  const nextSeq = maxSeq + 1;
  return `PKP-${year}-${String(nextSeq).padStart(5, '0')}`;
};

const createPickup = async (data, userId) => {
  // Verify cargo exists
  const cargo = await Cargo.findById(data.cargo_id);
  if (!cargo) throw createError('Cargo not found.', 404);

  const schedule_id = await generateScheduleId();

  const id = await Pickup.create({
    ...data,
    schedule_id,
    status: 'scheduled',
    created_by: userId
  });

  const record = await Pickup.findById(id);

  await ActivityLog.create({
    user_id: userId,
    action: 'PICKUP_SCHEDULED',
    description: `Scheduled pickup ${schedule_id} for cargo ${cargo.cargo_id}`
  });

  return record;
};

const listPickup = async ({ status, type, search }) => {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('pkp.status = ?');
    params.push(status);
  }
  if (type) {
    conditions.push('pkp.pickup_type = ?');
    params.push(type);
  }
  if (search) {
    conditions.push('(pkp.schedule_id LIKE ? OR pkp.customer_name LIKE ? OR pkp.assigned_driver LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const data = await Pickup.findAll(where, params);

  return data;
};

const getPickup = async (id) => {
  const record = await Pickup.findById(id);
  if (!record) throw createError('Pickup schedule not found.', 404);
  return record;
};

const updatePickupStatus = async (id, data, userId) => {
  const existing = await Pickup.findById(id);
  if (!existing) throw createError('Pickup schedule not found.', 404);

  const updateData = {};
  if (data.status) updateData.status = data.status;
  if (data.actual_completion_time) updateData.actual_completion_time = data.actual_completion_time;
  if (data.driver_notes) updateData.driver_notes = data.driver_notes;
  if (data.proof_of_delivery) updateData.proof_of_delivery = data.proof_of_delivery;

  await Pickup.updateStatus(id, updateData);

  // If marked complete — update cargo status too
  if (data.status === 'completed') {
    // If it's a customer delivery, cargo can be marked Delivered
    // If it's an airport pickup, cargo is now Received/Stored
    const newCargoStatus = existing.pickup_type === 'customer_delivery' ? 'Delivered' : 'Received';
    await Cargo.update(existing.cargo_id, { status: newCargoStatus });
  }

  await ActivityLog.create({
    user_id: userId,
    action: 'PICKUP_STATUS_UPDATED',
    description: `Updated status of pickup ${existing.schedule_id} to ${data.status}`
  });

  return await Pickup.findById(id);
};

const cancelPickup = async (id, userId) => {
  const existing = await Pickup.findById(id);
  if (!existing) throw createError('Pickup schedule not found.', 404);

  await Pickup.updateStatus(id, { status: 'cancelled' });

  await ActivityLog.create({
    user_id: userId,
    action: 'PICKUP_CANCELLED',
    description: `Cancelled pickup ${existing.schedule_id}`
  });

  return { id, status: 'cancelled' };
};

const getPickupCalendar = async (month, year) => {
  const m = String(month).padStart(2, '0');
  const startDate = `${year}-${m}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;

  const data = await Pickup.findAll(
    `WHERE pkp.scheduled_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );
  return data;
};

module.exports = {
  createPickup,
  listPickup,
  getPickup,
  updatePickupStatus,
  cancelPickup,
  getPickupCalendar
};
