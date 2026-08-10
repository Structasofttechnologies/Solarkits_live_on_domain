const validatePricingPlan = (req, res, next) => {
  const { planName, price } = req.body;
  const errors = {};

  if (!planName || typeof planName !== "string" || planName.trim() === "") {
    errors.planName = "Plan Name is required and must be a string.";
  }

  if (!price || typeof price !== "string" || price.trim() === "") {
    errors.price = "Price is required and must be a string.";
  }

  // Validate features array if present
  if (req.body.features && !Array.isArray(req.body.features)) {
    errors.features = "Features must be an array.";
  } else if (req.body.features) {
    req.body.features.forEach((feat, index) => {
      if (!feat.title || typeof feat.title !== "string" || feat.title.trim() === "") {
        errors[`features[${index}].title`] = "Feature title is required.";
      }
    });
  }

  // Validate softwareIncluded array if present
  if (req.body.softwareIncluded && !Array.isArray(req.body.softwareIncluded)) {
    errors.softwareIncluded = "Software Included must be an array.";
  } else if (req.body.softwareIncluded) {
    req.body.softwareIncluded.forEach((sw, index) => {
      if (!sw.title || typeof sw.title !== "string" || sw.title.trim() === "") {
        errors[`softwareIncluded[${index}].title`] = "Software title is required.";
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  next();
};

module.exports = {
  validatePricingPlan,
};

