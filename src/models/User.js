const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile_image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'suspended', 'inactive']
  },
  total_revenue: {
    type: Number,
    default: 0
  },
  gym_name: {
    type: String,
    default: null
  },
  gym_address: {
    type: String,
    default: null
  },
  gym_type: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    default: 'unisex'
  },
  gym_logo: {
    type: String,
    default: null
  },
  membership_plans: [{
    name: String,
    duration: Number,
    fee: Number
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true
  }
});

module.exports = mongoose.model('User', userSchema);
