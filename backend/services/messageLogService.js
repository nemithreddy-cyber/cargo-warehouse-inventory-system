'use strict';

const db = require('../config/db');

/**
 * Ensures the message_logs table exists in the database.
 */
const ensureTableExists = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_name VARCHAR(120) NOT NULL,
        phone_number   VARCHAR(50)  NULL,
        email          VARCHAR(180) NULL,
        channel        VARCHAR(20)  NOT NULL,
        message        TEXT         NOT NULL,
        status         VARCHAR(50)  NOT NULL,
        sent_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cargo_id       VARCHAR(50)  NULL,
        error_message  TEXT         NULL
      )
    `);
  } catch (err) {
    // If running in MySQL mode, table is already defined, or we handle translation fallback.
    console.warn('[MessageLogService] table ensure failed:', err.message);
  }
};

/**
 * Creates a message log entry.
 */
const createLog = async ({ recipient_name, phone_number, email, channel, message, status, cargo_id, error_message }) => {
  await ensureTableExists();
  try {
    const isMysql = db.getClientType?.() === 'mysql';
    const timeFunc = isMysql ? 'NOW()' : "datetime('now', 'localtime')";

    const sql = `
      INSERT INTO message_logs (recipient_name, phone_number, email, channel, message, status, cargo_id, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${timeFunc})
    `;
    const params = [
      recipient_name || 'Customer',
      phone_number || null,
      email || null,
      channel,
      message,
      status,
      cargo_id || null,
      error_message || null
    ];
    await db.query(sql, params);
  } catch (err) {
    console.error('[DATABASE LOG ERROR] Failed to save message log:', err.message);
  }
};

/**
 * Retrieves filtered message logs.
 */
const getLogs = async ({ startDate, endDate, channel, status, cargoId, search }) => {
  await ensureTableExists();
  let sql = 'SELECT * FROM message_logs';
  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push('sent_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    // Append end-of-day timestamp limit to include whole day
    const formattedEndDate = endDate.includes(' ') || endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
    conditions.push('sent_at <= ?');
    params.push(formattedEndDate);
  }
  if (channel && channel !== 'All') {
    conditions.push('channel = ?');
    params.push(channel.toLowerCase());
  }
  if (status && status !== 'All') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (cargoId) {
    conditions.push('cargo_id LIKE ?');
    params.push(`%${cargoId}%`);
  }
  if (search) {
    conditions.push('(recipient_name LIKE ? OR phone_number LIKE ? OR email LIKE ? OR cargo_id LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY sent_at DESC';

  const [rows] = await db.query(sql, params);
  return rows;
};

/**
 * Returns messaging statistics for dashboard cards.
 */
const getStats = async () => {
  await ensureTableExists();
  try {
    const [[totalRow]] = await db.query('SELECT COUNT(*) AS total FROM message_logs');
    const [[whatsappRow]] = await db.query('SELECT COUNT(*) AS whatsapp FROM message_logs WHERE channel = "whatsapp"');
    const [[emailRow]] = await db.query('SELECT COUNT(*) AS email FROM message_logs WHERE channel = "email"');
    const [[failedRow]] = await db.query('SELECT COUNT(*) AS failed FROM message_logs WHERE status = "Failed"');
    const [[pendingRow]] = await db.query('SELECT COUNT(*) AS pending FROM message_logs WHERE status = "Pending"');

    return {
      total: totalRow?.total || 0,
      whatsapp: whatsappRow?.whatsapp || 0,
      email: emailRow?.email || 0,
      failed: failedRow?.failed || 0,
      pending: pendingRow?.pending || 0
    };
  } catch (err) {
    console.error('Failed to get stats:', err.message);
    return { total: 0, whatsapp: 0, email: 0, failed: 0, pending: 0 };
  }
};

module.exports = { createLog, getLogs, getStats, ensureTableExists };
