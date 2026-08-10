const About = require("../models/about.model");

// create or upsert about-us configuration
const createAboutUs = async (req, res) => {
    try {
        const { badgeText, title, subTitle, description, primaryBtnText, secondaryBtnText, imageUrl, status } = req.body;

        let about = await About.findOne().sort({ updatedAt: -1 });

        if (about) {
            if (badgeText !== undefined) about.badgeText = badgeText;
            if (title !== undefined) about.title = title;
            if (subTitle !== undefined) about.subTitle = subTitle;
            if (description !== undefined) about.description = description;
            if (primaryBtnText !== undefined) about.primaryBtnText = primaryBtnText;
            if (secondaryBtnText !== undefined) about.secondaryBtnText = secondaryBtnText;
            if (imageUrl !== undefined) about.imageUrl = imageUrl;
            if (status !== undefined) about.status = status;
            await about.save();
        } else {
            about = new About({
                badgeText,
                title,
                subTitle,
                description,
                primaryBtnText,
                secondaryBtnText,
                imageUrl,
                status: status !== undefined ? status : true,
            });
            await about.save();
        }

        return res.status(200).json({
            success: true,
            message: "About Us configuration saved successfully",
            data: about
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create/save About Us configuration.",
            error: error.message,
        });
    }
};

// update about-us configuration
const updateAboutUs = async (req, res) => {
    try {
        const { id } = req.params;

        let updatedAbout;
        if (id && id !== "undefined") {
            try {
                updatedAbout = await About.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } catch (err) {
                console.log("Invalid About ID provided, finding latest entry:", err.message);
            }
        }

        if (!updatedAbout) {
            let latest = await About.findOne().sort({ updatedAt: -1 });
            if (latest) {
                updatedAbout = await About.findByIdAndUpdate(
                    latest._id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } else {
                updatedAbout = await About.create(req.body);
            }
        }

        return res.status(200).json({
            success: true,
            message: "About Us configuration updated successfully.",
            data: updatedAbout,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update About Us configuration.",
            error: error.message,
        });
    }
};

// get about-us configuration
const getAboutUs = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const about = await About.findOne().sort({ updatedAt: -1 });

        if (!about) {
            return res.status(404).json({
                success: false,
                message: "About Us configuration not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "About Us configuration fetched successfully.",
            data: about
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get About Us configuration.",
            error: error.message,
        });
    }
};

module.exports = {
    createAboutUs,
    updateAboutUs,
    getAboutUs
};
