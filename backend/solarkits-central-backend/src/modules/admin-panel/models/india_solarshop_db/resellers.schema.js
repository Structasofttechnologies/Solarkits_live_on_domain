const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * resellers — Primary entity for Reseller accounts in the Solarkits system.
 *
 * Stores business identity, GST/PAN/Aadhaar (masked/encrypted), territory address,
 * KYC status, plan subscription, agreement status, and activation status.
 *
 * Phase R2 additions:
 *   - reseller_lifecycle_status: Full end-to-end pipeline state (separate from kyc_status)
 *   - GST identity fields from Quick eKYC verification
 *   - contact_person for operations team communication
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

  // ── Existing KYC sub-process status (unchanged) ───────────────────────────
  kyc_status: {
    type: String,
    enum: ['draft', 'submitted', 'pending', 'verified', 'rejected', 'resubmission_required'],
    default: 'draft',
  },

  // ── Phase R2: Full Reseller Lifecycle Status ──────────────────────────────
  // Tracks the complete onboarding pipeline end-to-end, distinct from kyc_status
  // (which only reflects the KYC document review sub-process).
  //
  // Transition map:
  //   draft → gst_verification_pending → gst_verified → kyc_pending → kyc_submitted →
  //   kyc_under_review → kyc_verified (or kyc_rejected / kyc_resubmission_required) →
  //   agreement_pending → territory_pending → active → suspended / expired / terminated
  reseller_lifecycle_status: {
    type: String,
    enum: [
      'draft',
      'gst_verification_pending',
      'gst_verified',
      'kyc_pending',
      'kyc_submitted',
      'kyc_under_review',
      'kyc_rejected',
      'kyc_resubmission_required',
      'kyc_verified',
      'agreement_pending',
      'territory_pending',
      'active',
      'suspended',
      'expired',
      'terminated',
    ],
    default: 'draft',
  },

  // ── Phase R2: GST Identity (populated after Quick eKYC verification) ──────
  gst_legal_name:          { type: String, default: null, trim: true, maxlength: 300 },
  gst_trade_name:          { type: String, default: null, trim: true, maxlength: 300 },
  gst_registration_status: { type: String, default: null, trim: true, maxlength: 50 }, // e.g. 'ACTIVE', 'CANCELLED'
  gst_verified_at:         { type: Date,   default: null },
  gst_verification_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'gst_verification_logs', default: null },

  // ── Phase R2: Operations Contact ─────────────────────────────────────────
  contact_person: { type: String, default: null, trim: true, maxlength: 150 },

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

  is_email_verified:  { type: Boolean, default: false },
  is_mobile_verified: { type: Boolean, default: false },
  is_active:          { type: Boolean, default: true },
  token_version:      { type: Number, default: 1 },
  deleted_at:         { type: Date, default: null },
  created_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
  updated_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
}, {
  collection: 'resellers',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Existing indexes — untouched
schema.index({ mobile: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });
schema.index({ gst_number: 1 }, { sparse: true });
schema.index({ activation_status: 1, kyc_status: 1 });
schema.index({ reseller_type_id: 1 });

// Phase R2: Lifecycle status index for activation readiness queries
schema.index({ reseller_lifecycle_status: 1, activation_status: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('resellers', schema);
