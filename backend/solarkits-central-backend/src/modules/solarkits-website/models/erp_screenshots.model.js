const mongoose = require("mongoose");

const erpScreenshotsSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      default: "ERP System Screenshots",
    },
    subTitle: {
      type: String,
      default: "See our powerful ERP interface in action",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },

    slides: [
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
        description: {
          type: String,
          default: "",
        },
        desc: {
          type: String,
          default: "",
        },
        icon: {
          type: String,
          default: "BarChart3",
        },
        imageUrl: {
          type: String,
          default: "",
        },
        bg: {
          type: String,
          default: "bg-gradient-to-br from-indigo-100/50 via-indigo-50/20 to-purple-100/40",
        },
        iconColor: {
          type: String,
          default: "text-indigo-400",
        },
        status: {
          type: String,
          default: "Active",
        },
      },
    ],

    lastUpdated: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("ErpScreenshotsConfig", erpScreenshotsSchema);
