const { validationResult } = require('express-validator');
const { error } = require('../utils/helpers');

/**
 * Run after express-validator chains.
 * If there are validation errors, respond with 422 and structured error list.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return error(res, 'Validation failed', 422, formatted);
  }
  next();
};

module.exports = { validate };
