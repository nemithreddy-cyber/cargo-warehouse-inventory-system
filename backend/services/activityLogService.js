const ActivityLog = require('../models/ActivityLog');
const { paginate, paginatedResponse } = require('../utils/helpers');
const db = require('../config/db');

/**
 * List activity logs with date filters, search, and pagination.
 */
const listLogs = async ({ page, limit, search, from, to }) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(al.action LIKE ? OR al.description LIKE ? OR u.name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (from) {
    conditions.push('DATE(al.created_at) >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('DATE(al.created_at) <= ?');
    params.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [total, data, [allRows]] = await Promise.all([
    ActivityLog.count(where, params),
    ActivityLog.findAll(where, params, l, offset),
    db.query('SELECT action FROM activity_logs'),
  ]);

  const counts = { create: 0, update: 0, delete: 0, dispatch: 0, login: 0, report: 0 };
  allRows.forEach((row) => {
    const act = (row.action || '').toLowerCase();
    if (act.includes('created') || act.includes('create')) counts.create++;
    else if (act.includes('updated') || act.includes('update')) counts.update++;
    else if (act.includes('deleted') || act.includes('delete')) counts.delete++;
    else if (act.includes('dispatch')) counts.dispatch++;
    else if (act.includes('login')) counts.login++;
    else if (act.includes('report')) counts.report++;
    else counts.update++;
  });

  const response = paginatedResponse(data, total, p, l);
  response.counts = counts;

  return response;
};

module.exports = { listLogs };
