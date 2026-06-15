const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/helpers');

/**
 * Middleware: verify JWT and attach decoded user to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, name, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token has expired. Please log in again.', 401);
    }
    return error(res, 'Invalid token.', 401);
  }
};

/**
 * Middleware factory: restrict access to specific roles.
 * Usage: requireRole('Admin', 'Warehouse Staff')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return error(res, 'Unauthorized. Please authenticate first.', 401);
  }
  if (!roles.includes(req.user.role)) {
    return error(
      res,
      `Access denied. Required role(s): ${roles.join(', ')}`,
      403
    );
  }
  next();
};

module.exports = { authenticate, requireRole };
