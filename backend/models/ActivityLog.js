const db = require('../config/db');

/**
 * ActivityLog model — thin wrapper around the `activity_logs` table.
 */
const ActivityLog = {
  create: async ({ user_id, action, description }) => {
    const [result] = await db.query(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [user_id || null, action, description || null]
    );
    return result.insertId;
  },

  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM activity_logs al ${where}`,
      params
    );
    return rows[0].total;
  },

  findAll: async (where = '', params = [], limit = 20, offset = 0) => {
    const [rows] = await db.query(
      `SELECT al.*, u.name AS user_name, u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  findRecent: async (n = 10) => {
    const [rows] = await db.query(
      `SELECT al.*, u.name AS user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [n]
    );
    return rows;
  },
};

module.exports = ActivityLog;
