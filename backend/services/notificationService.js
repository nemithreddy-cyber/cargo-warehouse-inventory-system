const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

const listNotifications = async (limit) => Notification.findAll(limit || 50);

const markRead = async (id) => {
  const notif = await Notification.findById(id);
  if (!notif) throw createError('Notification not found.', 404);
  await Notification.markRead(id);
  return Notification.findById(id);
};

module.exports = { listNotifications, markRead };
