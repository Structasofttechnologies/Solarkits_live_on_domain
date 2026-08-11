const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * reseller_wallets — Primary Wallet balance tracking per Reseller.
 * Collection: reseller_wallets
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
    unique: true,
  },
  available_balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  pending_balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  total_earned: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  total_withdrawn: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['active', 'frozen'],
    default: 'active',
  },
}, {
  collection: 'reseller_wallets',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('reseller_wallets', schema);
