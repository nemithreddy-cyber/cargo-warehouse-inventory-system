const db = require('../config/db');

/**
 * Notification model — thin wrapper around the `notifications` table.
 */
const Notification = {
  create: async ({ title, message, type }) => {
    const [result] = await db.query(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)',
      [title, message, type || 'new_cargo']
    );
    return result.insertId;
  },

  findAll: async (limit = 50) => {
    const [rows] = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0] || null;
  },

  markRead: async (id) => {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  countUnread: async () => {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM notifications WHERE is_read = 0'
    );
    return rows[0].total;
  },
};

module.exports = Notification;
