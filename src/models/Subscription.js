const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const subscriptionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  user_id: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    default: 'free'
  },
  billing_cycle: {
    type: String,
    default: 'monthly'
  },
  start_date: {
    type: String,
    required: true
  },
  end_date: {
    type: String
  },
  is_active: {
    type: Number,
    default: 1
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
