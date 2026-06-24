'use strict';

const axios = require('axios');

/**
 * Sends a WhatsApp message using Meta's WhatsApp Business Cloud API or Twilio.
 * Falls back to simulation if credentials are not configured.
 * 
 * Supports both Java spring.properties-style keys and Node.js-style keys.
 */
const sendWhatsAppMessage = async (phoneNumber, messageText) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env['whatsapp.access.token'];
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env['whatsapp.phone.number.id'];
  const apiUrl = process.env.WHATSAPP_API_URL || process.env['whatsapp.api.url'] || 'https://graph.facebook.com/v23.0';

  // Twilio Settings
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  // 1. Try Twilio if credentials are provided
  if (twilioSid && twilioAuthToken) {
    try {
      const twilio = require('twilio');
      const client = twilio(twilioSid, twilioAuthToken);
      
      let formattedTo = phoneNumber.trim();
      if (!formattedTo.startsWith('whatsapp:')) {
        formattedTo = `whatsapp:${formattedTo}`;
      }

      const response = await client.messages.create({
        from: twilioFrom,
        to: formattedTo,
        body: messageText,
      });

      console.log(`[WHATSAPP TWILIO] Live message sent successfully. SID:`, response.sid);
      return { 
        success: true, 
        messageId: response.sid,
        data: response 
      };
    } catch (error) {
      console.error('[WHATSAPP TWILIO ERROR]', error.message);
      throw error;
    }
  }

  // 2. Try Meta Cloud API if credentials are provided
  if (token && phoneId) {
    try {
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      const url = `${apiUrl}/${phoneId}/messages`;
      const response = await axios.post(url, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[WHATSAPP META] Live message sent successfully. Response ID:`, response.data.messages?.[0]?.id);
      return { 
        success: true, 
        messageId: response.data.messages?.[0]?.id || response.data.wamid, 
        data: response.data 
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('[WHATSAPP META ERROR]', errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 3. Fallback to Simulation
  console.log(`[WHATSAPP SIMULATION]
To: ${phoneNumber}
Message: ${messageText}
--------------------------------------------------`);
  return { success: true, messageId: `sim-wa-${Date.now()}`, simulated: true };
};

module.exports = { sendWhatsAppMessage };

