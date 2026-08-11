/**
 * industry.types.route.js
 *
 * Admin routes for Industry Type management.
 * All routes require CMS auth + module permission check (unique_code: ADM_INDUSTRY_TYPES).
 *
 * Route prefix (registered in index.js): /admin-api/industry-types
 *
 * Phase 1 — Reseller Management System
 */

const express = require('express');
const router = express.Router();

const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const handler = require('../controller/industry.types.handler');

// ─── Industry Type CRUD ────────────────────────────────────────────────────────

router.get(
  '/list',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['view'] }]),
  handler.list_industry_types
);

router.post(
  '/add',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['add'] }]),
  handler.add_industry_type
);

router.put(
  '/update',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['edit'] }]),
  handler.update_industry_type
);

router.put(
  '/toggle-status',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['edit'] }]),
  handler.toggle_industry_type_status
);

router.delete(
  '/delete',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['delete'] }]),
  handler.delete_industry_type
);

// ─── Project-Subcategory ↔ Industry Type Mappings ─────────────────────────────

router.post(
  '/map-to-subcategory',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['add'] }]),
  handler.map_industry_to_subcategory
);

router.delete(
  '/unmap',
  check_auth,
  check_permissions([{ unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['delete'] }]),
  handler.unmap_industry_from_subcategory
);

router.get(
  '/mappings',
  check_auth,
  check_permissions([
    { unique_code: 'ADM_INDUSTRY_TYPES', permissions: ['view'] },
    { unique_code: 'ADM_PROJ_TYPES',     permissions: ['view'] },
    { unique_code: 'RSL_MGMT',           permissions: ['view'] },
  ]),
  handler.get_industry_mappings_for_subcategory
);

module.exports = router;
