const mongoose = require('mongoose');
const { india_solarshop_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  country_id:          { type: mongoose.Schema.Types.ObjectId, default: null },
  state_id:            { type: mongoose.Schema.Types.ObjectId, default: null },
  state_name:          { type: String, required: true, trim: true }, // e.g. "Gujarat"
  district_id:         { type: mongoose.Schema.Types.ObjectId, default: null },
  district_name:       { type: String, required: true, trim: true }, // e.g. "Devbhumi Dwarka"
  pincode:             { type: String, required: true, trim: true, index: true }, // e.g. "361320"
  combo_kit_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'pc_combo_kits', default: null }, // null means all kits / default for pincode
  combo_kit_name:      { type: String, default: null }, // snapshot of kit name
  delivery_cost:       { type: Number, required: true, min: 0 }, // e.g. 1500
  estimated_days_min:  { type: Number, default: 3 },
  estimated_days_max:  { type: Number, default: 7 },
  is_active:           { type: Boolean, default: true },
  notes:               { type: String, default: null },
  created_at:          { type: Date, default: Date.now },
  updated_at:          { type: Date, default: Date.now }
}, {
  collection: 'pincode_delivery_costs',
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

schema.virtual('id').get(function () { return this._id; });

// Compound unique index on pincode + combo_kit_id
schema.index({ pincode: 1, combo_kit_id: 1 }, { unique: true });

module.exports = db.model('pincode_delivery_costs', schema);
