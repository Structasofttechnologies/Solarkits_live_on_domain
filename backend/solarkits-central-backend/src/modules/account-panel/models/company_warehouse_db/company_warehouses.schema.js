const mongoose = require('mongoose');
const { company_warehouse_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  warehouse_code:  { type: String, required: true, trim: true, unique: true },
  images:          { type: String, default: null },
  address:         { type: String, default: null },
  pincode:         { type: String, default: null },
  lat:             { type: Number, default: null },
  lng:             { type: Number, default: null },
  status:          { type: Number, default: 1 },
  warehouse_type:  { type: String, enum: ['master', 'sub'], required: true },
  level_0:         { type: mongoose.Schema.Types.ObjectId, default: null }, // Country ID
  level_1:         { type: mongoose.Schema.Types.ObjectId, default: null }, // State ID
  level_2:         { type: mongoose.Schema.Types.ObjectId, default: null }, // District ID
  is_active:       { type: Boolean, default: false },
  deleted_at:      { type: Date, default: null },
}, { collection: 'company_warehouses', timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.virtual('id').get(function () { return this._id; });

module.exports = db.model('company_warehouses', schema);
