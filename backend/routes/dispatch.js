const express = require('express');
const { body } = require('express-validator');
const dispatchController = require('../controllers/dispatchController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', dispatchController.getDispatchList);
router.get('/:id', dispatchController.getDispatchById);

router.post(
  '/',
  requireRole('Super Admin', 'Operations Staff'),
  [
    body('cargo_id').isInt().withMessage('Cargo ID must be an integer'),
    body('driver_name').trim().notEmpty().withMessage('Driver name is required'),
    body('vehicle_number').trim().notEmpty().withMessage('Vehicle number is required'),
    body('dispatch_date').isISO8601().withMessage('Dispatch date must be a valid date'),
    body('expected_delivery').isISO8601().withMessage('Expected delivery must be a valid date'),
    body('status')
      .optional()
      .isIn(['Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'])
      .withMessage('Invalid dispatch status'),
    validate,
  ],
  dispatchController.createDispatch
);

router.put(
  '/:id',
  requireRole('Super Admin', 'Operations Staff'),
  [
    body('driver_name').optional().trim().notEmpty().withMessage('Driver name cannot be empty'),
    body('vehicle_number').optional().trim().notEmpty().withMessage('Vehicle number cannot be empty'),
    body('dispatch_date').optional().isISO8601().withMessage('Dispatch date must be a valid date'),
    body('expected_delivery').optional().isISO8601().withMessage('Expected delivery must be a valid date'),
    body('status')
      .optional()
      .isIn(['Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'])
      .withMessage('Invalid dispatch status'),
    validate,
  ],
  dispatchController.updateDispatch
);

module.exports = router;
