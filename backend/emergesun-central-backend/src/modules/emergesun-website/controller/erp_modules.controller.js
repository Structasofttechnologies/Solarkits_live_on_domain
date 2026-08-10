const ErpModulesConfig = require("../models/erp_modules.model");

// Save / Update ERP Modules
const saveErpModulesConfig = async (req, res) => {
  try {
    console.log("Body:", req.body);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const {
      menuTitle,
      subTitle,
      menuType,
      enableSection,
      modules,
      lastUpdated,
    } = req.body;

    let config = await ErpModulesConfig.findOne();

    if (!config) {
      config = new ErpModulesConfig();
    }

    if (menuTitle !== undefined) config.menuTitle = menuTitle;
    if (subTitle !== undefined) config.subTitle = subTitle;
    if (menuType !== undefined) config.menuType = menuType;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(modules)) {
      config.modules = modules.map((item, index) => {
        const itemIcon = item.icon || item.logo || "";
        const itemDesc = item.desc || item.description || "";
        return {
          id: item.id || `module-${Date.now()}-${index}`,
          order: item.order ?? index + 1,
          title: item.title,
          desc: itemDesc,
          description: itemDesc,
          icon: itemIcon,
          logo: itemIcon,
          status: item.status || "Active",
        };
      });
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "ERP Modules configuration saved successfully",
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save ERP Modules configuration",
      error: error.message,
    });
  }
};

// Get ERP Modules
const getErpModulesConfig = async (req, res) => {
  try {
    const config = await ErpModulesConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }

    if (Array.isArray(config.modules)) {
      config.modules.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return res.status(200).json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ERP Modules configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveErpModulesConfig,
  getErpModulesConfig,
};