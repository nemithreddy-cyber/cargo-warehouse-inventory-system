const express = require('express');
const { body } = require('express-validator');
const awbController = require('../controllers/awbController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// Role Protection: Super Admin & Accounts Staff
router.use(requireRole('Super Admin', 'Accounts Staff'));

router.get('/list', awbController.getAwbList);
router.get('/detail/:id', awbController.getAwbById);
router.get('/generate-number', awbController.generateAwbNumber);
router.patch('/cancel/:id', awbController.cancelAwb);

router.post(
  '/create',
  [
    body('cargo_id').isInt().withMessage('Cargo ID must be an integer'),
    body('shipper_name').trim().notEmpty().withMessage('Shipper name is required'),
    body('shipper_address').trim().notEmpty().withMessage('Shipper address is required'),
    body('consignee_name').trim().notEmpty().withMessage('Consignee name is required'),
    body('consignee_address').trim().notEmpty().withMessage('Consignee address is required'),
    body('origin_airport').trim().notEmpty().withMessage('Origin airport is required'),
    body('destination_airport').trim().notEmpty().withMessage('Destination airport is required'),
    body('cargo_description').trim().notEmpty().withMessage('Cargo description is required'),
    body('pieces').isInt({ min: 1 }).withMessage('Number of pieces must be at least 1'),
    body('actual_weight').isFloat({ min: 0.1 }).withMessage('Actual weight must be a positive number'),
    body('chargeable_weight').isFloat({ min: 0.1 }).withMessage('Chargeable weight must be a positive number'),
    body('declared_value').isFloat({ min: 0 }).withMessage('Declared value must be a positive number or zero'),
    body('issue_date').isISO8601().withMessage('Issue date must be a valid date'),
    validate
  ],
  awbController.createAwb
);

module.exports = router;
