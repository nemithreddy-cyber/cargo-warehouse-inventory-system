const db = require('../config/db');

/**
 * Warehouse model — zones and storage locations.
 */
const Warehouse = {
  // ---- Zones ----

  createZone: async ({ zone_name, capacity }) => {
    const [result] = await db.query(
      'INSERT INTO warehouse_zones (zone_name, capacity, occupied) VALUES (?, ?, 0)',
      [zone_name, capacity]
    );
    return result.insertId;
  },

  findAllZones: async () => {
    const [rows] = await db.query(
      `SELECT wz.*,
              COUNT(sl.id) AS total_locations,
              SUM(sl.status = 'Available') AS available_locations
       FROM warehouse_zones wz
       LEFT JOIN storage_locations sl ON sl.zone_id = wz.id
       GROUP BY wz.id
       ORDER BY wz.zone_name`
    );
    return rows;
  },

  findZoneById: async (id) => {
    const [rows] = await db.query('SELECT * FROM warehouse_zones WHERE id = ?', [id]);
    return rows[0] || null;
  },

  updateZoneOccupancy: async (zone_id, delta) => {
    await db.query(
      'UPDATE warehouse_zones SET occupied = GREATEST(0, occupied + ?) WHERE id = ?',
      [delta, zone_id]
    );
  },

  // ---- Storage Locations ----

  createLocation: async ({ zone_id, location_code, status }) => {
    const [result] = await db.query(
      'INSERT INTO storage_locations (zone_id, location_code, status) VALUES (?, ?, ?)',
      [zone_id, location_code, status || 'Available']
    );
    return result.insertId;
  },

  findAllLocations: async (zone_id = null) => {
    let query = `SELECT sl.*, wz.zone_name
                 FROM storage_locations sl
                 JOIN warehouse_zones wz ON sl.zone_id = wz.id`;
    const params = [];
    if (zone_id) {
      query += ' WHERE sl.zone_id = ?';
      params.push(zone_id);
    }
    query += ' ORDER BY sl.location_code';
    const [rows] = await db.query(query, params);
    return rows;
  },

  findLocationById: async (id) => {
    const [rows] = await db.query('SELECT * FROM storage_locations WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findAvailableLocation: async (zone_id) => {
    const [rows] = await db.query(
      "SELECT * FROM storage_locations WHERE zone_id = ? AND status = 'Available' LIMIT 1",
      [zone_id]
    );
    return rows[0] || null;
  },

  updateLocationStatus: async (id, status) => {
    await db.query('UPDATE storage_locations SET status = ? WHERE id = ?', [status, id]);
  },

  // ---- Occupancy ----
  getOccupancySummary: async () => {
    const [rows] = await db.query(
      `SELECT
         SUM(capacity) AS total_capacity,
         SUM(occupied) AS total_occupied,
         ROUND(SUM(occupied) / NULLIF(SUM(capacity), 0) * 100, 2) AS occupancy_pct
       FROM warehouse_zones`
    );
    return rows[0];
  },
};

module.exports = Warehouse;
