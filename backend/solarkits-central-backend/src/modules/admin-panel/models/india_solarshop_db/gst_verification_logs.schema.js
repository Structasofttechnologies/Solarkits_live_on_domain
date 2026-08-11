const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * gst_verification_logs — Audit log for all GSTIN verification requests.
 *
 * Collection: gst_verification_logs
 */
const schema = new mongoose.Schema({
  entity_type: {
    type: String,
    enum: ['reseller', 'epc_buyer'],
    required: true,
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  gstin: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
  },
  provider: {
    type: String,
    enum: ['mock', 'sandbox', 'production'],
    default: 'mock',
  },
  request_payload:   { type: Object, default: {} },
  response_snapshot: { type: Object, default: {} },

  legal_name:        { type: String, default: null },
  trade_name:        { type: String, default: null },
  business_status:   { type: String, default: null },
  registration_state:{ type: String, default: null },
  derived_state_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1', default: null },

  is_valid:          { type: Boolean, required: true },
  error_message:     { type: String, default: null },

  verified_by:       { type: String, default: 'system' }, // 'system' or cms_user id
  verified_at:       { type: Date, default: Date.now },
}, {
  collection: 'gst_verification_logs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ gstin: 1 });
schema.index({ entity_type: 1, entity_id: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('gst_verification_logs', schema);
