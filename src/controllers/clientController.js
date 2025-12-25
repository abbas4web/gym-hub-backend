const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

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
exports.getAllClients = (req, res) => {
  db.all(
    'SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, clients) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      // Update is_active status
      const now = new Date();
      clients = clients.map(client => ({
        ...client,
        is_active: new Date(client.end_date) > now ? 1 : 0
      }));

      res.json({ success: true, clients });
    }
  );
};

// Add new client
exports.addClient = (req, res) => {
  try {
    const { name, phone, email, photo, membershipType, startDate, endDate: customEndDate, fee: customFee } = req.body;

    console.log('Add client request:', { name, phone, email, membershipType, startDate, customEndDate, customFee, hasPhoto: !!photo });

    if (!name || !phone || !membershipType || !startDate) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const clientId = uuidv4();
    // Use custom values if provided, otherwise calculate
    const endDate = customEndDate || calculateEndDate(startDate, membershipType);
    const fee = customFee !== undefined ? customFee : getMembershipFee(membershipType);

    // Insert client with photo
    db.run(
      `INSERT INTO clients (id, user_id, name, phone, email, photo, membership_type, start_date, end_date, fee, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, req.userId, name, phone, email || null, photo || null, membershipType, startDate, endDate, fee, 1],
      function(err) {
        if (err) {
          console.error('Database error adding client:', err);
          return res.status(500).json({ success: false, error: 'Failed to add client: ' + err.message });
        }

        // Generate receipt
        const receiptId = generateReceiptId();
        db.run(
          `INSERT INTO receipts (id, client_id, user_id, client_name, amount, membership_type, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [receiptId, clientId, req.userId, name, fee, membershipType, startDate, endDate],
          (err) => {
            if (err) console.error('Failed to create receipt:', err);

            // Get the created client
            db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
              db.get('SELECT * FROM receipts WHERE id = ?', [receiptId], (err, receipt) => {
                res.status(201).json({
                  success: true,
                  client,
                  receipt
                });
              });
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Add client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update client
exports.updateClient = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  values.push(id, req.userId);

  db.run(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to update client' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
        res.json({ success: true, client });
      });
    }
  );
};

// Delete client
exports.deleteClient = (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM clients WHERE id = ? AND user_id = ?',
    [id, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to delete client' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      res.json({ success: true, message: 'Client deleted successfully' });
    }
  );
};

// Renew membership
exports.renewMembership = (req, res) => {
  const { id } = req.params;
  const { membershipType } = req.body;

  if (!membershipType) {
    return res.status(400).json({ success: false, error: 'Membership type required' });
  }

  const startDate = new Date().toISOString();
  const endDate = calculateEndDate(startDate, membershipType);
  const fee = getMembershipFee(membershipType);

  db.run(
    `UPDATE clients SET membership_type = ?, start_date = ?, end_date = ?, fee = ?, is_active = 1
     WHERE id = ? AND user_id = ?`,
    [membershipType, startDate, endDate, fee, id, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to renew membership' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      // Get client name
      db.get('SELECT name FROM clients WHERE id = ?', [id], (err, client) => {
        // Generate receipt
        const receiptId = generateReceiptId();
        db.run(
          `INSERT INTO receipts (id, client_id, user_id, client_name, amount, membership_type, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [receiptId, id, req.userId, client.name, fee, membershipType, startDate, endDate],
          (err) => {
            db.get('SELECT * FROM clients WHERE id = ?', [id], (err, updatedClient) => {
              db.get('SELECT * FROM receipts WHERE id = ?', [receiptId], (err, receipt) => {
                res.json({
                  success: true,
                  client: updatedClient,
                  receipt
                });
              });
            });
          }
        );
      });
    }
  );
};
