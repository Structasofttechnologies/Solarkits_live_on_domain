const mongoose = require("mongoose");
const GeoLevel0 = require("../../models/geolocation_db/geo_level_0.schema");
const GeoLevel1 = require("../../models/geolocation_db/geo_level_1.schema");
const GeoLevel2 = require("../../models/geolocation_db/geo_level_2.schema");
const CompanyWarehouse = require("../../models/india_core_db/company_warehouses.schema");

const get_states = async (req, res) => {
    try {
        // Query active states (as configured/activated from admin panel)
        const india = await GeoLevel0.findOne({ name: { $regex: /^India$/i } });

        const query = {
            is_active: true,
            $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
        };

        if (india) {
            query.level_0 = india._id;
        }

        const states = await GeoLevel1.find(query).sort({ name: 1 }).select('_id name is_active');

        // Map response to match standard format (id instead of _id)
        const formattedStates = states.map(s => ({
            id: s._id.toString(),
            name: s.name,
            is_active: s.is_active
        }));

        return res.status(200).json({ states: formattedStates });

    } catch (error) {
        console.error("get_states error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const get_districts_by_state = async (req, res) => {
    try {
        const { state_id } = req.query;

        if (!state_id) {
            return res.status(400).json({ error: "state_id is required" });
        }

        const query = {
            is_active: true,
            $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
        };

        if (mongoose.Types.ObjectId.isValid(state_id)) {
            query.level_1 = new mongoose.Types.ObjectId(state_id);
        } else {
            // Find by state name
            const stateDoc = await GeoLevel1.findOne({
                name: { $regex: new RegExp(`^${state_id.trim()}$`, "i") },
                $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
            });
            if (stateDoc) {
                query.level_1 = stateDoc._id;
            } else {
                return res.status(200).json({ districts: [] });
            }
        }

        // Fetch all active districts for this state as activated from admin panel
        const districts = await GeoLevel2.find(query).sort({ name: 1 }).select('_id name level_1 is_active');

        // Map response to match standard format
        const formattedDistricts = districts.map(d => ({
            id: d._id.toString(),
            name: d.name,
            state_id: d.level_1 ? d.level_1.toString() : null,
            is_active: d.is_active
        }));

        return res.status(200).json({ districts: formattedDistricts });

    } catch (error) {
        console.error("get_districts_by_state error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// -------------------------------------------------------------
// Boundary DB Setup and District Boundary Lookup Endpoint
// -------------------------------------------------------------
const { geolocation_boundary_db } = require("../../../../config/databases");
const boundaryDb = geolocation_boundary_db || mongoose;

const boundaryCountrySchema = new mongoose.Schema({
  iso2: { type: String, required: true }
}, { collection: 'geolocation_level_0' });

const boundaryStateSchema = new mongoose.Schema({
  level_0: { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_0' },
  name: { type: String, required: true }
}, { collection: 'geolocation_level_1' });

const boundaryDistrictSchema = new mongoose.Schema({
  level_1: { type: mongoose.Schema.Types.ObjectId, ref: 'geolocation_level_1' },
  name: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  geometry_type: { type: String },
  coordinates: {
    type: { type: String },
    coordinates: { type: Array }
  }
}, { collection: 'geolocation_level_2' });

const BoundaryCountry = boundaryDb.model('geolocation_level_0', boundaryCountrySchema);
const BoundaryState = boundaryDb.model('geolocation_level_1', boundaryStateSchema);
const BoundaryDistrict = boundaryDb.model('geolocation_level_2', boundaryDistrictSchema);

const get_district_boundary = async (req, res) => {
    try {
        const { district, state, country } = req.query;

        if (!district || !state || !country) {
            return res.status(400).json({ error: "district, state, and country are required" });
        }

        const countryDoc = await GeoLevel0.findOne({ name: { $regex: new RegExp(`^${country}$`, "i") }, deleted_at: null });
        if (!countryDoc) {
            return res.status(404).json({ error: `Country "${country}" not found.` });
        }

        const stateDoc = await GeoLevel1.findOne({ name: { $regex: new RegExp(`^${state}$`, "i") }, level_0: countryDoc._id, deleted_at: null });
        if (!stateDoc) {
            return res.status(404).json({ error: `State "${state}" not found under "${country}".` });
        }

        const districtDoc = await GeoLevel2.findOne({ name: { $regex: new RegExp(`^${district}$`, "i") }, level_1: stateDoc._id, deleted_at: null });
        if (!districtDoc) {
            return res.status(404).json({ error: `District "${district}" not found under "${state}".` });
        }

        const boundaryCountry = await BoundaryCountry.findOne({ iso2: countryDoc.iso2 });
        let boundaryData = null;
        if (boundaryCountry) {
            const boundaryState = await BoundaryState.findOne({ level_0: boundaryCountry._id, name: { $regex: new RegExp(`^${state}$`, "i") } });
            if (boundaryState) {
                boundaryData = await BoundaryDistrict.findOne({ level_1: boundaryState._id, name: { $regex: new RegExp(`^${district}$`, "i") } });
            }
        }

        return res.status(200).json({
            success: true,
            district: {
                id: districtDoc._id.toString(),
                name: districtDoc.name,
                lat: boundaryData?.lat || 0,
                lng: boundaryData?.lng || 0,
                geometry: {
                    type: boundaryData?.geometry_type || (boundaryData?.coordinates ? boundaryData.coordinates.type : 'Point'),
                    coordinates: boundaryData?.coordinates?.coordinates || [],
                },
                boundary: boundaryData?.coordinates?.coordinates || [],
            }
        });

    } catch (error) {
        console.error("get_district_boundary error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { get_states, get_districts_by_state, get_district_boundary };