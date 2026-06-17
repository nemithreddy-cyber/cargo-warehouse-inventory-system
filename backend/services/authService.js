const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { signToken } = require('../utils/jwt');
const { createError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 */
const register = async ({ name, username, email, password, role }) => {
  const existingEmail = await User.findByEmail(email);
  if (existingEmail) throw createError('An account with this email already exists.', 409);

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) throw createError('An account with this username already exists.', 409);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await User.create({ name, username, email, password: hashedPassword, role });

  await ActivityLog.create({
    user_id: userId,
    action: 'USER_REGISTERED',
    description: `New user registered: ${name} (${email})`,
  });

  const user = await User.findById(userId);
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

  return { user, token };
};

/**
 * Login an existing user.
 */
const login = async ({ email, password }) => {
  const user = await User.findByEmail(email);
  if (!user) throw createError('Invalid email or password.', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError('Invalid email or password.', 401);

  await ActivityLog.create({
    user_id: user.id,
    action: 'USER_LOGIN',
    description: `${user.name} logged in`,
  });

  const { password: _pw, ...safeUser } = user;
  const token = signToken({
    id: safeUser.id,
    name: safeUser.name,
    email: safeUser.email,
    role: safeUser.role,
  });

  return { user: safeUser, token };
};

/**
 * Get authenticated user's profile.
 */
const getProfile = async (id) => {
  const user = await User.findById(id);
  if (!user) throw createError('User not found.', 404);
  return user;
};

module.exports = { register, login, getProfile };
