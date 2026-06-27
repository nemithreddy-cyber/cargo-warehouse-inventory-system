const express = require('express');
const { body } = require('express-validator');
const weightController = require('../controllers/weightController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// Role Protection: Super Admin & Warehouse Staff
router.use(requireRole('Super Admin', 'Warehouse Staff'));

router.get('/history', weightController.getWeightHistory);
router.delete('/delete/:id', weightController.deleteWeightRecord);

router.post(
  '/calculate',
  [
    body('description').trim().notEmpty().withMessage('Cargo description is required'),
    body('pieces').isInt({ min: 1 }).withMessage('Pieces count must be at least 1'),
    body('actual_weight').isFloat({ min: 0.1 }).withMessage('Actual weight must be a positive number'),
    body('volumetric_weight').isFloat({ min: 0.1 }).withMessage('Volumetric weight must be a positive number'),
    body('chargeable_weight').isFloat({ min: 0.1 }).withMessage('Chargeable weight must be a positive number'),
    body('length_cm').isFloat({ min: 0.1 }).withMessage('Length must be a positive number'),
    body('width_cm').isFloat({ min: 0.1 }).withMessage('Width must be a positive number'),
    body('height_cm').isFloat({ min: 0.1 }).withMessage('Height must be a positive number'),
    body('rate_per_kg').isFloat({ min: 0 }).withMessage('Rate per kg must be a positive number or zero'),
    body('freight_cost').isFloat({ min: 0 }).withMessage('Freight cost must be a positive number or zero'),
    validate
  ],
  weightController.calculateAndSaveWeight
);

module.exports = router;
