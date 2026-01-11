const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const clientSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  user_id: {
    type: String,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  adhar_photo: {
    type: String,
    default: null
  },
  membership_type: {
    type: String,
    required: true
  },
  start_date: {
    type: String, // Keeping as String to match SQLite ISO string format, or Date? SQLite was TEXT. Let's use Date for Mongo power, but controllers send strings.
    required: true
  },
  end_date: {
    type: String,
    required: true
  },
  fee: {
    type: Number,
    required: true
  },
  is_active: {
    type: Number, // 0: Pending, 1: Active
    default: 0
  },
  terms_accepted: {
    type: Boolean,
    default: false
  },
  terms_accepted_at: {
    type: Date,
    default: null
  },
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
  }
});

module.exports = mongoose.model('Client', clientSchema);
