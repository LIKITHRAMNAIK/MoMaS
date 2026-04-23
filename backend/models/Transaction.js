const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema({
  old_due_date: {
    type: Date,
    required: false
  },
  new_due_date: {
    type: Date,
    required: true
  },
  extra_interest: {
    type: Number,
    required: true
  },
  interest_paid: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const transactionSchema = new mongoose.Schema({
  person_name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },

  principal_amount: {
    type: Number,
    required: true
  },

  base_interest: {
    type: Number,
    required: true
  },

  start_date: {
    type: Date,
    required: true
  },

  due_date: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'extended'],
    default: 'pending'
  },

  extensions: [extensionSchema],

  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);