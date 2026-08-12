/**
 * solarshop_settings.schema.js
 *
 * Platform-wide configuration document for India Solarshop operations.
 * Only ONE document should exist in this collection.
 *
 * Phase R1 additions:
 *   - Territory exclusivity policy
 *   - Settlement trigger and return window
 *   - Platform commission defaults
 *   - EPC GST re-verification policy
 *   - Reseller activation readiness flags
 *
 * To read settings, always call SolarshopSettings.findOne().lean() and
 * provide sensible defaults if the document doesn't exist yet.
 *
 * Collection: solarshop_settings
 */

const mongoose = require('mongoose');
const { india_solarshop_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  // ── Existing checkout settings ─────────────────────────────────────────────
  enable_checkout_timer:      { type: Boolean, default: true },
  checkout_timer_duration:    { type: Number, default: 20 },    // minutes
  combokit_bulk_panels_limit: { type: Number, default: 30 },
  gst_rate:                   { type: Number, default: 13.8 },

  // ── Phase R1: Territory Exclusivity Policy ──────────────────────────────────
  /**
   * territory_exclusivity_mode:
   *   'strict'        — Only one active primary reseller per district (default).
   *   'multi_reseller'— Multiple resellers allowed per district; no uniqueness enforced.
   *   'category'      — Exclusivity scoped per product category (application-layer check).
   *   'product'       — Exclusivity scoped per individual product.
   *   'industry'      — Exclusivity scoped per industry type.
   *
   * Backend services must read this setting before performing district assignments.
   * Changing this at runtime does NOT retroactively revoke existing assignments.
   */
  territory_exclusivity_mode: {
    type: String,
    enum: ['strict', 'multi_reseller', 'category', 'product', 'industry'],
    default: 'strict',
  },

  // ── Phase R1: Settlement Engine Defaults ────────────────────────────────────
  /**
   * settlement_trigger:
   *   'delivery_plus_window' — Settlement eligible after delivery + return_window_days (recommended).
   *   'manual'              — Admin manually triggers settlement eligibility.
   *   'payment_confirmation'— Settlement triggered immediately on payment capture (NOT recommended).
   *
   * WARNING: 'payment_confirmation' creates reversal risk for returns/chargebacks.
   * Only enable after explicit business and accounting approval.
   */
  settlement_trigger: {
    type: String,
    enum: ['delivery_plus_window', 'manual', 'payment_confirmation'],
    default: 'delivery_plus_window',
  },

  /**
   * settlement_return_window_days:
   * Number of days after delivery before a settlement becomes eligible.
   * Default: 7 days.
   */
  settlement_return_window_days: { type: Number, default: 7, min: 0 },

  /**
   * platform_commission_pct:
   * Default platform commission percentage deducted from each reseller-channel sale.
   * Can be overridden per reseller or per product via reseller_pricing_rules.
   * Stored as a percentage (e.g. 5 = 5%). Precision limited to 4 decimal places.
   * Default: 0 (no commission) until explicitly configured.
   */
  platform_commission_pct: { type: Number, default: 0, min: 0, max: 100 },

  /**
   * pgw_charge_pct:
   * Default payment gateway charge percentage passed through from Razorpay.
   * Default: 2%.
   */
  pgw_charge_pct: { type: Number, default: 2, min: 0, max: 10 },

  // ── Phase R1: EPC GST Re-Verification Policy ───────────────────────────────
  /**
   * epc_gst_reverify_policy:
   *   'onboarding_only' — GST verified once during EPC onboarding; no re-checks (default).
   *   'periodic'        — Re-verify every epc_gst_reverify_days days automatically.
   *   'per_order'       — Re-verify GST status before every order placement.
   *
   * Affects Phase R8 order pre-validation logic.
   */
  epc_gst_reverify_policy: {
    type: String,
    enum: ['onboarding_only', 'periodic', 'per_order'],
    default: 'onboarding_only',
  },

  /**
   * epc_gst_reverify_days:
   * Applicable when epc_gst_reverify_policy === 'periodic'.
   * Number of days between automatic re-verifications.
   * Default: 90 days.
   */
  epc_gst_reverify_days: { type: Number, default: 90, min: 1 },

  // ── Phase R1: Reseller Activation Requirements ─────────────────────────────
  /**
   * Configurable boolean flags that control which checks the activation-readiness
   * service enforces before marking a reseller as 'active'.
   * All default to true (most restrictive). Admin can relax individual requirements.
   */
  activation_require_gst_verified:        { type: Boolean, default: true },
  activation_require_kyc_approved:        { type: Boolean, default: true },
  activation_require_signed_agreement:    { type: Boolean, default: false }, // Off until agreement flow is built (Phase R2)
  activation_require_active_plan:         { type: Boolean, default: false }, // Off until plan requirement is confirmed (Blocking Q4)
  activation_require_territory_assigned:  { type: Boolean, default: true },
  activation_require_product_auth:        { type: Boolean, default: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  collection: 'solarshop_settings',
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.virtual('id').get(function () { return this._id; });

module.exports = db.model('solarshop_settings', schema);
