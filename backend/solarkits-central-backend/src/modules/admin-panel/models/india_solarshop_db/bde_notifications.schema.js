const mongoose = require('mongoose');
const { india_solarshop_db } = require('../../config/databases');

/**
 * bde_notifications — In-app notification items for BDEs.
 *
 * Collection: bde_notifications
 */
const schema = new mongoose.Schema({
  bde_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bde_profiles',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['assignment', 'kyc', 'goal', 'store_setup', 'system', 'general'],
    default: 'general',
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true,
  },
  read_at: {
    type: Date,
    default: null,
  },
}, {
  collection: 'bde_notifications',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

schema.virtual('id').get(function () {
  return this._id;
});

module.exports = india_solarshop_db.model('bde_notifications', schema);
