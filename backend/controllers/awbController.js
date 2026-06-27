const awbService = require('../services/awbService');
const { success } = require('../utils/helpers');

const getAwbList = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await awbService.listAwb({ page, limit, status, search });
    success(res, result, 'Airway Bills list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getAwbById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await awbService.getAwb(id);
    success(res, { awb: result }, 'Airway Bill retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAwb = async (req, res, next) => {
  try {
    const result = await awbService.createAwb(req.body, req.user.id);
    success(res, { awb: result }, 'Airway Bill generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

const cancelAwb = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await awbService.cancelAwb(id, req.user.id);
    success(res, { awb: result }, 'Airway Bill cancelled successfully');
  } catch (err) {
    next(err);
  }
};

const generateAwbNumber = async (req, res, next) => {
  try {
    const awbNumber = await awbService.generateAwbNumber();
    success(res, { awbNumber }, 'Next Airway Bill number generated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAwbList,
  getAwbById,
  createAwb,
  cancelAwb,
  generateAwbNumber
};
