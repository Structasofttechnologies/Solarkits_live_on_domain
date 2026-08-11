const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * reseller_plan_subscriptions — Tracked plan subscriptions per Reseller.
 *
 * Collection: reseller_plan_subscriptions
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reseller_plans',
    required: true,
  },
  start_date:        { type: Date, required: true, default: Date.now },
  expiry_date:       { type: Date, required: true },
  grace_expiry_date: { type: Date, default: null },

  amount_paid:       { type: Number, required: true, min: 0 },
  currency:          { type: String, default: 'INR', uppercase: true },
  payment_reference: { type: String, default: null, trim: true },

  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'grace'],
    default: 'active',
  },
  renewed_from_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reseller_plan_subscriptions',
    default: null,
  },
}, {
  collection: 'reseller_plan_subscriptions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, status: 1 });
schema.index({ expiry_date: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('reseller_plan_subscriptions', schema);
