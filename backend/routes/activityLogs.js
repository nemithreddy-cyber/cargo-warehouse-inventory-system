const express = require('express');
const activityLogController = require('../controllers/activityLogController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('Super Admin'), activityLogController.getActivityLogs);

module.exports = router;
