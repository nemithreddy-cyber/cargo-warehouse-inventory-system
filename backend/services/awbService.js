const Awb = require('../models/Awb');
const Cargo = require('../models/Cargo');
const ActivityLog = require('../models/ActivityLog');
const { createError } = require('../middleware/errorHandler');

const generateAwbNumber = async () => {
  const year = new Date().getFullYear();
  const maxSeq = await Awb.getMaxSequence(year);
  const nextSeq = maxSeq + 1;
  return `AWB-${year}-${String(nextSeq).padStart(5, '0')}`;
};

const createAwb = async (data, userId) => {
  // Check if cargo exists
  const cargo = await Cargo.findById(data.cargo_id);
  if (!cargo) throw createError('Cargo record not found.', 404);

  const awb_number = await generateAwbNumber();

  const awbData = {
    ...data,
    awb_number,
    status: 'draft'
  };

  const id = await Awb.create(awbData);
  const record = await Awb.findById(id);

  await ActivityLog.create({
    user_id: userId,
    action: 'AWB_CREATED',
    description: `Airway Bill ${awb_number} created for cargo ${cargo.cargo_id}`
  });

  return record;
};

const listAwb = async ({ page, limit, status, search }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (p - 1) * l;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('awb.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(awb.awb_number LIKE ? OR awb.shipper_name LIKE ? OR awb.consignee_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = await Awb.count(where, params);
  const data = await Awb.findAll(where, params, l, offset);

  return {
    data,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    }
  };
};

const getAwb = async (id) => {
  const record = await Awb.findById(id);
  if (!record) throw createError('Airway Bill not found.', 404);
  return record;
};

const cancelAwb = async (id, userId) => {
  const existing = await Awb.findById(id);
  if (!existing) throw createError('Airway Bill not found.', 404);

  await Awb.updateStatus(id, 'cancelled');

  await ActivityLog.create({
    user_id: userId,
    action: 'AWB_CANCELLED',
    description: `Airway Bill ${existing.awb_number} has been cancelled.`
  });

  return { ...existing, status: 'cancelled' };
};

module.exports = {
  generateAwbNumber,
  createAwb,
  listAwb,
  getAwb,
  cancelAwb
};
