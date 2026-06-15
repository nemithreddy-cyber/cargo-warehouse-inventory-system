const notificationService = require('../services/notificationService');
const { success } = require('../utils/helpers');

const getNotifications = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await notificationService.listNotifications(limit);
    success(res, { notifications: result }, 'Notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await notificationService.markRead(id);
    success(res, { notification: result }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead };
