const Client = require('../models/Client');
const User = require('../models/User');
const Receipt = require('../models/Receipt');
const { generateReceiptPDF } = require('../services/pdfService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const axios = require('axios');

// 1. GET /public/terms/:clientId -> Serve HTML Page
exports.getTermsPage = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId).populate('user_id');

    if (!client) {
      return res.status(404).send('<h1>Link Expired or Invalid</h1>');
    }

    if (client.terms_accepted) {
      // Fetch receipt to show view button
      const receipt = await Receipt.findOne({ client_id: clientId });
      const receiptBtn = receipt && receipt.receipt_url ? \`
        <div style="margin-top: 30px;">
          <a href="\${receipt.receipt_url}" style="
              background-color: #4CAF50; 
              color: white;
              font-size: 18px; 
              padding: 15px 20px; 
              display: inline-block; 
              text-decoration: none;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              font-family: sans-serif;
            " target="_blank">
              View Receipt
          </a>
        </div>
      \` : '';

      return res.send(\`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #4CAF50;">You have already accepted the terms.</h1>
          <p>Your membership is active.</p>
          \${receiptBtn}
        </div>
      \`);
    }

    const gymName = client.user_id.gym_name || 'Fitness Center';

    // Simple HTML Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Accept Terms - ${gymName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; text-align: center; }
          .terms-box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; height: 300px; overflow-y: scroll; margin: 20px 0; font-size: 14px; color: #555; }
          .btn { display: block; width: 100%; padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; text-align: center; text-decoration: none; }
          .btn:hover { background: #45a049; }
          .btn:disabled { background: #ccc; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to ${gymName}</h1>
          <p>Hi <strong>${client.name}</strong>, please review and accept our terms to activate your membership.</p>
          
          <div class="terms-box">
            <h3>Terms and Conditions</h3>
            <p>1. <strong>Health & Safety:</strong> I confirm that I am physically fit to engage in exercise. I understand that the gym is not responsible for any injuries sustained due to lifting heavy weights without supervision.</p>
            <p>2. <strong>Equipment Use:</strong> I agree to use equipment properly and return weights to their racks after use.</p>
            <p>3. <strong>Conduct:</strong> I will maintain respectful behavior towards staff and other members.</p>
            <p>4. <strong>Liability Waiver:</strong> I hereby waive ${gymName} from any liability for injuries or accidents occurring on the premises.</p>
            <p>5. <strong>Membership:</strong> Membership fees are non-refundable.</p>
          </div>

          <button id="acceptBtn" class="btn" onclick="acceptTerms()">I Accept & Activate Membership</button>
          <p id="status" style="text-align: center; margin-top: 15px; color: #666;"></p>
        </div>

        <script>
          async function acceptTerms() {
            const btn = document.getElementById('acceptBtn');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.innerText = 'Processing...';
            status.innerText = 'Activating membership and generating receipt...';

            try {
              const response = await fetch('/api/public/accept/${clientId}', { method: 'POST' });
              const data = await response.json();

              if (data.success) {
                document.body.innerHTML = \`
                  <div class="container" style="text-align: center;">
                    <h1 style="color: #4CAF50;">Membership Activated!</h1>
                    <p style="margin-bottom: 30px;">Thank you for accepting the terms.</p>
                    
                    <a href="\${data.receipt_url}" class="btn" style="
                        background-color: #4CAF50; 
                        font-size: 18px; 
                        padding: 15px 20px; 
                        display: inline-block; 
                        width: auto; 
                        max-width: 100%;
                        white-space: nowrap;
                        text-decoration: none;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                      " target="_blank">
                        📥 Download Receipt
                    </a>
                    
                    <p style="color: #888; font-size: 13px; margin-top: 20px;">(Receipt will auto-download shortly)</p>
                  </div>
                \`;
                // Auto-open in new tab to trigger download/view
                setTimeout(() => {
                  window.location.href = data.receipt_url; 
                }, 1000);
              } else {
                status.innerText = 'Error: ' + (data.error || 'Something went wrong');
                btn.disabled = false;
                btn.innerText = 'I Accept & Activate Membership';
              }
            } catch (err) {
              status.innerText = 'Network Error. Please try again.';
              btn.disabled = false;
              btn.innerText = 'I Accept & Activate Membership';
            }
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error serving terms page:', error);
    res.status(500).send('Server Error');
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
