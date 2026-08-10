const Header = require("../models/header.model");

// create or upsert the header 
const createHeader = async (req, res) => {
    try {
        const { badge, title, subtitle, description, imageUrl, status, erpModulesTitle, erpModulesSubTitle, erpModulesStatus, erpModules } = req.body;

        let header = await Header.findOne().sort({ updatedAt: -1 });

        if (header) {
            if (badge !== undefined) header.badge = badge;
            if (title !== undefined) header.title = title;
            if (subtitle !== undefined) header.subtitle = subtitle;
            if (description !== undefined) header.description = description;
            if (imageUrl !== undefined) header.imageUrl = imageUrl;
            if (status !== undefined) header.status = status;
            if (erpModulesTitle !== undefined) header.erpModulesTitle = erpModulesTitle;
            if (erpModulesSubTitle !== undefined) header.erpModulesSubTitle = erpModulesSubTitle;
            if (erpModulesStatus !== undefined) header.erpModulesStatus = erpModulesStatus;
            if (erpModules !== undefined) header.erpModules = erpModules;
            await header.save();
        } else {
            header = new Header({
                badge,
                title,
                subtitle,
                description,
                imageUrl,
                status: status !== undefined ? status : true,
                erpModulesTitle,
                erpModulesSubTitle,
                erpModulesStatus,
                erpModules,
            });
            await header.save();
        }

        return res.status(200).json({
            success: true,
            message: "Header saved successfully",
            data: header
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create header.",
            error: error.message,
        });
    }
}


// update the header 
const updateHeader = async (req, res) => {
    try {
        const { id } = req.params;

        let updatedHeader;
        if (id && id !== "undefined") {
            try {
                updatedHeader = await Header.findByIdAndUpdate(
                    id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );
            } catch (err) {
                console.log("Invalid ID provided, searching for latest header:", err.message);
            }
        }

        if (!updatedHeader) {
            let latest = await Header.findOne().sort({ updatedAt: -1 });
            if (latest) {
                updatedHeader = await Header.findByIdAndUpdate(
                    latest._id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } else {
                updatedHeader = await Header.create(req.body);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Header updated successfully.",
            data: updatedHeader,
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update header.",
            error: error.message,
        });
    }
}


// get header 
const getHeader = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const header = await Header.findOne().sort({ updatedAt: -1 });

        if (!header) {
            return res.status(404).json({
                success: false,
                message: "Header not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Header fetched successfully.",
            data: header
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get header.",
            error: error.message,
        });
    }
}

module.exports = {
    createHeader,
    updateHeader,
    getHeader
};
