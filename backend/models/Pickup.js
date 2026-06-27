const db = require('../config/db');

const Pickup = {
  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM pickup_schedules pkp ${where}`,
      params
    );
    return rows[0].total;
  },

  findAll: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT pkp.*, c.cargo_id AS cargo_ref
       FROM pickup_schedules pkp
       LEFT JOIN cargo c ON pkp.cargo_id = c.id
       ${where}
       ORDER BY pkp.scheduled_date DESC, pkp.scheduled_time DESC`,
      params
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT pkp.*, c.cargo_id AS cargo_ref, u.name AS created_by_name
       FROM pickup_schedules pkp
       LEFT JOIN cargo c ON pkp.cargo_id = c.id
       LEFT JOIN users u ON pkp.created_by = u.id
       WHERE pkp.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  getMaxSequence: async (year) => {
    const [rows] = await db.query(
      `SELECT MAX(CAST(SUBSTR(schedule_id, 10) AS INTEGER)) AS seq 
       FROM pickup_schedules 
       WHERE schedule_id LIKE ?`,
      [`PKP-${year}-%`]
    );
    return rows[0]?.seq || 0;
  },

  create: async (data) => {
    const {
      schedule_id, cargo_id, customer_name, pickup_type, location,
      customer_address, scheduled_date, scheduled_time, assigned_driver,
      vehicle_number, contact_number, notes, status, created_by
    } = data;
    const [result] = await db.query(
      `INSERT INTO pickup_schedules
       (schedule_id, cargo_id, customer_name, pickup_type, location,
        customer_address, scheduled_date, scheduled_time, assigned_driver,
        vehicle_number, contact_number, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schedule_id, cargo_id, customer_name, pickup_type, location,
        customer_address || null, scheduled_date, scheduled_time, assigned_driver,
        vehicle_number, contact_number, notes || null, status || 'scheduled', created_by
      ]
    );
    return result.insertId;
  },

  updateStatus: async (id, data) => {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await db.query(`UPDATE pickup_schedules SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM pickup_schedules WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Pickup;
