const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * franchise_leads — Inbound Franchisee & Territory Application Leads.
 * Collection: franchise_leads
 */
const schema = new mongoose.Schema({
  // ── Personal & Company Identity ─────────────────────────────────────
  full_name:          { type: String, required: true, trim: true, maxlength: 150 },
  business_name:      { type: String, required: true, trim: true, maxlength: 200 },
  mobile_number:      { type: String, required: true, trim: true, maxlength: 15 },
  whatsapp_number:    { type: String, default: null, trim: true, maxlength: 15 },
  email:              { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  gstin:              { type: String, default: null, trim: true, uppercase: true, maxlength: 20 },

  // ── Geographic Territory Requested ─────────────────────────────────
  state:              { type: String, required: true, trim: true },
  district:           { type: String, required: true, trim: true },
  pincode:            { type: String, default: null, trim: true, maxlength: 10 },

  // ── Commercial & Profile Scope ─────────────────────────────────────
  business_profile: {
    type: String,
    default: 'Solar EPC Contractor',
    trim: true,
  },
  expected_order_volume: {
    type: String,
    default: '1 - 3 Kits / Month (Starter)',
    trim: true,
  },
  selected_solution:  { type: String, default: 'Header Fast Application', trim: true },
  plan_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'reseller_plans', default: null },

  // ── Applicant Requirements & Terms ──────────────────────────────────
  notes:              { type: String, default: null, trim: true, maxlength: 1000 },
  consent_agreed:     { type: Boolean, required: true, default: true },

  // ── CRM Pipeline & Admin Review Status ──────────────────────────────
  status: {
    type: String,
    default: 'NEW',
    index: true,
  },
  admin_remarks:      { type: String, default: null, trim: true, maxlength: 1000 },
  reviewed_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
  reviewed_at:        { type: Date, default: null },
  converted_reseller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'resellers', default: null },

  // ── Metadata ────────────────────────────────────────────────────────
  source:             { type: String, default: 'storefront_modal' },
  ip_address:         { type: String, default: null },
  deleted_at:         { type: Date, default: null },
}, {
  collection: 'franchise_leads',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ status: 1, created_at: -1 });
schema.index({ mobile_number: 1, email: 1 });
schema.index({ state: 1, district: 1 });

schema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = india_solarshop_db.model('franchise_leads', schema);
