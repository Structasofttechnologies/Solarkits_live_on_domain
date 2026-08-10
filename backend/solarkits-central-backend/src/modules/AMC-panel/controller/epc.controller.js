const EpcPlan = require('../models/epcPlan.model');

const INITIAL_EPC_PLANS = [
  {
    planId: "epc-starter",
    name: "Starter Plan",
    category: "Starter",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Ideal for small solar contractors & single-region installers.",
    basePrice: 49,
    priceAnnual: 470,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 142,
    buttonText: "CHECKOUT STARTER",
    features: [
      "Up to 10 users",
      "1 country",
      "Basic analytics",
      "Email support",
      "5 GB storage",
    ],
  },
  {
    planId: "epc-professional",
    name: "Professional Plan",
    category: "Professional",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Perfect for growing EPC companies scaling residential & commercial projects.",
    basePrice: 149,
    priceAnnual: 1430,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    subscribersCount: 489,
    buttonText: "CHECKOUT PROFESSIONAL",
    features: [
      "Up to 100 users",
      "5 countries",
      "Advanced analytics",
      "Priority support",
      "50 GB storage",
    ],
  },
  {
    planId: "epc-enterprise",
    name: "Enterprise Plan",
    category: "Enterprise",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Built for multi-country solar enterprises requiring full BI analytics.",
    basePrice: 499,
    priceAnnual: 4790,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 98,
    buttonText: "CHECKOUT ENTERPRISE",
    features: [
      "Unlimited users",
      "20 countries",
      "Full analytics suite",
      "Dedicated account manager",
      "500 GB storage",
      "Custom integrations",
    ],
  },
  {
    planId: "epc-custom",
    name: "Custom Plan",
    category: "Custom Tiers",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Tailored solution with custom BI, white-glove onboarding & dedicated SLA.",
    basePrice: 0,
    priceAnnual: 0,
    customPriceText: "Contact Sales",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 35,
    buttonText: "CHECKOUT CUSTOM",
    features: [
      "Unlimited everything",
      "Custom integrations",
      "White glove support",
      "Custom BI dashboard",
      "SLA guarantee",
    ],
  },
];

// Helper to seed database if empty
const seedDefaultEpcPlans = async () => {
  try {
    const count = await EpcPlan.countDocuments();
    if (count === 0) {
      await EpcPlan.insertMany(INITIAL_EPC_PLANS);
      console.log('✅ Seeded default EPC Plans into Database');
    }
  } catch (error) {
    console.error('Error seeding default EPC Plans:', error);
  }
};

// GET all EPC plans
const getAllPlans = async (req, res) => {
  try {
    await seedDefaultEpcPlans();
    const filter = {};
    if (req.query.country && req.query.country !== 'All') {
      filter.country = new RegExp(`^${req.query.country}$`, 'i');
    }
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    const plans = await EpcPlan.find(filter).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching EPC plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch EPC plans',
      error: error.message,
    });
  }
};

// GET single EPC plan
const getPlanById = async (req, res) => {
  try {
    const plan = await EpcPlan.findOne({
      $or: [{ _id: req.params.id }, { planId: req.params.id }],
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'EPC Plan not found' });
    }
    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch EPC plan', error: error.message });
  }
};

// CREATE EPC plan
const createPlan = async (req, res) => {
  try {
    const planData = req.body;
    if (!planData.planId) {
      planData.planId = `epc-${Date.now()}`;
    }

    const newPlan = new EpcPlan(planData);
    await newPlan.save();

    return res.status(201).json({
      success: true,
      message: 'EPC Plan created successfully',
      data: newPlan,
    });
  } catch (error) {
    console.error('Error creating EPC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create EPC plan',
      error: error.message,
    });
  }
};

// UPDATE EPC plan
const updatePlan = async (req, res) => {
  try {
    const targetId = req.params.id;
    let updatedPlan = await EpcPlan.findOneAndUpdate(
      { $or: [{ _id: targetId }, { planId: targetId }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ success: false, message: 'EPC Plan not found for update' });
    }

    return res.status(200).json({
      success: true,
      message: 'EPC Plan updated successfully',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating EPC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update EPC plan',
      error: error.message,
    });
  }
};

// DELETE EPC plan
const deletePlan = async (req, res) => {
  try {
    const targetId = req.params.id;
    const deletedPlan = await EpcPlan.findOneAndDelete({
      $or: [{ _id: targetId }, { planId: targetId }],
    });

    if (!deletedPlan) {
      return res.status(404).json({ success: false, message: 'EPC Plan not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'EPC Plan deleted successfully',
      data: deletedPlan,
    });
  } catch (error) {
    console.error('Error deleting EPC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete EPC plan',
      error: error.message,
    });
  }
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
