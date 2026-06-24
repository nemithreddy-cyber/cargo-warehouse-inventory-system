'use strict';

const axios = require('axios');

/**
 * Sends a WhatsApp message using Meta's WhatsApp Business Cloud API.
 * Falls back to simulation if credentials are not configured.
 * 
 * Supports both Java spring.properties-style keys and Node.js-style keys.
 */
const sendWhatsAppMessage = async (phoneNumber, messageText) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env['whatsapp.access.token'];
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env['whatsapp.phone.number.id'];
  const apiUrl = process.env.WHATSAPP_API_URL || process.env['whatsapp.api.url'] || 'https://graph.facebook.com/v23.0';

  if (!token || !phoneId) {
    console.log(`[WHATSAPP SIMULATION]
To: ${phoneNumber}
Message: ${messageText}
--------------------------------------------------`);
    return { success: true, messageId: `sim-wa-${Date.now()}`, simulated: true };
  }

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

    console.log(`[WHATSAPP] Live message sent successfully. Response ID:`, response.data.messages?.[0]?.id);
    return { 
      success: true, 
      messageId: response.data.messages?.[0]?.id || response.data.wamid, 
      data: response.data 
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error('[WHATSAPP ERROR]', errorMsg);
    throw new Error(errorMsg);
  }
};

module.exports = { sendWhatsAppMessage };
