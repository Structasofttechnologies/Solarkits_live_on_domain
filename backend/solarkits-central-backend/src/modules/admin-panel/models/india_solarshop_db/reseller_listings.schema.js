const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * reseller_listings — Reseller's active product and kit storefront listings.
 *
 * All price fields stored in integer Paise (1 INR = 100 Paise).
 * Enforces MAP (Minimum Advertised Price) compliance.
 *
 * Collection: reseller_listings
 */
const schema = new mongoose.Schema({
  reseller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resellers',
    required: true,
  },
  item_type: {
    type: String,
    enum: ['product', 'kit'],
    required: true,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    default: null,
  },
  kit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'warehouse_combo_kits',
    default: null,
  },

  // ── Integer Paise Financial Fields ──────────────────────────────────────
  cost_price_paise: {
    type: Number,
    required: true,
    min: 0,
  },
  map_price_paise: {
    type: Number,
    required: true,
    min: 0,
  },
  max_price_paise: {
    type: Number,
    default: null,
  },
  selling_price_paise: {
    type: Number,
    required: true,
    min: 0,
  },
  platform_commission_pct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  is_map_compliant: {
    type: Boolean,
    required: true,
    default: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'delisted'],
    default: 'active',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  collection: 'reseller_listings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ reseller_id: 1, status: 1 });
schema.index({ reseller_id: 1, item_type: 1, product_id: 1, kit_id: 1 }, { unique: true });
schema.index({ is_map_compliant: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = india_solarshop_db.model('reseller_listings', schema);
