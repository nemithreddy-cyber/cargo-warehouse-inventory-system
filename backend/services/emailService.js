'use strict';

const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer and Gmail or custom SMTP hosts.
 * Falls back to simulation if credentials are not configured.
 * 
 * Supports both Spring Mail keys (spring.mail.*) and Node-style variables (SMTP_*).
 */
const sendEmailMessage = async (toEmail, subject, messageText) => {
  const host = process.env.SPRING_MAIL_HOST || process.env['spring.mail.host'] || process.env.SMTP_HOST;
  const port = parseInt(process.env.SPRING_MAIL_PORT || process.env['spring.mail.port'] || process.env.SMTP_PORT || '587', 10);
  const username = process.env.SPRING_MAIL_USERNAME || process.env['spring.mail.username'] || process.env.SMTP_USER;
  const password = process.env.SPRING_MAIL_PASSWORD || process.env['spring.mail.password'] || process.env.SMTP_PASS;

  if (!host || !username || !password) {
    console.log(`[EMAIL SIMULATION]
To: ${toEmail}
Subject: ${subject}
Message: ${messageText}
--------------------------------------------------`);
    return { success: true, messageId: `sim-mail-${Date.now()}`, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password
      }
    });

    const mailOptions = {
      from: `"ORBEM Solutions Support" <${username}>`,
      to: toEmail,
      subject: subject,
      text: messageText,
      html: messageText.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Live mail sent successfully. Message ID:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
    throw error;
  }
};

module.exports = { sendEmailMessage };
