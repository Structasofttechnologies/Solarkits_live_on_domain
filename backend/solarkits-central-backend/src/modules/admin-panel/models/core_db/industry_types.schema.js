const mongoose = require('mongoose');
const { solarkits_core_db } = require('../../config/databases');

/**
 * industry_types — Master list of industry types for reseller/EPC configuration.
 * Examples: "Residential", "Commercial", "Industrial", "Agricultural", "Government"
 *
 * Collection: sys_industry_types
 */
const schema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 250 },
  slug:       { type: String, required: true, trim: true, lowercase: true, maxlength: 100, unique: true },
  description:{ type: String, default: null, trim: true, maxlength: 1000 },
  sort_order: { type: Number, default: 0 },
  is_active:  { type: Boolean, default: true },
  deleted_at: { type: Date, default: null },
}, {
  collection: 'sys_industry_types',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.index({ name: 1, deleted_at: 1 });
schema.index({ sort_order: 1, is_active: 1 });

schema.virtual('id').get(function () { return this._id; });

module.exports = solarkits_core_db.model('sys_industry_types', schema);
