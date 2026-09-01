/**
 * =========================================================================
 * SEED MASTER SOLAR KITS (pc_combo_kit_definitions)
 * =========================================================================
 * Seeds the approved 6 Real-World Architectural Solar Kit Blueprints
 * with Base Components and BOS Kit Bundles mapped to the new Project Scopes.
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
require('../keys/config/databases');

const {
  IndustryType,
  ProjectCategory,
  ProjectSubcategory,
  ProjectSubcategoryType,
  ProductTemplate,
  ProductSubtype,
  Brand,
  SolarKit
} = require('../modules/admin-panel/models/core_db');

const APPROVED_BLUEPRINTS = [
  // 1. 5kW Residential Single-Phase On-Grid Solar Kit
  {
    name: "5kW Residential Single-Phase On-Grid Solar Kit",
    description: "Standard Indian home rooftop on-grid net metering blueprint with Mono PERC panels, high-efficiency string inverter, ACDB/DCDB protection boxes, RCC mounting structure, and copper-bonded lightning earthing.",
    industryName: "Solar PV",
    categoryName: "Residential Solar",
    subcategoryName: "Individual Home",
    systemTypeName: "On-Grid",
    baseComponents: [
      { template: "Solar Panel", subtype: "Mono PERC" },
      { template: "Inverter", subtype: "String" }
    ],
    bosKits: [
      {
        name: "AC/DC Electrical Protection & Switchgear Kit",
        brand: "Tata Power Solar",
        items: [
          { template: "ACDB", subtypes: ["Single Phase"] },
          { template: "DCDB", subtypes: ["1 String"] },
          { template: "Surge Protection Device", subtypes: ["AC SPD", "DC SPD"] },
          { template: "Net Meter", subtypes: ["Single Phase"] }
        ]
      },
      {
        name: "RCC Roof Mounting & Civil Hardware Kit",
        brand: "Waaree Energies",
        items: [
          { template: "Mounting Structure", subtypes: ["RCC Roof"] },
          { template: "Rail", subtypes: ["Aluminium Rail"] },
          { template: "Clamp", subtypes: ["Mid Clamp", "End Clamp"] },
          { template: "Screw & Fastener", subtypes: ["Hex Bolt", "Nut & Bolt"] }
        ]
      },
      {
        name: "Solar DC/AC Cabling & Safety Grounding Kit",
        brand: "Polycab Solar",
        items: [
          { template: "Cable", subtypes: ["DC Cable", "AC Cable", "Earthing Cable"] },
          { template: "Earthing Rod", subtypes: ["Copper Bonded"] },
          { template: "Lightning Arrester", subtypes: ["ESE Type"] },
          { template: "MC4 Connector", subtypes: ["Standard MC4"] }
        ]
      }
    ]
  },

  // 2. 10kW Three-Phase Villa Hybrid Solar Kit with ESS
  {
    name: "10kW Three-Phase Villa Hybrid Solar Kit with ESS",
    description: "Premium residential villa hybrid solar blueprint featuring high-efficiency TOPCon panels, smart 3-phase hybrid inverter, LiFePO4 battery energy storage, and automated changeover ATS switchgear.",
    industryName: "Solar PV",
    categoryName: "Residential Solar",
    subcategoryName: "Individual Home",
    systemTypeName: "Hybrid",
    baseComponents: [
      { template: "Solar Panel", subtype: "TOPCon" },
      { template: "Inverter", subtype: "Hybrid" },
      { template: "Battery", subtype: "LFP" }
    ],
    bosKits: [
      {
        name: "3-Phase Hybrid Distribution & ATS Changeover Box",
        brand: "Havells Solar",
        items: [
          { template: "ACDB", subtypes: ["Three Phase"] },
          { template: "DCDB", subtypes: ["2 String"] },
          { template: "Changeover Switch", subtypes: ["Automatic"] },
          { template: "MCCB", subtypes: ["4 Pole"] }
        ]
      },
      {
        name: "Heavy-Duty Solar Cabling & Grounding Package",
        brand: "Polycab Solar",
        items: [
          { template: "Cable", subtypes: ["DC Cable", "AC Cable", "Earthing Cable"] },
          { template: "Earthing Pit", subtypes: ["Chemical Earthing"] },
          { template: "Lightning Arrester", subtypes: ["ESE Type"] }
        ]
      },
      {
        name: "Villa Metal / RCC Mounting Hardware",
        brand: "Adani Solar",
        items: [
          { template: "Mounting Structure", subtypes: ["RCC Roof"] },
          { template: "Rail", subtypes: ["Aluminium Rail"] },
          { template: "Clamp", subtypes: ["Mid Clamp", "End Clamp"] }
        ]
      }
    ]
  },

  // 3. 50kW Commercial LT On-Grid Rooftop Solution
  {
    name: "50kW Commercial LT On-Grid Rooftop Solution",
    description: "Commercial building, school, and hospital blueprint engineered for high-yield 3-phase net metering with Bifacial glass-to-glass modules, commercial string inverters, and heavy-duty cable tray management.",
    industryName: "Solar PV",
    categoryName: "Commercial & Industrial Solar",
    subcategoryName: "Commercial Building",
    systemTypeName: "On-Grid",
    baseComponents: [
      { template: "Solar Panel", subtype: "Bifacial" },
      { template: "Inverter", subtype: "String" }
    ],
    bosKits: [
      {
        name: "Commercial LT Switchgear & Distribution Array",
        brand: "Tata Power Solar",
        items: [
          { template: "ACDB", subtypes: ["Three Phase"] },
          { template: "DCDB", subtypes: ["4 String"] },
          { template: "MCCB", subtypes: ["4 Pole"] },
          { template: "Net Meter", subtypes: ["Three Phase"] }
        ]
      },
      {
        name: "Commercial Structure & Perforated Tray Management",
        brand: "Waaree Energies",
        items: [
          { template: "Mounting Structure", subtypes: ["Metal Roof"] },
          { template: "Cable Tray", subtypes: ["Perforated"] },
          { template: "Conduit Pipe", subtypes: ["GI Conduit"] },
          { template: "Clamp", subtypes: ["Mid Clamp", "End Clamp"] }
        ]
      },
      {
        name: "Industrial Earthing & Lightning Protection Hub",
        brand: "Polycab Solar",
        items: [
          { template: "Earthing Pit", subtypes: ["Maintenance Free"] },
          { template: "Lightning Arrester", subtypes: ["ESE Type"] },
          { template: "Cable", subtypes: ["DC Cable", "AC Cable"] }
        ]
      }
    ]
  },

  // 4. 5 HP Agricultural Solar Water Pumping Kit
  {
    name: "5 HP Agricultural Solar Water Pumping Kit",
    description: "PM-KUSUM Component B / Farm irrigation setup with Mono PERC solar array, DC/AC variable frequency controller, high-protection DC isolator, and ground-mounting structure.",
    industryName: "Solar Agriculture",
    categoryName: "Agricultural Solar",
    subcategoryName: "Solar Water Pump",
    systemTypeName: "DC / AC Pump System",
    baseComponents: [
      { template: "Solar Panel", subtype: "Mono PERC" },
      { template: "Inverter", subtype: "VFD Controller" }
    ],
    bosKits: [
      {
        name: "Agri DC Protection & Drive Control Panel",
        brand: "Kirloskar Solar",
        items: [
          { template: "DCDB", subtypes: ["1 String"] },
          { template: "Isolator", subtypes: ["DC Isolator"] },
          { template: "Surge Protection Device", subtypes: ["DC SPD"] }
        ]
      },
      {
        name: "Ground Mounting & Submersible Cabling Bundle",
        brand: "Polycab Solar",
        items: [
          { template: "Mounting Structure", subtypes: ["Ground Mount"] },
          { template: "Cable", subtypes: ["DC Cable", "Earthing Cable"] },
          { template: "Earthing Rod", subtypes: ["GI Rod"] }
        ]
      }
    ]
  },

  // 5. 30kW Commercial EV Solar Fast Charging Hub Kit
  {
    name: "30kW Commercial EV Solar Fast Charging Hub Kit",
    description: "Commercial EV charging hub infrastructure featuring Bifacial solar carport canopy, 3-phase grid-tied inverter, TPN distribution board, and industrial ladder cable trays.",
    industryName: "Solar EV",
    categoryName: "EV Charging Infrastructure",
    subcategoryName: "Commercial EV Charging",
    systemTypeName: "AC Charging",
    baseComponents: [
      { template: "Solar Panel", subtype: "Bifacial" },
      { template: "Inverter", subtype: "String" }
    ],
    bosKits: [
      {
        name: "EV Charging Power Distribution & Isolation Switchgear",
        brand: "Servotech Power Systems",
        items: [
          { template: "ACDB", subtypes: ["Three Phase"] },
          { template: "MCCB", subtypes: ["4 Pole"] },
          { template: "Isolator", subtypes: ["AC Isolator"] },
          { template: "Distribution Board", subtypes: ["TPN"] }
        ]
      },
      {
        name: "Solar Carport Structure & Heavy Cable Tray Kit",
        brand: "Waaree Energies",
        items: [
          { template: "Mounting Structure", subtypes: ["Carport"] },
          { template: "Cable Tray", subtypes: ["Ladder Type"] },
          { template: "Conduit Pipe", subtypes: ["GI Conduit"] }
        ]
      }
    ]
  },

  // 6. 10kW Village Mini-Grid Off-Grid Solar Power Kit
  {
    name: "10kW Village Mini-Grid Off-Grid Solar Power Kit",
    description: "Decentralised rural solar power plant blueprint with high-durability Poly panels, standalone hybrid inverter, lead acid battery backup bank, MPPT charge controller, and manual bypass changeover switch.",
    industryName: "Rural Solar",
    categoryName: "Decentralised Solar",
    subcategoryName: "Village Mini-Grid",
    systemTypeName: "Off-Grid / Hybrid Mini-Grid",
    baseComponents: [
      { template: "Solar Panel", subtype: "Poly" },
      { template: "Inverter", subtype: "Hybrid" },
      { template: "Battery", subtype: "Lead Acid" }
    ],
    bosKits: [
      {
        name: "Off-Grid Central Power Management & Safety Kit",
        brand: "Luminous Power Technologies",
        items: [
          { template: "DCDB", subtypes: ["2 String"] },
          { template: "Charge Controller", subtypes: ["MPPT"] },
          { template: "ACDB", subtypes: ["Single Phase"] },
          { template: "Changeover Switch", subtypes: ["Manual"] }
        ]
      },
      {
        name: "Rural Ground Mount & Distribution Cabling",
        brand: "Polycab Solar",
        items: [
          { template: "Mounting Structure", subtypes: ["Ground Mount"] },
          { template: "Cable", subtypes: ["DC Cable", "AC Cable", "Earthing Cable"] },
          { template: "Earthing Rod", subtypes: ["Copper Bonded"] }
        ]
      }
    ]
  }
];

async function seedMasterSolarKits() {
  console.log('====================================================');
  console.log('🚀 SEEDING MASTER SOLAR KITS & BOS CONFIGURATIONS');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Cache templates, subtypes, brands
  const templates = await ProductTemplate.find({ deleted_at: null }).lean();
  const subtypes = await ProductSubtype.find({ deleted_at: null }).lean();
  const brands = await Brand.find({ deleted_at: null }).lean();

  const getTemplate = (name) => {
    return templates.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  };

  const getSubtype = (templateId, name) => {
    return subtypes.find(s =>
      s.template_id?.toString() === templateId?.toString() &&
      s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  const getBrand = (name) => {
    return brands.find(b =>
      (b.brand_name && b.brand_name.trim().toLowerCase().includes(name.trim().toLowerCase())) ||
      (b.name && b.name.trim().toLowerCase().includes(name.trim().toLowerCase()))
    );
  };

  let totalSeeded = 0;

  for (const bp of APPROVED_BLUEPRINTS) {
    console.log(`\n📌 Processing Kit: "${bp.name}"...`);

    // 1. Resolve Industry Type
    const industry = await IndustryType.findOne({
      name: new RegExp(`^${bp.industryName.replace(/\+/g, '\\+')}$`, 'i'),
      deleted_at: null
    });
    if (!industry) {
      console.error(`  ❌ Industry "${bp.industryName}" not found!`);
      continue;
    }

    // 2. Resolve Category
    const category = await ProjectCategory.findOne({
      name: new RegExp(`^${bp.categoryName.replace(/\+/g, '\\+')}$`, 'i'),
      industry_type_id: industry._id,
      deleted_at: null
    });
    if (!category) {
      console.error(`  ❌ Category "${bp.categoryName}" under "${bp.industryName}" not found!`);
      continue;
    }

    // 3. Resolve Subcategory
    const subcategory = await ProjectSubcategory.findOne({
      name: new RegExp(`^${bp.subcategoryName.replace(/\+/g, '\\+')}$`, 'i'),
      category: category._id,
      deleted_at: null
    });
    if (!subcategory) {
      console.error(`  ❌ Subcategory "${bp.subcategoryName}" under category not found!`);
      continue;
    }

    // 4. Resolve System Type (sys_filter_type_maps)
    const scopeMap = await ProjectSubcategoryType.findOne({
      subcategory: subcategory._id,
      deleted_at: null
    }).populate('type');

    // Find specific match by type name
    const allScopesForSub = await ProjectSubcategoryType.find({
      subcategory: subcategory._id,
      deleted_at: null
    }).populate('type');

    const matchedScope = allScopesForSub.find(s =>
      s.type?.name?.trim().toLowerCase() === bp.systemTypeName.trim().toLowerCase()
    );

    if (!matchedScope) {
      console.error(`  ❌ System Type Scope "${bp.systemTypeName}" not found under subcategory!`);
      continue;
    }

    // 5. Build Base Components
    const base_components = [];
    const base_template_ids = [];

    for (const bc of bp.baseComponents) {
      const tmpl = getTemplate(bc.template);
      if (!tmpl) {
        console.error(`  ❌ Base Template "${bc.template}" not found!`);
        continue;
      }
      const sub = getSubtype(tmpl._id, bc.subtype);
      if (!sub) {
        console.error(`  ❌ Base Subtype "${bc.subtype}" for "${bc.template}" not found!`);
        continue;
      }

      base_components.push({
        template_id: tmpl._id,
        subtype_id: sub._id
      });
      if (!base_template_ids.some(id => id.toString() === tmpl._id.toString())) {
        base_template_ids.push(tmpl._id);
      }
    }

    // 6. Build BOS Kits
    const bos_kits = [];
    const bos_template_ids = [];

    for (const bk of bp.bosKits) {
      const brandDoc = getBrand(bk.brand);
      const kitItems = [];

      for (const it of bk.items) {
        const tmpl = getTemplate(it.template);
        if (!tmpl) {
          console.error(`  ❌ BOS Template "${it.template}" not found!`);
          continue;
        }
        const subtypeIds = [];
        for (const stName of it.subtypes) {
          const sub = getSubtype(tmpl._id, stName);
          if (sub) {
            subtypeIds.push(sub._id);
          } else {
            console.warn(`  ⚠️ BOS Subtype "${stName}" for "${it.template}" not found.`);
          }
        }

        kitItems.push({
          template_id: tmpl._id,
          subtype_ids: subtypeIds
        });

        if (!bos_template_ids.some(id => id.toString() === tmpl._id.toString())) {
          bos_template_ids.push(tmpl._id);
        }
      }

      bos_kits.push({
        name: bk.name,
        brand_id: brandDoc ? brandDoc._id : null,
        items: kitItems
      });
    }

    // 7. Upsert SolarKit Document in MongoDB
    const kitData = {
      name: bp.name,
      description: bp.description,
      category_id: category._id,
      subcategory_id: subcategory._id,
      type_id: matchedScope._id,
      base_template_ids,
      bos_template_ids,
      base_components,
      bos_kits,
      deleted_at: null
    };

    const existing = await SolarKit.findOne({ name: bp.name, deleted_at: null });
    if (existing) {
      await SolarKit.updateOne({ _id: existing._id }, { $set: kitData });
      console.log(`  🔄 Updated existing Solar Kit: "${bp.name}"`);
    } else {
      await SolarKit.create(kitData);
      console.log(`  ✅ Created new Solar Kit: "${bp.name}"`);
    }

    totalSeeded++;
  }

  const finalCount = await SolarKit.countDocuments({ deleted_at: null });

  console.log('\n====================================================');
  console.log('🎉 MASTER SOLAR KITS SEEDING COMPLETE!');
  console.log(`📊 Total Master Kits Seeded: ${totalSeeded}`);
  console.log(`📊 Active Solar Kits in DB : ${finalCount}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedMasterSolarKits().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
