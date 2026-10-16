const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * store_status_history — Immutable audit trail of every store onboarding status change.
 *
 * Records who changed the status, from what, to what, with a reason and any
 * uploaded document references. Used for compliance, dispute resolution, and
 * the Audit History view in the Admin Panel.
 *
 * Collection: store_status_history
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
  },
  from_status: {
    type: String,
    required: true,
    trim: true,
  },
  to_status: {
    type: String,
    required: true,
    trim: true,
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cms_users',
    default: null,
  },
  // 'admin' | 'accounts' | 'system' | 'franchisee'
  changed_by_role: {
    type: String,
    enum: ['admin', 'accounts', 'system', 'franchisee'],
    default: 'admin',
  },
  reason: {
    type: String,
    default: null,
    trim: true,
    maxlength: 2000,
  },
  // Array of uploaded document URLs attached to this status change
  documents: [{ type: String, trim: true }],
}, {
  collection: 'store_status_history',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, created_at: -1 });
schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('store_status_history', schema);
