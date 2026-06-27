const Weight = require('../models/Weight');
const ActivityLog = require('../models/ActivityLog');
const { createError } = require('../middleware/errorHandler');

const saveCalculation = async (data, userId) => {
  const id = await Weight.create({
    ...data,
    calculated_by: userId
  });

  const records = await Weight.findAll();
  const saved = records.find(r => r.id === id);

  await ActivityLog.create({
    user_id: userId,
    action: 'WEIGHT_CALCULATED',
    description: `Saved weight calculation for ${data.description || 'Cargo'}`
  });

  return saved;
};

const getHistory = async () => {
  return await Weight.findAll();
};

const deleteRecord = async (id, userId) => {
  const deleted = await Weight.delete(id);
  if (!deleted) throw createError('Calculation record not found.', 404);

  await ActivityLog.create({
    user_id: userId,
    action: 'WEIGHT_CALC_DELETED',
    description: `Deleted weight calculation record ${id}`
  });

  return { id };
};

module.exports = {
  saveCalculation,
  getHistory,
  deleteRecord
};
