const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, gymName, gymAddress, gymType, gymLogo, membershipPlans } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    const user = await User.create({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      gym_name: gymName,
      gym_address: gymAddress,
      gym_type: gymType || 'unisex',
      gym_logo: gymLogo,
      membership_plans: membershipPlans
    });

    console.log('User created successfully:', userId);

    // Create default subscription
    const subscriptionId = uuidv4();
    await Subscription.create({
      _id: subscriptionId,
      user_id: userId,
      plan: 'free',
      start_date: new Date().toISOString()
    });
    
    console.log('Subscription created successfully:', subscriptionId);

    // Generate JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '30d'
    });

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: userId, 
        name, 
        email, 
        profile_image: null,
        gym_name: gymName,
        gym_address: gymAddress,
        gym_type: gymType || 'unisex',
        gym_logo: gymLogo,
        membership_plans: membershipPlans
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended. Please contact support.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        profile_image: user.profile_image,
        role: user.role,
        owner_id: user.owner_id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;
    const userId = req.userId;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Update user profile
    const updates = { name, email };
    if (profileImage) {
      updates.profile_image = profileImage;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
