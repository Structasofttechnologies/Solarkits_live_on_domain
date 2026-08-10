const MarketplaceConfig = require("../models/marketplace.model");

// Save / Update Marketplace Config
const saveMarketplaceConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const { heroTitle, heroDescription, buttonText, buttonLink, imageUrl, featuresTitle, featuresList, stepsTitle, stepsList, whyChooseTitle, whyChooseImage, whyChooseList, ctaTitle, ctaDescription, ctaButtonText, ctaButtonLink, enableSection, enableFeaturesSection, enableStepsSection, enableWhyChooseSection, enableCtaSection, lastUpdated } = req.body;

    let config = await MarketplaceConfig.findOne();

    if (!config) {
      config = new MarketplaceConfig();
    }

    if (heroTitle !== undefined) config.heroTitle = heroTitle;
    if (heroDescription !== undefined) config.heroDescription = heroDescription;
    if (buttonText !== undefined) config.buttonText = buttonText;
    if (buttonLink !== undefined) config.buttonLink = buttonLink;
    if (imageUrl !== undefined) config.imageUrl = imageUrl;
    if (featuresTitle !== undefined) config.featuresTitle = featuresTitle;
    if (stepsTitle !== undefined) config.stepsTitle = stepsTitle;
    if (whyChooseTitle !== undefined) config.whyChooseTitle = whyChooseTitle;
    if (whyChooseImage !== undefined) config.whyChooseImage = whyChooseImage;
    if (ctaTitle !== undefined) config.ctaTitle = ctaTitle;
    if (ctaDescription !== undefined) config.ctaDescription = ctaDescription;
    if (ctaButtonText !== undefined) config.ctaButtonText = ctaButtonText;
    if (ctaButtonLink !== undefined) config.ctaButtonLink = ctaButtonLink;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (enableFeaturesSection !== undefined) config.enableFeaturesSection = enableFeaturesSection;
    if (enableStepsSection !== undefined) config.enableStepsSection = enableStepsSection;
    if (enableWhyChooseSection !== undefined) config.enableWhyChooseSection = enableWhyChooseSection;
    if (enableCtaSection !== undefined) config.enableCtaSection = enableCtaSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(featuresList)) {
      config.featuresList = featuresList.map((item) => ({
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "ShieldCheck",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    if (Array.isArray(stepsList)) {
      config.stepsList = stepsList.map((item) => ({
        num: item.num || "",
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "FileEdit",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    if (Array.isArray(whyChooseList)) {
      config.whyChooseList = whyChooseList.map((item) => ({
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "IndianRupee",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Marketplace configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Marketplace configuration",
      error: error.message,
    });
  }
};

// Get Marketplace Config
const getMarketplaceConfig = async (req, res) => {
  try {
    let config = await MarketplaceConfig.findOne();

    if (!config) {
      // Create and save defaults
      config = new MarketplaceConfig();
      await config.save();
    }

    // Dynamic backfill to ensure default schema values are present
    const schemaPaths = MarketplaceConfig.schema.paths;
    let modified = false;
    for (const path in schemaPaths) {
      if (path === '_id' || path === '__v' || path === 'createdAt' || path === 'updatedAt') continue;
      if (
        config[path] === undefined || 
        config[path] === null || 
        config[path] === "" ||
        (path === 'featuresList' && (!config[path] || config[path].length === 0)) ||
        (path === 'stepsList' && (!config[path] || config[path].length === 0)) ||
        (path === 'whyChooseList' && (!config[path] || config[path].length === 0))
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
      message: "Failed to fetch Marketplace configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveMarketplaceConfig,
  getMarketplaceConfig,
};
