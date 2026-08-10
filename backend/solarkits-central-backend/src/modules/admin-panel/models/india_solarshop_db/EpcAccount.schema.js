const mongoose = require('mongoose');
const { india_solarshop_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  whatsapp: { type: String, required: true },
  registered_whatsapp: { type: String, default: null },
  is_registered_same_as_whatsapp: { type: Boolean, default: false },
  password_hash: { type: String, required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'epc_companies', default: null },
  states: [{ type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1' }],
  districts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_2' }],
  is_email_verified: { type: Boolean, default: false },
  is_whatsapp_verified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  deleted_at: { type: Date, default: null }
}, { 
  collection: 'epc_accounts', 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

schema.virtual('id').get(function () { return this._id; });
module.exports = db.model('epc_accounts', schema);
