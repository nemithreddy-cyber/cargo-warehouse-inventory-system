const db = require('../config/db');

/**
 * User model — thin wrapper around the `users` table.
 */
const User = {
  /** Find a user by email (includes password for auth). */
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  /** Find a user by username. */
  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  /** Count total number of users. */
  count: async () => {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM users');
    return rows[0]?.count || 0;
  },

  /** Find a user by ID (excludes password). */
  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT id, name, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new user. */
  create: async ({ name, username, email, password, role }) => {
    const [result] = await db.query(
      'INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, password, role || 'Warehouse Staff']
    );
    return result.insertId;
  },

  /** List all users (excluding passwords). */
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, name, username, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  /** List all active users (for task assignment dropdowns). */
  findAllActive: async () => {
    const [rows] = await db.query(
      "SELECT id, name, username, email, role FROM users WHERE is_active = 1 ORDER BY name ASC"
    );
    return rows;
  },

  /** Update a user. */
  update: async (id, { name, username, email, role, is_active, password }) => {
    const fields = [];
    const values = [];
    if (name !== undefined)      { fields.push('name = ?');      values.push(name); }
    if (username !== undefined)  { fields.push('username = ?');  values.push(username); }
    if (email !== undefined)     { fields.push('email = ?');     values.push(email); }
    if (role !== undefined)      { fields.push('role = ?');      values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (password !== undefined)  { fields.push('password = ?');  values.push(password); }
    if (!fields.length) return;
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  },

  /** Delete a user. */
  delete: async (id) => {
    // Delete tasks associated with the user
    await db.query('DELETE FROM tasks WHERE assigned_to = ? OR assigned_by = ?', [id, id]);
    // Delete activity logs of the user
    await db.query('DELETE FROM activity_logs WHERE user_id = ?', [id]);
    // Delete the user record
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = User;
