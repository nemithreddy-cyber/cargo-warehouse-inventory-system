const db = require('../config/db');

/**
 * Task model — thin wrapper around the `tasks` table.
 */
const Task = {
  /** Count tasks with optional WHERE clause. */
  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM tasks t ${where}`,
      params
    );
    return rows[0].total;
  },

  /** Find all tasks with optional filters, pagination, and user join. */
  findAll: async (where = '', params = [], limit = 50, offset = 0) => {
    const [rows] = await db.query(
      `SELECT t.*,
              u1.name AS assigned_to_name, u1.role AS assigned_to_role,
              u2.name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       ${where}
       ORDER BY
         CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         t.due_date ASC,
         t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  /** Find a single task by ID. */
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT t.*,
              u1.name AS assigned_to_name, u1.role AS assigned_to_role,
              u2.name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new task. */
  create: async ({ title, description, assigned_to, assigned_by, status, priority, due_date, cargo_id }) => {
    const [result] = await db.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, status, priority, due_date, cargo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        assigned_to || null,
        assigned_by || null,
        status || 'Pending',
        priority || 'Medium',
        due_date || null,
        cargo_id || null,
      ]
    );
    return result.insertId;
  },

  /** Update a task. */
  update: async (id, fields) => {
    const allowed = ['title', 'description', 'assigned_to', 'status', 'priority', 'due_date', 'cargo_id'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await db.query(`UPDATE tasks SET ${set} WHERE id = ?`, [...values, id]);
  },

  /** Delete a task. */
  delete: async (id) => {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
  },

  /** Get task counts grouped by status for a user (or all if no userId). */
  getStatusCounts: async (userId = null) => {
    const where = userId ? 'WHERE t.assigned_to = ?' : '';
    const params = userId ? [userId] : [];
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count FROM tasks t ${where} GROUP BY status`,
      params
    );
    return rows;
  },
};

module.exports = Task;
