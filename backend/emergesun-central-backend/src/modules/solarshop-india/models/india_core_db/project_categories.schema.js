const mongoose = require('mongoose');
const { core_db: db } = require('../../config/databases');

const schema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  is_active:  { type: Boolean, default: true },
  deleted_at: { type: Date, default: null },
}, { 
  collection: 'sys_filter_categories',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

schema.virtual('id').get(function () { return this._id; });

module.exports = db.model('sys_filter_categories', schema);
