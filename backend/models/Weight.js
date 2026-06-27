const db = require('../config/db');

const Weight = {
  create: async (data) => {
    const {
      cargo_id, description, pieces, actual_weight, volumetric_weight,
      chargeable_weight, length_cm, width_cm, height_cm, rate_per_kg,
      freight_cost, calculated_by
    } = data;
    const [result] = await db.query(
      `INSERT INTO weight_calculations
       (cargo_id, description, pieces, actual_weight, volumetric_weight,
        chargeable_weight, length_cm, width_cm, height_cm, rate_per_kg,
        freight_cost, calculated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cargo_id || null, description, pieces, actual_weight, volumetric_weight,
        chargeable_weight, length_cm, width_cm, height_cm, rate_per_kg,
        freight_cost, calculated_by
      ]
    );
    return result.insertId;
  },

  findAll: async () => {
    const [rows] = await db.query(
      `SELECT wc.*, u.name AS calculated_by_name
       FROM weight_calculations wc
       LEFT JOIN users u ON wc.calculated_by = u.id
       ORDER BY wc.created_at DESC`
    );
    return rows;
  },

  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM weight_calculations WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Weight;
