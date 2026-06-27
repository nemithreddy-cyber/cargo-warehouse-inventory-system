const db = require('../config/db');

const Awb = {
  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM awb_records ${where}`,
      params
    );
    return rows[0].total;
  },

  findAll: async (where = '', params = [], limit = 10, offset = 0) => {
    const [rows] = await db.query(
      `SELECT awb.*, c.cargo_id AS cargo_ref
       FROM awb_records awb
       LEFT JOIN cargo c ON awb.cargo_id = c.id
       ${where}
       ORDER BY awb.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT awb.*, c.cargo_id AS cargo_ref
       FROM awb_records awb
       LEFT JOIN cargo c ON awb.cargo_id = c.id
       WHERE awb.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  getMaxSequence: async (year) => {
    const [rows] = await db.query(
      `SELECT MAX(CAST(SUBSTR(awb_number, 10) AS INTEGER)) AS seq 
       FROM awb_records 
       WHERE awb_number LIKE ?`,
      [`AWB-${year}-%`]
    );
    return rows[0]?.seq || 0;
  },

  create: async (data) => {
    const {
      awb_number, cargo_id, shipper_name, shipper_address,
      consignee_name, consignee_address, origin_airport, destination_airport,
      cargo_description, pieces, actual_weight, chargeable_weight,
      declared_value, special_instructions, issue_date, status
    } = data;
    const [result] = await db.query(
      `INSERT INTO awb_records
       (awb_number, cargo_id, shipper_name, shipper_address,
        consignee_name, consignee_address, origin_airport, destination_airport,
        cargo_description, pieces, actual_weight, chargeable_weight,
        declared_value, special_instructions, issue_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        awb_number, cargo_id, shipper_name, shipper_address,
        consignee_name, consignee_address, origin_airport, destination_airport,
        cargo_description, pieces, actual_weight, chargeable_weight,
        declared_value || 0, special_instructions || null, issue_date, status || 'draft'
      ]
    );
    return result.insertId;
  },

  updateStatus: async (id, status) => {
    const [result] = await db.query(
      `UPDATE awb_records SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }
};

module.exports = Awb;
