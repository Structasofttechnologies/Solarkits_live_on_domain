const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * reseller_wallet_ledgers — Double-entry audit ledger for Reseller wallet movements.
 * Enforces financial idempotency via unique idempotency_key index.
 * Collection: reseller_wallet_ledgers
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
  },
  transaction_type: {
    type: String,
    enum: [
      'commission_credit', // Earned commission credited to available balance
      'payout_debit',       // Funds debited upon successful payout payout
      'payout_hold',        // Funds moved to pending upon payout request
      'payout_reversal',    // Funds returned to available upon rejected payout
      'bonus',              // Incentive bonus
      'adjustment',         // Admin ledger adjustment
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Positive for credit/bonus, negative for debits/holds
  },
  balance_type: {
    type: String,
    enum: ['available', 'pending'],
    default: 'available',
  },
  balance_after: {
    type: Number,
    required: true,
  },
  reference_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchase_orders',
    default: null,
  },
  reference_payout_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reseller_payout_requests',
    default: null,
  },
  idempotency_key: {
    type: String,
    required: true,
    unique: true,
  },
  narration: {
    type: String,
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  collection: 'reseller_wallet_ledgers',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, created_at: -1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('reseller_wallet_ledgers', schema);
