const mongoose = require('mongoose');
const { india_solarshop_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  account_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'epc_accounts', required: true },
  company_name:    { type: String, required: true },
  email:           { type: String, required: true },
  whatsapp:        { type: String, required: true },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  state_id:        { type: mongoose.Schema.Types.ObjectId, required: true }, // CROSS DB (geo_level_1)
  reference_image: { type: String, default: null },
  reviewed_by:     { type: mongoose.Schema.Types.ObjectId, default: null }, // user_id
  reviewed_at:     { type: Date, default: null },
  // --- Phase 5: Reseller Onboarding Pipeline (backward-compatible) ---
  onboarded_by_reseller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'resellers', default: null },
  onboarding_source:        { type: String, enum: ['direct', 'reseller'], default: 'direct' },
  // ------------------------------------------------------------------
  created_at:      { type: Date, default: Date.now },
}, { collection: 'epc_signup_requests', timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.virtual('id').get(function () { return this._id; });

module.exports = db.model('epc_signup_requests', schema);
