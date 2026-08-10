const { PricingSection, PricingPlan } = require("./pricingPlan.model");

const DEFAULT_SECTION = {
  sectionTitle: "Flexible Pricing Plans",
  sectionSubtitle: "Choose the plan that fits your solar business needs",
  sectionStatus: true,
};

const DEFAULT_PLANS = [
  {
    planName: "Free",
    price: "â‚¹0",
    duration: "forever",
    badgeText: "",
    badgeStatus: false,
    isPopular: false,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#e5e7eb",
    planTitleColor: "#0d9488", // teal-600
    priceColor: "#1f2937",
    featureHeadingColor: "#0d9488",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c", // orange-600
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#0d9488",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#8b5cf6",
    badgeTextColor: "#ffffff",
    buttonText: "Sign Up Free",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [
      { title: "Up to 5 users", icon: "CheckCircle", sortOrder: 1, status: true },
      { title: "Core dealer app features", icon: "CheckCircle", sortOrder: 2, status: true },
      { title: "Lead management", icon: "CheckCircle", sortOrder: 3, status: true },
      { title: "Basic reporting", icon: "CheckCircle", sortOrder: 4, status: true },
      { title: "Solar quotation calculator", icon: "CheckCircle", sortOrder: 5, status: true },
      { title: "Basic solar calculator", icon: "CheckCircle", sortOrder: 6, status: true },
    ],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [
      { title: "Solar Dealer App", icon: "Sun", sortOrder: 1, status: true },
    ],
    displayOrder: 1,
    status: "Active",
  },
  {
    planName: "Starter",
    price: "â‚¹49,999",
    duration: "per month",
    badgeText: "",
    badgeStatus: false,
    isPopular: false,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#e5e7eb",
    planTitleColor: "#2563eb", // blue-600
    priceColor: "#1f2937",
    featureHeadingColor: "#2563eb",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c",
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#2563eb",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#8b5cf6",
    badgeTextColor: "#ffffff",
    buttonText: "Get Started",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [
      { title: "Up to 50 users", icon: "CheckCircle", sortOrder: 1, status: true },
      { title: "Core ERP modules", icon: "CheckCircle", sortOrder: 2, status: true },
      { title: "Solar lead management", icon: "CheckCircle", sortOrder: 3, status: true },
      { title: "Basic reporting", icon: "CheckCircle", sortOrder: 4, status: true },
      { title: "Email support", icon: "CheckCircle", sortOrder: 5, status: true },
      { title: "Basic solar calculator", icon: "CheckCircle", sortOrder: 6, status: true },
    ],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [
      { title: "Solar Business ERP", icon: "Sun", sortOrder: 1, status: true },
      { title: "Solar Dealer App", icon: "Sun", sortOrder: 2, status: true },
    ],
    displayOrder: 2,
    status: "Active",
  },
  {
    planName: "Business",
    price: "â‚¹99,999",
    duration: "per month",
    badgeText: "MOST POPULAR",
    badgeStatus: true,
    isPopular: true,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#a855f7", // purple border for popular card
    planTitleColor: "#9333ea", // purple-600
    priceColor: "#1f2937",
    featureHeadingColor: "#9333ea",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c",
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#9333ea",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#9333ea",
    badgeTextColor: "#ffffff",
    buttonText: "Get Started",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [
      { title: "Up to 200 users", icon: "CheckCircle", sortOrder: 1, status: true },
      { title: "All ERP modules", icon: "CheckCircle", sortOrder: 2, status: true },
      { title: "Advanced solar analytics", icon: "CheckCircle", sortOrder: 3, status: true },
      { title: "Solar project management", icon: "CheckCircle", sortOrder: 4, status: true },
      { title: "Inventory tracking", icon: "CheckCircle", sortOrder: 5, status: true },
      { title: "Priority support", icon: "CheckCircle", sortOrder: 6, status: true },
      { title: "Solar design tools", icon: "CheckCircle", sortOrder: 7, status: true },
    ],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [
      { title: "Solar Business ERP", icon: "Sun", sortOrder: 1, status: true },
      { title: "Solar Dealer App", icon: "Sun", sortOrder: 2, status: true },
      { title: "Solar Installer Marketplace", icon: "Sun", sortOrder: 3, status: true },
    ],
    displayOrder: 3,
    status: "Active",
  },
  {
    planName: "Premium",
    price: "â‚¹1,49,999",
    duration: "per month",
    badgeText: "",
    badgeStatus: false,
    isPopular: false,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#e5e7eb",
    planTitleColor: "#ea580c", // orange-600
    priceColor: "#1f2937",
    featureHeadingColor: "#ea580c",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c",
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#ea580c",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#8b5cf6",
    badgeTextColor: "#ffffff",
    buttonText: "Get Started",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [
      { title: "Up to 500 users", icon: "CheckCircle", sortOrder: 1, status: true },
      { title: "All ERP + Solar modules", icon: "CheckCircle", sortOrder: 2, status: true },
      { title: "Advanced solar analytics", icon: "CheckCircle", sortOrder: 3, status: true },
      { title: "Solar design & simulation", icon: "CheckCircle", sortOrder: 4, status: true },
      { title: "Solar panel performance tracking", icon: "CheckCircle", sortOrder: 5, status: true },
      { title: "Installation scheduling", icon: "CheckCircle", sortOrder: 6, status: true },
      { title: "Dedicated account manager", icon: "CheckCircle", sortOrder: 7, status: true },
      { title: "Advanced reporting", icon: "CheckCircle", sortOrder: 8, status: true },
      { title: "Solar ROI calculator", icon: "CheckCircle", sortOrder: 9, status: true },
    ],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [
      { title: "Solar Business ERP", icon: "Sun", sortOrder: 1, status: true },
      { title: "Solar Dealer App", icon: "Sun", sortOrder: 2, status: true },
      { title: "Solar Installer Marketplace", icon: "Sun", sortOrder: 3, status: true },
      { title: "Solar AMC Management", icon: "Sun", sortOrder: 4, status: true },
    ],
    displayOrder: 4,
    status: "Active",
  },
  {
    planName: "Enterprise",
    price: "Custom",
    duration: "contact sales",
    badgeText: "",
    badgeStatus: false,
    isPopular: false,
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#e5e7eb",
    planTitleColor: "#16a34a", // green-600
    priceColor: "#1f2937",
    featureHeadingColor: "#16a34a",
    featureTextColor: "#4b5563",
    softwareHeadingColor: "#ea580c",
    softwareTextColor: "#4b5563",
    buttonBackgroundColor: "#16a34a",
    buttonTextColor: "#ffffff",
    badgeBackgroundColor: "#8b5cf6",
    badgeTextColor: "#ffffff",
    buttonText: "Contact Sales",
    buttonLink: "/login",
    featureSectionTitle: "Features",
    features: [
      { title: "Unlimited users", icon: "CheckCircle", sortOrder: 1, status: true },
      { title: "Custom solar solutions", icon: "CheckCircle", sortOrder: 2, status: true },
      { title: "Solar farm management", icon: "CheckCircle", sortOrder: 3, status: true },
      { title: "Advanced solar analytics", icon: "CheckCircle", sortOrder: 4, status: true },
      { title: "Dedicated account manager", icon: "CheckCircle", sortOrder: 5, status: true },
      { title: "24/7 phone support", icon: "CheckCircle", sortOrder: 6, status: true },
      { title: "SLA guarantee", icon: "CheckCircle", sortOrder: 7, status: true },
      { title: "On-premise option", icon: "CheckCircle", sortOrder: 8, status: true },
      { title: "Training & consultation", icon: "CheckCircle", sortOrder: 9, status: true },
      { title: "Solar bidding", icon: "CheckCircle", sortOrder: 10, status: true },
    ],
    softwareSectionTitle: "Solar Software Included",
    softwareIncluded: [
      { title: "Solar Business ERP", icon: "Sun", sortOrder: 1, status: true },
      { title: "Solar Dealer App", icon: "Sun", sortOrder: 2, status: true },
      { title: "Solar Installer Marketplace", icon: "Sun", sortOrder: 3, status: true },
      { title: "Solar AMC Management", icon: "Sun", sortOrder: 4, status: true },
      { title: "Solar Mega Watt Project Management", icon: "Sun", sortOrder: 5, status: true },
    ],
    displayOrder: 5,
    status: "Active",
  },
];

