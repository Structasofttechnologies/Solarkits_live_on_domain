const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * resellers — Primary entity for Reseller accounts in the Solarkits system.
 *
 * Stores business identity, GST/PAN/Aadhaar (masked/encrypted), territory address,
 * KYC status, plan subscription, agreement status, and activation status.
 *
 * Collection: resellers
 */
const schema = new mongoose.Schema({
  business_name:   { type: String, required: true, trim: true, maxlength: 250 },
  gst_number:      { type: String, default: null, trim: true, uppercase: true, maxlength: 20 },
  pan_number:      { type: String, default: null, trim: true, uppercase: true, maxlength: 10 },
  aadhaar_masked:  { type: String, default: null, trim: true, maxlength: 14 }, // e.g. "XXXX-XXXX-1234"
  mobile:          { type: String, required: true, trim: true, maxlength: 15 },
  email:           { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  password_hash:   { type: String, required: true },

  address: {
    line:        { type: String, default: null, trim: true, maxlength: 500 },
    country_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_0', default: null },
    state_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1', default: null },
    district_id: { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_2', default: null },
    city:        { type: String, default: null, trim: true, maxlength: 100 },
    pincode:     { type: String, default: null, trim: true, maxlength: 10 },
  },

  commercial_mode: {
    type: String,
    enum: ['commission', 'dealer'],
    required: true,
    default: 'commission',
  },
  reseller_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reseller_types',
    required: true,
  },
  plan_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'reseller_plan_subscriptions',
    default: null,
  },

  kyc_status: {
    type: String,
    enum: ['draft', 'submitted', 'pending', 'verified', 'rejected', 'resubmission_required'],
    default: 'draft',
  },
  agreement_status: {
    type: String,
    enum: ['pending', 'generated', 'signed', 'expired', 'revoked'],
    default: 'pending',
  },
  activation_status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'terminated'],
    default: 'pending',
  },

  is_email_verified:    { type: Boolean, default: false },
  is_mobile_verified:   { type: Boolean, default: false },
  is_active:            { type: Boolean, default: true },
  token_version:        { type: Number, default: 1 },
  deleted_at:           { type: Date, default: null },
  created_by:           { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
  updated_by:           { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
}, {
  collection: 'resellers',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ mobile: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });
schema.index({ gst_number: 1 }, { sparse: true });
schema.index({ activation_status: 1, kyc_status: 1 });
schema.index({ reseller_type_id: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('resellers', schema);
