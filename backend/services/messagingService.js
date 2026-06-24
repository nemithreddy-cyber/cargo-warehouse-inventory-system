const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Sends a live or simulated email using Nodemailer.
 * Falls back to simulation if credentials are not configured.
 */
const sendEmail = async (to, subject, text, html = null) => {
  const hasCreds = process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST;

  if (hasCreds) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromAddress = process.env.SMTP_FROM || `"ORBEM Solutions Support" <${process.env.SMTP_USER}>`;
      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Live mail sent successfully to ${to}. Message ID: ${info.messageId}`);
      return { success: true, mode: 'live', messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send live email to ${to}:`, err.message);
      return { success: false, mode: 'error', error: err.message };
    }
  } else {
    console.log(`[EMAIL SIMULATION]
From: ORBEM Solutions Support
To: ${to}
Subject: ${subject}
Message: ${text}
--------------------------------------------------`);
    return { success: true, mode: 'simulation' };
  }
};

/**
 * Sends a live or simulated WhatsApp message using Twilio.
 * Falls back to simulation if credentials are not configured.
 */
const sendWhatsApp = async (to, body) => {
  const hasCreds = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM;

  if (hasCreds) {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      // Ensure the recipient number is formatted correctly for WhatsApp
      let formattedTo = to.trim();
      if (!formattedTo.startsWith('whatsapp:')) {
        formattedTo = `whatsapp:${formattedTo}`;
      }

      const message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: formattedTo,
        body: body,
      });

      console.log(`[WHATSAPP] Live message sent successfully to ${formattedTo}. SID: ${message.sid}`);
      return { success: true, mode: 'live', sid: message.sid };
    } catch (err) {
      console.error(`[WHATSAPP ERROR] Failed to send live WhatsApp to ${to}:`, err.message);
      return { success: false, mode: 'error', error: err.message };
    }
  } else {
    console.log(`[WHATSAPP SIMULATION]
From: ${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}
To: ${to}
Message: ${body}
--------------------------------------------------`);
    return { success: true, mode: 'simulation' };
  }
};

module.exports = {
  sendEmail,
  sendWhatsApp,
};
