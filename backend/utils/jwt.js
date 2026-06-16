const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT token for the given payload.
 * @param {object} payload - Data to embed (e.g. { id, email, role })
 * @returns {string} Signed JWT string
 */
const signToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment');
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { signToken, verifyToken };
