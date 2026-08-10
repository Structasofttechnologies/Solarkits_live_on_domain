const KeyFeaturesConfig = require("../models/key_features.model");

// Save / Update Key Features
const saveKeyFeaturesConfig = async (req, res) => {
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
      features,
      lastUpdated,
    } = req.body;

    let config = await KeyFeaturesConfig.findOne();

    if (!config) {
      config = new KeyFeaturesConfig();
    }

    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (subTitle !== undefined) config.subTitle = subTitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(features)) {
      config.features = features.map((item, index) => {
        return {
          id: item.id || `feature-${Date.now()}-${index}`,
          order: item.order ?? index + 1,
          title: item.title,
          desc: item.desc || item.description || "",
          icon: item.icon || "",
          color: item.color || "bg-blue-50 text-blue-600",
          status: item.status || "Active",
        };
      });
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Key Features configuration saved successfully",
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save Key Features configuration",
      error: error.message,
    });
  }
};

// Get Key Features
const getKeyFeaturesConfig = async (req, res) => {
  try {
    const config = await KeyFeaturesConfig.findOne();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }

    if (Array.isArray(config.features)) {
      config.features.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return res.status(200).json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Key Features configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveKeyFeaturesConfig,
  getKeyFeaturesConfig,
};
