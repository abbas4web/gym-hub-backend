const mongoose = require('mongoose');
// Receipts often had custom IDs in the controller: `RCP-${timestamp}-${random}`.
// I should allow manual _id override.

const receiptSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true // Controller generates this manually
  },
  client_id: {
    type: String,
    ref: 'Client',
    required: true
  },
  user_id: {
    type: String,
    ref: 'User',
    required: true
  },
  client_name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  membership_type: {
    type: String,
    required: true
  },
  start_date: {
    type: String,
    required: true
  },
  end_date: {
    type: String,
    required: true
  },
  receipt_url: {
    type: String, // URL of the generated receipt PDF
    default: null
  },
  generated_at: {
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

module.exports = mongoose.model('Receipt', receiptSchema);
