const Receipt = require('../models/Receipt');

// Get all receipts for user
exports.getAllReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ user_id: req.userId }).sort({ generated_at: -1 });
    res.json({ success: true, receipts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Get receipt by ID
exports.getReceiptById = async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await Receipt.findOne({ _id: id, user_id: req.userId });

    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Get receipts for a specific client
exports.getClientReceipts = async (req, res) => {
  const { clientId } = req.params;

  try {
    const receipts = await Receipt.find({ client_id: clientId, user_id: req.userId }).sort({ generated_at: -1 });
    res.json({ success: true, receipts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Delete receipt
exports.deleteReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await Receipt.findOneAndDelete({ _id: id, user_id: req.userId });

    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete receipt' });
  }
};
