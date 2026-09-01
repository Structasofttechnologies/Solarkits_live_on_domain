/**
 * =========================================================================
 * SEED PROJECT CONFIGURATIONS HIERARCHY
 * =========================================================================
 * Industry Type -> Project Category -> Sub-Category -> System Type -> Capacity Range
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
require('../keys/config/databases');

const {
  IndustryType,
  ProjectCategory,
  ProjectSubcategory,
  ProjectType,
  ProjectSubcategoryType,
  ProjectRange,
  UnitGroup,
  Unit
} = require('../modules/admin-panel/models/core_db');

const RAW_ITEMS = [
  // 1-5: Solar PV -> Residential Solar
  { industry: "Solar PV", category: "Residential Solar", subcategory: "Individual Home", type: "On-Grid", min: 1, max: 10, unit: "kW" },
  { industry: "Solar PV", category: "Residential Solar", subcategory: "Individual Home", type: "Off-Grid", min: 1, max: 10, unit: "kW" },
  { industry: "Solar PV", category: "Residential Solar", subcategory: "Individual Home", type: "Hybrid", min: 1, max: 10, unit: "kW" },
  { industry: "Solar PV", category: "Residential Solar", subcategory: "Housing Society / RWA", type: "On-Grid", min: 10, max: 500, unit: "kW" },
  { industry: "Solar PV", category: "Residential Solar", subcategory: "Housing Society / RWA", type: "Hybrid", min: 10, max: 500, unit: "kW" },

  // 6-14: Solar PV -> Commercial & Industrial Solar
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Commercial Building", type: "On-Grid", min: 10, max: 1000, unit: "kW" }, // 10 kW–1 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Factory / Manufacturing Unit", type: "On-Grid", min: 50, max: 10000, unit: "kW" }, // 50 kW–10 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Factory / Manufacturing Unit", type: "Hybrid", min: 50, max: 10000, unit: "kW" }, // 50 kW–10 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Warehouse / Logistics Centre", type: "On-Grid", min: 25, max: 5000, unit: "kW" }, // 25 kW–5 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Hospital", type: "On-Grid / Hybrid", min: 25, max: 2000, unit: "kW" }, // 25 kW–2 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Hotel / Resort", type: "On-Grid / Hybrid", min: 10, max: 1000, unit: "kW" }, // 10 kW–1 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "School / College", type: "On-Grid / Hybrid", min: 10, max: 1000, unit: "kW" }, // 10 kW–1 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Shopping Mall / Retail", type: "On-Grid", min: 50, max: 5000, unit: "kW" }, // 50 kW–5 MW
  { industry: "Solar PV", category: "Commercial & Industrial Solar", subcategory: "Petrol Pump", type: "On-Grid / Hybrid", min: 5, max: 100, unit: "kW" }, // 5 kW–100 kW

  // 15-17: Solar PV -> Institutional & Government Solar
  { industry: "Solar PV", category: "Institutional & Government Solar", subcategory: "Government Building", type: "On-Grid", min: 10, max: 5000, unit: "kW" }, // 10 kW–5 MW
  { industry: "Solar PV", category: "Institutional & Government Solar", subcategory: "Railway / Metro Station", type: "On-Grid / Hybrid", min: 50, max: 10000, unit: "kW" }, // 50 kW–10 MW
  { industry: "Solar PV", category: "Institutional & Government Solar", subcategory: "Defence Facility", type: "Off-Grid / Hybrid", min: 10, max: 10000, unit: "kW" }, // 10 kW–10 MW

  // 18-22: Solar PV -> Utility-Scale Solar
  { industry: "Solar PV", category: "Utility-Scale Solar", subcategory: "Ground-Mounted Solar Plant", type: "Grid-Connected", min: 1, max: 500, unit: "MW" }, // 1 MW–500+ MW
  { industry: "Solar PV", category: "Utility-Scale Solar", subcategory: "Floating Solar Plant", type: "Grid-Connected", min: 1, max: 500, unit: "MW" }, // 1 MW–500+ MW
  { industry: "Solar PV", category: "Utility-Scale Solar", subcategory: "Solar Park", type: "Grid-Connected", min: 50, max: 1000, unit: "MW" }, // 50 MW–1 GW+
  { industry: "Solar PV", category: "Utility-Scale Solar", subcategory: "Captive Solar Plant", type: "Grid-Connected", min: 1, max: 100, unit: "MW" }, // 1 MW–100+ MW
  { industry: "Solar PV", category: "Utility-Scale Solar", subcategory: "Open-Access Solar Plant", type: "Grid-Connected", min: 1, max: 500, unit: "MW" }, // 1 MW–500+ MW

  // 23-27: Solar Agriculture -> Agricultural Solar
  { industry: "Solar Agriculture", category: "Agricultural Solar", subcategory: "Solar Water Pump", type: "DC / AC Pump System", min: 1, max: 20, unit: "HP" }, // 1 HP–20 HP
  { industry: "Solar Agriculture", category: "Agricultural Solar", subcategory: "PM-KUSUM Component A", type: "Grid-Connected Plant", min: 500, max: 2000, unit: "kW" }, // 500 kW–2 MW
  { industry: "Solar Agriculture", category: "Agricultural Solar", subcategory: "PM-KUSUM Component B", type: "Standalone Solar Pump", min: 1, max: 20, unit: "HP" }, // 1 HP–20 HP
  { industry: "Solar Agriculture", category: "Agricultural Solar", subcategory: "PM-KUSUM Component C", type: "Solarised Grid Pump", min: 1, max: 20, unit: "HP" }, // 1 HP–20 HP
  { industry: "Solar Agriculture", category: "Agricultural Solar", subcategory: "Farm / Cold Storage", type: "On-Grid / Hybrid", min: 10, max: 1000, unit: "kW" }, // 10 kW–1 MW

  // 28-32: Solar EV -> EV Charging Infrastructure
  { industry: "Solar EV", category: "EV Charging Infrastructure", subcategory: "Residential EV Charging", type: "Solar On-Grid / Hybrid", min: 3.3, max: 22, unit: "kW" }, // 3.3 kW–22 kW
  { industry: "Solar EV", category: "EV Charging Infrastructure", subcategory: "Commercial EV Charging", type: "AC Charging", min: 7.4, max: 22, unit: "kW" }, // 7.4 kW–22 kW
  { industry: "Solar EV", category: "EV Charging Infrastructure", subcategory: "Public Charging Station", type: "DC Fast Charging", min: 30, max: 240, unit: "kW" }, // 30 kW–240 kW
  { industry: "Solar EV", category: "EV Charging Infrastructure", subcategory: "Highway Charging Hub", type: "DC Ultra-Fast Charging", min: 120, max: 1000, unit: "kW" }, // 120 kW–1 MW+
  { industry: "Solar EV", category: "EV Charging Infrastructure", subcategory: "Fleet / Bus Depot", type: "Solar + Battery + EV Charging", min: 100, max: 10000, unit: "kW" }, // 100 kW–10 MW

  // 33-34: Solar EV -> Solar Carport
  { industry: "Solar EV", category: "Solar Carport", subcategory: "Residential Carport", type: "On-Grid / Hybrid", min: 3, max: 20, unit: "kW" }, // 3 kW–20 kW
  { industry: "Solar EV", category: "Solar Carport", subcategory: "Commercial Carport", type: "On-Grid / Hybrid", min: 20, max: 5000, unit: "kW" }, // 20 kW–5 MW

  // 35-37: Energy Storage -> Battery Energy Storage
  { industry: "Energy Storage", category: "Battery Energy Storage", subcategory: "Residential Storage", type: "Solar Hybrid / Backup", min: 1, max: 50, unit: "kWh" }, // 1 kWh–50 kWh
  { industry: "Energy Storage", category: "Battery Energy Storage", subcategory: "Commercial & Industrial Storage", type: "Behind-the-Meter BESS", min: 50, max: 10000, unit: "kWh" }, // 50 kWh–10 MWh
  { industry: "Energy Storage", category: "Battery Energy Storage", subcategory: "Utility-Scale Storage", type: "Grid-Scale BESS", min: 1, max: 1000, unit: "MWh" }, // 1 MWh–1 GWh+

  // 38-40: Solar Lighting -> Outdoor Solar Lighting
  { industry: "Solar Lighting", category: "Outdoor Solar Lighting", subcategory: "Solar Street Light", type: "Standalone", min: 9, max: 120, unit: "W" }, // 9 W–120 W
  { industry: "Solar Lighting", category: "Outdoor Solar Lighting", subcategory: "Highway / Area Lighting", type: "Standalone / Centralised", min: 20, max: 200, unit: "W" }, // 20 W–200 W
  { industry: "Solar Lighting", category: "Outdoor Solar Lighting", subcategory: "Solar High-Mast Light", type: "Standalone / Hybrid", min: 200, max: 2000, unit: "W" }, // 200 W–2 kW

  // 41-43: Solar Thermal -> Solar Heating
  { industry: "Solar Thermal", category: "Solar Heating", subcategory: "Residential Water Heating", type: "Evacuated Tube / Flat Plate", min: 100, max: 500, unit: "LPD" }, // 100–500 LPD
  { industry: "Solar Thermal", category: "Solar Heating", subcategory: "Commercial Water Heating", type: "Centralised System", min: 500, max: 10000, unit: "LPD" }, // 500–10,000 LPD
  { industry: "Solar Thermal", category: "Solar Heating", subcategory: "Industrial Process Heating", type: "Concentrated Solar Thermal", min: 100, max: 50000, unit: "kWth" }, // 100 kWth–50 MWth

  // 44-46: Rural Solar -> Decentralised Solar
  { industry: "Rural Solar", category: "Decentralised Solar", subcategory: "Village Mini-Grid", type: "Off-Grid / Hybrid Mini-Grid", min: 10, max: 1000, unit: "kW" }, // 10 kW–1 MW
  { industry: "Rural Solar", category: "Decentralised Solar", subcategory: "Telecom Tower", type: "Off-Grid / Hybrid", min: 3, max: 50, unit: "kW" }, // 3 kW–50 kW
  { industry: "Rural Solar", category: "Decentralised Solar", subcategory: "Remote Facility", type: "Off-Grid / Hybrid", min: 1, max: 500, unit: "kW" }, // 1 kW–500 kW
];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
}

async function ensureUnits() {
  console.log('Ensuring all required units exist in pc_units...');
  
  // Power group
  let powerGroup = await UnitGroup.findOne({ name: "Power", deleted_at: null });
  if (!powerGroup) {
    powerGroup = await UnitGroup.create({ name: "Power", is_system: true, is_active: true });
  }

  // Energy group
  let energyGroup = await UnitGroup.findOne({ name: "Energy", deleted_at: null });
  if (!energyGroup) {
    energyGroup = await UnitGroup.create({ name: "Energy", is_system: true, is_active: true });
  }

  // Volume / Count group for LPD
  let volumeGroup = await UnitGroup.findOne({ name: { $in: ["Volume", "Count"] }, deleted_at: null });
  if (!volumeGroup) {
    volumeGroup = await UnitGroup.create({ name: "Volume", is_system: true, is_active: true });
  }

  const unitsToEnsure = [
    { name: "Kilowatt", symbol: "kW", group: powerGroup._id, factor: 1000, is_base: false },
    { name: "Megawatt", symbol: "MW", group: powerGroup._id, factor: 1000000, is_base: false },
    { name: "Watt", symbol: "W", group: powerGroup._id, factor: 1, is_base: true },
    { name: "Horsepower", symbol: "HP", group: powerGroup._id, factor: 745.7, is_base: false },
    { name: "Kilowatt Thermal", symbol: "kWth", group: powerGroup._id, factor: 1000, is_base: false },
    { name: "Kilowatt-hour", symbol: "kWh", group: energyGroup._id, factor: 1000, is_base: false },
    { name: "Megawatt-hour", symbol: "MWh", group: energyGroup._id, factor: 1000000, is_base: false },
    { name: "Litres Per Day", symbol: "LPD", group: volumeGroup._id, factor: 1, is_base: false },
  ];

  for (const u of unitsToEnsure) {
    const existing = await Unit.findOne({ symbol: u.symbol, deleted_at: null });
    if (!existing) {
      await Unit.create({
        name: u.name,
        symbol: u.symbol,
        unit_group_id: u.group,
        conversion_factor: u.factor,
        is_base_unit: u.is_base,
        is_system: true,
        is_active: true
      });
      console.log(`  ➕ Created Unit: ${u.name} (${u.symbol})`);
    }
  }
}

async function seed() {
  console.log('====================================================');
  console.log('🚀 SEEDING PROJECT CONFIGURATIONS');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await ensureUnits();

  // Load all units into map by symbol
  const allUnits = await Unit.find({ deleted_at: null });
  const unitMap = new Map(allUnits.map(u => [u.symbol, u]));

  let counters = {
    industryCreated: 0,
    categoryCreated: 0,
    subcategoryCreated: 0,
    subcategoryReassigned: 0,
    typeCreated: 0,
    typeMapCreated: 0,
    rangeCreated: 0,
    skipped: 0
  };

  // Re-link helper: Subcategories that belong to Commercial & Industrial Solar
  const commercialSubcats = [
    "Commercial Building",
    "Factory / Manufacturing Unit",
    "Warehouse / Logistics Centre",
    "Hospital"
  ];

  // Clean up any duplicate Solar + Battery + EV Charging if created
  const dupeTypes = await ProjectType.find({ name: "Solar + Battery + EV Charging" });
  if (dupeTypes.length > 1) {
    const keepId = dupeTypes[0]._id;
    const removeIds = dupeTypes.slice(1).map(x => x._id);
    await ProjectType.deleteMany({ _id: { $in: removeIds } });
    const dupeMaps = await ProjectSubcategoryType.find({ type: { $in: removeIds } });
    const dupeMapIds = dupeMaps.map(m => m._id);
    if (dupeMapIds.length) {
      await ProjectSubcategoryType.deleteMany({ _id: { $in: dupeMapIds } });
      await ProjectRange.deleteMany({ subcategory_type: { $in: dupeMapIds } });
    }
  }

  for (let idx = 0; idx < RAW_ITEMS.length; idx++) {
    const item = RAW_ITEMS[idx];

    // 1. Industry Type
    let indDoc = await IndustryType.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(item.industry.trim())}$`, 'i') },
      deleted_at: null
    });

    if (!indDoc) {
      indDoc = await IndustryType.create({
        name: item.industry.trim(),
        slug: slugify(item.industry),
        code: item.industry.toUpperCase().replace(/[\s\W-]+/g, '_'),
        is_active: true,
        for_resellers: true,
        for_epc: true
      });
      counters.industryCreated++;
      console.log(`[+] Created Industry Type: "${indDoc.name}"`);
    }

    // 2. Project Category
    let catDoc = await ProjectCategory.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(item.category.trim())}$`, 'i') },
      industry_type_id: indDoc._id,
      deleted_at: null
    });

    if (!catDoc) {
      catDoc = await ProjectCategory.create({
        name: item.category.trim(),
        industry_type_id: indDoc._id,
        is_active: true
      });
      counters.categoryCreated++;
      console.log(`  [+] Created Category: "${catDoc.name}" under Industry "${indDoc.name}"`);
    }

    // Check if subcategory exists under Commercial & Industrial Solar or Residential Solar
    let subDoc = await ProjectSubcategory.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(item.subcategory.trim())}$`, 'i') },
      category: catDoc._id,
      deleted_at: null
    });

    // If it was previously misfiled under another category (e.g. Residential Solar), reassign it
    if (!subDoc && commercialSubcats.includes(item.subcategory.trim()) && item.category === "Commercial & Industrial Solar") {
      const existingMisfiled = await ProjectSubcategory.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(item.subcategory.trim())}$`, 'i') },
        deleted_at: null
      });
      if (existingMisfiled) {
        existingMisfiled.category = catDoc._id;
        await existingMisfiled.save();
        subDoc = existingMisfiled;
        counters.subcategoryReassigned++;
        console.log(`  [↺] Reassigned Subcategory: "${subDoc.name}" -> Category "${catDoc.name}"`);
      }
    }

    // If still not found, create new subcategory
    if (!subDoc) {
      subDoc = await ProjectSubcategory.create({
        name: item.subcategory.trim(),
        category: catDoc._id,
        color: "#2f4cbd",
        is_active: true
      });
      counters.subcategoryCreated++;
      console.log(`    [+] Created Subcategory: "${subDoc.name}" under Category "${catDoc.name}"`);
    }

    // 4. System Type
    let typeDoc = await ProjectType.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(item.type.trim())}$`, 'i') },
      deleted_at: null
    });

    if (!typeDoc) {
      typeDoc = await ProjectType.create({
        name: item.type.trim(),
        is_active: true
      });
      counters.typeCreated++;
      console.log(`      [+] Created System Type: "${typeDoc.name}"`);
    }

    // 5. Project Subcategory Type Mapping (Pivot)
    let typeMapDoc = await ProjectSubcategoryType.findOne({
      subcategory: subDoc._id,
      type: typeDoc._id,
      deleted_at: null
    });

    if (!typeMapDoc) {
      typeMapDoc = await ProjectSubcategoryType.create({
        subcategory: subDoc._id,
        type: typeDoc._id,
        is_active: true
      });
      counters.typeMapCreated++;
    }

    // 6. Project Range
    const unitDoc = unitMap.get(item.unit);
    if (!unitDoc) {
      console.error(`❌ Unit not found: ${item.unit}`);
      continue;
    }

    const existingRange = await ProjectRange.findOne({
      subcategory_type: typeMapDoc._id,
      min_value: item.min,
      max_value: item.max,
      unit_id: unitDoc._id,
      deleted_at: null
    });

    if (!existingRange) {
      // Check if any range exists for this subcategory_type to avoid any duplicate
      const anyRange = await ProjectRange.findOne({
        subcategory_type: typeMapDoc._id,
        deleted_at: null
      });

      if (!anyRange) {
        await ProjectRange.create({
          subcategory_type: typeMapDoc._id,
          min_value: item.min,
          max_value: item.max,
          unit_id: unitDoc._id,
          is_active: true
        });
        counters.rangeCreated++;
        console.log(`        [+] Created Range: ${item.min} - ${item.max} ${item.unit} for [${subDoc.name} -> ${typeDoc.name}]`);
      } else {
        counters.skipped++;
      }
    } else {
      counters.skipped++;
    }
  }

  console.log('\n====================================================');
  console.log('🎉 SEEDING COMPLETED!');
  console.log(`📊 Industries Created    : ${counters.industryCreated}`);
  console.log(`📊 Categories Created    : ${counters.categoryCreated}`);
  console.log(`📊 Subcategories Created : ${counters.subcategoryCreated}`);
  console.log(`📊 Subcategories Moved   : ${counters.subcategoryReassigned}`);
  console.log(`📊 System Types Created  : ${counters.typeCreated}`);
  console.log(`📊 Type Mappings Created : ${counters.typeMapCreated}`);
  console.log(`📊 Ranges Created        : ${counters.rangeCreated}`);
  console.log(`📊 Already Existed       : ${counters.skipped}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
