const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get user subscription
exports.getSubscription = (req, res) => {
  db.get(
    'SELECT * FROM subscriptions WHERE user_id = ?',
    [req.userId],
    (err, subscription) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!subscription) {
        // Create default subscription if not exists
        const subscriptionId = uuidv4();
        db.run(
          'INSERT INTO subscriptions (id, user_id, plan, start_date) VALUES (?, ?, ?, ?)',
          [subscriptionId, req.userId, 'free', new Date().toISOString()],
          (err) => {
            if (err) {
              return res.status(500).json({ success: false, error: 'Failed to create subscription' });
            }

            db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId], (err, newSub) => {
              res.json({ success: true, subscription: newSub });
            });
          }
        );
      } else {
        res.json({ success: true, subscription });
      }
    }
  );
};

// Update subscription
exports.updateSubscription = (req, res) => {
  const { plan, billingCycle } = req.body;

  if (!plan) {
    return res.status(400).json({ success: false, error: 'Plan is required' });
  }

  const startDate = new Date().toISOString();

  db.run(
    `UPDATE subscriptions SET plan = ?, billing_cycle = ?, start_date = ?, is_active = 1
     WHERE user_id = ?`,
    [plan, billingCycle || 'monthly', startDate, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Failed to update subscription' });
      }

      db.get('SELECT * FROM subscriptions WHERE user_id = ?', [req.userId], (err, subscription) => {
        res.json({ success: true, subscription });
      });
    }
  );
};

// Check if user can add client (based on plan limits)
exports.canAddClient = (req, res) => {
  db.get('SELECT plan FROM subscriptions WHERE user_id = ?', [req.userId], (err, subscription) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    const plan = subscription?.plan || 'free';

    if (plan !== 'free') {
      return res.json({ success: true, canAdd: true });
    }

    // Check client count for free plan
    db.get('SELECT COUNT(*) as count FROM clients WHERE user_id = ?', [req.userId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      const canAdd = result.count < 10;
      res.json({ success: true, canAdd, currentCount: result.count, limit: 10 });
    });
  });
};
