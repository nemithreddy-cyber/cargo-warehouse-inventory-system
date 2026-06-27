const weightService = require('../services/weightService');
const { success } = require('../utils/helpers');

const calculateAndSaveWeight = async (req, res, next) => {
  try {
    const result = await weightService.saveCalculation(req.body, req.user.id);
    success(res, { calculation: result }, 'Weight calculation saved successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getWeightHistory = async (req, res, next) => {
  try {
    const result = await weightService.getHistory();
    success(res, { history: result }, 'Saved calculations history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const deleteWeightRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await weightService.deleteRecord(id, req.user.id);
    success(res, result, 'Weight calculation record deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  calculateAndSaveWeight,
  getWeightHistory,
  deleteWeightRecord
};
