const AmcPlan = require('../models/amcPlan.model');

const INITIAL_PLANS = [
  {
    planId: "plan1",
    id: "amc-basic-in",
    name: "Basic AMC",
    category: "Residential",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Essential maintenance coverage with annual preventive visits and remote monitoring support.",
    basePrice: 18000,
    pricePerKw: 180,
    visitFrequency: "2 Visits/Year",
    cleaningFrequency: "Not Included",
    contractDuration: "1 Year",
    slaResponse: "24 Hours",
    billing: "Annual",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 312,
    features: [
      "Preventive Maintenance",
      "Remote Monitoring",
      "Corrective Support (Chargeable)",
    ],
  },
  {
    planId: "plan2",
    id: "amc-cleaning-in",
    name: "Cleaning AMC",
    category: "Residential",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Regular panel cleaning service to maintain peak generation performance year-round.",
    basePrice: 12000,
    pricePerKw: 120,
    visitFrequency: "Not Included",
    cleaningFrequency: "4 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "48 Hours",
    billing: "Annual",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 189,
    features: [
      "Panel Cleaning (4x/year)",
      "Generation Report",
      "Before/After Photo Documentation",
    ],
  },
  {
    planId: "plan3",
    id: "amc-clean-maint-in",
    name: "Cleaning + Maintenance AMC",
    category: "Commercial",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Comprehensive AMC combining regular cleaning with preventive maintenance for maximum uptime.",
    basePrice: 32000,
    pricePerKw: 320,
    visitFrequency: "4 Visits/Year",
    cleaningFrequency: "6 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "8 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    subscribersCount: 421,
    features: [
      "Preventive Maintenance (4x/year)",
      "Panel Cleaning (6x/year)",
      "Remote Monitoring",
      "Priority Support",
      "Thermal Imaging Inspection",
      "Consumables Cover",
    ],
  },
  {
    planId: "plan4",
    id: "amc-warranty-in",
    name: "Power Generation Warranty AMC",
    category: "Industrial",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Premium AMC with guaranteed minimum power generation and comprehensive corrective support.",
    basePrice: 58000,
    pricePerKw: 580,
    visitFrequency: "6 Visits/Year",
    cleaningFrequency: "12 Visits/Year",
    contractDuration: "3 Years",
    slaResponse: "4 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 164,
    features: [
      "Monthly Preventive Maintenance",
      "Monthly Panel Cleaning",
      "Remote Monitoring (24/7)",
      "Generation Guarantee (90% of design)",
      "Zero Labor Charge Repairs",
      "Component Indemnification",
      "Dedicated Account Manager",
    ],
  },
  {
    planId: "amc-aus-pro",
    id: "amc-aus-pro",
    name: "Australia Solar Care Pro",
    category: "Commercial",
    country: "Australia",
    countryCode: "AU",
    currencySymbol: "A$",
    description: "CEC-compliant preventive maintenance and inverter warranty renewal package in Australia.",
    basePrice: 2400,
    pricePerKw: 24,
    visitFrequency: "4 Visits/Year",
    cleaningFrequency: "4 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "12 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: true,
    isPremium: true,
    subscribersCount: 95,
    features: [
      "Clean Energy Council Safety Audit",
      "Inverter Firmware & Health Scan",
      "Bi-annual Panel Wash",
      "Grid Compliance Protection",
    ],
  },
  {
    planId: "amc-us-enterprise",
    id: "amc-us-enterprise",
    name: "US Commercial Solar Shield",
    category: "Industrial",
    country: "United States",
    countryCode: "US",
    currencySymbol: "$",
    description: "Enterprise O&M coverage with 24/7 telemetry monitoring and fast technician dispatch in the US.",
    basePrice: 4800,
    pricePerKw: 45,
    visitFrequency: "6 Visits/Year",
    cleaningFrequency: "6 Visits/Year",
    contractDuration: "2 Years",
    slaResponse: "6 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 112,
    features: [
      "24/7 Telemetry Alert Monitoring",
      "Drone Thermal Mapping",
      "NEC 2023 Rapid Shutdown Audit",
      "Guaranteed 99.2% Plant Uptime",
    ],
  },
];

// Helper to seed database if empty
const seedDefaultPlans = async () => {
  try {
    const count = await AmcPlan.countDocuments();
    if (count === 0) {
      await AmcPlan.insertMany(INITIAL_PLANS);
      console.log('✅ Seeded default AMC Plans into Database');
    }
  } catch (error) {
    console.error('Error seeding default AMC Plans:', error);
  }
};

// GET all AMC plans
const getAllPlans = async (req, res) => {
  try {
    await seedDefaultPlans();
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

    const plans = await AmcPlan.find(filter).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching AMC plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch AMC plans',
      error: error.message,
    });
  }
};

// GET single AMC plan
const getPlanById = async (req, res) => {
  try {
    const plan = await AmcPlan.findOne({
      $or: [{ _id: req.params.id }, { planId: req.params.id }],
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plan', error: error.message });
  }
};

// CREATE AMC plan
const createPlan = async (req, res) => {
  try {
    const planData = req.body;
    if (!planData.planId) {
      planData.planId = `amc-${Date.now()}`;
    }

    const newPlan = new AmcPlan(planData);
    await newPlan.save();

    return res.status(201).json({
      success: true,
      message: 'AMC Plan created successfully',
      data: newPlan,
    });
  } catch (error) {
    console.error('Error creating AMC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create AMC plan',
      error: error.message,
    });
  }
};

// UPDATE AMC plan
const updatePlan = async (req, res) => {
  try {
    const targetId = req.params.id;
    let updatedPlan = await AmcPlan.findOneAndUpdate(
      { $or: [{ _id: targetId }, { planId: targetId }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found for update' });
    }

    return res.status(200).json({
      success: true,
      message: 'AMC Plan updated successfully',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating AMC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update AMC plan',
      error: error.message,
    });
  }
};

// DELETE AMC plan
const deletePlan = async (req, res) => {
  try {
    const targetId = req.params.id;
    const deletedPlan = await AmcPlan.findOneAndDelete({
      $or: [{ _id: targetId }, { planId: targetId }],
    });

    if (!deletedPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'AMC Plan deleted successfully',
      data: deletedPlan,
    });
  } catch (error) {
    console.error('Error deleting AMC plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete AMC plan',
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
