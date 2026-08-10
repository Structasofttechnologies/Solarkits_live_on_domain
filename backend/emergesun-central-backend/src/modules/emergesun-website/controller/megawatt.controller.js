const MegawattConfig = require('../models/megawatt.model');

// Save or Update Megawatt Config
const saveMegawattConfig = async (req, res) => {
  try {
    const {
      heroTitle,
      heroDescription,
      primaryBtnText,
      primaryBtnLink,
      secondaryBtnText,
      imageUrl,
      rightBannerTitle,
      metricsList,
      phasesTitle,
      phasesSubtitle,
      phasesList,
      featuresTitle,
      featuresSubtitle,
      featuresList,
      screenshotsTitle,
      screenshotsSubtitle,
      screenshotsList,
      enableSection,
      enablePhasesSection,
      enableFeaturesSection,
      enableScreenshotsSection,
      lastUpdated
    } = req.body;

    let config = await MegawattConfig.findOne();

    if (!config) {
      config = new MegawattConfig();
    }

    if (heroTitle !== undefined) config.heroTitle = heroTitle;
    if (heroDescription !== undefined) config.heroDescription = heroDescription;
    if (primaryBtnText !== undefined) config.primaryBtnText = primaryBtnText;
    if (primaryBtnLink !== undefined) config.primaryBtnLink = primaryBtnLink;
    if (secondaryBtnText !== undefined) config.secondaryBtnText = secondaryBtnText;
    if (imageUrl !== undefined) config.imageUrl = imageUrl;
    if (rightBannerTitle !== undefined) config.rightBannerTitle = rightBannerTitle;
    if (phasesTitle !== undefined) config.phasesTitle = phasesTitle;
    if (phasesSubtitle !== undefined) config.phasesSubtitle = phasesSubtitle;
    if (featuresTitle !== undefined) config.featuresTitle = featuresTitle;
    if (featuresSubtitle !== undefined) config.featuresSubtitle = featuresSubtitle;
    if (screenshotsTitle !== undefined) config.screenshotsTitle = screenshotsTitle;
    if (screenshotsSubtitle !== undefined) config.screenshotsSubtitle = screenshotsSubtitle;
    if (enableSection !== undefined) config.enableSection = enableSection;
    if (enablePhasesSection !== undefined) config.enablePhasesSection = enablePhasesSection;
    if (enableFeaturesSection !== undefined) config.enableFeaturesSection = enableFeaturesSection;
    if (enableScreenshotsSection !== undefined) config.enableScreenshotsSection = enableScreenshotsSection;
    if (lastUpdated !== undefined) config.lastUpdated = lastUpdated;

    if (Array.isArray(metricsList)) {
      config.metricsList = metricsList.map((item) => ({
        value: item.value || "",
        label: item.label || "",
        theme: item.theme || "orange"
      }));
    }

    if (Array.isArray(phasesList)) {
      config.phasesList = phasesList.map((item) => ({
        num: item.num || "",
        title: item.title || "",
        description: item.description || item.desc || "",
        icon: item.icon || "FileText",
        enabled: item.enabled !== undefined ? item.enabled : true
      }));
    }

    if (Array.isArray(featuresList)) {
      config.featuresList = featuresList.map((item) => ({
        title: item.title || "",
        description: item.description || item.desc || "",
        icon: item.icon || "FolderGit2",
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
      message: "Megawatt configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Megawatt configuration",
      error: error.message,
    });
  }
};

// Get Megawatt Config
const getMegawattConfig = async (req, res) => {
  try {
    let config = await MegawattConfig.findOne();

    if (!config) {
      config = new MegawattConfig();
      await config.save();
    }

    // Dynamic backfill to ensure default schema values are present
    const schemaPaths = MegawattConfig.schema.paths;
    let modified = false;
    for (const path in schemaPaths) {
      if (path === '_id' || path === '__v' || path === 'createdAt' || path === 'updatedAt') continue;
      if (
        config[path] === undefined || 
        config[path] === null || 
        config[path] === "" ||
        (path === 'metricsList' && (!config[path] || config[path].length === 0)) ||
        (path === 'phasesList' && (!config[path] || config[path].length === 0)) ||
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
      message: "Failed to fetch Megawatt configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveMegawattConfig,
  getMegawattConfig,
};
