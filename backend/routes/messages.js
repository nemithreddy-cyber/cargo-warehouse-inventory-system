'use strict';

const express = require('express');
const { body } = require('express-validator');
const messagingController = require('../controllers/messagingController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Secure all messaging endpoints
router.use(authenticate);

router.get('/logs', messagingController.getMessageLogs);
router.get('/stats', messagingController.getMessagingStats);

router.post(
  '/whatsapp',
  [
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('message').trim().notEmpty().withMessage('Message content cannot be empty'),
    validate
  ],
  messagingController.sendWhatsApp
);

router.post(
  '/email',
  [
    body('email').trim().isEmail().withMessage('Must provide a valid recipient email address'),
    body('subject').trim().notEmpty().withMessage('Email subject is required'),
    body('message').trim().notEmpty().withMessage('Email body cannot be empty'),
    validate
  ],
  messagingController.sendEmail
);

router.post('/retry/:id', messagingController.retryMessage);

module.exports = router;
