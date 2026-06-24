/**
 * Notification model stub — avoids querying the dropped notifications table.
 */
const Notification = {
  create: async ({ title, message, type }) => {
    return 1;
  },

  findAll: async (limit = 50) => {
    return [];
  },

  findById: async (id) => {
    return null;
  },

  markRead: async (id) => {
    return 0;
  },

  countUnread: async () => {
    return 0;
  },
};

module.exports = Notification;
