const express = require('express');
const activityLogController = require('../controllers/activityLogController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('Admin'), activityLogController.getActivityLogs);

module.exports = router;
