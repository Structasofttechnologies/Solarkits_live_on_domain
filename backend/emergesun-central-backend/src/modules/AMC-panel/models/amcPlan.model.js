const mongoose = require('mongoose');

const amcPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Residential' },
    country: { type: String, default: 'India' },
    countryCode: { type: String, default: 'IN' },
    currencySymbol: { type: String, default: '₹' },
    description: { type: String, default: '' },
    basePrice: { type: Number, default: 0 },
    pricePerKw: { type: Number, default: 0 },
    visitFrequency: { type: String, default: '2 Visits/Year' },
    cleaningFrequency: { type: String, default: '4 Visits/Year' },
    contractDuration: { type: String, default: '1 Year' },
    slaResponse: { type: String, default: '24 Hours' },
    billing: { type: String, default: 'Annual' },
    status: { type: String, default: 'Active' },
    isBestSeller: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    subscribersCount: { type: Number, default: 0 },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Virtual for pricePerKW (compatibility)
amcPlanSchema.virtual('pricePerKW').get(function () {
  return this.pricePerKw;
});

// Virtual for services (compatibility with features)
amcPlanSchema.virtual('services').get(function () {
  return this.features;
});

amcPlanSchema.set('toJSON', { virtuals: true });
amcPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AmcPlan', amcPlanSchema);
