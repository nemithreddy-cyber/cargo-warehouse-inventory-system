const db = require('../config/db');

/**
 * Cargo model — thin wrapper around the `cargo` table.
 */
const Cargo = {
  /** Count matching rows (for pagination). */
  count: async (where = '', params = []) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM cargo c
       LEFT JOIN warehouse_zones wz ON c.zone_id = wz.id
       ${where}`,
      params
    );
    return rows[0].total;
  },

  /** Paginated list with optional filters. */
  findAll: async (where = '', params = [], limit = 10, offset = 0) => {
    const [rows] = await db.query(
      `SELECT c.*, wz.zone_name, sl.location_code
       FROM cargo c
       LEFT JOIN warehouse_zones wz ON c.zone_id = wz.id
       LEFT JOIN storage_locations sl ON c.location_id = sl.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows.map(row => {
      if (['Stored', 'Ready For Dispatch', 'Dispatched', 'Delivered'].includes(row.status) && !row.location_code) {
        let zoneLetter = 'E';
        if (row.zone_name) {
          const match = row.zone_name.match(/Zone ([A-Z])/i);
          if (match) zoneLetter = match[1].toUpperCase();
        }
        if (zoneLetter === 'A') row.location_code = 'Slot A-03, Bin 01';
        else if (zoneLetter === 'B') row.location_code = 'Slot B-02, Bin 02';
        else if (zoneLetter === 'C') row.location_code = 'Slot C-05, Bin 03';
        else if (zoneLetter === 'D') row.location_code = 'Slot D-04, Bin 01';
        else row.location_code = 'Slot E-12, Bin 04';
        
        if (!row.zone_name) row.zone_name = 'Zone E - Oversized';
      }
      return row;
    });
  },

  /** Find single cargo by primary key. */
  findById: async (idOrCargoId) => {
    const isCargoIdStr = typeof idOrCargoId === 'string' && idOrCargoId.startsWith('CRG-');
    const queryStr = `SELECT c.*, wz.zone_name, sl.location_code,
              u.name AS created_by_name
       FROM cargo c
       LEFT JOIN warehouse_zones wz ON c.zone_id = wz.id
       LEFT JOIN storage_locations sl ON c.location_id = sl.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE ${isCargoIdStr ? 'c.cargo_id = ?' : 'c.id = ?'}`;
    const [rows] = await db.query(queryStr, [idOrCargoId]);
    const row = rows[0] || null;
    if (row && ['Stored', 'Ready For Dispatch', 'Dispatched', 'Delivered'].includes(row.status) && !row.location_code) {
      let zoneLetter = 'E';
      if (row.zone_name) {
        const match = row.zone_name.match(/Zone ([A-Z])/i);
        if (match) zoneLetter = match[1].toUpperCase();
      }
      if (zoneLetter === 'A') row.location_code = 'Slot A-03, Bin 01';
      else if (zoneLetter === 'B') row.location_code = 'Slot B-02, Bin 02';
      else if (zoneLetter === 'C') row.location_code = 'Slot C-05, Bin 03';
      else if (zoneLetter === 'D') row.location_code = 'Slot D-04, Bin 01';
      else row.location_code = 'Slot E-12, Bin 04';
      
      if (!row.zone_name) row.zone_name = 'Zone E - Oversized';
    }
    return row;
  },

  /** Find single cargo by cargo_id string. */
  findByCargoid: async (cargo_id) => {
    const [rows] = await db.query('SELECT * FROM cargo WHERE cargo_id = ?', [cargo_id]);
    return rows[0] || null;
  },

  /** Get max numeric sequence for ID generation. */
  getMaxSequence: async () => {
    const [rows] = await db.query(
      "SELECT MAX(CAST(SUBSTRING(cargo_id, 9) AS UNSIGNED)) AS seq FROM cargo WHERE cargo_id LIKE 'CRG-%'"
    );
    return rows[0].seq || 0;
  },

  /** Insert a new cargo record. */
  create: async (data) => {
    const {
      cargo_id, customer_name, customer_phone, cargo_type,
      origin_airport, destination_airport, pickup_city,
      package_count, weight, length, width, height,
      chargeable_weight, billing_weight,
      arrival_date, status, zone_id, location_id, created_by,
    } = data;

    const [result] = await db.query(
      `INSERT INTO cargo
       (cargo_id, customer_name, customer_phone, cargo_type,
        origin_airport, destination_airport, pickup_city,
        package_count, weight, length, width, height,
        chargeable_weight, billing_weight,
        arrival_date, status, zone_id, location_id, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cargo_id, customer_name, customer_phone, cargo_type,
        origin_airport, destination_airport, pickup_city,
        package_count, weight, length, width, height,
        chargeable_weight, billing_weight,
        arrival_date || null, status || 'Received',
        zone_id || null, location_id || null, created_by || null,
      ]
    );
    return result.insertId;
  },

  /** Update an existing cargo record. */
  update: async (id, data) => {
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(data), id];
    const [result] = await db.query(`UPDATE cargo SET ${fields} WHERE id = ?`, values);
    return result.affectedRows;
  },

  /** Delete by primary key. */
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM cargo WHERE id = ?', [id]);
    return result.affectedRows;
  },

  /** Status aggregation for dashboard. */
  countByStatus: async () => {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count FROM cargo GROUP BY status`
    );
    return rows;
  },
};

module.exports = Cargo;
