const db = require('../config/db');

/**
 * Dispatch model — thin wrapper around the `dispatch_records` table.
 */
const Dispatch = {
  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM dispatch_records dr ${where}`,
      params
    );
    return rows[0].total;
  },

  findAll: async (where = '', params = [], limit = 10, offset = 0) => {
    const [rows] = await db.query(
      `SELECT dr.*,
              c.cargo_id AS cargo_ref, c.customer_name, c.cargo_type
       FROM dispatch_records dr
       JOIN cargo c ON dr.cargo_id = c.id
       ${where}
       ORDER BY dr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT dr.*,
              c.cargo_id AS cargo_ref, c.customer_name, c.cargo_type,
              c.origin_airport, c.destination_airport,
              u.name AS created_by_name
       FROM dispatch_records dr
       JOIN cargo c ON dr.cargo_id = c.id
       LEFT JOIN users u ON dr.created_by = u.id
       WHERE dr.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  getMaxSequence: async () => {
    const [rows] = await db.query(
      "SELECT MAX(CAST(SUBSTRING(dispatch_id, 9) AS UNSIGNED)) AS seq FROM dispatch_records WHERE dispatch_id LIKE 'DSP-%'"
    );
    return rows[0].seq || 0;
  },

  create: async ({ dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status, created_by }) => {
    const [result] = await db.query(
      `INSERT INTO dispatch_records
       (dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dispatch_id, cargo_id, driver_name, vehicle_number, dispatch_date, expected_delivery, status || 'Scheduled', created_by || null]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await db.query(`UPDATE dispatch_records SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },
};

module.exports = Dispatch;