// Helper to update/save Section Information from request body
const updateSectionInfo = async (body) => {
  const updateData = {};
  if (body.sectionTitle !== undefined) updateData.sectionTitle = body.sectionTitle;
  if (body.sectionSubtitle !== undefined) updateData.sectionSubtitle = body.sectionSubtitle;
  if (body.sectionStatus !== undefined) updateData.sectionStatus = body.sectionStatus;
  if (Object.keys(updateData).length > 0) {
    await PricingSection.findOneAndUpdate({}, updateData, { upsert: true, new: true });
  }
};

const createPricingPlan = async (req, res) => {
  try {
    await updateSectionInfo(req.body);

    const planData = { ...req.body };
    delete planData._id;
    delete planData.__v;
    delete planData.createdAt;
    delete planData.updatedAt;

    const pricingPlan = new PricingPlan(planData);
    await pricingPlan.save();

    return res.status(201).json({
      success: true,
      message: "Pricing plan created successfully",
      data: pricingPlan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create pricing plan",
      error: error.message,
    });
  }
};

// Get All Pricing Plans (with Section Info)
const getPricingPlans = async (req, res) => {
  try {
    let section = await PricingSection.findOne();
    if (!section) {
      section = await PricingSection.create(DEFAULT_SECTION);
    }

    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === "true") {
      filter.status = "Active";
    }

    let plans = await PricingPlan.find(filter).sort({ displayOrder: 1 });

    // Seed database if empty and returning default plans
    if (plans.length === 0 && (!activeOnly || activeOnly === "false")) {
      await PricingPlan.insertMany(DEFAULT_PLANS);
      plans = await PricingPlan.find(filter).sort({ displayOrder: 1 });
    } else if (plans.length === 0 && activeOnly === "true") {
      // If we are filtering activeOnly but DB is empty, let's seed first, then filter
      const count = await PricingPlan.countDocuments();
      if (count === 0) {
        await PricingPlan.insertMany(DEFAULT_PLANS);
      }
      plans = await PricingPlan.find(filter).sort({ displayOrder: 1 });
    }

    return res.status(200).json({
      success: true,
      section,
      plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pricing plans",
      error: error.message,
    });
  }
};

// Get Pricing Plan by ID
const getPricingPlanById = async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pricing plan",
      error: error.message,
    });
  }
};

// Update Pricing Plan
const updatePricingPlan = async (req, res) => {
  try {
    await updateSectionInfo(req.body);

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pricing plan updated successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update pricing plan",
      error: error.message,
    });
  }
};

// Delete Pricing Plan
const deletePricingPlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pricing plan deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete pricing plan",
      error: error.message,
    });
  }
};

// Patch Pricing Plan Status (Active/Inactive toggle)
const patchPricingPlanStatus = async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Pricing plan not found",
      });
    }

    // Toggle status or set to status in body
    const nextStatus = req.body.status || (plan.status === "Active" ? "Inactive" : "Active");
    plan.status = nextStatus;
    await plan.save();

    return res.status(200).json({
      success: true,
      message: `Pricing plan status updated to ${nextStatus}`,
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update pricing plan status",
      error: error.message,
    });
  }
};

module.exports = {
  createPricingPlan,
  getPricingPlans,
  getPricingPlanById,
  updatePricingPlan,
  deletePricingPlan,
  patchPricingPlanStatus,
};

