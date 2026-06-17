const authService = require('../services/authService');
const { success } = require('../utils/helpers');

const User = require('../models/User');

const register = async (req, res, next) => {
  try {
    const { name, username, email, password, role } = req.body;
    const result = await authService.register({ name, username, email, password, role });
    success(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    success(res, result, 'Login successful', 200);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id);
    success(res, { user: result }, 'Profile retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
};

const checkUsers = async (req, res, next) => {
  try {
    const count = await User.count();
    res.status(200).json({ success: true, hasUsers: count > 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, checkUsers };
