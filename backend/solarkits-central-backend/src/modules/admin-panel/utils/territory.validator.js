/**
 * territory.validator.js
 *
 * Server-side Territory Validation Service & Precedence Engine.
 * Phase 3 — Reseller Management System
 *
 * Rules & Precedence:
 *   1. 'admin_override' / 'admin_assigned': Explicit admin territory assignments override plan defaults.
 *   2. 'plan': Active plan subscription territory limits & level.
 *   3. 'gst_derived': Fallback to reseller's registered GSTIN state.
 *
 * Security Guard: Never trust client-submitted territory authorization.
 * Always re-evaluate on server before allowing catalog view, EPC buyer creation, or order confirmation.
 */

const { Reseller, ResellerTerritory, ResellerPlanSubscription } = require('../models/india_solarshop_db');

/**
 * Check if a location (country, state, district) is covered by active reseller territories.
 *
 * @param {string|ObjectId} resellerId
 * @param {object} location - { country_id, state_id, district_id }
 * @returns {Promise<object>} { is_allowed: boolean, source: string, reason: string, territory: object|null }
 */
async function validateResellerTerritoryAccess(resellerId, location = {}) {
  const { country_id, state_id, district_id } = location;

  const reseller = await Reseller.findOne({ _id: resellerId, deleted_at: null }).lean();
  if (!reseller) {
    return { is_allowed: false, source: 'none', reason: 'Reseller account not found or deleted', territory: null };
  }

  if (reseller.activation_status !== 'active') {
    return { is_allowed: false, source: 'none', reason: `Reseller is not active (status: ${reseller.activation_status})`, territory: null };
  }

  // 1. Fetch all active assigned territories sorted by precedence source
  const territories = await ResellerTerritory.find({
    reseller_id: resellerId,
    status: 'active',
  }).lean();

  if (territories.length > 0) {
    // Sort by precedence: admin_override (1) > admin_assigned (2) > plan (3) > gst_derived (4)
    const sourcePriority = { admin_override: 1, admin_assigned: 2, plan: 3, gst_derived: 4 };
    territories.sort((a, b) => (sourcePriority[a.source] || 9) - (sourcePriority[b.source] || 9));

    for (const t of territories) {
      // Check expiry date if set
      if (t.expiry_date && new Date(t.expiry_date) < new Date()) {
        continue; // Expired territory entry
      }

      // Matching rules based on level:
      if (t.territory_level === 'country') {
        if (!country_id || String(t.country_id) === String(country_id)) {
          return { is_allowed: true, source: t.source, reason: `Authorized at Country level (${t.source})`, territory: t };
        }
      } else if (t.territory_level === 'state') {
        if (!state_id || String(t.state_id) === String(state_id)) {
          return { is_allowed: true, source: t.source, reason: `Authorized at State level (${t.source})`, territory: t };
        }
      } else if (t.territory_level === 'district') {
        if (district_id && String(t.district_id) === String(district_id)) {
          return { is_allowed: true, source: t.source, reason: `Authorized at District level (${t.source})`, territory: t };
        }
      }
    }
  }

  // 2. GST Fallback (if reseller has registered state address matching location)
  if (reseller.address?.state_id && state_id && String(reseller.address.state_id) === String(state_id)) {
    return {
      is_allowed: true,
      source: 'gst_derived',
      reason: 'Authorized via GST registered state address fallback',
      territory: null,
    };
  }

  return {
    is_allowed: false,
    source: 'none',
    reason: 'Location is not within reseller authorized territories',
    territory: null,
  };
}

/**
 * Validate that an EPC buyer's address falls within reseller's authorized territory.
 */
async function validateEpcResellerTerritoryMatch(resellerId, epcAddress = {}) {
  const check = await validateResellerTerritoryAccess(resellerId, {
    country_id:  epcAddress.country_id,
    state_id:    epcAddress.state_id,
    district_id: epcAddress.district_id,
  });

  return {
    is_matched: check.is_allowed,
    source:     check.source,
    reason:     check.reason,
  };
}

module.exports = {
  validateResellerTerritoryAccess,
  validateEpcResellerTerritoryMatch,
};
