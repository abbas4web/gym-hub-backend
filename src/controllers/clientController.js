const { v4: uuidv4 } = require('uuid');
const Client = require('../models/Client');
const Receipt = require('../models/Receipt');

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

// Get all clients for user
exports.getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Client.countDocuments({ user_id: req.userId });
    
    let clients = await Client.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Update is_active status
    const now = new Date();
    clients = clients.map(client => {
      const clientObj = client.toObject(); // Convert to plain object to modify
      // Re-apply the id transformation manually since toObject might not do it depending on options
      clientObj.id = clientObj._id;
      delete clientObj._id;
      delete clientObj.__v;
      
      clientObj.is_active = new Date(client.end_date) > now ? 1 : 0;
      return clientObj;
    });

    res.json({ 
      success: true, 
      clients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Add new client
exports.addClient = async (req, res) => {
  try {
    const { name, phone, email, photo, adharPhoto, membershipType, startDate, endDate: customEndDate, fee: customFee } = req.body;

    console.log('Add client request:', { name, phone, email, membershipType, startDate, customEndDate, customFee, hasPhoto: !!photo, hasAdhar: !!adharPhoto });

    if (!name || !phone || !membershipType || !startDate) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const clientId = uuidv4();
    // Use custom values if provided, otherwise calculate
    const endDate = customEndDate || calculateEndDate(startDate, membershipType);
    const fee = customFee !== undefined ? customFee : getMembershipFee(membershipType);

    // Insert client with photo
    const client = await Client.create({
      _id: clientId,
      user_id: req.userId,
      name,
      phone,
      email: email || null,
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
      user_id: req.userId,
      client_name: name,
      amount: fee,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate
    });

    res.status(201).json({
      success: true,
      client,
      receipt
    });
  } catch (error) {
    console.error('Add client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Filter out undefined updates
  const cleanUpdates = {};
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      cleanUpdates[key] = updates[key];
    }
  });

  if (Object.keys(cleanUpdates).length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  try {
    const client = await Client.findOneAndUpdate(
      { _id: id, user_id: req.userId },
      cleanUpdates,
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

  try {
    const client = await Client.findOneAndDelete({ _id: id, user_id: req.userId });

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

  if (!membershipType) {
    return res.status(400).json({ success: false, error: 'Membership type required' });
  }

  const startDate = new Date().toISOString();
  const endDate = calculateEndDate(startDate, membershipType);
  const fee = getMembershipFee(membershipType);

  try {
    const client = await Client.findOneAndUpdate(
      { _id: id, user_id: req.userId },
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
      user_id: req.userId,
      client_name: client.name,
      amount: fee,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate
    });

    res.json({
      success: true,
      client,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to renew membership' });
  }
};
