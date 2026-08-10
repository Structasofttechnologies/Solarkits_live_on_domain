const mongoose = require("mongoose");

const marketplaceSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Solar Installer Marketplace",
    },
    heroDescription: {
      type: String,
      default: "Connect with verified solar installers, compare quotes, and find the best deals for your solar projects. Our marketplace brings together top-rated installers and customers in one platform.",
    },
    buttonText: {
      type: String,
      default: "Sign Up / Login",
    },
    buttonLink: {
      type: String,
      default: "/login",
    },
    imageUrl: {
      type: String,
      default: "/logo.png",
    },
    featuresTitle: {
      type: String,
      default: "Key Features",
    },
    featuresList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Verified Installers", description: "All installers are background-verified with proper certifications and licenses.", icon: "ShieldCheck" },
        { title: "Compare Quotes", description: "Get multiple quotes and compare pricing, services, and warranties.", icon: "GitCompare" },
        { title: "Reviews & Ratings", description: "Read genuine reviews from previous customers to make informed decisions.", icon: "Star" },
        { title: "Secure Payments", description: "Safe and secure payment processing with escrow protection.", icon: "Lock" },
        { title: "24/7 Support", description: "Dedicated customer support to help you throughout your solar journey.", icon: "Headphones" },
        { title: "Project Tracking", description: "Track your installation progress in real-time from start to finish.", icon: "Target" }
      ]
    },
    stepsTitle: {
      type: String,
      default: "How It Works",
    },
    stepsList: {
      type: [
        {
          num: { type: String },
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { num: "1", title: "Post Your Project", description: "Describe your solar requirements and preferences", icon: "FileEdit" },
        { num: "2", title: "Receive Quotes", description: "Get competitive quotes from verified installers", icon: "BadgeCent" },
        { num: "3", title: "Compare & Select", description: "Review quotes and choose the best installer", icon: "ArrowRightLeft" },
        { num: "4", title: "Get Installed", description: "Schedule installation and enjoy solar energy", icon: "Sun" }
      ]
    },
    whyChooseTitle: {
      type: String,
      default: "Why Choose Our Marketplace?",
    },
    whyChooseImage: {
      type: String,
      default: "/logo.png",
    },
    whyChooseList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Best Prices", description: "Competitive pricing through installer competition", icon: "IndianRupee" },
        { title: "Quality Guarantee", description: "All installations meet industry standards", icon: "Zap" },
        { title: "Fast Installation", description: "Quick turnaround times with professional service", icon: "Timer" },
        { title: "Extended Warranty", description: "Comprehensive warranty coverage on all installations", icon: "ShieldCheck" }
      ]
    },
    ctaTitle: {
      type: String,
      default: "Ready to Start Your Solar Journey?",
    },
    ctaDescription: {
      type: String,
      default: "Join thousands of satisfied customers who have found their perfect solar installer through our platform",
    },
    ctaButtonText: {
      type: String,
      default: "Get Started Now",
    },
    ctaButtonLink: {
      type: String,
      default: "/login",
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
    enableFeaturesSection: {
      type: Boolean,
      default: true,
    },
    enableStepsSection: {
      type: Boolean,
      default: true,
    },
    enableWhyChooseSection: {
      type: Boolean,
      default: true,
    },
    enableCtaSection: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("MarketplaceConfig", marketplaceSchema);
