const activityLogService = require('../services/activityLogService');
const { success } = require('../utils/helpers');

const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, search, from, to } = req.query;
    const result = await activityLogService.listLogs({ page, limit, search, from, to });
    success(res, result, 'Activity logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLogs };
