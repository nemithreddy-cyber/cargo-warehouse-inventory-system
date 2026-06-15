const warehouseService = require('../services/warehouseService');
const { success } = require('../utils/helpers');

const createZone = async (req, res, next) => {
  try {
    const { zone_name, capacity } = req.body;
    const result = await warehouseService.createZone({ zone_name, capacity });
    success(res, { zone: result }, 'Warehouse zone created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getZones = async (req, res, next) => {
  try {
    const result = await warehouseService.listZones();
    success(res, { zones: result }, 'Warehouse zones retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const { zone_id, location_code, status } = req.body;
    const result = await warehouseService.createLocation({ zone_id, location_code, status });
    success(res, { location: result }, 'Storage location created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const { zone_id } = req.query;
    const result = await warehouseService.listLocations(zone_id);
    success(res, { locations: result }, 'Storage locations retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getWarehouseOccupancy = async (req, res, next) => {
  try {
    const result = await warehouseService.getOccupancy();
    success(res, { occupancy: result }, 'Warehouse occupancy retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createZone, getZones, createLocation, getLocations, getWarehouseOccupancy };
