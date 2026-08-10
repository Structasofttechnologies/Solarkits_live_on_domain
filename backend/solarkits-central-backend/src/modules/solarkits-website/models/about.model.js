const mongoose = require("mongoose");

const AboutSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: "welcome to solarkits",
    },
    title: {
      type: String,
      default: "Powering a Sustainable Future with Smart Solar Solutions",
    },
    subTitle: {
      type: String,
      default: "Trusted Solar EPC Partner for Residential, Commercial & Industrial Projects",
    },
    description: {
      type: String,
      default: "SolarKits is committed to delivering reliable, efficient, and affordable solar energy solutions for homes, businesses, and industries. Our experienced team specializes in solar EPC services, rooftop solar installations, system design, engineering, procurement, installation, and long-term maintenance",
    },
    primaryBtnText: {
      type: String,
      default: "Request Demo",
    },
    secondaryBtnText: {
      type: String,
      default: "Contact Sales",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("About", AboutSchema);
