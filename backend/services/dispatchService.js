const Dispatch = require('../models/Dispatch');
const Cargo = require('../models/Cargo');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { paginate, paginatedResponse, generateId } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

const listDispatch = async ({ page, limit, status }) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('dr.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [total, data] = await Promise.all([
    Dispatch.count(where, params),
    Dispatch.findAll(where, params, l, offset),
  ]);

  return paginatedResponse(data, total, p, l);
};

const getDispatch = async (id) => {
  const record = await Dispatch.findById(id);
  if (!record) throw createError('Dispatch record not found.', 404);
  return record;
};

const createDispatch = async (data, userId) => {
  // Verify cargo exists
  const cargo = await Cargo.findById(data.cargo_id);
  if (!cargo) throw createError('Cargo not found.', 404);

  // Auto-generate dispatch_id
  const seq = await Dispatch.getMaxSequence();
  const dispatch_id = generateId('DSP', seq + 1);

  const id = await Dispatch.create({
    ...data,
    dispatch_id,
    status: 'Scheduled',
    created_by: userId,
  });

  // Update cargo status to Dispatched
  await Cargo.update(data.cargo_id, { status: 'Dispatched' });

  await ActivityLog.create({
    user_id: userId,
    action: 'DISPATCH_CREATED',
    description: `Dispatch ${dispatch_id} created for cargo ${cargo.cargo_id}`,
  });

  return Dispatch.findById(id);
};

const updateDispatch = async (id, data, userId) => {
  const existing = await Dispatch.findById(id);
  if (!existing) throw createError('Dispatch record not found.', 404);

  await Dispatch.update(id, data);

  // If marked Delayed — notify
  if (data.status === 'Delayed') {
    await Notification.create({
      title: 'Dispatch Delayed',
      message: `Dispatch ${existing.dispatch_id} has been marked as delayed.`,
      type: 'dispatch_delayed',
    });
  }

  // If delivered — update cargo too
  if (data.status === 'Delivered') {
    await Cargo.update(existing.cargo_id, { status: 'Delivered' });
    await Notification.create({
      title: 'Cargo Delivered',
      message: `Dispatch ${existing.dispatch_id} delivered. Cargo ${existing.cargo_ref} successfully delivered.`,
      type: 'cargo_delivered',
    });
  }

  await ActivityLog.create({
    user_id: userId,
    action: 'DISPATCH_UPDATED',
    description: `Dispatch ${existing.dispatch_id} updated`,
  });

  return Dispatch.findById(id);
};

module.exports = { listDispatch, getDispatch, createDispatch, updateDispatch };
