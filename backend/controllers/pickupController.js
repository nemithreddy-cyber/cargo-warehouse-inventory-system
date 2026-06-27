const pickupService = require('../services/pickupService');
const { success } = require('../utils/helpers');

const createPickup = async (req, res, next) => {
  try {
    const result = await pickupService.createPickup(req.body, req.user.id);
    success(res, { pickup: result }, 'Pickup schedule created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getPickupList = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const result = await pickupService.listPickup({ status, type, search });
    success(res, { schedules: result }, 'Pickup schedules list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getPickupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pickupService.getPickup(id);
    success(res, { schedule: result }, 'Pickup schedule details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updatePickupStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pickupService.updatePickupStatus(id, req.body, req.user.id);
    success(res, { schedule: result }, 'Pickup status updated successfully');
  } catch (err) {
    next(err);
  }
};

const cancelPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pickupService.cancelPickup(id, req.user.id);
    success(res, result, 'Pickup schedule cancelled successfully');
  } catch (err) {
    next(err);
  }
};

const getPickupCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const result = await pickupService.getPickupCalendar(parseInt(month, 10), parseInt(year, 10));
    success(res, { calendarEvents: result }, 'Pickup calendar events retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPickup,
  getPickupList,
  getPickupById,
  updatePickupStatus,
  cancelPickup,
  getPickupCalendar
};
