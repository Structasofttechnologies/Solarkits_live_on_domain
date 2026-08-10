const ErpScreenshotsConfig = require("../models/erp_screenshots.model");

// Save / Update ERP Screenshots
const saveErpScreenshotsConfig = async (req, res) => {
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
      slides,
      lastUpdated,
    } = req.body;

    let config = await ErpScreenshotsConfig.findOne();

    if (!config) {
      config = new ErpScreenshotsConfig();
    }

    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (subTitle !== undefined) config.subTitle = subTitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(slides)) {
      config.slides = slides.map((item, index) => {
        const itemDesc = item.description || item.desc || "";
        return {
          id: item.id || `slide-${Date.now()}-${index}`,
          order: item.order ?? index + 1,
          title: item.title,
          description: itemDesc,
          desc: itemDesc,
          icon: item.icon || "BarChart3",
          imageUrl: item.imageUrl || "",
          bg: item.bg || "bg-gradient-to-br from-indigo-100/50 via-indigo-50/20 to-purple-100/40",
          iconColor: item.iconColor || "text-indigo-400",
          status: item.status || "Active",
        };
      });
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "ERP Screenshots configuration saved successfully",
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save ERP Screenshots configuration",
      error: error.message,
    });
  }
};

// Get ERP Screenshots
const getErpScreenshotsConfig = async (req, res) => {
  try {
    const config = await ErpScreenshotsConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }

    if (Array.isArray(config.slides)) {
      config.slides.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return res.status(200).json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ERP Screenshots configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveErpScreenshotsConfig,
  getErpScreenshotsConfig,
};
