const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * audit_logs — Central audit log collection for all sensitive reseller & financial actions.
 *
 * Collection: audit_logs
 */
const schema = new mongoose.Schema({
  actor_type: {
    type: String,
    enum: ['cms_user', 'reseller', 'epc_buyer', 'system'],
    required: true,
  },
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100, // e.g. 'RESELLER_REGISTER', 'KYC_VERIFY', 'KYC_REJECT', 'PLAN_ACTIVATE'
  },
  entity_type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100, // e.g. 'resellers', 'reseller_kyc', 'reseller_plans'
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  before_snapshot: { type: Object, default: null },
  after_snapshot:  { type: Object, default: null },
  ip_address:      { type: String, default: null, trim: true },
  user_agent:      { type: String, default: null, trim: true },
}, {
  collection: 'audit_logs',
  timestamps: { createdAt: 'created_at', updatedAt: false }, // Immutable append-only
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ entity_type: 1, entity_id: 1, created_at: -1 });
schema.index({ actor_type: 1, actor_id: 1, created_at: -1 });
schema.index({ action: 1, created_at: -1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('audit_logs', schema);
