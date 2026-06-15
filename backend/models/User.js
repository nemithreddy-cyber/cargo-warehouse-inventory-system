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

  /** Find a user by ID (excludes password). */
  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new user. */
  create: async ({ name, email, password, role }) => {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'Warehouse Staff']
    );
    return result.insertId;
  },

  /** List all users (excluding passwords). */
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  /** List all active users (for task assignment dropdowns). */
  findAllActive: async () => {
    const [rows] = await db.query(
      "SELECT id, name, email, role FROM users WHERE is_active = 1 ORDER BY name ASC"
    );
    return rows;
  },

  /** Update a user. */
  update: async (id, { name, email, role, is_active }) => {
    const fields = [];
    const values = [];
    if (name !== undefined)      { fields.push('name = ?');      values.push(name); }
    if (email !== undefined)     { fields.push('email = ?');     values.push(email); }
    if (role !== undefined)      { fields.push('role = ?');      values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (!fields.length) return;
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  },

  /** Delete a user. */
  delete: async (id) => {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = User;
