require('dotenv').config();
const { sendWhatsAppReceipt } = require('./src/services/whatsappService');

const testWhatsApp = async () => {
  // Use the number the user provided in the curl command example
  const testPhone = '919325481695'; 
  const testUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf'; // Dummy PDF
  const testName = 'Test User';

  console.log('Testing WhatsApp Send...');
  console.log('Token:', process.env.WHATSAPP_TOKEN ? 'Present' : 'Missing');
  console.log('Phone ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Present' : 'Missing');
  console.log('Target Phone:', testPhone);

  try {
    await sendWhatsAppReceipt(testPhone, testUrl, testName);
    console.log('Test function executed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testWhatsApp();
