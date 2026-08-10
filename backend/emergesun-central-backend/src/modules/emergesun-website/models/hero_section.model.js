const mongoose = require("mongoose");

const heroSectionSchema = new mongoose.Schema(
  {
    badge: {
      type: String,
      default: "welcome to solarkits",
    },
    title: {
      type: String,
      default: "Powering a Sustainable Future with Smart Solar Solutions",
    },
    subtitle: {
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
      default: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("HeroSection", heroSectionSchema);
