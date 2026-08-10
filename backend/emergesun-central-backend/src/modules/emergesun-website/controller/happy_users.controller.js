const HappyUsersConfig = require("../models/happy_users.model");

const DEFAULT_STATS = [
  { id: "stat-1", order: 1, label: "Active Users", value: "5000+", icon: "Users", color: "text-blue-500 bg-blue-50", status: "Active" },
  { id: "stat-2", order: 2, label: "Companies", value: "1000+", icon: "Briefcase", color: "text-green-500 bg-green-50", status: "Active" },
  { id: "stat-3", order: 3, label: "Projects Managed", value: "15000+", icon: "Sun", color: "text-orange-500 bg-orange-50", status: "Active" },
  { id: "stat-4", order: 4, label: "MW Installed", value: "500+", icon: "BarChart3", color: "text-purple-500 bg-purple-50", status: "Active" }
];

const DEFAULT_TESTIMONIALS = [
  { id: "test-1", order: 1, name: "Rajesh Kumar", company: "SunPower Solutions", position: "CEO", testimonial: "This ERP system has transformed our solar business completely. We've seen a 40% increase in operational efficiency and better project management.", status: "Active" },
  { id: "test-2", order: 2, name: "Priya Sharma", company: "Green Energy Systems", position: "Operations Director", testimonial: "The solar-specific features like panel performance tracking and installation scheduling have made our workflow seamless. Highly recommended!", status: "Active" },
  { id: "test-3", order: 3, name: "Amit Patel", company: "SolarTech India", position: "Founder", testimonial: "From lead management to project completion, everything is integrated. The dealer app is a game-changer for our business.", status: "Active" },
  { id: "test-4", order: 4, name: "Neha Gupta", company: "EcoSun Enterprises", position: "Project Manager", testimonial: "The ROI calculator and solar design tools help us provide accurate quotes to customers. Customer satisfaction has improved significantly.", status: "Active" },
  { id: "test-5", order: 5, name: "Vikram Singh", company: "SolarMax Industries", position: "Director", testimonial: "The AMC management and installer marketplace have revolutionized how we handle maintenance contracts. Excellent platform!", status: "Active" }
];

const DEFAULT_COMPANIES = [
  "Tata Power Solar",
  "Adani Green",
  "Waaree",
  "Vikram Solar",
  "Solex Energy",
  "Renew Power"
];

// Save / Update Happy Users Config
const saveHappyUsersConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const {
      sectionTitle,
      subTitle,
      enableSection,
      stats,
      testimonials,
      trustedCompanies,
      lastUpdated,
    } = req.body;

    let config = await HappyUsersConfig.findOne();

    if (!config) {
      config = new HappyUsersConfig();
    }

    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (subTitle !== undefined) config.subTitle = subTitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(stats)) {
      config.stats = stats.map((item, index) => ({
        id: item.id || `stat-${Date.now()}-${index}`,
        order: item.order ?? index + 1,
        label: item.label || "",
        value: item.value || "",
        icon: item.icon || "Users",
        color: item.color || "text-blue-500 bg-blue-50",
        status: item.status || "Active",
      }));
    }

    if (Array.isArray(testimonials)) {
      config.testimonials = testimonials.map((item, index) => ({
        id: item.id || `test-${Date.now()}-${index}`,
        order: item.order ?? index + 1,
        name: item.name || "",
        company: item.company || "",
        position: item.position || "",
        testimonial: item.testimonial || "",
        status: item.status || "Active",
      }));
    }

    if (Array.isArray(trustedCompanies)) {
      config.trustedCompanies = trustedCompanies;
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Happy Users configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Happy Users configuration",
      error: error.message,
    });
  }
};

// Get Happy Users Config
const getHappyUsersConfig = async (req, res) => {
  try {
    let config = await HappyUsersConfig.findOne();

    if (!config) {
      // Return default configuration structure if none exists in DB yet
      config = {
        sectionTitle: "Our Happy Users",
        subTitle: "Trusted by solar businesses across India",
        enableSection: true,
        stats: DEFAULT_STATS,
        testimonials: DEFAULT_TESTIMONIALS,
        trustedCompanies: DEFAULT_COMPANIES,
      };
    } else {
      if (!Array.isArray(config.stats) || config.stats.length === 0) {
        config.stats = DEFAULT_STATS;
      }
      if (!Array.isArray(config.testimonials) || config.testimonials.length === 0) {
        config.testimonials = DEFAULT_TESTIMONIALS;
      }
      if (!Array.isArray(config.trustedCompanies) || config.trustedCompanies.length === 0) {
        config.trustedCompanies = DEFAULT_COMPANIES;
      }
      if (Array.isArray(config.stats)) {
        config.stats.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      if (Array.isArray(config.testimonials)) {
        config.testimonials.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Happy Users configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveHappyUsersConfig,
  getHappyUsersConfig,
};
