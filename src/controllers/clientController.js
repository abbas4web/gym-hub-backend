const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Client = require('../models/Client');
const Receipt = require('../models/Receipt');
const User = require('../models/User');
const { generateReceiptPDF } = require('../services/pdfService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendWhatsAppReceipt } = require('../services/whatsappService');

// Helper functions
const calculateEndDate = (startDate, membershipType) => {
  const start = new Date(startDate);
  const months = membershipType === 'monthly' ? 1 : membershipType === 'quarterly' ? 3 : 12;
  start.setMonth(start.getMonth() + months);
  return start.toISOString();
};

const getMembershipFee = (membershipType) => {
  return membershipType === 'monthly' ? 1500 : membershipType === 'quarterly' ? 4000 : 15000;
};

const generateReceiptId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `RCP-${timestamp}-${random}`;
};

// Get all clients for user (Owner or Worker)
exports.getAllClients = async (req, res) => {
  try {
    // If worker, use owner_id. If owner, use _id.
    const ownerId = req.user.role === 'worker' ? req.user.owner_id : req.user._id;

    let clients = await Client.find({ user_id: ownerId })
      .sort({ created_at: -1 })
      .populate('created_by', 'name role'); // Populate creator info

    // Update is_active status
    const now = new Date();
    clients = clients.map(client => {
      const clientObj = client.toObject(); 
      clientObj.id = clientObj._id;
      delete clientObj._id;
      delete clientObj.__v;
      
      clientObj.is_active = new Date(client.end_date) > now ? 1 : 0;
      return clientObj;
    });

    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Add new client
exports.addClient = async (req, res) => {
  try {
    const { name, phone, photo, adharPhoto, membershipType, startDate, endDate: customEndDate, fee: customFee } = req.body;

    console.log('Add client request:', { name, phone, membershipType, startDate, customEndDate, customFee, hasPhoto: !!photo, hasAdhar: !!adharPhoto });

    if (!name || !phone || !membershipType || !startDate) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Determine Owner ID
    const ownerId = req.user.role === 'worker' ? req.user.owner_id : req.user._id;

    const clientId = uuidv4();
    // Use custom values if provided, otherwise calculate
    const endDate = customEndDate || calculateEndDate(startDate, membershipType);
    const fee = customFee !== undefined ? customFee : getMembershipFee(membershipType);

    // Insert client with photo
    const client = await Client.create({
      _id: clientId,
      user_id: ownerId, // Belongs to the Gym Owner
      created_by: req.user._id, // Track who added it
      name,
      phone,
      // email removed as per requirement
      photo: photo || null,
      adhar_photo: adharPhoto || null,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate,
      fee,
      is_active: 1
    });

    // Generate receipt
    const receiptId = generateReceiptId();
    const receipt = await Receipt.create({
      _id: receiptId,
      client_id: clientId,
      user_id: ownerId, // Receipt belongs to Owner
      client_name: name,
      amount: fee,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate
    });

    // --- Automated Receipt Flow (PDF -> Cloudinary) ---
    // DISABLED for initial add. Receipt is now generated ONLY after terms acceptance.
    
    // 1. Fetch Gym Name (From Owner)
    const user = await User.findById(ownerId);
    const gymName = user?.gym_name || user?.name || 'Gym Hub';

    // 2. Generate Consent Link
    // Assuming backend URL is set in env, or construct dynamically
    // For Vercel, it's usually https://your-app.vercel.app
    const backendUrl = process.env.BACKEND_URL || `https://${req.get('host')}`;
    const consentLink = `${backendUrl}/api/public/terms/${client._id}`;

    // 3. Construct WhatsApp Message (Consent First)
    const whatsappMessage = `Hello ${name}, welcome to ${gymName}! Please accept our Terms & Conditions to activate your membership and receive your receipt: ${consentLink}`;

    res.status(201).json({
      success: true,
      client,
      // No receipt yet
      receipt: null, 
      whatsapp_message: whatsappMessage,
      consent_link: consentLink
    });

  } catch (error) {
    console.error('Add client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, phone, photo, adharPhoto, membershipType, startDate, endDate, fee } = req.body;

  // Determine Owner ID
  const ownerId = req.user.role === 'worker' ? req.user.owner_id : req.user._id;

  // Build update object
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  // email removed
  if (photo !== undefined) updates.photo = photo;
  if (adharPhoto !== undefined) updates.adhar_photo = adharPhoto;
  if (membershipType !== undefined) updates.membership_type = membershipType;
  if (startDate !== undefined) updates.start_date = startDate;
  if (endDate !== undefined) updates.end_date = endDate;
  if (fee !== undefined) updates.fee = fee;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  try {
    const client = await Client.findOneAndUpdate(
      { _id: id, user_id: ownerId }, // Use Owner ID
      updates,
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update client' });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  const { id } = req.params;

  // Determine Owner ID
  const ownerId = req.user.role === 'worker' ? req.user.owner_id : req.user._id;

  try {
    const client = await Client.findOneAndDelete({ _id: id, user_id: ownerId }); // Use Owner ID

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
};

// Renew membership
exports.renewMembership = async (req, res) => {
  const { id } = req.params;
  const { membershipType } = req.body;

  // Determine Owner ID
  const ownerId = req.user.role === 'worker' ? req.user.owner_id : req.user._id;

  if (!membershipType) {
    return res.status(400).json({ success: false, error: 'Membership type required' });
  }

  const startDate = new Date().toISOString();
  const endDate = calculateEndDate(startDate, membershipType);
  const fee = getMembershipFee(membershipType);

  try {
    const client = await Client.findOneAndUpdate(
      { _id: id, user_id: ownerId }, // Use Owner ID
      {
        membership_type: membershipType,
        start_date: startDate,
        end_date: endDate,
        fee,
        is_active: 1
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Generate receipt
    const receiptId = generateReceiptId();
    const receipt = await Receipt.create({
      _id: receiptId,
      client_id: id,
      user_id: ownerId, // Use Owner ID
      client_name: client.name,
      amount: fee,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate
    });

    // We can also trigger automation here for renewals if desired, but user asked for "admission/register-client flow".
    // I'll leave it out for now to strictly follow "Extend the current admission / register-client flow".

    res.json({
      success: true,
      client,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to renew membership' });
  }
};
