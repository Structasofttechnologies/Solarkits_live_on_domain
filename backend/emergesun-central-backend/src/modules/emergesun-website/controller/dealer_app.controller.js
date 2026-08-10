const DealerAppConfig = require('../models/dealer_app.model');

// Save or Update Dealer App Config
const saveDealerAppConfig = async (req, res) => {
  try {
    const {
      heroTitle,
      heroDescription,
      downloadLink,
      imageUrl,
      featuresTitle,
      featuresSubtitle,
      featuresList,
      screenshotsTitle,
      screenshotsSubtitle,
      screenshotsList,
      enableSection,
      enableFeaturesSection,
      enableScreenshotsSection,
      lastUpdated
    } = req.body;

    let config = await DealerAppConfig.findOne();

    if (!config) {
      config = new DealerAppConfig();
    }

    if (heroTitle !== undefined) config.heroTitle = heroTitle;
    if (heroDescription !== undefined) config.heroDescription = heroDescription;
    if (downloadLink !== undefined) config.downloadLink = downloadLink;
    if (imageUrl !== undefined) config.imageUrl = imageUrl;
    if (featuresTitle !== undefined) config.featuresTitle = featuresTitle;
    if (featuresSubtitle !== undefined) config.featuresSubtitle = featuresSubtitle;
    if (screenshotsTitle !== undefined) config.screenshotsTitle = screenshotsTitle;
    if (screenshotsSubtitle !== undefined) config.screenshotsSubtitle = screenshotsSubtitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (enableFeaturesSection !== undefined) config.enableFeaturesSection = enableFeaturesSection;
    if (enableScreenshotsSection !== undefined) config.enableScreenshotsSection = enableScreenshotsSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(featuresList)) {
      config.featuresList = featuresList.map((item) => ({
        title: item.title || "",
        description: item.description || item.desc || "",
        icon: item.icon || "Boxes",
        color: item.color || "text-green-600 bg-green-50",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    if (Array.isArray(screenshotsList)) {
      config.screenshotsList = screenshotsList.map((item) => ({
        title: item.title || "",
        description: item.description || "",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Dealer App configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Dealer App configuration",
      error: error.message,
    });
  }
};

// Get Dealer App Config
const getDealerAppConfig = async (req, res) => {
  try {
    let config = await DealerAppConfig.findOne();

    if (!config) {
      config = new DealerAppConfig();
      await config.save();
    }

    // Dynamic backfill to ensure default schema values are present
    const schemaPaths = DealerAppConfig.schema.paths;
    let modified = false;
    for (const path in schemaPaths) {
      if (path === '_id' || path === '__v' || path === 'createdAt' || path === 'updatedAt') continue;
      if (
        config[path] === undefined || 
        config[path] === null || 
        config[path] === "" ||
        (path === 'featuresList' && (!config[path] || config[path].length === 0)) ||
        (path === 'screenshotsList' && (!config[path] || config[path].length === 0))
      ) {
        config[path] = typeof schemaPaths[path].defaultValue === 'function'
          ? schemaPaths[path].defaultValue()
          : schemaPaths[path].defaultValue;
        modified = true;
      }
    }
    if (modified) {
      await config.save();
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Dealer App configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveDealerAppConfig,
  getDealerAppConfig,
};
