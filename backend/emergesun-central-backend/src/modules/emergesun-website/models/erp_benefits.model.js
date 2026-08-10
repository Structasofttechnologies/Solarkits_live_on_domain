const mongoose = require("mongoose");

const erpBenefitsSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      default: "Benefits of Our ERP System",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
    benefits: [
      {
        id: String,
        order: {
          type: Number,
          default: 0,
        },
        title: {
          type: String,
          required: true,
        },
        desc: {
          type: String,
          default: "",
        },
        icon: {
          type: String,
          default: "TrendingUp",
        },
        color: {
          type: String,
          default: "bg-purple-50 text-purple-700",
        },
        status: {
          type: String,
          default: "Active",
        },
      },
    ],
    rightCard: {
      title: {
        type: String,
        default: "BUSINESS GROWTH",
      },
      icon: {
        type: String,
        default: "TrendingUp",
      },
      color: {
        type: String,
        default: "text-purple-300",
      },
      textColor: {
        type: String,
        default: "text-purple-400",
      },
    },
    lastUpdated: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("ErpBenefitsConfig", erpBenefitsSchema);
