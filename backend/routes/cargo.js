const express = require('express');
const { body } = require('express-validator');
const cargoController = require('../controllers/cargoController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', cargoController.getCargoList);
router.get('/:id', cargoController.getCargoById);

router.post(
  '/',
  requireRole('Super Admin', 'Warehouse Staff'),
  [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('customer_phone').trim().notEmpty().withMessage('Customer phone is required'),
    body('cargo_type').trim().notEmpty().withMessage('Cargo type is required'),
    body('origin_airport')
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage('Origin airport must be between 3 and 10 characters'),
    body('destination_airport')
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage('Destination airport must be between 3 and 10 characters'),
    body('pickup_city').trim().notEmpty().withMessage('Pickup city is required'),
    body('package_count')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Package count must be a positive integer'),
    body('weight').isFloat({ min: 1, max: 20000 }).withMessage('Weight must be between 1 and 20,000 kg'),
    body('length').isFloat({ min: 0.1 }).withMessage('Length must be a positive number'),
    body('width').isFloat({ min: 0.1 }).withMessage('Width must be a positive number'),
    body('height').isFloat({ min: 0.1 }).withMessage('Height must be a positive number'),
    body('zone_id').optional({ checkFalsy: true }).isInt().withMessage('Zone ID must be an integer'),
    body('location_id').optional({ checkFalsy: true }).isInt().withMessage('Location ID must be an integer'),
    body('status')
      .optional()
      .isIn([
        'Received',
        'Stored',
        'Ready For Dispatch',
        'Dispatched',
        'Delivered',
        'Cancelled',
      ])
      .withMessage('Invalid cargo status'),
    validate,
  ],
  cargoController.createCargo
);

router.put(
  '/:id',
  requireRole('Super Admin', 'Warehouse Staff', 'Operations Staff'),
  [
    body('customer_name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
    body('customer_phone').optional().trim().notEmpty().withMessage('Customer phone cannot be empty'),
    body('cargo_type').optional().trim().notEmpty().withMessage('Cargo type cannot be empty'),
    body('origin_airport')
      .optional()
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage('Origin airport must be between 3 and 10 characters'),
    body('destination_airport')
      .optional()
      .trim()
      .isLength({ min: 3, max: 10 })
      .withMessage('Destination airport must be between 3 and 10 characters'),
    body('pickup_city').optional().trim().notEmpty().withMessage('Pickup city cannot be empty'),
    body('package_count')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Package count must be a positive integer'),
    body('weight').optional().isFloat({ min: 1, max: 20000 }).withMessage('Weight must be between 1 and 20,000 kg'),
    body('length').optional().isFloat({ min: 0.1 }).withMessage('Length must be a positive number'),
    body('width').optional().isFloat({ min: 0.1 }).withMessage('Width must be a positive number'),
    body('height').optional().isFloat({ min: 0.1 }).withMessage('Height must be a positive number'),
    body('zone_id').optional({ nullable: true }).isInt().withMessage('Zone ID must be an integer'),
    body('location_id').optional({ nullable: true }).isInt().withMessage('Location ID must be an integer'),
    body('status')
      .optional()
      .isIn([
        'Received',
        'Stored',
        'Ready For Dispatch',
        'Dispatched',
        'Delivered',
        'Cancelled',
      ])
      .withMessage('Invalid cargo status'),
    validate,
  ],
  cargoController.updateCargo
);

router.delete('/:id', requireRole('Super Admin'), cargoController.deleteCargo);

module.exports = router;
