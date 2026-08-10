const mongoose = require("mongoose");

const solarShopSchema = new mongoose.Schema(
  {
    // Hero Section
    welcomeTag: {
      type: String,
      default: "Welcome to Solar Business Platform",
    },
    heroTitle: {
      type: String,
      default: "One Stop Shop For Solar Material Kit",
    },
    heroSubtitle: {
      type: String,
      default: "Made Solarkits",
    },
    heroDescription: {
      type: String,
      default: "Premium quality solar kits for residential and commercial use. Transform your solar business with our multi-branded solutions. Experience the future of solar energy management.",
    },
    features: {
      type: [String],
      default: ["Free Delivery", "Multi-Brand Solar Kits", "Quick Delivery Time", "Free Service"],
    },
    
    // Video
    videoTitle: {
      type: String,
      default: "How It Works",
    },
    videoSubtitle: {
      type: String,
      default: "Watch our platform demo",
    },
    videoDuration: {
      type: String,
      default: "2:30 min",
    },
    videoUrl: {
      type: String,
      default: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },

    // Software Solutions Section
    solutionsTag: {
      type: String,
      default: "Our Software Solutions",
    },
    solutionsTitle: {
      type: String,
      default: "Digital Solutions for Modern Solar Business",
    },
    solutionsSubtitle: {
      type: String,
      default: "Comprehensive software suite to manage every aspect of your solar business",
    },
    solutionsList: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          icon: { type: String },
          color: { type: String },
          path: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        {
          title: "Solar Installer Marketplace",
          description: "Connect with top solar installers, compare quotes, and manage installations seamlessly.",
          icon: "Layers",
          color: "from-blue-500/20 to-blue-600/20 text-blue-600",
          path: "/solar-installer",
        },
        {
          title: "Solar Dealer App",
          description: "Powerful mobile app for solar dealers to manage inventory, orders, and customer relationships.",
          icon: "Smartphone",
          color: "from-green-500/20 to-green-600/20 text-green-600",
          path: "/solar-dealer",
        },
        {
          title: "Solar Mega Watt Project Management",
          description: "Advanced project management tools for large-scale solar installations.",
          icon: "BarChart3",
          color: "from-purple-500/20 to-purple-600/20 text-purple-600",
          path: "/megawatt-project",
        },
        {
          title: "Solar AMC Management",
          description: "Complete annual maintenance contract management for solar assets.",
          icon: "Sparkles",
          color: "from-red-500/20 to-red-600/20 text-red-600",
          path: "/solar-amc",
        }
      ]
    },

    // CRM Modules Section
    crmTitle: {
      type: String,
      default: "CRM Modules",
    },
    crmSubtitle: {
      type: String,
      default: "Complete customer lifecycle management",
    },
    crmList: {
      type: [
        {
          title: { type: String },
          badge: { type: String },
          description: { type: String },
          icon: { type: String },
          color: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        {
          title: "Lead Management",
          badge: "2,500+ LEADS/MONTH",
          description: "Capture, track, and convert leads efficiently with automated follow-ups and scoring.",
          icon: "UserPlus",
          color: "from-blue-500/20 to-blue-600/20 text-blue-600"
        },
        {
          title: "Quotation Management",
          badge: "500+ QUOTES/MONTH",
          description: "Create professional quotes, send to customers, and track approval status in real-time.",
          icon: "FileText",
          color: "from-green-500/20 to-green-600/20 text-green-600"
        },
        {
          title: "Project Signup",
          badge: "98% FASTER SIGNUP",
          description: "Streamlined project onboarding with digital signatures and document collection.",
          icon: "CheckSquare",
          color: "from-orange-500/20 to-orange-600/20 text-orange-600"
        },
        {
          title: "Project Management",
          badge: "150+ ACTIVE PROJECTS",
          description: "End-to-end project tracking from initiation to completion with milestone management.",
          icon: "Layers",
          color: "from-purple-500/20 to-purple-600/20 text-purple-600"
        },
        {
          title: "Service Management",
          badge: "98% SATISFACTION",
          description: "Manage service requests, schedule visits, and track resolution efficiently.",
          icon: "HelpCircle",
          color: "from-red-500/20 to-red-600/20 text-red-600"
        },
        {
          title: "My Warehouse",
          badge: "10K+ SKUS",
          description: "Real-time inventory tracking, stock alerts, and warehouse management system.",
          icon: "Warehouse",
          color: "from-teal-500/20 to-teal-600/20 text-teal-600"
        },
        {
          title: "Customer Center",
          badge: "5,000+ CUSTOMERS",
          description: "360-degree customer view with interaction history, documents, and communication logs.",
          icon: "Users",
          color: "from-indigo-500/20 to-indigo-600/20 text-indigo-600"
        }
      ]
    },

    // Why Choose Us Section
    whyChooseTitle: {
      type: String,
      default: "Why Choose Us",
    },
    whyChooseSubtitle: {
      type: String,
      default: "We deliver excellence through our dedicated service",
    },
    whyChooseList: {
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
        {
          title: "Best Price Guarantee",
          description: "We offer competitive and direct manufacturer prices for all solar materials and modules.",
          icon: "Award",
          color: "from-orange-500/20 to-orange-600/20 text-orange-600"
        },
        {
          title: "Wide Supplier Network",
          description: "Choose from a network of trusted brands and quality manufacturers across the country.",
          icon: "Globe",
          color: "from-blue-500/20 to-blue-600/20 text-blue-600"
        },
        {
          title: "Expert System Integrators",
          description: "Our certified engineering teams handle seamless integrations and testing for perfect performance.",
          icon: "Sparkles",
          color: "from-amber-500/20 to-amber-600/20 text-amber-600"
        }
      ]
    },

    // Performance Stats Section
    metricsTitle: {
      type: String,
      default: "Performance Metrics",
    },
    metricsList: {
      type: [
        {
          val: { type: String },
          label: { type: String },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { val: "100+", label: "SUCCESSFUL PROJECTS" },
        { val: "99.9%", label: "SYSTEM UPTIME" },
        { val: "4.9/5", label: "CLIENT RATING" },
        { val: "20K Tons", label: "CARBON REDUCTION" }
      ]
    },

    // Testimonials Section
    testimonialsTitle: {
      type: String,
      default: "What Our Partners Say",
    },
    testimonialsList: {
      type: [
        {
          name: { type: String },
          role: { type: String },
          company: { type: String },
          testimonial: { type: String },
          rating: { type: Number, default: 5 },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: [
        { name: "Rajesh Kumar", role: "EPC Contractor", company: "SunPower Solutions", testimonial: "The platform has completely transformed how we manage our solar projects. No more inventory headaches! The efficiency gain is remarkable.", rating: 5 },
        { name: "Priya Sharma", role: "Solar Dealer", company: "Green Energy Stores", testimonial: "Best decision we made for our business. The dealer app is incredibly user-friendly and efficient. Our sales have increased by 40%.", rating: 5 },
        { name: "Amit Patel", role: "Project Manager", company: "MegaSolar Corp", testimonial: "The project management tools are outstanding. We've completed 3MW projects ahead of schedule with better resource utilization.", rating: 5 },
        { name: "Sunita Reddy", role: "CEO", company: "SolarTech Industries", testimonial: "The ERP system streamlined our entire operation. From procurement to delivery, everything is now automated and efficient.", rating: 5 }
      ]
    },

    // CTA Section
    ctaTitle: {
      type: String,
      default: "Ready to Power Your Solar Business?",
    },
    ctaDescription: {
      type: String,
      default: "Join EmergeSun today and gain complete control over your project lifecycle, supplier contracts, and sales dashboards.",
    },
    ctaButtonText: {
      type: String,
      default: "Get Started Now",
    },
    ctaButtonLink: {
      type: String,
      default: "/login",
    },

    // Section Toggles
    enableHero: { type: Boolean, default: true },
    enableSolutions: { type: Boolean, default: true },
    enableCrm: { type: Boolean, default: true },
    enableWhyChoose: { type: Boolean, default: true },
    enableMetrics: { type: Boolean, default: true },
    enableTestimonials: { type: Boolean, default: true },
    enableCta: { type: Boolean, default: true },

    lastUpdated: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("SolarShopConfig", solarShopSchema);
