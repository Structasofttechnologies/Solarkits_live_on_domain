const AmcConfig = require('../models/amc.model');

const getAmcConfig = async (req, res) => {
  try {
    let config = await AmcConfig.findOne();
    if (!config) {
      config = new AmcConfig();
      await config.save();
    }
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch AMC configuration", error: error.message });
  }
};

const saveAmcConfig = async (req, res) => {
  try {
    let config = await AmcConfig.findOne();
    if (!config) config = new AmcConfig();

    const fields = [
      'heroTitle','heroDescription','primaryBtnText','primaryBtnLink',
      'secondaryBtnText','rightBannerTitle','imageUrl',
      'featuresTitle','featuresSubtitle',
      'processTitle','processSubtitle',
      'benefitsTitle','benefitsSubtitle',
      'screenshotsTitle','screenshotsSubtitle',
      'enableSection', 'enableFeaturesSection', 'enableProcessSection', 'enableBenefitsSection', 'enableScreenshotsSection', 'lastUpdated'
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) config[f] = req.body[f]; });

    if (Array.isArray(req.body.metricsList)) {
      config.metricsList = req.body.metricsList.map(m => ({ value: m.value||"", label: m.label||"", theme: m.theme||"orange" }));
    }
    if (Array.isArray(req.body.featuresList)) {
      config.featuresList = req.body.featuresList.map(f => ({ title: f.title||"", description: f.description||"", icon: f.icon||"FileText", enabled: f.enabled !== undefined ? f.enabled : true }));
    }
    if (Array.isArray(req.body.processList)) {
      config.processList = req.body.processList.map(p => ({ step: p.step||"", title: p.title||"", description: p.description||"", icon: p.icon||"FileText", enabled: p.enabled !== undefined ? p.enabled : true }));
    }
    if (Array.isArray(req.body.benefitsList)) {
      config.benefitsList = req.body.benefitsList.map(b => ({ title: b.title||"", description: b.description||"", enabled: b.enabled !== undefined ? b.enabled : true }));
    }
    if (Array.isArray(req.body.screenshotsList)) {
      config.screenshotsList = req.body.screenshotsList.map(s => ({ title: s.title||"", description: s.description||"", enabled: s.enabled !== undefined ? s.enabled : true }));
    }

    await config.save();
    return res.status(200).json({ success: true, message: "AMC configuration saved successfully", data: config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to save AMC configuration", error: error.message });
  }
};

module.exports = { getAmcConfig, saveAmcConfig };
