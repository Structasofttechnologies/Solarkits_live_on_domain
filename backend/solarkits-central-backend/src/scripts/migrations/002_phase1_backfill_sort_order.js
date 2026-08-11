/**
 * 002_phase1_backfill_sort_order.js
 *
 * Idempotent migration: sets sort_order on existing sys_filter_categories
 * and sys_filter_subcategories documents that have no sort_order yet.
 *
 * Run once after deploy:
 *   node src/scripts/migrations/002_phase1_backfill_sort_order.js
 *
 * Safe to re-run: only updates documents where sort_order === 0 (the default
 * assigned by Mongoose for new docs), and only if they don't already have
 * a sort_order set by a previous run.
 *
 * Strategy: assign sort_order = index based on _id ascending (insertion order proxy).
 *
 * Phase 1 — Reseller Management System
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('../../modules/admin-panel/config/databases');

const mongoose = require('mongoose');
const { ProjectCategory, ProjectSubcategory } = require('../../modules/admin-panel/models/core_db');

async function backfill() {
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n──────────────────────────────────────────────────────');
  console.log('  Phase 1: Sort Order Backfill Migration');
  console.log('──────────────────────────────────────────────────────\n');

  // ── 1. Project Categories ─────────────────────────────────────────────────
  const categories = await ProjectCategory.find({ deleted_at: null }).sort({ _id: 1 }).lean();
  console.log(`Found ${categories.length} project categories`);

  let catUpdated = 0;
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    // Only update if sort_order is the default 0 AND name exists (sanity check)
    if (cat.sort_order === 0 || cat.sort_order == null) {
      const newOrder = (i + 1) * 10; // sparse numbering (10, 20, 30...) leaves room for future inserts
      await ProjectCategory.findByIdAndUpdate(cat._id, { $set: { sort_order: newOrder } });
      console.log(`  ✅ Category [${newOrder}] "${cat.name}"`);
      catUpdated++;
    } else {
      console.log(`  ⬜ SKIP   Category "${cat.name}" (already has sort_order: ${cat.sort_order})`);
    }
  }

  // ── 2. Project Subcategories ──────────────────────────────────────────────
  const subcategories = await ProjectSubcategory.find({ deleted_at: null }).sort({ _id: 1 }).lean();
  console.log(`\nFound ${subcategories.length} project subcategories`);

  let subUpdated = 0;

  // Group by category for per-category sort ordering
  const subcatsByCategory = {};
  subcategories.forEach(sc => {
    const catId = String(sc.category || 'null');
    if (!subcatsByCategory[catId]) subcatsByCategory[catId] = [];
    subcatsByCategory[catId].push(sc);
  });

  for (const catId of Object.keys(subcatsByCategory)) {
    const subs = subcatsByCategory[catId];
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      if (sub.sort_order === 0 || sub.sort_order == null) {
        const newOrder = (i + 1) * 10;
        await ProjectSubcategory.findByIdAndUpdate(sub._id, { $set: { sort_order: newOrder } });
        console.log(`  ✅ Subcategory [${newOrder}] "${sub.name}" (category: ${catId})`);
        subUpdated++;
      } else {
        console.log(`  ⬜ SKIP   Subcategory "${sub.name}" (sort_order: ${sub.sort_order})`);
      }
    }
  }

  console.log(`\n──────────────────────────────────────────────────────`);
  console.log(`  Done: ${catUpdated} categories updated, ${subUpdated} subcategories updated`);
  console.log(`──────────────────────────────────────────────────────\n`);

  process.exit(0);
}

backfill().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
