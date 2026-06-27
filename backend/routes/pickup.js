const express = require('express');
const { body } = require('express-validator');
const pickupController = require('../controllers/pickupController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// Role Protection: Super Admin & Warehouse Staff
router.use(requireRole('Super Admin', 'Warehouse Staff'));

router.get('/list', pickupController.getPickupList);
router.get('/calendar', pickupController.getPickupCalendar);
router.get('/detail/:id', pickupController.getPickupById);
router.patch('/status/:id', pickupController.updatePickupStatus);
router.delete('/cancel/:id', pickupController.cancelPickup);

router.post(
  '/create',
  [
    body('cargo_id').isInt().withMessage('Cargo ID must be an integer'),
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('pickup_type').isIn(['airport_pickup', 'customer_delivery']).withMessage('Invalid pickup type'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('scheduled_date').isISO8601().withMessage('Scheduled date must be a valid date'),
    body('scheduled_time').trim().notEmpty().withMessage('Scheduled time is required'),
    body('assigned_driver').trim().notEmpty().withMessage('Assigned driver is required'),
    body('vehicle_number').trim().notEmpty().withMessage('Vehicle number is required'),
    body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
    validate
  ],
  pickupController.createPickup
);

module.exports = router;
