const mongoose = require('mongoose');
const { solarkits_core_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'company_warehouses', default: null },
  warehouse_code: { type: String, required: true, trim: true },
  warehouse_name: { type: String, required: true, trim: true },
  cluster_id: { type: mongoose.Schema.Types.ObjectId, ref: 'regional_clusters', required: true },
  cluster_name: { type: String, required: true, trim: true },
  states: [{ type: String, required: true, trim: true }],
  kit_types: [{
    type: String,
    enum: ['Combo Kit', 'Customize Kit', 'Bulk Kit'],
    default: ['Combo Kit']
  }],
  effective_from: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  deleted_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'warehouse_cluster_mappings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

schema.virtual('id').get(function () {
  return this._id;
});

module.exports = db.model('warehouse_cluster_mappings', schema);
