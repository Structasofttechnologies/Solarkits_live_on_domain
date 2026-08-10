require('dotenv').config();
require('./keys/config/databases');
const mongoose = require('mongoose');

const ComboKit = require('./modules/solarshop-india/models/india_core_db/combo_kits.schema');
const SolarKit = require('./modules/solarshop-india/models/india_core_db/solar_kits.schema');
const CompanyWarehouse = require('./modules/solarshop-india/models/india_core_db/company_warehouses.schema');
const WarehouseKitActivation = require('./modules/solarshop-india/models/india_core_db/warehouse_kit_activations.schema');
const ProjectCategory = require('./modules/solarshop-india/models/india_core_db/project_categories.schema');
const ProjectSubcategory = require('./modules/solarshop-india/models/india_core_db/project_subcategories.schema');
const GeoLevel0 = require('./modules/solarshop-india/models/geolocation_db/geo_level_0.schema');

async function seedBosKits() {
  try {
    console.log("🔍 Seeding BOS Kits & Customize BOS Components into Database...");

    // Find India ID
    let indiaDoc = await GeoLevel0.findOne({ name: 'India' }).lean();
    if (!indiaDoc) {
      indiaDoc = await GeoLevel0.findOne({ iso2: 'IN' }).lean();
    }
    const indiaCountryId = indiaDoc?._id || new mongoose.Types.ObjectId();

    // Fetch active warehouses
    let warehouses = await CompanyWarehouse.find({ deleted_at: null }).lean();
    const primaryWarehouse = warehouses[0] || null;

    // Fetch or create BOS project category
    let category = await ProjectCategory.findOne({ name: "BOS Kit Protection" }).lean();
    if (!category) {
      category = await ProjectCategory.create({ name: "BOS Kit Protection", code: "BOS_KIT", is_active: true });
      category = category.toObject();
    }

    let subcategory = await ProjectSubcategory.findOne({ name: "BOS Protection Combos" }).lean();
    if (!subcategory) {
      subcategory = await ProjectSubcategory.create({ category: category._id, name: "BOS Protection Combos", is_active: true });
      subcategory = subcategory.toObject();
    }

    let solarKitDef = await SolarKit.findOne({ name: "Standard BOS Protection Definition" }).lean();
    if (!solarKitDef) {
      solarKitDef = await SolarKit.create({
        name: "Standard BOS Protection Definition",
        category_id: category._id,
        subcategory_id: subcategory._id,
        is_active: true
      });
      solarKitDef = solarKitDef.toObject();
    }

    const bosKitsToSeed = [
      {
        name: "3 kW – 5 kW Residential Solar BOS Protection & Wiring Kit",
        description: "Complete Residential Solar Protection Box Set with DCDB, ACDB, 4 sq mm UV Cable & Chemical Earthing Kit.",
        capacity: 5,
        base_price_cached: 8499,
        selling_price_cached: 11999,
        kit_image: "https://images.unsplash.com/photo-1592833159057-651427788523?w=800&auto=format&fit=crop&q=80",
        category: "Complete BOS Combos",
        bos_kits: [
          { name: "1-In 1-Out DCDB Box (1000V DC SPD + 32A MCB)", quantity: 1, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400" },
          { name: "Single Phase ACDB Protection Box (32A MCB + 275V SPD)", quantity: 1, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400" },
          { name: "4.0 sq mm UV Protected Twin-Core Solar DC Cable", quantity: 30, image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400" },
          { name: "IP68 Waterproof MC4 Male/Female Connector Pair", quantity: 4, image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400" },
          { name: "1.2m Copper Bonded Steel Earthing Rod (100 Micron)", quantity: 1, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" },
          { name: "Backfill Chemical Earth Pit Compound (BFC 15kg Bag)", quantity: 1, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" }
        ]
      },
      {
        name: "10 kW – 15 kW Commercial Rooftop Heavy-Duty BOS Kit",
        description: "Dual String DCDB, 3-Phase 4-Pole ACDB, 6 sq mm Cable, ESE Lightning Arrester and Heavy Earthing Kit.",
        capacity: 15,
        base_price_cached: 18999,
        selling_price_cached: 24999,
        kit_image: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=800&auto=format&fit=crop&q=80",
        category: "Complete BOS Combos",
        bos_kits: [
          { name: "Dual String DCDB Box (1000V DC SPD + Fuses)", quantity: 1, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400" },
          { name: "3-Phase ACDB Industrial Box (63A 4P MCCB + 415V SPD)", quantity: 1, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400" },
          { name: "6.0 sq mm Heavy Duty Tinned Copper Solar Cable", quantity: 50, image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400" },
          { name: "Y-Branch 2-in-1 MC4 Parallel Connector Pair", quantity: 8, image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400" },
          { name: "2.0m Chemical Earthing Rod (250 Micron)", quantity: 2, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" },
          { name: "Pure Copper 1.5m Active ESE Lightning Arrester", quantity: 1, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" }
        ]
      },
      {
        name: "25 HP PM-KUSUM Solar Agriculture Pump Protection Kit",
        description: "Outdoor Canopy VFD Drive Protection Enclosure, High Surge 1000V SPD and Armored Cable Glands.",
        capacity: 25,
        base_price_cached: 14299,
        selling_price_cached: 19500,
        kit_image: "https://images.unsplash.com/photo-1548613053-22087dd8edb8?w=800&auto=format&fit=crop&q=80",
        category: "Agriculture & Solar Pumps",
        bos_kits: [
          { name: "1-In 1-Out DCDB Box with 1000V SPD & 32A MCB", quantity: 1, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400" },
          { name: "6.0 sq mm Heavy Duty Tinned Copper Solar Cable", quantity: 40, image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400" },
          { name: "1.2m Copper Bonded Steel Earthing Rod (100 Micron)", quantity: 2, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" },
          { name: "Backfill Chemical Earth Pit Compound (BFC 15kg Bag)", quantity: 2, image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400" }
        ]
      }
    ];

    for (const item of bosKitsToSeed) {
      let existingKit = await ComboKit.findOne({ name: item.name });
      if (!existingKit) {
        existingKit = await ComboKit.create({
          name: item.name,
          description: item.description,
          capacity: item.capacity,
          country_id: indiaCountryId,
          solar_kit_id: solarKitDef._id,
          warehouse_id: primaryWarehouse ? primaryWarehouse._id : null,
          base_price_cached: item.base_price_cached,
          selling_price_cached: item.selling_price_cached,
          kit_image: item.kit_image,
          bos_kits: item.bos_kits,
          is_custom: false,
          is_active: true,
          deleted_at: null
        });
        console.log(`✅ Created Database BOS Kit: ${item.name}`);
      } else {
        existingKit.country_id = indiaCountryId;
        existingKit.bos_kits = item.bos_kits;
        existingKit.base_price_cached = item.base_price_cached;
        existingKit.selling_price_cached = item.selling_price_cached;
        existingKit.is_active = true;
        existingKit.deleted_at = null;
        await existingKit.save();
        console.log(`ℹ️ Updated Database BOS Kit: ${item.name}`);
      }

      if (warehouses.length > 0) {
        for (const wh of warehouses) {
          await WarehouseKitActivation.findOneAndUpdate(
            { warehouse_id: wh._id, combo_kit_id: existingKit._id },
            {
              warehouse_id: wh._id,
              combo_kit_id: existingKit._id,
              is_combokit_active: true,
              is_customize_kit_active: true,
              is_active: true,
              is_deleted: false,
              deleted_at: null
            },
            { upsert: true, new: true }
          );
        }
      }
    }

const CustomBosCatalog = require('./modules/solarshop-india/models/india_solarshop_db/custom_bos_catalog.schema');

const customCatalogToSeed = [
  {
    group: "Protection & Distribution Boxes (ACDB / DCDB)",
    icon: "📦",
    items: [
      { id: "c_dcdb_1in1out", name: "DCDB 1-In 1-Out (1000V DC SPD + 32A MCB)", unitPrice: 1850, unit: "Box", defaultQty: 1, recommendedPerKw: 0.2, packInfo: "1 Box (Recommended for 5 kW System)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80" },
      { id: "c_dcdb_2in2out", name: "DCDB 2-In 2-Out Dual String (1000V SPD + Fuses)", unitPrice: 3400, unit: "Box", defaultQty: 1, recommendedPerKw: 0.2, packInfo: "1 Box (Dual String 5 kW System)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80" },
      { id: "c_acdb_1phase", name: "ACDB Single Phase (32A MCB + Type-2 275V SPD)", unitPrice: 1950, unit: "Box", defaultQty: 1, recommendedPerKw: 0.2, packInfo: "1 Box (Single Phase 5 kW Kit)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80" },
      { id: "c_acdb_3phase", name: "ACDB 3-Phase (63A 4P MCCB + 415V Type-2 SPD)", unitPrice: 5800, unit: "Box", defaultQty: 1, recommendedPerKw: 0.1, packInfo: "1 Box (Commercial 3-Phase)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80" },
      { id: "c_ajb_8in", name: "Central Array Junction Box (AJB) 8-In 1-Out", unitPrice: 12500, unit: "Unit", defaultQty: 1, recommendedPerKw: 0.05, packInfo: "1 Unit (Heavy Array Project)", icon: "🏭", imageUrl: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&auto=format&fit=crop&q=80" }
    ]
  },
  {
    group: "Solar DC Cables & Connectors",
    icon: "🔌",
    items: [
      { id: "c_dc_cable_4sqmm", name: "4 sq mm Solar DC Cable (Polycab UV Protected)", unitPrice: 42, unit: "Meter", defaultQty: 50, recommendedPerKw: 10, packInfo: "50 Meters (Recommended for 5 kW System)", icon: "🔌", imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80" },
      { id: "c_dc_cable_6sqmm", name: "6 sq mm Solar DC Cable (Heavy Duty Tinned Copper)", unitPrice: 65, unit: "Meter", defaultQty: 50, recommendedPerKw: 10, packInfo: "50 Meters (Recommended for 5 kW System)", icon: "🔌", imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80" },
      { id: "c_dc_cable_10sqmm", name: "10 sq mm Armored Solar DC Cable", unitPrice: 110, unit: "Meter", defaultQty: 30, recommendedPerKw: 6, packInfo: "30 Meters (Long Run Heavy Duty)", icon: "🔌", imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80" },
      { id: "c_mc4_pair", name: "IP68 Waterproof MC4 Connector Pair", unitPrice: 65, unit: "Pair", defaultQty: 4, recommendedPerKw: 0.8, packInfo: "4 Pairs (Recommended for 5 kW Kit)", icon: "🔌", imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80" },
      { id: "c_mc4_branch", name: "Y-Branch 2-in-1 MC4 Parallel Connectors", unitPrice: 180, unit: "Pair", defaultQty: 2, recommendedPerKw: 0.4, packInfo: "2 Pairs (Parallel Stringing)", icon: "🔌", imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80" }
    ]
  },
  {
    group: "Earthing & Lightning Protection",
    icon: "⚡",
    items: [
      { id: "c_earth_rod_1_2m", name: "1.2m Pure Copper Bonded Earthing Rod (100 Micron)", unitPrice: 1450, unit: "Rod", defaultQty: 2, recommendedPerKw: 0.4, packInfo: "2 Rods (Standard 5 kW Protection)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80" },
      { id: "c_earth_rod_2_0m", name: "2.0m Heavy Chemical Earthing Rod (250 Micron)", unitPrice: 2850, unit: "Rod", defaultQty: 2, recommendedPerKw: 0.4, packInfo: "2 Rods (Commercial Protection)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80" },
      { id: "c_bfc_compound", name: "Backfill Chemical Compound (BFC 15kg Bag)", unitPrice: 450, unit: "Bag", defaultQty: 2, recommendedPerKw: 0.4, packInfo: "2 Bags (Per Earthing Pit)", icon: "🧪", imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80" },
      { id: "c_ese_arrester", name: "ESE Early Streamer Emission Lightning Arrester (35m Radius)", unitPrice: 4500, unit: "Set", defaultQty: 1, recommendedPerKw: 0.2, packInfo: "1 Set (Rooftop Protection)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80" },
      { id: "c_earth_strip_copper", name: "Copper Earthing Strip 25x3mm", unitPrice: 280, unit: "Meter", defaultQty: 25, recommendedPerKw: 5, packInfo: "25 Meters (Earthing Grid Run)", icon: "⚡", imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&auto=format&fit=crop&q=80" }
    ]
  },
  {
    group: "Mounting Structure (MMS) & Fasteners",
    icon: "🏗️",
    items: [
      { id: "c_mms_rail_2_1m", name: "Anodized Aluminium Mounting Rail (2.1 Meter)", unitPrice: 650, unit: "Length", defaultQty: 10, recommendedPerKw: 2, packInfo: "10 Lengths (10 Panel Structure for 5 kW)", icon: "🏗️", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" },
      { id: "c_mid_clamp", name: "Aluminium Solar Panel Mid Clamp with SS304 Bolt", unitPrice: 45, unit: "Piece", defaultQty: 24, recommendedPerKw: 4.8, packInfo: "24 Pcs (Recommended for 5 kW Array)", icon: "🔧", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" },
      { id: "c_end_clamp", name: "Aluminium Solar Panel End Clamp with SS304 Bolt", unitPrice: 45, unit: "Piece", defaultQty: 12, recommendedPerKw: 2.4, packInfo: "12 Pcs (Recommended for 5 kW Array)", icon: "🔧", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" },
      { id: "c_jbolts_set", name: "SS304 Anchor J-Bolts & Fastener Package", unitPrice: 35, unit: "Piece", defaultQty: 40, recommendedPerKw: 8, packInfo: "40 Pcs (Package for 5 kW Roof Structure)", icon: "🔩", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" },
      { id: "c_l_feet", name: "Heavy Duty L-Feet Mount Connector for Concrete Roof", unitPrice: 85, unit: "Piece", defaultQty: 20, recommendedPerKw: 4, packInfo: "20 Pcs (Base Connectors for 5 kW)", icon: "🏗️", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" },
      { id: "c_walkway_grating", name: "FRP Roof Walkway Grating (Non-Conductive)", unitPrice: 750, unit: "Meter", defaultQty: 10, recommendedPerKw: 2, packInfo: "10 Meters (Standard Rooftop Walkway)", icon: "🏗️", imageUrl: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80", image: "https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80" }
    ]
  }
];

    // Seed Custom BOS Catalog into Database
    await CustomBosCatalog.deleteMany({});
    await CustomBosCatalog.insertMany(customCatalogToSeed);
    console.log("✅ Seeded Customize BOS Components Catalog into Database!");

    console.log("🎉 Successfully seeded BOS Kits & Custom Catalog into MongoDB Database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding BOS Kits:", err);
    process.exit(1);
  }
}

seedBosKits();

