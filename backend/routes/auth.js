const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['Super Admin', 'Warehouse Staff', 'Operations Staff', 'Documentation Executive', 'Accounts Staff'])
      .withMessage('Invalid user role'),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

router.get('/profile', authenticate, authController.getProfile);
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validate,
  ],
  authController.updateProfile
);
router.get('/check-users', authController.checkUsers);

module.exports = router;
