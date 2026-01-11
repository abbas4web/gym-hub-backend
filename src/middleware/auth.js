const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;

    // Fetch full user to get role and owner_id
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    req.user = user; // Attach full user object

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
       return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Requires one of the following roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

const verifySuperAdminToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
    
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Super admin only.' });
    }
    
    req.superAdminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
};

module.exports = { auth, authorize, verifySuperAdminToken };
