const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ActivityLog = require('../models/ActivityLog');
const { success } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

const ADMIN_ROLES = ['Super Admin'];

const requireAdmin = (req) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    throw createError('Only Super Admin can manage users.', 403);
  }
};

/** GET /api/users — list all users */
const listUsers = async (req, res, next) => {
  try {
    requireAdmin(req);
    const users = await User.findAll();
    success(res, { users });
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/active — for task assignment dropdowns */
const listActiveUsers = async (req, res, next) => {
  try {
    const users = await User.findAllActive();
    success(res, { users });
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/:id */
const getUser = async (req, res, next) => {
  try {
    requireAdmin(req);
    const user = await User.findById(req.params.id);
    if (!user) throw createError('User not found.', 404);
    success(res, { user });
  } catch (err) {
    next(err);
  }
};

/** POST /api/users — create user */
const createUser = async (req, res, next) => {
  try {
    requireAdmin(req);
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      throw createError('Name, email, and password are required.', 400);
    }
    const existing = await User.findByEmail(email);
    if (existing) throw createError('Email already in use.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const id = await User.create({ name, email, password: hashed, role });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'USER_CREATED',
      description: `User "${name}" (${role}) created by admin`,
    });

    const user = await User.findById(id);
    success(res, { user }, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/users/:id — update user */
const updateUser = async (req, res, next) => {
  try {
    requireAdmin(req);
    const existing = await User.findById(req.params.id);
    if (!existing) throw createError('User not found.', 404);

    const { name, email, role, is_active } = req.body;
    await User.update(req.params.id, { name, email, role, is_active });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'USER_UPDATED',
      description: `User "${existing.name}" updated`,
    });

    const updated = await User.findById(req.params.id);
    success(res, { user: updated }, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/users/:id — delete user */
const deleteUser = async (req, res, next) => {
  try {
    requireAdmin(req);
    if (Number(req.params.id) === req.user.id) {
      throw createError('You cannot delete your own account.', 400);
    }
    const existing = await User.findById(req.params.id);
    if (!existing) throw createError('User not found.', 404);

    await User.delete(req.params.id);
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'USER_DELETED',
      description: `User "${existing.name}" deleted`,
    });
    success(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, listActiveUsers, getUser, createUser, updateUser, deleteUser };
