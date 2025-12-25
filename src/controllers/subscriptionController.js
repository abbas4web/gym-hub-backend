const { v4: uuidv4 } = require('uuid');
const Subscription = require('../models/Subscription');
const Client = require('../models/Client');

// Get user subscription
exports.getSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user_id: req.userId });

    if (!subscription) {
      // Create default subscription if not exists
      const subscriptionId = uuidv4();
      subscription = await Subscription.create({
        _id: subscriptionId,
        user_id: req.userId,
        plan: 'free',
        start_date: new Date().toISOString()
      });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  const { plan, billingCycle } = req.body;

  if (!plan) {
    return res.status(400).json({ success: false, error: 'Plan is required' });
  }

  const startDate = new Date().toISOString();

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { user_id: req.userId },
      {
        plan,
        billing_cycle: billingCycle || 'monthly',
        start_date: startDate,
        is_active: 1
      },
      { new: true, upsert: true } // Create if doesn't exist, though it should usually exist
    );

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update subscription' });
  }
};

// Check if user can add client (based on plan limits)
exports.canAddClient = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user_id: req.userId });
    const plan = subscription?.plan || 'free';

    if (plan !== 'free') {
      return res.json({ success: true, canAdd: true });
    }

    // Check client count for free plan
    const count = await Client.countDocuments({ user_id: req.userId });
    const canAdd = count < 10;
    
    res.json({ success: true, canAdd, currentCount: count, limit: 10 });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
