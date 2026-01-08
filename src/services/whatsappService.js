const axios = require('axios');

/**
 * Sends a WhatsApp message with the receipt.
 * @param {string} to - Recipient phone number (with country code).
 * @param {string} receiptUrl - URL of the receipt PDF/Image.
 * @param {string} clientName - Name of the client.
 */
const sendWhatsAppReceipt = async (to, receiptUrl, clientName) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  if (!token || !phoneNumberId) {
    console.warn('WhatsApp credentials missing. Skipping message send.');
    return;
  }

  // Ensure phone number has no special characters or spaces
  const cleanPhone = to.replace(/\D/g, '');

  try {
    // 1. Send Confirmation Text
    // NOTE: This will fail if the user hasn't messaged the business in the last 24h.
    // In Production, you MUST use a Template Message for the first contact.
    // We try to send a 'hello_world' template if the text fails, as a fallback for testing.
    
    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            body: `Hello ${clientName}, welcome to Gym Hub! Here is your admission receipt.`,
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (textError) {
      console.warn('Text message failed (likely 24h window policy). Attempting Template message...');
      
      // Fallback: Send "hello_world" template (Standard Test Template)
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' }
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Send Receipt File
    // Note: This might also fail if the 24h window is closed.
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'document',
        document: {
          link: receiptUrl,
          caption: 'Admission Receipt',
          filename: 'receipt.pdf',
        },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log(`WhatsApp receipt sent to ${cleanPhone}`);
  } catch (error) {
    // Log the full error from Meta
    const metaError = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
    console.error('Error sending WhatsApp message:', metaError);
  }
};

module.exports = { sendWhatsAppReceipt };
