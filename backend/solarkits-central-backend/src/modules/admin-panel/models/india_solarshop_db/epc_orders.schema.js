const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * Line item in EPC Buyer order.
 * Financial totals stored in integer Paise (1 INR = 100 Paise).
 */
const epcOrderItemSchema = new mongoose.Schema({
  scope_type:                { type: String, enum: ['product', 'kit'], required: true },
  product_id:                { type: mongoose.Schema.Types.ObjectId, ref: 'products', default: null },
  kit_id:                    { type: mongoose.Schema.Types.ObjectId, ref: 'warehouse_combo_kits', default: null },
  item_name:                 { type: String, required: true },
  quantity:                  { type: Number, required: true, min: 1 },
  unit_price_paise:          { type: Number, required: true, min: 0 },
  cost_price_paise:          { type: Number, required: true, min: 0 },
  reseller_margin_paise:     { type: Number, required: true, min: 0 },
  platform_commission_paise: { type: Number, required: true, min: 0 },
  gst_rate:                  { type: Number, default: 13.8 },
  tax_paise:                 { type: Number, required: true, min: 0 },
  total_price_paise:         { type: Number, required: true, min: 0 },
}, { _id: false });

/**
 * epc_orders — Orders placed by EPC Buyers, routed to territory resellers.
 *
 * Collection: epc_orders
 */
const schema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  epc_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'epc_accounts',
    required: true,
  },
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    default: null, // null if direct fallback
  },
  routing_source: {
    type: String,
    enum: ['primary_reseller', 'territory_match', 'direct_fallback'],
    default: 'territory_match',
  },
  items: [epcOrderItemSchema],

  // ── Integer Paise Totals ────────────────────────────────────────────────
  subtotal_paise:                 { type: Number, required: true, min: 0 },
  tax_total_paise:                { type: Number, required: true, min: 0 },
  shipping_fee_paise:             { type: Number, default: 0, min: 0 },
  grand_total_paise:              { type: Number, required: true, min: 0 },
  reseller_total_margin_paise:     { type: Number, default: 0, min: 0 },
  platform_total_commission_paise: { type: Number, default: 0, min: 0 },

  order_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'allocated', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending',
  },
  payment_status: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending',
  },
  payment_reference: {
    type: String,
    default: null,
    trim: true,
  },
  razorpay_order_id: {
    type: String,
    default: null,
    trim: true,
  },
  is_end_customer_sale: {
    type: Boolean,
    default: true,
  },
  delivery_address: {
    line:        { type: String, default: null },
    state_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1', default: null },
    district_id: { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_2', default: null },
    pincode:     { type: String, default: null },
  },

  reservation_expires_at: { type: Date, default: null },
  delivered_at:           { type: Date, default: null },
  cancelled_at:           { type: Date, default: null },
  cancellation_reason:    { type: String, default: null },
}, {
  collection: 'epc_orders',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, order_status: 1 });
schema.index({ epc_id: 1, created_at: -1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('epc_orders', schema);
