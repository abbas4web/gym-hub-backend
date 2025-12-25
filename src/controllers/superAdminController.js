const SuperAdmin = require('../models/SuperAdmin');
const User = require('../models/User');
const Receipt = require('../models/Receipt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Super Admin Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const superAdmin = await SuperAdmin.findOne({ email });

    if (!superAdmin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, superAdmin.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: superAdmin._id, email: superAdmin.email, role: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      superAdmin: {
        id: superAdmin._id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Get Current Super Admin
exports.getMe = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findById(req.superAdminId).select('id email name created_at');

    if (!superAdmin) {
      return res.status(404).json({ success: false, error: 'Super admin not found' });
    }

    res.json({ success: true, superAdmin });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Get All Admins
exports.getAllAdmins = async (req, res) => {
  const { search, status } = req.query;

  try {
    const pipeline = [];

    // Match stage for search and status
    const match = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      match.$or = [
        { name: regex },
        { email: regex },
        { gym_name: regex }
      ];
    }
    if (status && status !== 'all') {
      match.status = status;
    }
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // Lookup clients to get count
    pipeline.push({
      $lookup: {
        from: 'clients',
        localField: '_id', // String UUID
        foreignField: 'user_id', // String UUID
        as: 'clients'
      }
    });

    // Lookup subscription to get plan
    pipeline.push({
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'user_id',
        as: 'subscription'
      }
    });

    // Project stage
    pipeline.push({
      $project: {
        id: '$_id',
        _id: 0,
        name: 1,
        email: 1,
        gym_name: 1,
        status: 1,
        created_at: 1,
        total_revenue: 1,
        client_count: { $size: '$clients' },
        subscription_plan: { $ifNull: [{ $arrayElemAt: ['$subscription.plan', 0] }, 'free'] }
      }
    });

    // Sort
    pipeline.push({ $sort: { created_at: -1 } });

    const admins = await User.aggregate(pipeline);

    res.json({ success: true, admins });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Update Admin Status
exports.updateAdminStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {};

    // Get admin counts and total revenue
    const adminStats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          total_revenue: { $sum: '$total_revenue' }
        }
      }
    ]);

    const result = adminStats[0] || {};
    stats.totalAdmins = result.total || 0;
    stats.activeAdmins = result.active || 0;
    stats.suspendedAdmins = result.suspended || 0;
    stats.totalRevenue = result.total_revenue || 0;

    // Get monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueStats = await Receipt.aggregate([
      {
        $match: {
          generated_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          monthly_revenue: { $sum: '$amount' }
        }
      }
    ]);

    stats.monthlyRevenue = revenueStats[0]?.monthly_revenue || 0;

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
