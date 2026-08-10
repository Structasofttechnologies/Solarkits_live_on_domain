const HeroSection = require("../models/hero_section.model");

// Save / Update Hero Section Config
const saveHeroSectionConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    const {
      badge,
      title,
      subtitle,
      description,
      primaryBtnText,
      secondaryBtnText,
      imageUrl,
      enableSection,
    } = req.body;

    let config = await HeroSection.findOne().sort({ updatedAt: -1 });

    if (!config) {
      config = new HeroSection();
    }

    if (badge !== undefined) config.badge = badge;
    if (title !== undefined) config.title = title;
    if (subtitle !== undefined) config.subtitle = subtitle;
    if (description !== undefined) config.description = description;
    if (primaryBtnText !== undefined) config.primaryBtnText = primaryBtnText;
    if (secondaryBtnText !== undefined) config.secondaryBtnText = secondaryBtnText;
    if (imageUrl !== undefined) config.imageUrl = imageUrl;
    if (enableSection !== undefined) config.enableSection = enableSection;

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Hero Section configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Hero Section configuration",
      error: error.message,
    });
  }
};

// Get Hero Section Config
const getHeroSectionConfig = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    let config = await HeroSection.findOne().sort({ updatedAt: -1 });

    if (!config) {
      // Create default
      config = await HeroSection.create({});
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Hero Section configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveHeroSectionConfig,
  getHeroSectionConfig,
};
