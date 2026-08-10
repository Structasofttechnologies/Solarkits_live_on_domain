const mongoose = require('mongoose');
const { company_warehouse_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'company_warehouses', required: true },
  name: { type: String, required: true, trim: true }, 
  vehicle_type: { type: String, default: 'Custom', trim: true }, 
  registration_number: { type: String, required: true, trim: true }, 
  capacity_kg: { type: Number, required: true, min: 0 },
  base_rate_per_km: { type: Number, required: true, min: 0 },
  fuel_type: { type: String, enum: ['Diesel', 'Petrol', 'CNG', 'Electric'], default: 'Diesel' },
  fuel_efficiency_kmpl: { type: Number, required: true, min: 0.1 },
  fuel_price_per_litre: { type: Number, required: true, min: 0 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null }
}, {
  collection: 'delivery_vehicles',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

schema.virtual('id').get(function () { return this._id; });
module.exports = db.model('delivery_vehicles', schema);
