const dispatchService = require('../services/dispatchService');
const { success } = require('../utils/helpers');

const getDispatchList = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await dispatchService.listDispatch({ page, limit, status });
    success(res, { dispatches: result.data, pagination: result.pagination }, 'Dispatch list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getDispatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dispatchService.getDispatch(id);
    success(res, { dispatch: result }, 'Dispatch record retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createDispatch = async (req, res, next) => {
  try {
    const result = await dispatchService.createDispatch(req.body, req.user.id);
    success(res, { dispatch: result }, 'Dispatch record created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateDispatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dispatchService.updateDispatch(id, req.body, req.user.id);
    success(res, { dispatch: result }, 'Dispatch record updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDispatchList, getDispatchById, createDispatch, updateDispatch };
