/**
 * ActivityLog model stub — avoids querying the dropped activity_logs table.
 */
const ActivityLog = {
  create: async ({ user_id, action, description }) => {
    // Return a mock ID instead of executing database queries
    return 1;
  },

  count: async (where = '', params = []) => {
    return 0;
  },

  findAll: async (where = '', params = [], limit = 20, offset = 0) => {
    return [];
  },

  findRecent: async (n = 10) => {
    return [];
  },
};

module.exports = ActivityLog;
