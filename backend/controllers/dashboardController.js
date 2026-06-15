const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/helpers');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboard();
    success(res, result, 'Dashboard metrics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardMetrics };
