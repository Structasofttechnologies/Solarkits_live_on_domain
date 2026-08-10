const Contact = require("../models/contact.model");

// create or upsert contact configuration
const createContactInfo = async (req, res) => {
    try {
        let contact = await Contact.findOne().sort({ updatedAt: -1 });

        if (contact) {
            Object.assign(contact, req.body);
            await contact.save();
        } else {
            contact = new Contact(req.body);
            await contact.save();
        }

        return res.status(200).json({
            success: true,
            message: "Contact configuration saved successfully",
            data: contact
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to save contact configuration.",
            error: error.message,
        });
    }
};

// update contact configuration
const updateContactInfo = async (req, res) => {
    try {
        const { id } = req.params;

        let updatedContact;
        if (id && id !== "undefined") {
            try {
                updatedContact = await Contact.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } catch (err) {
                console.log("Invalid Contact ID provided, searching for latest:", err.message);
            }
        }

        if (!updatedContact) {
            let latest = await Contact.findOne().sort({ updatedAt: -1 });
            if (latest) {
                updatedContact = await Contact.findByIdAndUpdate(
                    latest._id,
                    req.body,
                    { new: true, runValidators: true }
                );
            } else {
                updatedContact = await Contact.create(req.body);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Contact configuration updated successfully.",
            data: updatedContact,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update contact configuration.",
            error: error.message,
        });
    }
};

// get contact configuration
const getContactInfo = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        let contact = await Contact.findOne().sort({ updatedAt: -1 });

        if (!contact) {
            contact = await Contact.create({});
        } else {
            let updated = false;
            if (contact.mapTitle === undefined) {
                contact.mapTitle = "Map View";
                updated = true;
            }
            if (contact.mapSubtitle === undefined) {
                contact.mapSubtitle = "Interactive map integrations will load in this canvas";
                updated = true;
            }
            if (contact.mapStatus === undefined) {
                contact.mapStatus = true;
                updated = true;
            }
            if (contact.faqTitle === undefined) {
                contact.faqTitle = "Frequently Asked Questions";
                updated = true;
            }
            if (contact.faqStatus === undefined) {
                contact.faqStatus = true;
                updated = true;
            }
            if (!contact.faqs || contact.faqs.length === 0) {
                contact.faqs = [
                    { q: "How long does a solar installation take?", a: "Residential installations typically take 2-4 days, while commercial projects vary depending on scale and planning compliance." },
                    { q: "What is the lifespan of solar panels?", a: "High-quality solar panels have an active lifespan of 25-30 years, often with linear power warranties up to 25 years." },
                    { q: "Do you offer solar warranties?", a: "Yes! We offer a full workmanship warranty alongside standard manufacture product warranties for materials, inverters, and battery banks." },
                    { q: "How can I calculate my ROI?", a: "Our consultants will analyze your billing, property size, and sun exposure profile to calculate a accurate ROI payoff schedule." }
                ];
                updated = true;
            }
            if (updated) {
                await contact.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Contact configuration fetched successfully.",
            data: contact
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get contact configuration.",
            error: error.message,
        });
    }
};

module.exports = {
    createContactInfo,
    updateContactInfo,
    getContactInfo
};
