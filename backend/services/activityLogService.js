const ActivityLog = require('../models/ActivityLog');
const { paginate, paginatedResponse } = require('../utils/helpers');

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

  const [total, data] = await Promise.all([
    ActivityLog.count(where, params),
    ActivityLog.findAll(where, params, l, offset),
  ]);

  return paginatedResponse(data, total, p, l);
};

module.exports = { listLogs };
