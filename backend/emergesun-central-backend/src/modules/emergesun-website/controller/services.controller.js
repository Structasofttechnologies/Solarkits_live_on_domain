const ServicesConfig = require("../models/services.model");

// Save / Update Services Config
const saveServicesConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const { menuTitle, menuType, enableSection, services, lastUpdated } = req.body;

    let config = await ServicesConfig.findOne();

    if (!config) {
      config = new ServicesConfig();
    }

    if (menuTitle !== undefined) config.menuTitle = menuTitle;
    if (menuType !== undefined) config.menuType = menuType;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(services)) {
      config.services = services.map((item, index) => ({
        id: item.id || `service-${Date.now()}-${index}`,
        name: item.name || "",
        slug: item.slug || "",
        status: item.status || "Active",
      }));
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Services configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Services configuration",
      error: error.message,
    });
  }
};

// Get Services Config
const getServicesConfig = async (req, res) => {
  try {
    const config = await ServicesConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Services configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveServicesConfig,
  getServicesConfig,
};
