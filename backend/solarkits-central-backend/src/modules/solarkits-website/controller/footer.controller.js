const Footer = require("../models/footer.model");

// create or upsert footer configuration
const createFooterInfo = async (req, res) => {
    try {
        let footer = await Footer.findOne().sort({ updatedAt: -1 });

        if (footer) {
            Object.assign(footer, req.body);
            await footer.save();
        } else {
            footer = new Footer(req.body);
            await footer.save();
        }

        return res.status(200).json({
            success: true,
            message: "Footer configuration saved successfully",
            data: footer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to save footer configuration.",
            error: error.message,
        });
    }
};

// update footer configuration
const updateFooterInfo = async (req, res) => {
    try {
        const { id } = req.params;

        let updatedFooter;
        if (id && id !== "undefined") {
            try {
                updatedFooter = await Footer.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } catch (err) {
                console.log("Invalid Footer ID provided, finding latest entry:", err.message);
            }
        }

        if (!updatedFooter) {
            let latest = await Footer.findOne().sort({ updatedAt: -1 });
            if (latest) {
                updatedFooter = await Footer.findByIdAndUpdate(
                    latest._id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } else {
                updatedFooter = await Footer.create(req.body);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Footer configuration updated successfully.",
            data: updatedFooter,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update footer configuration.",
            error: error.message,
        });
    }
};

// get footer configuration
const getFooterInfo = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const footer = await Footer.findOne().sort({ updatedAt: -1 });

        if (!footer) {
            return res.status(404).json({
                success: false,
                message: "Footer configuration not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Footer configuration fetched successfully.",
            data: footer
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get footer configuration.",
            error: error.message,
        });
    }
};

module.exports = {
    createFooterInfo,
    updateFooterInfo,
    getFooterInfo
};
