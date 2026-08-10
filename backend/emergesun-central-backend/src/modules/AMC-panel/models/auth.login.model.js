const mongoose = require('mongoose');

const amcAuthSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, default: 'epc_owner' },
    avatar: { type: String, default: '' },
    company: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      logo: { type: String, default: '' },
      plan: { type: String, default: 'professional' },
    },
    branch: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    token: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AmcAuthUser', amcAuthSchema);
