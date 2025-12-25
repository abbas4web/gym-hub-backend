const db = require('../config/database');

// Get all receipts for user
exports.getAllReceipts = (req, res) => {
  db.all(
    'SELECT * FROM receipts WHERE user_id = ? ORDER BY generated_at DESC',
    [req.userId],
    (err, receipts) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({ success: true, receipts });
    }
  );
};

// Get receipt by ID
exports.getReceiptById = (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM receipts WHERE id = ? AND user_id = ?',
    [id, req.userId],
    (err, receipt) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!receipt) {
        return res.status(404).json({ success: false, error: 'Receipt not found' });
      }

      res.json({ success: true, receipt });
    }
  );
};

// Get receipts for a specific client
exports.getClientReceipts = (req, res) => {
  const { clientId } = req.params;

  db.all(
    'SELECT * FROM receipts WHERE client_id = ? AND user_id = ? ORDER BY generated_at DESC',
    [clientId, req.userId],
    (err, receipts) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({ success: true, receipts });
    }
  );
};
