/**
 * 001_phase1_seed_reseller_modules.js
 *
 * Idempotent seeder script — registers all Phase 1 reseller CMS module records.
 *
 * Run once after deploy:
 *   node src/scripts/migrations/001_phase1_seed_reseller_modules.js
 *
 * Safe to re-run: uses upsert by unique_code, never overwrites existing active modules.
 *
 * Phase 1 — Reseller Management System
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('../../modules/admin-panel/config/databases'); // open all Mongoose connections

const mongoose = require('mongoose');
const { CmsModule, CmsPanel, CmsLevel } = require('../../modules/admin-panel/models/user_db');

// ─── New module definitions ────────────────────────────────────────────────────
//
// These modules will be registered under the 'admin-panel' panel.
// Level: must match an existing cms_levels document (assumed: 'feature' or equivalent).
// dashboard_context: 'default' for all reseller modules (not product-gated).
//
// Unique codes follow the established convention: ADM_* for global admin, RSL_* for reseller-specific.

const MODULES_TO_SEED = [
  // ── Industry Types (ADM_ prefix — shared with project types domain) ───────
  {
    unique_code:       'ADM_INDUSTRY_TYPES',
    name:              'Industry Types',
    dashboard_context: 'default',
    saas_product_slug: null,
  },

  // ── Reseller Types ────────────────────────────────────────────────────────
  {
    unique_code:       'RSL_TYPES',
    name:              'Reseller Types',
    dashboard_context: 'default',
    saas_product_slug: null,
  },

  // ── Reseller Management (primary module + sub-modules) ───────────────────
  {
    unique_code:       'RSL_MGMT',
    name:              'Reseller Management',
    dashboard_context: 'default',
    saas_product_slug: null,
  },
  {
    unique_code:       'RSL_KYC',
    name:              'Reseller KYC Review',
    dashboard_context: 'default',
    saas_product_slug: null,
    parent_unique_code: 'RSL_MGMT',
  },
  {
    unique_code:       'RSL_PLAN',
    name:              'Reseller Plans',
    dashboard_context: 'default',
    saas_product_slug: null,
  },
  {
    unique_code:       'RSL_TERRITORY',
    name:              'Reseller Territories',
    dashboard_context: 'default',
    saas_product_slug: null,
    parent_unique_code: 'RSL_MGMT',
  },
  {
    unique_code:       'RSL_PROD_AUTH',
    name:              'Reseller Product Authorization',
    dashboard_context: 'default',
    saas_product_slug: null,
    parent_unique_code: 'RSL_MGMT',
  },

  // ── Commission & Wallet ───────────────────────────────────────────────────
  {
    unique_code:       'RSL_COMMISSION',
    name:              'Reseller Commission',
    dashboard_context: 'default',
    saas_product_slug: null,
  },
  {
    unique_code:       'RSL_WALLET',
    name:              'Reseller Wallet & Ledger',
    dashboard_context: 'default',
    saas_product_slug: null,
    parent_unique_code: 'RSL_COMMISSION',
  },

  // ── Agreement Templates ───────────────────────────────────────────────────
  {
    unique_code:       'RSL_AGREEMENT',
    name:              'Reseller Agreements',
    dashboard_context: 'default',
    saas_product_slug: null,
  },

  // ── EPC Buyers (reseller-onboarded) ──────────────────────────────────────
  {
    unique_code:       'RSL_EPC_BUYERS',
    name:              'Reseller EPC Buyers',
    dashboard_context: 'default',
    saas_product_slug: null,
    parent_unique_code: 'RSL_MGMT',
  },

  // ── Audit & Reports ───────────────────────────────────────────────────────
  {
    unique_code:       'RSL_AUDIT',
    name:              'Reseller Audit Logs',
    dashboard_context: 'default',
    saas_product_slug: null,
  },
  {
    unique_code:       'RSL_REPORTS',
    name:              'Reseller Reports',
    dashboard_context: 'default',
    saas_product_slug: null,
  },
];

// ─── Main seeder ──────────────────────────────────────────────────────────────
async function seed() {
  // Wait for all connections to be established
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n──────────────────────────────────────────────────────');
  console.log('  Phase 1: Reseller CMS Module Seeder');
  console.log('──────────────────────────────────────────────────────\n');

  // ── 1. Resolve the admin panel _id ────────────────────────────────────────
  const adminPanel = await CmsPanel.findOne({ slug: 'admin-panel' }).lean();
  if (!adminPanel) {
    console.error('ERROR: Could not find CmsPanel with slug "admin-panel". Ensure the panel exists before running this seeder.');
    process.exit(1);
  }
  console.log(`✓ Panel found: "${adminPanel.name}" (_id: ${adminPanel._id})`);

  // ── 2. Resolve a suitable default level ───────────────────────────────────
  const level = await CmsLevel.findOne({ is_active: true, is_deleted: { $ne: true } }).sort({ _id: 1 }).lean();
  if (!level) {
    console.error('ERROR: Could not find any active CmsLevel. Ensure at least one level exists.');
    process.exit(1);
  }
  console.log(`✓ Level found: "${level.name}" (_id: ${level._id})`);

  // ── 3. Build a lookup of unique_code → _id for parent resolution ──────────
  const existingModules = await CmsModule.find({}).lean();
  const existingMap     = {};
  existingModules.forEach(m => { existingMap[m.unique_code] = m._id; });

  // ── 4. Seed each module ────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const def of MODULES_TO_SEED) {
    const exists = await CmsModule.findOne({ unique_code: def.unique_code }).lean();

    if (exists) {
      console.log(`  ⬜ SKIP  [${def.unique_code}] — already exists`);
      existingMap[def.unique_code] = exists._id; // ensure parent lookup works
      skipped++;
      continue;
    }

    // Resolve parent module (if defined)
    let parent_module_id = null;
    if (def.parent_unique_code) {
      parent_module_id = existingMap[def.parent_unique_code] || null;
      if (!parent_module_id) {
        console.warn(`  ⚠ WARN  [${def.unique_code}] — parent "${def.parent_unique_code}" not found yet (will be null)`);
      }
    }

    const doc = await CmsModule.create({
      name:              def.name,
      unique_code:       def.unique_code,
      panel_id:          adminPanel._id,
      level_id:          level._id,
      parent_module_id:  parent_module_id,
      dashboard_context: def.dashboard_context || 'default',
      saas_product_id:   null,
      is_active:         true,
      is_deleted:        false,
    });

    existingMap[def.unique_code] = doc._id;
    console.log(`  ✅ CREATE [${def.unique_code}] "${def.name}" (_id: ${doc._id})`);
    created++;
  }

  console.log(`\n──────────────────────────────────────────────────────`);
  console.log(`  Done: ${created} created, ${skipped} skipped`);
  console.log(`──────────────────────────────────────────────────────\n`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeder failed with error:', err);
  process.exit(1);
});
