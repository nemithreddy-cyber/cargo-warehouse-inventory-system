const express = require('express');
const { body } = require('express-validator');
const warehouseController = require('../controllers/warehouseController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/zones', warehouseController.getZones);
router.get('/locations', warehouseController.getLocations);
router.get('/occupancy', warehouseController.getWarehouseOccupancy);

router.post(
  '/zones',
  requireRole('Super Admin'),
  [
    body('zone_name').trim().notEmpty().withMessage('Zone name is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    validate,
  ],
  warehouseController.createZone
);

router.post(
  '/locations',
  requireRole('Super Admin'),
  [
    body('zone_id').isInt().withMessage('Zone ID must be an integer'),
    body('location_code').trim().notEmpty().withMessage('Location code is required'),
    body('status')
      .optional()
      .isIn(['Available', 'Occupied', 'Reserved'])
      .withMessage('Status must be Available, Occupied or Reserved'),
    validate,
  ],
  warehouseController.createLocation
);

module.exports = router;
