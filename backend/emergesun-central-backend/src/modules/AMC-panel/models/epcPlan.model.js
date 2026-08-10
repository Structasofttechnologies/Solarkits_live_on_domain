const mongoose = require('mongoose');

const epcPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Professional' },
    country: { type: String, default: 'Global' },
    countryCode: { type: String, default: 'US' },
    currencySymbol: { type: String, default: '$' },
    description: { type: String, default: '' },
    basePrice: { type: Number, default: 0 },
    priceAnnual: { type: Number, default: 0 },
    customPriceText: { type: String, default: '' },
    billing: { type: String, default: 'Monthly' },
    status: { type: String, default: 'Active' },
    isBestSeller: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    subscribersCount: { type: Number, default: 0 },
    buttonText: { type: String, default: '' },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

epcPlanSchema.virtual('services').get(function () {
  return this.features;
});

epcPlanSchema.set('toJSON', { virtuals: true });
epcPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EpcPlan', epcPlanSchema);
