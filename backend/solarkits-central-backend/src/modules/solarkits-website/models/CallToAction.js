const mongoose = require("mongoose");

const CallToActionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    primaryButtonText: {
      type: String,
      required: true,
      trim: true,
    },
    primaryButtonLink: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryButtonText: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryButtonLink: {
      type: String,
      required: true,
      trim: true,
    },
    loginText: {
      type: String,
      required: true,
      trim: true,
    },
    loginLink: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CallToAction", CallToActionSchema);
