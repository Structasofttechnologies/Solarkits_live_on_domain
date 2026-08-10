const AboutDetails = require("../models/about_details.model");

// Create or upsert About Details configuration
const createAboutDetails = async (req, res) => {
  try {
    const {
      missionTitle,
      missionDescription,
      visionTitle,
      visionDescription,
      storyTitle,
      storyParagraph1,
      storyParagraph2,
      valuesTitle,
      values,
      stats,
      ctaTitle,
      ctaDescription,
      ctaButtonText,
      ctaButtonLink,
      ctaStatus,
      status,
    } = req.body;

    let details = await AboutDetails.findOne().sort({ updatedAt: -1 });

    if (details) {
      if (missionTitle !== undefined) details.missionTitle = missionTitle;
      if (missionDescription !== undefined) details.missionDescription = missionDescription;
      if (visionTitle !== undefined) details.visionTitle = visionTitle;
      if (visionDescription !== undefined) details.visionDescription = visionDescription;
      if (storyTitle !== undefined) details.storyTitle = storyTitle;
      if (storyParagraph1 !== undefined) details.storyParagraph1 = storyParagraph1;
      if (storyParagraph2 !== undefined) details.storyParagraph2 = storyParagraph2;
      if (valuesTitle !== undefined) details.valuesTitle = valuesTitle;
      if (values !== undefined) details.values = values;
      if (stats !== undefined) details.stats = stats;
      if (ctaTitle !== undefined) details.ctaTitle = ctaTitle;
      if (ctaDescription !== undefined) details.ctaDescription = ctaDescription;
      if (ctaButtonText !== undefined) details.ctaButtonText = ctaButtonText;
      if (ctaButtonLink !== undefined) details.ctaButtonLink = ctaButtonLink;
      if (ctaStatus !== undefined) details.ctaStatus = ctaStatus;
      if (status !== undefined) details.status = status;
      await details.save();
    } else {
      details = new AboutDetails({
        missionTitle,
        missionDescription,
        visionTitle,
        visionDescription,
        storyTitle,
        storyParagraph1,
        storyParagraph2,
        valuesTitle,
        values,
        stats,
        ctaTitle,
        ctaDescription,
        ctaButtonText,
        ctaButtonLink,
        ctaStatus: ctaStatus !== undefined ? ctaStatus : true,
        status: status !== undefined ? status : true,
      });
      await details.save();
    }

    return res.status(200).json({
      success: true,
      message: "About details configuration saved successfully",
      data: details,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create/save About details configuration.",
      error: error.message,
    });
  }
};

// Update About Details configuration
const updateAboutDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let updatedDetails;
    if (id && id !== "undefined") {
      try {
        updatedDetails = await AboutDetails.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
      } catch (err) {
        console.log("Invalid About Details ID provided, finding latest entry:", err.message);
      }
    }

    if (!updatedDetails) {
      let latest = await AboutDetails.findOne().sort({ updatedAt: -1 });
      if (latest) {
        updatedDetails = await AboutDetails.findByIdAndUpdate(latest._id, req.body, {
          new: true,
          runValidators: true,
        });
      } else {
        updatedDetails = await AboutDetails.create(req.body);
      }
    }

    return res.status(200).json({
      success: true,
      message: "About details configuration updated successfully.",
      data: updatedDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update About details configuration.",
      error: error.message,
    });
  }
};

// Get About Details configuration
const getAboutDetails = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    let details = await AboutDetails.findOne().sort({ updatedAt: -1 });

    if (!details) {
      // Create a default details configuration if none exists
      details = await AboutDetails.create({});
    } else {
      // Seed missing values or stats for pre-existing configurations
      let updated = false;
      if (!details.values || details.values.length === 0) {
        details.values = [
          { icon: "Leaf", title: "Sustainability", description: "Committed to environmental stewardship" },
          { icon: "Sparkles", title: "Innovation", description: "Pushing boundaries in solar technology" },
          { icon: "Users", title: "Customer First", description: "Your satisfaction is our priority" },
          { icon: "ShieldCheck", title: "Quality", description: "Highest standards in every installation" }
        ];
        updated = true;
      }
      if (!details.stats || details.stats.length === 0) {
        details.stats = [
          { value: "10K+", label: "Installations" },
          { value: "15+", label: "Years Experience" },
          { value: "50MW+", label: "Solar Capacity" },
          { value: "98%", label: "Customer Satisfaction" }
        ];
        updated = true;
      }
      if (details.ctaTitle === undefined) {
        details.ctaTitle = "Ready to Go Solar?";
        updated = true;
      }
      if (details.ctaDescription === undefined) {
        details.ctaDescription = "Join thousands of satisfied customers who have made the switch to clean, renewable energy.";
        updated = true;
      }
      if (details.ctaButtonText === undefined) {
        details.ctaButtonText = "Get Free Consultation";
        updated = true;
      }
      if (details.ctaButtonLink === undefined) {
        details.ctaButtonLink = "/contact";
        updated = true;
      }
      if (details.ctaStatus === undefined) {
        details.ctaStatus = true;
        updated = true;
      }
      if (updated) {
        await details.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "About details configuration fetched successfully.",
      data: details,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get About details configuration.",
      error: error.message,
    });
  }
};

module.exports = {
  createAboutDetails,
  updateAboutDetails,
  getAboutDetails,
};
