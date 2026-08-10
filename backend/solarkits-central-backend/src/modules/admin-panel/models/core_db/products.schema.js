const mongoose = require('mongoose');
const { solarkits_core_db: db } = require('../../config/databases');

// products — template_id, subtype_id, brand_id SAME DB → ObjectId
// Soft delete via deleted_at (was in MySQL too)
const s = new mongoose.Schema({

  name:              { type: String, required: true, trim: true, maxlength: 255 },
  description:       { type: String, default: null },
  features:          { type: [String], default: [] },
  image:             { type: String, default: null, maxlength: 500 },
  template_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'pc_product_templates', required: true },

  subtype_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'pc_product_subtypes', required: true },

  brand_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'brands', default: null },
  scope_ids:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'sys_filter_type_maps' }],

  sku_config: {
    template_len: { type: Number, default: 3 },
    brand_len:    { type: Number, default: 5 },
    product_len:  { type: Number, default: 4 },
    subtype_len:  { type: Number, default: 4 }
  },

  deleted_at:        { type: Date, default: null },
  created_at:        { type: Date, default: Date.now },
}, { collection: 'products', timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });
s.virtual('id').get(function () { return this._id; });
module.exports = db.model('products', s);
