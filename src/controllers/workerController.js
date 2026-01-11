const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create a new worker account
exports.addWorker = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // 2. Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 8);

    // 4. Create Worker User
    const worker = new User({
      _id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: 'worker',
      owner_id: req.user._id, // Link to the Owner creating this worker
      gym_name: req.user.gym_name, // Inherit Gym Name
      gym_address: req.user.gym_address, // Inherit Address
      gym_logo: req.user.gym_logo // Inherit Logo
    });

    await worker.save();

    res.status(201).json({
      success: true,
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        role: worker.role
      }
    });

  } catch (error) {
    console.error('Add worker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get all workers for the logged-in owner
exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ 
      owner_id: req.user._id,
      role: 'worker' 
    }).select('-password');

    res.json({ success: true, workers });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Delete a worker
exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await User.findOne({ _id: id, owner_id: req.user._id });
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
