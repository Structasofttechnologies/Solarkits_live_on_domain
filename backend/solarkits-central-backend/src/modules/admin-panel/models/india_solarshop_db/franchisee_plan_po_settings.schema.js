const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * franchisee_plan_po_settings — PO Ordering configuration linked to a Reseller Plan.
 *
 * Governs whether PO ordering is enabled for a plan, quantity limits, payment terms,
 * allowed project/product types, territory levels, approval requirements, and
 * whether the PO quantity counts toward the monthly kit target.
 *
 * Collection: franchisee_plan_po_settings
 */
const cancellationRulesSchema = new mongoose.Schema(
  {
    allow_before_approval:   { type: Boolean, default: true },
    allow_before_payment:    { type: Boolean, default: true },
    allow_after_payment:     { type: Boolean, default: false },
    allow_after_dispatch:    { type: Boolean, default: false },
    allow_partial_cancel:    { type: Boolean, default: true },
    cancellation_window_hrs: { type: Number, default: 24 },
  },
  { _id: false }
);

const amendmentRulesSchema = new mongoose.Schema(
  {
    allow_before_approval: { type: Boolean, default: true },
    allow_before_payment:  { type: Boolean, default: false },
    max_amendments:        { type: Number, default: 3 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'reseller_plans',
      required: true,
    },

    // ── PO Enable / Disable ───────────────────────────────────────────────────
    po_enabled: { type: Boolean, default: true }, // Default TRUE — admin must explicitly disable

    // ── Quantity Limits ───────────────────────────────────────────────────────
    min_po_quantity: { type: Number, min: 0, default: 1 },
    max_po_quantity: { type: Number, min: 0, default: null }, // null = unlimited

    // ── Mixed Orders ─────────────────────────────────────────────────────────
    allow_mixed_project_types: { type: Boolean, default: true },
    max_line_items:            { type: Number, min: 1, default: 50 },

    // ── Eligibility Filters ───────────────────────────────────────────────────
    allowed_industry_type_ids:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'sys_industry_types' }],
    allowed_project_type_ids:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'sys_filter_types' }],
    allowed_category_ids:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'sys_filter_categories' }],
    allowed_subcategory_ids:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'sys_filter_subcategories' }],
    allowed_combo_kit_ids:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'pc_comobo_kit' }],
    allowed_product_ids:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'products' }],
    allowed_territory_levels:   [{ type: String, enum: ['district', 'state', 'country'] }],

    // ── Validity ──────────────────────────────────────────────────────────────
    po_validity_days: { type: Number, min: 1, default: 30 },

    // ── Approval ─────────────────────────────────────────────────────────────
    requires_approval: { type: Boolean, default: true },

    // ── Payment Terms ─────────────────────────────────────────────────────────
    payment_terms: {
      type: String,
      enum: [
        'FULL_ADVANCE',
        'PARTIAL_ADVANCE',
        'PAY_BEFORE_DISPATCH',
        'CREDIT_PERIOD',
        'MANUAL_OFFLINE_PAYMENT',
      ],
      default: 'FULL_ADVANCE',
    },
    advance_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // Required when payment_terms === 'PARTIAL_ADVANCE'
    },

    // ── Credit Terms ──────────────────────────────────────────────────────────
    credit_period_eligible: { type: Boolean, default: false },
    credit_period_days:     { type: Number, min: 0, default: 0 },

    // ── Rules ─────────────────────────────────────────────────────────────────
    cancellation_rules: { type: cancellationRulesSchema, default: () => ({}) },
    amendment_rules:    { type: amendmentRulesSchema, default: () => ({}) },

    // ── Target Contribution ───────────────────────────────────────────────────
    contributes_to_monthly_target: { type: Boolean, default: true },

    // ── Effective Period ──────────────────────────────────────────────────────
    effective_from:  { type: Date, required: true, default: Date.now }, // Bug fix: default prevents required-field errors
    effective_until: { type: Date, default: null },

    // ── Status & Audit ────────────────────────────────────────────────────────
    is_active:  { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
  },
  {
    collection: 'franchisee_plan_po_settings',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying by plan and status
schema.index({ plan_id: 1, effective_from: 1 });
schema.index({ plan_id: 1, is_active: 1 });
schema.index({ plan_id: 1, created_at: -1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('franchisee_plan_po_settings', schema);
