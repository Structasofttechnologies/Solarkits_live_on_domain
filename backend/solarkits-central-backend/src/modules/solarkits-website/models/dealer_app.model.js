const mongoose = require('mongoose');

const dealerAppSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Solar Dealer App",
    },
    heroDescription: {
      type: String,
      default: "Empower your solar business with our comprehensive dealer management app. Manage inventory, track orders, handle customers, and grow your solar business from anywhere.",
    },
    downloadLink: {
      type: String,
      default: "#",
    },
    imageUrl: {
      type: String,
      default: "/logo.png",
    },
    featuresTitle: {
      type: String,
      default: "Powerful Features for Solar Dealers",
    },
    featuresSubtitle: {
      type: String,
      default: "Everything you need to manage and grow your solar business",
    },
    featuresList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          color: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Dashboard Management", description: "Complete overview of your business with real-time analytics, sales performance, and key metrics at a glance", icon: "Boxes", color: "text-green-600 bg-green-50" },
        { title: "Project Signup", description: "Complete project lifecycle management - Lead tracking, Site Survey, Quote Generation, and Project Signup workflow", icon: "ShoppingCart", color: "text-blue-600 bg-blue-50" },
        { title: "Project Management", description: "End-to-end Service Management - Installation tracking, Timeline management, Task assignment, and Progress monitoring", icon: "Users", color: "text-orange-600 bg-orange-50" },
        { title: "Business Analytics", description: "Real-time insights into sales, revenue, and business performance", icon: "BarChart3", color: "text-purple-600 bg-purple-50" },
        { title: "Payment Tracking", description: "Track payments, dues, and generate payment receipts", icon: "CreditCard", color: "text-teal-600 bg-teal-50" },
        { title: "Stock Alerts", description: "Get notified when stock reaches reorder level", icon: "Bell", color: "text-red-600 bg-red-50" },
        { title: "Installation Scheduling", description: "Schedule and track installations with calendar integration", icon: "Calendar", color: "text-amber-800 bg-amber-50" },
        { title: "Customer Support", description: "Built-in ticket system for customer queries", icon: "Headphones", color: "text-indigo-600 bg-indigo-50" },
        { title: "Promotions Management", description: "Create and manage discounts and special offers", icon: "Tag", color: "text-pink-600 bg-pink-50" }
      ]
    },
    screenshotsTitle: {
      type: String,
      default: "User Friendly Interface Design",
    },
    screenshotsSubtitle: {
      type: String,
      default: "Take a look at our beautiful and intuitive app interface",
    },
    screenshotsList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { title: "Dashboard", description: "Complete overview of your business with real-time analytics, sales performance, and key metrics at a glance" },
        { title: "Project Signup", description: "Complete project lifecycle management - Lead tracking, Site Survey, Quote Generation, and Project Signup workflow" },
        { title: "Project Management", description: "End-to-end Service Management - Installation tracking, Timeline management, Task assignment, and Progress monitoring" },
        { title: "Combo Kits", description: "Pre-configured solar combo kits management - Order processing, Kit assembly tracking, Inventory management for complete solar packages" }
      ]
    },
    enableSection: {
      type: Boolean,
      default: true,
    },
    enableFeaturesSection: {
      type: Boolean,
      default: true,
    },
    enableScreenshotsSection: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DealerAppConfig', dealerAppSchema);
