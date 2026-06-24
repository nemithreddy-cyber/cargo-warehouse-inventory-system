'use strict';

const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');
const messageLogService = require('../services/messageLogService');
const db = require('../config/db');

const getMessageLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, channel, status, cargoId, search } = req.query;
    const logs = await messageLogService.getLogs({ startDate, endDate, channel, status, cargoId, search });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

const getMessagingStats = async (req, res, next) => {
  try {
    const stats = await messageLogService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

const sendWhatsApp = async (req, res, next) => {
  try {
    const { phoneNumber, message, recipientName, cargoId } = req.body;
    let status = 'Sent';
    let error_message = null;
    let response;

    try {
      response = await whatsappService.sendWhatsAppMessage(phoneNumber, message);
      if (response.simulated) {
        status = 'Delivered';
      }
    } catch (err) {
      status = 'Failed';
      error_message = err.message;
    }

    await messageLogService.createLog({
      recipient_name: recipientName || 'Customer',
      phone_number: phoneNumber,
      channel: 'whatsapp',
      message: message,
      status: status,
      cargo_id: cargoId || null,
      error_message: error_message
    });

    if (status === 'Failed') {
      return res.status(500).json({ success: false, message: 'Failed to send WhatsApp message', error: error_message });
    }

    res.json({ success: true, message: 'WhatsApp message sent successfully', data: response });
  } catch (err) {
    next(err);
  }
};

const sendEmail = async (req, res, next) => {
  try {
    const { email, subject, message, recipientName, cargoId } = req.body;
    let status = 'Sent';
    let error_message = null;
    let response;

    try {
      response = await emailService.sendEmailMessage(email, subject, message);
      if (response.simulated) {
        status = 'Delivered';
      }
    } catch (err) {
      status = 'Failed';
      error_message = err.message;
    }

    await messageLogService.createLog({
      recipient_name: recipientName || 'Customer',
      email: email,
      channel: 'email',
      message: `Subject: ${subject}\n\n${message}`,
      status: status,
      cargo_id: cargoId || null,
      error_message: error_message
    });

    if (status === 'Failed') {
      return res.status(500).json({ success: false, message: 'Failed to send email message', error: error_message });
    }

    res.json({ success: true, message: 'Email sent successfully', data: response });
  } catch (err) {
    next(err);
  }
};

const retryMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM message_logs WHERE id = ?', [id]);
    const log = rows[0];

    if (!log) {
      return res.status(404).json({ success: false, message: 'Message log entry not found' });
    }

    let status = 'Sent';
    let error_message = null;
    let response;

    try {
      if (log.channel === 'whatsapp') {
        response = await whatsappService.sendWhatsAppMessage(log.phone_number, log.message);
        if (response.simulated) status = 'Delivered';
      } else {
        let subject = 'ORBEM Solutions Notification';
        let body = log.message;
        if (log.message.startsWith('Subject:')) {
          const lines = log.message.split('\n');
          subject = lines[0].replace('Subject:', '').trim();
          body = lines.slice(1).join('\n').trim();
        }
        response = await emailService.sendEmailMessage(log.email, subject, body);
        if (response.simulated) status = 'Delivered';
      }
    } catch (err) {
      status = 'Failed';
      error_message = err.message;
    }

    const isMysql = db.getClientType?.() === 'mysql';
    const timeFunc = isMysql ? 'NOW()' : 'datetime("now", "localtime")';

    await db.query(
      `UPDATE message_logs SET status = ?, error_message = ?, sent_at = ${timeFunc} WHERE id = ?`,
      [status, error_message, id]
    );

    if (status === 'Failed') {
      return res.status(500).json({ success: false, message: 'Retry sending failed', error: error_message });
    }

    res.json({ success: true, message: 'Message resent successfully!' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMessageLogs,
  getMessagingStats,
  sendWhatsApp,
  sendEmail,
  retryMessage
};
