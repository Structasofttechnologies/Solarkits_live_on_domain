require('dotenv').config();
require('../modules/admin-panel/config/databases');
const mongoose = require('mongoose');

const DUMMY_PLANS = [
  // ── District-Level Plans ──────────────────────────────────────────────────
  {
    name: 'District Starter Partner',
    slug: 'district-starter-partner',
    territory_level: 'district',
    one_time_fee: 25000,
    currency: 'INR',
    validity_value: 1,
    validity_unit: 'years',
    allowed_territories_count: 1,
    description: 'Ideal for local solar contractors operating in a single district. Includes standard commission rate and wholesale dealer margins.',
    sort_order: 1,
    is_active: true,
  },
  {
    name: 'District Multi-Zone Partner',
    slug: 'district-multi-zone-partner',
    territory_level: 'district',
    one_time_fee: 60000,
    currency: 'INR',
    validity_value: 1,
    validity_unit: 'years',
    allowed_territories_count: 3,
    description: 'Expand your operations across up to 3 adjacent districts with enhanced margins and priority EPC buyer onboarding.',
    sort_order: 2,
    is_active: true,
  },

  // ── State-Level Plans ────────────────────────────────────────────────────
  {
    name: 'State Prime Partner',
    slug: 'state-prime-partner',
    territory_level: 'state',
    one_time_fee: 150000,
    currency: 'INR',
    validity_value: 1,
    validity_unit: 'years',
    allowed_territories_count: 1,
    description: 'Exclusive state-level distribution rights with tier-1 wholesale pricing, unlimited EPC sub-accounts, and priority catalog access.',
    sort_order: 3,
    is_active: true,
  },
  {
    name: 'Multi-State Enterprise Partner',
    slug: 'multi-state-enterprise-partner',
    territory_level: 'state',
    one_time_fee: 350000,
    currency: 'INR',
    validity_value: 1,
    validity_unit: 'years',
    allowed_territories_count: 3,
    description: 'High-volume multi-state coverage with dedicated account manager, custom catalog margins, and priority warehouse dispatch.',
    sort_order: 4,
    is_active: true,
  },

  // ── Country-Level Plans ──────────────────────────────────────────────────
  {
    name: 'National Master Franchise',
    slug: 'national-master-franchise',
    territory_level: 'country',
    one_time_fee: 1000000,
    currency: 'INR',
    validity_value: 2,
    validity_unit: 'years',
    allowed_territories_count: 1,
    description: 'Premium pan-India master reseller rights with top-tier distributor pricing, custom commission structures, and direct API access.',
    sort_order: 5,
    is_active: true,
  },
];

setTimeout(async () => {
  try {
    const { ResellerPlan } = require('../modules/admin-panel/models/india_solarshop_db');
    console.log("Seeding Reseller Plans into database...");

    for (const plan of DUMMY_PLANS) {
      await ResellerPlan.updateOne(
        { slug: plan.slug },
        { $set: plan },
        { upsert: true }
      );
      console.log(`✓ Plan seeded: ${plan.name} (${plan.territory_level.toUpperCase()} LEVEL - ₹${plan.one_time_fee.toLocaleString('en-IN')})`);
    }

    console.log("\n✅ All 5 District, State, and Country Reseller Plans saved into database successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    process.exit(0);
  }
}, 3000);
