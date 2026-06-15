const cargoService = require('../services/cargoService');
const { success } = require('../utils/helpers');

const getCargoList = async (req, res, next) => {
  try {
    const { page, limit, status, zone_id, search } = req.query;
    const result = await cargoService.listCargo({ page, limit, status, zone_id, search });
    success(res, result, 'Cargo list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getCargoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await cargoService.getCargo(id);
    success(res, { cargo: result }, 'Cargo retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createCargo = async (req, res, next) => {
  try {
    const result = await cargoService.createCargo(req.body, req.user.id);
    success(res, { cargo: result }, 'Cargo created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateCargo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await cargoService.updateCargo(id, req.body, req.user.id);
    success(res, { cargo: result }, 'Cargo updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteCargo = async (req, res, next) => {
  try {
    const { id } = req.params;
    await cargoService.deleteCargo(id, req.user.id);
    success(res, null, 'Cargo deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCargoList, getCargoById, createCargo, updateCargo, deleteCargo };
