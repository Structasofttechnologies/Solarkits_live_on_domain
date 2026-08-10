const SolarShopConfig = require("../models/solar_shop.model");

// Save / Update Solar Shop Config
const saveSolarShopConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing",
      });
    }

    let config = await SolarShopConfig.findOne();

    if (!config) {
      config = new SolarShopConfig();
    }

    // Assign fields dynamically
    Object.assign(config, req.body);

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Solar Shop configuration saved successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save Solar Shop configuration",
      error: error.message,
    });
  }
};

// Get Solar Shop Config
const getSolarShopConfig = async (req, res) => {
  try {
    let config = await SolarShopConfig.findOne();

    if (!config) {
      // Create with default values if not exists
      config = new SolarShopConfig();
      await config.save();
    } else {
      // Backfill missing default values in case the database document has missing fields
      let updated = false;
      const paths = SolarShopConfig.schema.paths;
      for (const path in paths) {
        if (path !== '_id' && path !== '__v' && paths[path].defaultValue !== undefined) {
          // Explicitly backfill if undefined, or if array fields are empty
          if (
            config[path] === undefined ||
            (path === 'features' && (!config[path] || config[path].length === 0)) ||
            (path === 'solutionsList' && (!config[path] || config[path].length === 0)) ||
            (path === 'crmList' && (!config[path] || config[path].length === 0)) ||
            (path === 'whyChooseList' && (!config[path] || config[path].length === 0)) ||
            (path === 'metricsList' && (!config[path] || config[path].length === 0)) ||
            (path === 'testimonialsList' && (!config[path] || config[path].length === 0))
          ) {
            config[path] = typeof paths[path].defaultValue === 'function'
              ? paths[path].defaultValue()
              : paths[path].defaultValue;
            updated = true;
          }
        }
      }
      if (updated) {
        await config.save();
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
      message: "Failed to fetch Solar Shop configuration",
      error: error.message,
    });
  }
};

module.exports = {
  saveSolarShopConfig,
  getSolarShopConfig,
};
