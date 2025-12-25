const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Super Admin Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  db.get(
    'SELECT * FROM super_admins WHERE email = ?',
    [email],
    async (err, superAdmin) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!superAdmin) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, superAdmin.password);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: superAdmin.id, email: superAdmin.email, role: 'super_admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        superAdmin: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
        },
      });
    }
  );
};

// Get Current Super Admin
exports.getMe = (req, res) => {
  db.get(
    'SELECT id, email, name, created_at FROM super_admins WHERE id = ?',
    [req.superAdminId],
    (err, superAdmin) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!superAdmin) {
        return res.status(404).json({ success: false, error: 'Super admin not found' });
      }

      res.json({ success: true, superAdmin });
    }
  );
};

// Get All Admins
exports.getAllAdmins = (req, res) => {
  const { search, status } = req.query;
  let query = `
    SELECT 
      u.id, u.name, u.email, u.gym_name, u.subscription_plan, u.status,
      u.created_at, u.total_revenue,
      COUNT(DISTINCT c.id) as client_count
    FROM users u
    LEFT JOIN clients c ON u.id = c.user_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.gym_name LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (status && status !== 'all') {
    query += ' AND u.status = ?';
    params.push(status);
  }

  query += ' GROUP BY u.id ORDER BY u.created_at DESC';

  db.all(query, params, (err, admins) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    res.json({ success: true, admins });
  });
};

// Update Admin Status
exports.updateAdminStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  db.run(
    'UPDATE users SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }

      res.json({ success: true, message: 'Status updated successfully' });
    }
  );
};

// Get Dashboard Stats
exports.getDashboardStats = (req, res) => {
  const stats = {};

  // Get admin counts
  db.get(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
      SUM(COALESCE(total_revenue, 0)) as total_revenue
    FROM users`,
    (err, adminStats) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      stats.totalAdmins = adminStats.total || 0;
      stats.activeAdmins = adminStats.active || 0;
      stats.suspendedAdmins = adminStats.suspended || 0;
      stats.totalRevenue = adminStats.total_revenue || 0;

      // Get monthly revenue (last 30 days)
      db.get(
        `SELECT SUM(amount) as monthly_revenue 
         FROM receipts 
         WHERE generated_at >= datetime('now', '-30 days')`,
        (err, revenueStats) => {
          if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
          }

          stats.monthlyRevenue = revenueStats?.monthly_revenue || 0;

          res.json({ success: true, stats });
        }
      );
    }
  );
};
