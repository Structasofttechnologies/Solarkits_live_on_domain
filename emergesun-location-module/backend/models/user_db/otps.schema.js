const mongoose = require('mongoose');
const { user_db } = require('../../config/databases');

const schema = new mongoose.Schema({
  otp:            { type: String, required: true, maxlength: 200 },
  user_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'cms_users', required: true },
  tries:          { type: Number, required: true, default: 0 },
  purpose:        { type: String, required: true },
  expires_at:     { type: Date, default: Date.now },
  created_at:     { type: Date, default: Date.now },
}, { collection: 'otps', timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.index({ purpose: 1, expires_at: -1 });
schema.virtual('id').get(function () { return this._id; });
module.exports = user_db.model('otps', schema);
