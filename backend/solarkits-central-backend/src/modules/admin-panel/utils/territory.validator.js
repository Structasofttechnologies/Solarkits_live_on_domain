/**
 * territory.validator.js
 *
 * Server-side Territory Validation Service, Precedence Engine & Atomic Assignment.
 * Phase 3 — Reseller Management System
 * Phase R3 — District Exclusivity, Partial Index Guard & Territory History Logging.
 *
 * Security Guard: Never trust client-submitted territory authorization.
 * Always re-evaluate on server before allowing catalog view, EPC buyer creation, or order confirmation.
 */

const {
  Reseller,
  ResellerTerritory,
  TerritoryAssignmentHistory,
  SolarShopSettings,
} = require('../models/india_solarshop_db');
const { logAudit } = require('./audit.service');

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

/**
 * Phase R3: Atomic Race-Safe Territory Assignment Service.
 *
 * Enforces:
 *   1. District Exclusivity Policy from solarshop_settings (`territory_exclusivity_mode`).
 *   2. Detection of conflicting active primary assignment for the district.
 *   3. Rejection unless an override_reason is provided.
 *   4. Revocation of existing active assignment if overridden.
 *   5. Immutable log entry in territory_assignment_history.
 *   6. Central audit logging.
 */
async function assignTerritoryAtomic({
  reseller_id,
  territory_level,
  country_id,
  state_id,
  district_id,
  assignment_type = 'primary',
  exclusivity_scope = 'strict',
  is_exclusive = true,
  allowed_project_type_ids = [],
  allowed_industry_type_ids = [],
  source = 'admin_assigned',
  override_reason = null,
  expiry_date = null,
  actor_id = null,
  req = null,
}) {
  const reseller = await Reseller.findOne({ _id: reseller_id, deleted_at: null });
  if (!reseller) {
    return { success: false, message: 'Reseller account not found or deleted' };
  }

  // 1. Fetch platform exclusivity policy
  const settings = await SolarShopSettings.findOne().lean();
  const globalMode = settings?.territory_exclusivity_mode || 'strict';

  const isExclusiveAssignment = is_exclusive && assignment_type === 'primary' && (exclusivity_scope === 'strict' || globalMode === 'strict');

  // 2. Conflict Check for district, state, or country
  let conflictingTerritory = null;
  if (isExclusiveAssignment) {
    const conflictQuery = {
      territory_level,
      assignment_type: 'primary',
      is_exclusive: true,
      status: 'active',
    };

    if (territory_level === 'district' && district_id) {
      conflictQuery.district_id = district_id;
    } else if (territory_level === 'state' && state_id) {
      conflictQuery.state_id = state_id;
    } else if (territory_level === 'country' && country_id) {
      conflictQuery.country_id = country_id;
    }

    if (conflictQuery.district_id || conflictQuery.state_id || conflictQuery.country_id) {
      conflictingTerritory = await ResellerTerritory.findOne(conflictQuery);

      if (conflictingTerritory && String(conflictingTerritory.reseller_id) !== String(reseller_id)) {
        // Conflict detected with a DIFFERENT reseller
        if (!override_reason || !override_reason.trim()) {
          const conflictingReseller = await Reseller.findById(conflictingTerritory.reseller_id).select('business_name email').lean();
          const levelName = territory_level.charAt(0).toUpperCase() + territory_level.slice(1);
          return {
            success: false,
            code: 'EXCLUSIVE_TERRITORY_CONFLICT',
            territory_level,
            conflicting_reseller_id: conflictingTerritory.reseller_id,
            conflicting_reseller_name: conflictingReseller?.business_name || 'Another Franchisee',
            message: `${levelName} territory is exclusively assigned to reseller "${conflictingReseller?.business_name || conflictingTerritory.reseller_id}". An explicit override_reason is required to replace this assignment.`,
          };
        }
      }
    }
  }

  // 3. Handle Override Revocation if conflicting territory exists and reason is provided
  if (conflictingTerritory && String(conflictingTerritory.reseller_id) !== String(reseller_id)) {
    const beforeRevoke = conflictingTerritory.toObject();
    conflictingTerritory.status = 'revoked';
    await conflictingTerritory.save();

    // Record revocation history
    await TerritoryAssignmentHistory.create({
      territory_id: conflictingTerritory._id,
      reseller_id: conflictingTerritory.reseller_id,
      action: 'OVERRIDE',
      territory_level: conflictingTerritory.territory_level,
      country_id: conflictingTerritory.country_id,
      state_id: conflictingTerritory.state_id,
      district_id: conflictingTerritory.district_id,
      assignment_type: conflictingTerritory.assignment_type,
      exclusivity_scope: conflictingTerritory.exclusivity_scope,
      source: 'admin_override',
      reason: `Revoked via admin override in favor of reseller ${reseller_id}. Reason: ${override_reason.trim()}`,
      actor_id: actor_id,
      before_snapshot: beforeRevoke,
      after_snapshot: conflictingTerritory.toObject(),
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: actor_id,
      action: 'TERRITORY_REVOKE_OVERRIDE',
      entity_type: 'reseller_territories',
      entity_id: conflictingTerritory._id,
      before_snapshot: beforeRevoke,
      after_snapshot: conflictingTerritory.toObject(),
      reason: override_reason.trim(),
      metadata: { replaced_by_reseller_id: reseller_id },
      req,
    });
  }

  // 4. Create New Territory Entry
  try {
    const newTerritory = await ResellerTerritory.create({
      reseller_id,
      territory_level,
      country_id,
      state_id: state_id || null,
      district_id: district_id || null,
      assignment_type,
      exclusivity_scope,
      is_exclusive,
      allowed_project_type_ids,
      allowed_industry_type_ids,
      source: conflictingTerritory ? 'admin_override' : source,
      override_reason: override_reason ? override_reason.trim() : null,
      assigned_by: actor_id,
      expiry_date: expiry_date || null,
      status: 'active',
    });

    // Record assignment history
    await TerritoryAssignmentHistory.create({
      territory_id: newTerritory._id,
      reseller_id: newTerritory.reseller_id,
      action: conflictingTerritory ? 'OVERRIDE' : 'ASSIGN',
      territory_level: newTerritory.territory_level,
      country_id: newTerritory.country_id,
      state_id: newTerritory.state_id,
      district_id: newTerritory.district_id,
      assignment_type: newTerritory.assignment_type,
      exclusivity_scope: newTerritory.exclusivity_scope,
      source: newTerritory.source,
      reason: newTerritory.override_reason,
      actor_id: actor_id,
      before_snapshot: null,
      after_snapshot: newTerritory.toObject(),
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: actor_id,
      action: conflictingTerritory ? 'TERRITORY_OVERRIDE' : 'TERRITORY_ASSIGN',
      entity_type: 'reseller_territories',
      entity_id: newTerritory._id,
      after_snapshot: newTerritory.toObject(),
      reason: override_reason ? override_reason.trim() : null,
      req,
    });

    return {
      success: true,
      territory: newTerritory,
      overridden_previous_assignment: Boolean(conflictingTerritory),
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        success: false,
        code: 'EXCLUSIVE_TERRITORY_CONFLICT',
        message: `${territory_level.toUpperCase()} territory is strictly exclusive and already assigned to another reseller (MongoDB partial index rejection).`,
      };
    }
    throw error;
  }
}

module.exports = {
  validateResellerTerritoryAccess,
  validateEpcResellerTerritoryMatch,
  assignTerritoryAtomic,
};
