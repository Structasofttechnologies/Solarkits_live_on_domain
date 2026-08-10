const mongoose = require("mongoose");

const keyFeaturesSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      default: "Key Features",
    },
    subTitle: {
      type: String,
      default: "Powerful capabilities to transform your business",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },

    features: [
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
          default: "",
        },
        color: {
          type: String,
          default: "bg-blue-50 text-blue-600",
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

module.exports = mongoose.model("KeyFeaturesConfig", keyFeaturesSchema);
