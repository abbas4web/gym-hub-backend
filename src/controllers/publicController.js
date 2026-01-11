const Client = require('../models/Client');
const User = require('../models/User');
const Receipt = require('../models/Receipt');
const { generateReceiptPDF } = require('../services/pdfService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const axios = require('axios');

// 1. GET /public/terms/:clientId -> Return JSON Data for Frontend UI
exports.getTermsPage = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId).populate('user_id');

    if (!client) {
      return res.status(404).json({ success: false, error: 'Link Expired or Invalid' });
    }

    const gymName = client.user_id.gym_name || 'Fitness Center';

    // Return JSON data so Frontend can build the UI
    res.json({
      success: true,
      gymName,
      clientName: client.name,
      termsAccepted: client.terms_accepted,
      termsText: [
        "1. Health & Safety: I confirm that I am physically fit to engage in exercise. I understand that the gym is not responsible for any injuries sustained due to lifting heavy weights without supervision.",
        "2. Equipment Use: I agree to use equipment properly and return weights to their racks after use.",
        "3. Conduct: I will maintain respectful behavior towards staff and other members.",
        `4. Liability Waiver: I hereby waive ${gymName} from any liability for injuries or accidents occurring on the premises.`,
        "5. Membership: Membership fees are non-refundable."
      ]
    });

  } catch (error) {
    console.error('Error fetching terms data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 2. POST /public/accept/:clientId -> Activate & Generate PDF
exports.acceptTerms = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    if (client.terms_accepted) {
      // If already accepted, find the existing receipt
      const existingReceipt = await Receipt.findOne({ client_id: clientId });
      return res.json({ success: true, receipt_url: existingReceipt?.receipt_url });
    }

    // 1. Update Client Status
    client.is_active = 1;
    client.terms_accepted = true;
    client.terms_accepted_at = new Date();
    await client.save();

    // 2. Fetch User (Gym Owner) for Logo/Name
    const user = await User.findById(client.user_id);
    const gymName = user?.gym_name || user?.name || 'Gym Hub';
    let gymLogoBuffer = null;

    if (user?.gym_logo) {
      try {
        const logoResponse = await axios.get(user.gym_logo, { responseType: 'arraybuffer' });
        gymLogoBuffer = logoResponse.data;
      } catch (logoErr) {
        console.error('Failed to fetch gym logo:', logoErr.message);
      }
    }

    // 3. Find or Create Receipt (It should already exist from addClient step, but without URL)
    let receipt = await Receipt.findOne({ client_id: clientId });
    
    // Safety check: if receipt doesn't exist (legacy), create one? 
    // Actually, addClient creates it. So we just update it.
    if (!receipt) {
       // This shouldn't happen in new flow, but handle gracefully
       return res.status(500).json({ success: false, error: 'Receipt record missing' });
    }

    // 4. Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      gymName,
      gymAddress: user?.gym_address,
      gymLogoBuffer,
      clientName: client.name,
      phone: client.phone,
      plan: client.membership_type,
      amount: client.fee,
      startDate: client.start_date,
      endDate: client.end_date,
      receiptId: receipt._id
    });

    // 5. Upload to Cloudinary
    const receiptUrl = await uploadToCloudinary(pdfBuffer, 'gym-receipts', receipt._id);

    // 6. Save Receipt URL
    receipt.receipt_url = receiptUrl;
    await receipt.save();

    res.json({ success: true, receipt_url: receiptUrl });

  } catch (error) {
    console.error('Accept terms error:', error);
    res.status(500).json({ success: false, error: 'Failed to activate membership' });
  }
};
