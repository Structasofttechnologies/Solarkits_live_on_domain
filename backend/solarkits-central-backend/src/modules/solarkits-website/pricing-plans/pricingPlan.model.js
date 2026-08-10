const mongoose = require("mongoose");

const PricingSectionSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      default: "Flexible Pricing Plans",
    },
    sectionSubtitle: {
      type: String,
      default: "Choose the plan that fits your solar business needs",
    },
    sectionStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const PricingPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "per month",
    },
    badgeText: {
      type: String,
      default: "",
    },
    badgeStatus: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    // Appearance
    cardBackgroundColor: {
      type: String,
      default: "#ffffff",
    },
    cardBorderColor: {
      type: String,
      default: "#e5e7eb",
    },
    planTitleColor: {
      type: String,
      default: "#1f2937",
    },
    priceColor: {
      type: String,
      default: "#1f2937",
    },
    featureHeadingColor: {
      type: String,
      default: "#1f2937",
    },
    featureTextColor: {
      type: String,
      default: "#4b5563",
    },
    softwareHeadingColor: {
      type: String,
      default: "#1f2937",
    },
    softwareTextColor: {
      type: String,
      default: "#4b5563",
    },
    buttonBackgroundColor: {
      type: String,
      default: "#2563eb",
    },
    buttonTextColor: {
      type: String,
      default: "#ffffff",
    },
    badgeBackgroundColor: {
      type: String,
      default: "#8b5cf6",
    },
    badgeTextColor: {
      type: String,
      default: "#ffffff",
    },
    // Button
    buttonText: {
      type: String,
      default: "Get Started",
    },
    buttonLink: {
      type: String,
      default: "/login",
    },
    // Feature Section
    featureSectionTitle: {
      type: String,
      default: "Features",
    },
    features: [
      {
        title: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          default: "CheckCircle",
        },
        sortOrder: {
          type: Number,
          default: 0,
        },
        status: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Software Section
    softwareSectionTitle: {
      type: String,
      default: "Solar Software Included",
    },
    softwareIncluded: [
      {
        title: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          default: "Sun",
        },
        sortOrder: {
          type: Number,
          default: 0,
        },
        status: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Other
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const PricingSection = mongoose.model("PricingSection", PricingSectionSchema);
const PricingPlan = mongoose.model("PricingPlan", PricingPlanSchema);

module.exports = {
  PricingSection,
  PricingPlan,
};

