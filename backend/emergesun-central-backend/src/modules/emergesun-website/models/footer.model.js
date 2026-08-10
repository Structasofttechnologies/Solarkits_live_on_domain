const mongoose = require("mongoose");

const QuickLinkSchema = new mongoose.Schema({
  id: String,
  label: String,
  url: String,
});

const FooterSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      default: "EmergeSun",
    },
    tagline: {
      type: String,
      default: "Your partner in sustainable energy since 2020.",
    },
    quickLinksTitle: {
      type: String,
      default: "Quick Links",
    },
    quickLinks: {
      type: [QuickLinkSchema],
      default: [
        { id: "q-1", label: "Services", url: "/services" },
        { id: "q-2", label: "About Us", url: "/about" },
        { id: "q-3", label: "Contact", url: "/contact" },
        { id: "q-4", label: "FAQ", url: "/faq" },
      ],
    },
    contactTitle: {
      type: String,
      default: "Contact",
    },
    address: {
      type: String,
      default: "123 Solar Ave, Green City, 45678",
    },
    email: {
      type: String,
      default: "info@solarsolutions.com",
    },
    phone: {
      type: String,
      default: "+91 98765 43210",
    },
    facebookUrl: {
      type: String,
      default: "https://facebook.com",
    },
    instagramUrl: {
      type: String,
      default: "https://instagram.com",
    },
    twitterUrl: {
      type: String,
      default: "https://twitter.com",
    },
    linkedinUrl: {
      type: String,
      default: "https://linkedin.com",
    },
    copyrightText: {
      type: String,
      default: "© 2026 Solar Solutions. All rights reserved.",
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

module.exports = mongoose.model("Footer", FooterSchema);
