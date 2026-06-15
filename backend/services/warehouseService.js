const Warehouse = require('../models/Warehouse');
const { createError } = require('../middleware/errorHandler');

const createZone = async ({ zone_name, capacity }) => {
  const id = await Warehouse.createZone({ zone_name, capacity });
  return Warehouse.findZoneById(id);
};

const listZones = async () => Warehouse.findAllZones();

const createLocation = async ({ zone_id, location_code, status }) => {
  const zone = await Warehouse.findZoneById(zone_id);
  if (!zone) throw createError('Warehouse zone not found.', 404);

  const id = await Warehouse.createLocation({ zone_id, location_code, status });
  return Warehouse.findLocationById(id);
};

const listLocations = async (zone_id) => Warehouse.findAllLocations(zone_id || null);

const getOccupancy = async () => Warehouse.getOccupancySummary();

module.exports = { createZone, listZones, createLocation, listLocations, getOccupancy };
