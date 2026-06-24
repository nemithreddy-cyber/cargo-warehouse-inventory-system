/**
 * Calculate volumetric (chargeable) and billing weights.
 * Chargeable weight = (L × W × H) / 6000   [result in kg]
 * Billing weight    = MAX(actual_weight, chargeable_weight)
 *
 * @param {number} weight  - Actual weight in kg
 * @param {number} length  - Length in cm
 * @param {number} width   - Width in cm
 * @param {number} height  - Height in cm
 * @returns {{ chargeable_weight: number, billing_weight: number }}
 */
const calculateWeights = (weight, length, width, height) => {
  const chargeable_weight = parseFloat(
    ((length * width * height) / 6000).toFixed(2)
  );
  const billing_weight = Math.max(parseFloat(weight), chargeable_weight);
  return { chargeable_weight, billing_weight };
};

/**
 * Build pagination metadata and LIMIT/OFFSET values.
 * @param {number|string} page  - Page number (1-based)
 * @param {number|string} limit - Items per page
 * @returns {{ page, limit, offset, meta }}
 */
const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return {
    page: p,
    limit: l,
    offset: (p - 1) * l,
  };
};

/**
 * Build a paginated API response.
 */
const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total: parseInt(total, 10),
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit),
  },
});

/**
 * Auto-generate a prefixed ID like CRG-20260001
 * @param {string} prefix   - e.g. 'CRG' or 'DSP'
 * @param {number} sequence - Integer sequence number
 */
const generateId = (prefix, sequence) => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}${String(sequence).padStart(4, '0')}`;
};

/**
 * Standard success response shape.
 */
const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

/**
 * Standard error response shape.
 */
const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = {
  calculateWeights,
  paginate,
  paginatedResponse,
  generateId,
  success,
  error,
};
