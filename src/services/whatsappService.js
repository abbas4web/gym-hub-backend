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
  // Updated to v22.0 based on user's dashboard feedback
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  if (!token || !phoneNumberId) {
    console.warn('WhatsApp credentials missing. Skipping message send.');
    return;
  }

  // Ensure phone number has no special characters or spaces
  const cleanPhone = to.replace(/\D/g, '');

  try {
    // 1. Send "hello_world" Template FIRST
    // This is the most reliable way to initiate contact in Dev/Sandbox mode.
    // Structure strictly matches the dashboard curl command provided by the user.
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
    console.log(`WhatsApp template 'hello_world' sent to ${cleanPhone}`);

    // 2. Try to Send Receipt File
    // Note: This might fail if the user has not explicitly replied to the business,
    // as free-form media messages are restricted outside of the 24h window.
    // However, we attempt it anyway.
    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'document',
          document: {
            link: receiptUrl,
            caption: `Admission Receipt for ${clientName}`,
            filename: 'receipt.pdf',
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      console.log(`WhatsApp receipt PDF sent to ${cleanPhone}`);
    } catch (mediaError) {
      console.warn('Failed to send PDF (User might need to reply to the first message to open the window):', mediaError.response ? mediaError.response.data : mediaError.message);
    }

  } catch (error) {
    // Log the full error from Meta
    const metaError = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
    console.error('Error sending WhatsApp message:', metaError);
  }
};

module.exports = { sendWhatsAppReceipt };
