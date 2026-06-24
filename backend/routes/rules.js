const express = require('express');
const { getAlerts, getSuggestions } = require('../services/ruleEngine');
const { authenticate } = require('../middleware/auth');
const { success } = require('../utils/helpers');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/rules/alerts
 * Returns all active rule-based alerts (capacity, delays, high-priority, dispatch-due)
 */
router.get('/alerts', async (req, res, next) => {
  try {
    const result = await getAlerts();
    success(res, result, 'Rule-based alerts generated');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rules/suggestions
 * Returns storage suggestions and status recommendations
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const result = await getSuggestions();
    success(res, result, 'Rule-based suggestions generated');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
