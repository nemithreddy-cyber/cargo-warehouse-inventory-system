const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { success, paginate, paginatedResponse } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

const ADMIN_ROLES = ['Super Admin'];

/** Build WHERE clause from query params. */
const buildWhere = ({ status, priority, assigned_to }) => {
  const conditions = [];
  const params = [];
  if (status)      { conditions.push('t.status = ?');      params.push(status); }
  if (priority)    { conditions.push('t.priority = ?');    params.push(priority); }
  if (assigned_to) { conditions.push('t.assigned_to = ?'); params.push(assigned_to); }
  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

/** GET /api/tasks — list tasks (Admin: all, others: own only) */
const listTasks = async (req, res, next) => {
  try {
    const isAdmin = ADMIN_ROLES.includes(req.user.role);
    const filters = {
      status:      req.query.status,
      priority:    req.query.priority,
      assigned_to: isAdmin ? req.query.assigned_to : String(req.user.id),
    };

    const { where, params } = buildWhere(filters);
    const { page: p, limit: l, offset } = paginate(req.query.page, req.query.limit || 50);

    const [total, data] = await Promise.all([
      Task.count(where, params),
      Task.findAll(where, params, l, offset),
    ]);

    success(res, paginatedResponse(data, total, p, l));
  } catch (err) {
    next(err);
  }
};

/** GET /api/tasks/counts — status counts for dashboard widget */
const getTaskCounts = async (req, res, next) => {
  try {
    const isAdmin = ADMIN_ROLES.includes(req.user.role);
    const userId = isAdmin ? null : req.user.id;
    const counts = await Task.getStatusCounts(userId);
    success(res, { counts });
  } catch (err) {
    next(err);
  }
};

/** GET /api/tasks/:id */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw createError('Task not found.', 404);
    const isAdmin = ADMIN_ROLES.includes(req.user.role);
    if (!isAdmin && task.assigned_to !== req.user.id) {
      throw createError('Access denied.', 403);
    }
    success(res, { task });
  } catch (err) {
    next(err);
  }
};

/** POST /api/tasks — Admin only */
const createTask = async (req, res, next) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      throw createError('Only Super Admin can create tasks.', 403);
    }
    const { title, description, assigned_to, status, priority, due_date, cargo_id } = req.body;
    if (!title) throw createError('Task title is required.', 400);

    const id = await Task.create({
      title,
      description,
      assigned_to: assigned_to || null,
      assigned_by: req.user.id,
      status,
      priority,
      due_date,
      cargo_id,
    });

    // Get assignee info for activity log
    let assigneeName = 'Unassigned';
    if (assigned_to) {
      const assignee = await User.findById(assigned_to);
      if (assignee) assigneeName = assignee.name;
    }

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'TASK_CREATED',
      description: `Task "${title}" assigned to ${assigneeName}`,
    });

    const task = await Task.findById(id);
    success(res, { task }, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/tasks/:id — Admin: full update; others: status only */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw createError('Task not found.', 404);

    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (!isAdmin && task.assigned_to !== req.user.id) {
      throw createError('Access denied.', 403);
    }

    let fields = {};
    if (isAdmin) {
      // Admin can change everything
      const { title, description, assigned_to, status, priority, due_date, cargo_id } = req.body;
      fields = { title, description, assigned_to, status, priority, due_date, cargo_id };
      // Remove undefined keys
      Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
    } else {
      // Non-admin can only update status
      if (req.body.status) fields.status = req.body.status;
    }

    await Task.update(req.params.id, fields);

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'TASK_UPDATED',
      description: `Task #${req.params.id} "${task.title}" updated`,
    });

    const updated = await Task.findById(req.params.id);
    success(res, { task: updated }, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/tasks/:id — Admin only */
const deleteTask = async (req, res, next) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      throw createError('Only Super Admin can delete tasks.', 403);
    }
    const task = await Task.findById(req.params.id);
    if (!task) throw createError('Task not found.', 404);
    await Task.delete(req.params.id);
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'TASK_DELETED',
      description: `Task "${task.title}" deleted`,
    });
    success(res, null, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, getTaskCounts };
