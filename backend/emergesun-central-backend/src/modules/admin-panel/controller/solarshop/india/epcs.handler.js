const { EpcAccount, EpcSignupRequest } = require("../../../models/india_solarshop_db");
const { EpcCompany } = require("../../../models/india_core_db");
const { GeoLevel0, GeoLevel1 } = require("../../../models/geolocation_db");
const { delete_uploaded_files } = require("../../../utils/upload.files");

const get_epc_requests = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", state = "", status = "pending" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        let filter = {};
        if (status && status !== "all") filter.status = status;
        if (search) {
            filter.$or = [
                { company_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { whatsapp: { $regex: search, $options: 'i' } }
            ];
        }
        if (state && state !== "all") filter.state_id = state;

        const total = await EpcSignupRequest.countDocuments(filter);
        const requests = await EpcSignupRequest.find(filter)
            .populate('account_id')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const india = await GeoLevel0.findOne({ iso2: "in" });
        const states = await GeoLevel1.find({ level_0: india._id });
        const stateMap = new Map(states.map(s => [s._id.toString(), s.name]));

        // 🚀 Fetch districts for mapping
        const districtIds = requests.map(r => r.district_id).filter(Boolean);
        const { GeoLevel2 } = require("../../../models/geolocation_db");
        const districts = await GeoLevel2.find({ _id: { $in: districtIds } });
        const districtMap = new Map(districts.map(d => [d._id.toString(), d.name]));

        const data = requests.map(r => ({
            ...r,
            id: r._id,
            account_name: r.account_id?.name,
            registered_whatsapp: r.account_id?.registered_whatsapp,
            is_registered_same_as_whatsapp: r.account_id?.is_registered_same_as_whatsapp,
            state_name: r.state_id ? stateMap.get(r.state_id.toString()) : null,
            district_name: r.district_id ? districtMap.get(r.district_id.toString()) : null
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const summary = {
            total_requests: total,
            today_requests: await EpcSignupRequest.countDocuments({ created_at: { $gte: today } }),
            this_week_requests: await EpcSignupRequest.countDocuments({ created_at: { $gte: weekStart } }),
            this_week_reqests: await EpcSignupRequest.countDocuments({ created_at: { $gte: weekStart } }) // ⚡ Fallback for frontend typo
        };

        return res.json({
            status: "success",
            message: "EPC requests fetched successfully",
            data,
            summary,
            pagination: { total, page, limit, total_pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error("get_epc_requests error:", error);
        return res.status(500).json({ status: "error", message: "Failed to fetch requests" });
    }
};

const update_epc_request_status = async (req, res) => {
    try {
        const { request_id, action } = req.body;
        if (!request_id || !action) {
            if (req.files) delete_uploaded_files(req.files);
            return res.status(400).json({ status: "error", message: "request_id and action are required" });
        }

        const referenceImage = req.files?.[0]?.path;
        if (action === "approve" && !referenceImage) {
            return res.status(400).json({ status: "error", message: "Reference image is required for approval" });
        }

        const request = await EpcSignupRequest.findOne({ _id: request_id });
        if (!request) {
            if (req.files) delete_uploaded_files(req.files);
            return res.status(404).json({ status: "error", message: "Request not found" });
        }

        if (action === "approve") {
            // ⚡ Create the EPC Company in core DB
            const newEpc = await EpcCompany.create({
                name: request.company_name,
                email: request.email,
                source: "verified",
                working_states: [request.state_id]
            });

            // ⚡ Update the User Account status and link company
            await EpcAccount.updateOne({ _id: request.account_id }, { 
                $set: { status: 'approved', company_id: newEpc._id } 
            });

            // ⚡ Mark request as approved
            await EpcSignupRequest.updateOne({ _id: request_id }, {
                $set: {
                    status: 'approved',
                    reference_image: referenceImage,
                    reviewed_by: req.user.id,
                    reviewed_at: new Date()
                }
            });
        } else if (action === "reject") {
            if (req.files) delete_uploaded_files(req.files);
            await EpcAccount.updateOne({ _id: request.account_id }, { $set: { status: 'rejected' } });
            await EpcSignupRequest.updateOne({ _id: request_id }, { $set: { status: 'rejected' } });
        } else {
            if (req.files) delete_uploaded_files(req.files);
            return res.status(400).json({ status: "error", message: "Invalid action" });
        }

        return res.json({ status: "success", message: `Request ${action}d successfully` });
    } catch (error) {
        if (req.files) delete_uploaded_files(req.files);
        console.error("❌ update_epc_request_status Error:", error);
        return res.status(500).json({ 
            status: "error", 
            message: "Failed to update request",
            error: error.message 
        });
    }
};

module.exports = { get_epc_requests, update_epc_request_status };