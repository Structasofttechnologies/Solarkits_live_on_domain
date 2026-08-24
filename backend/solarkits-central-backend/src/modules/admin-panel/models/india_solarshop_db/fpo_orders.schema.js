const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * fpo_orders — Full-featured Franchisee Purchase Orders.
 *
 * Replaces the legacy reseller_procurement_orders schema for new PO flows.
 * Legacy collection is untouched for backward compatibility.
 *
 * Status transition map (enforced in franchisee.po.service.js):
 *   DRAFT → SUBMITTED → PENDING_APPROVAL → CHANGES_REQUESTED → APPROVED
 *         → AWAITING_PAYMENT → PARTIALLY_PAID → PAID
 *         → STOCK_ALLOCATED → PROCESSING → PARTIALLY_DISPATCHED → DISPATCHED
 *         → PARTIALLY_DELIVERED → DELIVERED → COMPLETED
 *   (any active status) → CANCELLED
 *   DRAFT → EXPIRED (via TTL job after po_validity_days)
 *
 * All monetary values in integer Paise (1 INR = 100 Paise).
 *
 * Collection: fpo_orders
 */

const VALID_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_APPROVAL',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'AWAITING_PAYMENT',
  'PARTIALLY_PAID',
  'PAID',
  'STOCK_ALLOCATED',
  'PROCESSING',
  'PARTIALLY_DISPATCHED',
  'DISPATCHED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status:     { type: String, enum: VALID_STATUSES, required: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, default: null },
    actor_type: { type: String, enum: ['cms_user', 'reseller', 'system'], default: 'system' },
    note:       { type: String, default: null, maxlength: 1000 },
    changed_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const moqSnapshotSchema = new mongoose.Schema(
  {
    moq:                { type: Number, default: null },
    increment_quantity: { type: Number, default: null },
    max_quantity:       { type: Number, default: null },
    rule_id:            { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: false }
);

const poItemSchema = new mongoose.Schema(
  {
    project_type_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'sys_filter_types', default: null },
    project_type_name: { type: String, default: null },
    kit_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'pc_combo_kits', default: null },
    product_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'products', default: null },
    item_name:         { type: String, required: true },
    item_code:         { type: String, default: null },

    // Ordered quantity
    quantity: { type: Number, required: true, min: 1 },

    // Snapshots at time of PO creation (immutable after submission)
    moq_snapshot:        { type: moqSnapshotSchema, default: null },
    unit_price_paise:    { type: Number, required: true, min: 0 },
    gst_rate:            { type: Number, default: 0 },
    tax_paise:           { type: Number, required: true, min: 0 },
    total_price_paise:   { type: Number, required: true, min: 0 },

    // Commission snapshot (captured at submission)
    commission_method:   { type: String, enum: ['PERCENTAGE', 'FIXED_PER_KIT'], default: null },
    commission_snapshot: { type: Number, default: 0 }, // paise per kit OR percentage * 100

    // Contribution flags
    contributes_to_target: { type: Boolean, default: true },

    // Post-delivery adjustments
    returned_quantity:   { type: Number, default: 0, min: 0 },
    cancelled_quantity:  { type: Number, default: 0, min: 0 },
    delivered_quantity:  { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    po_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    idempotency_key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    franchisee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'resellers',
      required: true,
    },

    // ── Plan Snapshot (immutable after submission) ─────────────────────────────
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'reseller_plans',
      required: true,
    },
    plan_snapshot: { type: Object, default: null }, // Full plan object at creation time
    po_settings_snapshot: { type: Object, default: null }, // PO settings at creation time

    // ── Territory ─────────────────────────────────────────────────────────────
    territory_snapshot: { type: Object, default: null },
    state_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1', default: null },
    district_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_2', default: null },

    // ── Classification ────────────────────────────────────────────────────────
    industry_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'sys_industry_types', default: null },

    // ── Line Items ────────────────────────────────────────────────────────────
    items: [poItemSchema],

    // ── Financials (integer Paise) ─────────────────────────────────────────────
    subtotal_paise:     { type: Number, required: true, min: 0 },
    tax_total_paise:    { type: Number, required: true, min: 0 },
    shipping_fee_paise: { type: Number, default: 0, min: 0 },
    discount_paise:     { type: Number, default: 0, min: 0 },
    grand_total_paise:  { type: Number, required: true, min: 0 },

    // ── Payment ───────────────────────────────────────────────────────────────
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
    advance_percentage:  { type: Number, default: 0 },
    advance_paid_paise:  { type: Number, default: 0, min: 0 },
    payment_reference:   { type: String, default: null },
    razorpay_order_id:   { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },

    // ── Status & History ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'DRAFT',
    },
    status_history: [statusHistorySchema],

    // ── Approval ─────────────────────────────────────────────────────────────
    requires_approval: { type: Boolean, default: true },
    approved_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
    approved_at:       { type: Date, default: null },
    rejected_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', default: null },
    rejected_at:       { type: Date, default: null },
    approval_notes:    { type: String, default: null, maxlength: 2000 },

    // ── Dispatch & Delivery ────────────────────────────────────────────────────
    dispatch_date:   { type: Date, default: null },
    delivery_date:   { type: Date, default: null },
    expected_delivery_date: { type: Date, default: null },

    // ── Expiry ────────────────────────────────────────────────────────────────
    expires_at: { type: Date, default: null },

    // ── Commission ────────────────────────────────────────────────────────────
    commission_rule_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'franchisee_commission_rules', default: null },
    commission_rule_snapshot: { type: Object, default: null },
    commission_posted:        { type: Boolean, default: false },
    commission_ledger_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'fpo_commission_ledgers', default: null },
    total_commission_paise:   { type: Number, default: 0 },

    // ── Goal ─────────────────────────────────────────────────────────────────
    goal_counted:       { type: Boolean, default: false },
    goal_counted_qty:   { type: Number, default: 0 },

    // ── Cancellation / Return ─────────────────────────────────────────────────
    cancellation_reason: { type: String, default: null, maxlength: 2000 },
    amendment_reason:    { type: String, default: null, maxlength: 2000 },
    cancelled_by:        { type: mongoose.Schema.Types.ObjectId, default: null },
    cancelled_at:        { type: Date, default: null },

    // ── Audit ─────────────────────────────────────────────────────────────────
    created_by: { type: mongoose.Schema.Types.ObjectId, default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, default: null },
    deleted_at: { type: Date, default: null },
  },
  {
    collection: 'fpo_orders',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

schema.index({ franchisee_id: 1, status: 1, created_at: -1 });
schema.index({ plan_id: 1, status: 1 });
schema.index({ state_id: 1, status: 1 });
schema.index({ district_id: 1, status: 1 });
schema.index({ expires_at: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'DRAFT' } });
schema.index({ created_at: -1 });

schema.virtual('id').get(function () { return this._id; });
schema.virtual('VALID_STATUSES').get(() => VALID_STATUSES);

module.exports = india_solarshop_db.model('fpo_orders', schema);
module.exports.VALID_STATUSES = VALID_STATUSES;
