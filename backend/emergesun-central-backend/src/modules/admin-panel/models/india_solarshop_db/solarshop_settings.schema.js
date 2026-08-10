const mongoose = require('mongoose');
const { india_solarshop_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  enable_checkout_timer:      { type: Boolean, default: true },
  checkout_timer_duration:    { type: Number, default: 20 }, // in minutes
  combokit_bulk_panels_limit: { type: Number, default: 30 },
  gst_rate:                   { type: Number, default: 13.8 },
  created_at:                 { type: Date, default: Date.now },
  updated_at:                 { type: Date, default: Date.now }
}, { collection: 'solarshop_settings', timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.virtual('id').get(function () { return this._id; });

module.exports = db.model('solarshop_settings', schema);
