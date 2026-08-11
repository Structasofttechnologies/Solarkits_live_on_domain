/**
 * reseller.territory.handler.js
 *
 * Admin controller for Reseller Territory assignments & coverage checks.
 * Phase 3 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { Reseller, ResellerTerritory } = require('../models/india_solarshop_db');
const { GeoLevel0, GeoLevel1, GeoLevel2 } = require('../models/geolocation_db');
const { CmsUser } = require('../models/user_db');
const { validateResellerTerritoryAccess } = require('../utils/territory.validator');
const { logAudit } = require('../utils/audit.service');

// ─── 1. LIST RESELLER TERRITORIES ─────────────────────────────────────────────
/**
 * GET /admin-api/resellers/:id/territories/list
 */
const list_reseller_territories = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    const rows = await ResellerTerritory.find({ reseller_id: id })
      .sort({ created_at: -1 })
      .lean();

    const countryIds = [...new Set(rows.map((r) => r.country_id).filter(Boolean))];
    const stateIds = [...new Set(rows.map((r) => r.state_id).filter(Boolean))];
    const districtIds = [...new Set(rows.map((r) => r.district_id).filter(Boolean))];
    const assignedByIds = [...new Set(rows.map((r) => r.assigned_by).filter(Boolean))];

    const [countries, states, districts, users] = await Promise.all([
      countryIds.length ? GeoLevel0.find({ _id: { $in: countryIds } }).select('name iso2 currency').lean() : [],
      stateIds.length ? GeoLevel1.find({ _id: { $in: stateIds } }).select('name state_code').lean() : [],
      districtIds.length ? GeoLevel2.find({ _id: { $in: districtIds } }).select('name').lean() : [],
      assignedByIds.length ? CmsUser.find({ _id: { $in: assignedByIds } }).select('name email').lean() : [],
    ]);

    const cMap = countries.reduce((acc, c) => { acc[c._id.toString()] = { id: c._id, name: c.name, iso2: c.iso2, currency: c.currency }; return acc; }, {});
    const sMap = states.reduce((acc, s) => { acc[s._id.toString()] = { id: s._id, name: s.name, state_code: s.state_code }; return acc; }, {});
    const dMap = districts.reduce((acc, d) => { acc[d._id.toString()] = { id: d._id, name: d.name }; return acc; }, {});
    const uMap = users.reduce((acc, u) => { acc[u._id.toString()] = { id: u._id, name: u.name, email: u.email }; return acc; }, {});

    const data = rows.map((r) => {
      const c = r.country_id ? cMap[r.country_id.toString()] : null;
      const s = r.state_id ? sMap[r.state_id.toString()] : null;
      const d = r.district_id ? dMap[r.district_id.toString()] : null;

      let location_name = "Pan-India / Country";
      if (r.territory_level === 'district' && d) location_name = d.name;
      else if (r.territory_level === 'state' && s) location_name = s.name;
      else if (c) location_name = c.name;

      return {
        id:              r._id,
        reseller_id:     r.reseller_id,
        territory_level: r.territory_level,
        country:         c,
        state:           s,
        district:        d,
        location_name:   location_name,
        source:          r.source,
        precedence_source: r.source,
        override_reason: r.override_reason,
        assigned_by:     r.assigned_by ? uMap[r.assigned_by.toString()] : null,
        effective_date:  r.effective_date,
        expiry_date:     r.expiry_date,
        status:          r.status,
        created_at:      r.created_at,
      };
    });

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.territory] list_reseller_territories error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. ASSIGN TERRITORY ──────────────────────────────────────────────────────
/**
 * POST /admin-api/resellers/:id/territories/assign
 * Body: { territory_level, country_id, state_id?, district_id?, source?, override_reason?, expiry_date? }
 */
const assign_territory = async (req, res) => {
  try {
    const { id } = req.params;
    const { territory_level, country_id, state_id, district_id, source, override_reason, expiry_date } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }
    if (!territory_level || !['district', 'state', 'country'].includes(territory_level)) {
      return res.status(400).json({ status: 'error', message: 'territory_level must be district, state, or country' });
    }
    if (!country_id || !mongoose.Types.ObjectId.isValid(country_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid country_id is required' });
    }
    if (territory_level !== 'country' && (!state_id || !mongoose.Types.ObjectId.isValid(state_id))) {
      return res.status(400).json({ status: 'error', message: 'Valid state_id is required for state/district level' });
    }
    if (territory_level === 'district' && (!district_id || !mongoose.Types.ObjectId.isValid(district_id))) {
      return res.status(400).json({ status: 'error', message: 'Valid district_id is required for district level' });
    }

    const reseller = await Reseller.findOne({ _id: id, deleted_at: null });
    if (!reseller) {
      return res.status(404).json({ status: 'error', message: 'Reseller account not found' });
    }

    // Check for duplicate active assignment
    const query = {
      reseller_id:     id,
      territory_level: territory_level,
      country_id:      country_id,
      state_id:        state_id || null,
      district_id:     district_id || null,
      status:          'active',
    };
    const existing = await ResellerTerritory.findOne(query);
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'This territory is already assigned to the reseller' });
    }

    const territory = await ResellerTerritory.create({
      reseller_id:     id,
      territory_level: territory_level,
      country_id:      country_id,
      state_id:        state_id || null,
      district_id:     district_id || null,
      source:          source || 'admin_assigned',
      override_reason: override_reason ? override_reason.trim() : null,
      assigned_by:     req.user?.id || null,
      expiry_date:     expiry_date || null,
      status:          'active',
    });

    await logAudit({
      actor_type:  'cms_user',
      actor_id:    req.user?.id,
      action:      'ASSIGN_RESELLER_TERRITORY',
      entity_type: 'reseller_territories',
      entity_id:   territory._id,
      after_snapshot: { reseller_id: id, territory_level, country_id, state_id, district_id },
      req,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Territory assigned successfully',
      data: territory,
    });
  } catch (error) {
    console.error('[reseller.territory] assign_territory error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. DELETE/REMOVE TERRITORY ASSIGNMENT ────────────────────────────────────
/**
 * DELETE /admin-api/resellers/territories/:id
 */
const remove_territory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid territory assignment ID is required' });
    }

    const territory = await ResellerTerritory.findByIdAndDelete(id);
    if (!territory) {
      return res.status(404).json({ status: 'error', message: 'Territory assignment not found' });
    }

    await logAudit({
      actor_type:  'cms_user',
      actor_id:    req.user?.id,
      action:      'REMOVE_RESELLER_TERRITORY',
      entity_type: 'reseller_territories',
      entity_id:   territory._id,
      before_snapshot: territory.toObject(),
      req,
    });

    return res.json({ status: 'success', message: 'Territory assignment removed successfully' });
  } catch (error) {
    console.error('[reseller.territory] remove_territory error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. VALIDATE/CHECK TERRITORY ACCESS ───────────────────────────────────────
/**
 * POST /admin-api/resellers/:id/territories/validate
 * Body: { country_id, state_id, district_id }
 */
const validate_territory_access = async (req, res) => {
  try {
    const { id } = req.params;
    const { country_id, state_id, district_id } = req.body;

    const result = await validateResellerTerritoryAccess({
      reseller_id: id,
      country_id,
      state_id,
      district_id,
    });

    return res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[reseller.territory] validate_territory_access error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_territories,
  assign_territory,
  remove_territory,
  validate_territory_access,
};
