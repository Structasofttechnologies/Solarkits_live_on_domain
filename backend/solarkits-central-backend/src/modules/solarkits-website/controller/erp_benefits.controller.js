const ErpBenefitsConfig = require("../models/erp_benefits.model");

const DEFAULT_BENEFITS = [
  {
    id: "benefit-1",
    order: 1,
    title: "Increased Efficiency",
    desc: "Automate manual processes and reduce operational costs by up to 30%",
    icon: "TrendingUp",
    color: "bg-purple-50 text-purple-700",
    status: "Active"
  },
  {
    id: "benefit-2",
    order: 2,
    title: "Better Visibility",
    desc: "Real-time insights into all business operations and performance metrics",
    icon: "Eye",
    color: "bg-indigo-50 text-indigo-700",
    status: "Active"
  },
  {
    id: "benefit-3",
    order: 3,
    title: "Streamlined Operations",
    desc: "Seamless data flow between departments eliminating silos",
    icon: "ArrowLeftRight",
    color: "bg-blue-50 text-blue-700",
    status: "Active"
  },
  {
    id: "benefit-4",
    order: 4,
    title: "Improved Compliance",
    desc: "Automated compliance tracking and audit trails",
    icon: "ClipboardList",
    color: "bg-green-50 text-green-700",
    status: "Active"
  },
  {
    id: "benefit-5",
    order: 5,
    title: "Cost Reduction",
    desc: "Reduce IT costs, eliminate redundant systems, and optimize resources",
    icon: "Wallet",
    color: "bg-orange-50 text-orange-700",
    status: "Active"
  }
];

// Save / Update ERP Benefits
const saveErpBenefitsConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const {
      sectionTitle,
      enableSection,
      benefits,
      rightCard,
      lastUpdated,
    } = req.body;

    let config = await ErpBenefitsConfig.findOne();

    if (!config) {
      config = new ErpBenefitsConfig();
    }

    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (rightCard) {
      config.rightCard = {
        title: rightCard.title || "BUSINESS GROWTH",
        icon: rightCard.icon || "TrendingUp",
        color: rightCard.color || "text-purple-300",
        textColor: rightCard.textColor || "text-purple-400",
      };
    }

    if (Array.isArray(benefits)) {
      config.benefits = benefits.map((item, index) => {
        return {
          id: item.id || `benefit-${Date.now()}-${index}`,
          order: item.order ?? index + 1,
          title: item.title,
          desc: item.desc || item.description || "",
          icon: item.icon || "TrendingUp",
          color: item.color || "bg-purple-50 text-purple-700",
          status: item.status || "Active",
        };
      });
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "ERP Benefits configuration saved successfully",
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save ERP Benefits configuration",
      error: error.message,
    });
  }
};

// Get ERP Benefits
const getErpBenefitsConfig = async (req, res) => {
  try {
    let config = await ErpBenefitsConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          sectionTitle: "Benefits of Our ERP System",
          enableSection: true,
          benefits: DEFAULT_BENEFITS,
          rightCard: {
            title: "BUSINESS GROWTH",
            icon: "TrendingUp",
            color: "text-purple-300",
            textColor: "text-purple-400",
          },
          lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        },
      });
    }

    if (Array.isArray(config.benefits)) {
      config.benefits.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return res.status(200).json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ERP Benefits configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveErpBenefitsConfig,
  getErpBenefitsConfig,
};
