const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * reseller_payout_requests — Payout withdrawal request pipeline for Resellers.
 * Collection: reseller_payout_requests
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  bank_details_snapshot: {
    bank_name:            { type: String, required: true },
    account_number:       { type: String, required: true },
    ifsc_code:            { type: String, required: true },
    account_holder_name:  { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'paid', 'rejected'],
    default: 'pending',
  },
  transaction_reference: {
    type: String,
    default: null,
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cms_users',
    default: null,
  },
  rejection_reason: {
    type: String,
    default: null,
  },
  payout_date: {
    type: Date,
    default: null,
  },
}, {
  collection: 'reseller_payout_requests',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, status: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('reseller_payout_requests', schema);
