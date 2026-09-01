/**
 * =========================================================================
 * SEED PROJECT SCOPE MAPPINGS (pc_subtype_scope_maps)
 * =========================================================================
 * Binds each Product Subtype to its authorized Project Scopes (sys_filter_type_maps).
 * Solves "NO MAPPINGS YET" in Subtype Workspace & "No results found" in Solar Kits.
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
require('../keys/config/databases');

const {
  ProductTemplate,
  ProductSubtype,
  ProjectSubcategoryType,
  SubtypeScopeMap
} = require('../modules/admin-panel/models/core_db');

async function seedScopeMappings() {
  console.log('====================================================');
  console.log('🚀 SEEDING PROJECT SCOPE MAPPINGS (pc_subtype_scope_maps)');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Fetch all 46 Project Scopes
  const allScopes = await ProjectSubcategoryType.find({ deleted_at: null })
    .populate({
      path: 'subcategory',
      populate: { path: 'category', populate: { path: 'industry_type_id' } }
    })
    .populate('type')
    .lean();

  console.log(`Loaded ${allScopes.length} Project Scopes (sys_filter_type_maps).`);

  // Helper metadata tags for each scope
  const scopesWithMeta = allScopes.map(s => {
    const indName = s.subcategory?.category?.industry_type_id?.name || '';
    const catName = s.subcategory?.category?.name || '';
    const subName = s.subcategory?.name || '';
    const typeName = s.type?.name || '';

    const isSolarPV = indName === 'Solar PV';
    const isAgri = indName === 'Solar Agriculture';
    const isEV = indName === 'Solar EV';
    const isStorage = indName === 'Energy Storage';
    const isLighting = indName === 'Solar Lighting';
    const isThermal = indName === 'Solar Thermal';
    const isRural = indName === 'Rural Solar';

    const isResidential = catName.includes('Residential');
    const isCommercial = catName.includes('Commercial') || catName.includes('Industrial');
    const isInstitutional = catName.includes('Institutional') || catName.includes('Government');
    const isUtility = catName.includes('Utility');
    const isCarport = catName.includes('Carport');

    const isOnGrid = typeName.includes('On-Grid') || typeName.includes('Grid-Connected') || typeName.includes('AC Charging');
    const isOffGrid = typeName.includes('Off-Grid') || typeName.includes('Standalone');
    const isHybrid = typeName.includes('Hybrid');

    return {
      scopeId: s._id,
      label: `${catName} › ${subName} › ${typeName}`,
      indName, catName, subName, typeName,
      isSolarPV, isAgri, isEV, isStorage, isLighting, isThermal, isRural,
      isResidential, isCommercial, isInstitutional, isUtility, isCarport,
      isOnGrid, isOffGrid, isHybrid
    };
  });

  // 2. Fetch all Templates & Subtypes
  const templates = await ProductTemplate.find({ deleted_at: null }).lean();
  const subtypes = await ProductSubtype.find({ deleted_at: null }).lean();

  console.log(`Loaded ${templates.length} Templates & ${subtypes.length} Subtypes.\n`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const tmpl of templates) {
    const tmplName = tmpl.name.trim();
    const tmplSubtypes = subtypes.filter(s => s.template_id?.toString() === tmpl._id.toString());

    if (tmplSubtypes.length === 0) continue;

    for (const sub of tmplSubtypes) {
      const subName = sub.name.trim();
      const matchedScopeIds = [];

      // Determine eligible scopes for (tmplName, subName)
      for (const sc of scopesWithMeta) {
        let eligible = false;

        // --- 1. Solar Panels ---
        if (tmplName === "Solar Panel") {
          if (subName === "Mono PERC") {
            eligible = sc.isSolarPV || (sc.isAgri && sc.subName.includes("Farm")) || sc.isRural || sc.isCarport;
          } else if (subName === "Bifacial") {
            eligible = sc.isCommercial || sc.isUtility || sc.isCarport || (sc.isAgri && sc.subName.includes("Component A"));
          } else if (subName === "TOPCon" || subName === "HJT") {
            eligible = sc.isCommercial || sc.isUtility || sc.isInstitutional || sc.isCarport;
          } else if (subName === "Poly") {
            eligible = sc.isRural || (sc.isResidential && sc.isOffGrid) || (sc.isAgri && sc.subName.includes("Component A"));
          }
        }

        // --- 2. Inverters ---
        else if (tmplName === "Inverter") {
          if (subName === "String") {
            eligible = sc.isOnGrid && (sc.isSolarPV || sc.isCarport || (sc.isAgri && sc.subName.includes("Farm")));
          } else if (subName === "Micro") {
            eligible = sc.isResidential && sc.subName === "Individual Home";
          } else if (subName === "Hybrid") {
            eligible = sc.isHybrid || (sc.isSolarPV && sc.isHybrid) || sc.isRural || (sc.isEV && sc.subName.includes("Residential"));
          } else if (subName === "Central") {
            eligible = sc.isUtility;
          } else if (subName === "VFD Controller") {
            eligible = sc.isAgri;
          }
        }

        // --- 3. Battery ---
        else if (tmplName === "Battery") {
          if (subName === "LFP" || subName === "Lithium-Ion") {
            eligible = sc.isStorage || sc.isHybrid || (sc.isResidential && sc.isHybrid) || sc.isRural || (sc.isEV && sc.subName.includes("Depot"));
          } else if (subName === "Lead Acid") {
            eligible = (sc.isResidential && sc.isOffGrid) || sc.isRural;
          }
        }

        // --- 4. EV Charger ---
        else if (tmplName === "EV Charger") {
          if (subName === "AC Wallbox") {
            eligible = sc.subName.includes("Residential EV") || sc.subName.includes("Residential Carport");
          } else if (subName === "AC Commercial") {
            eligible = sc.subName.includes("Commercial EV") || sc.subName.includes("Commercial Carport");
          } else if (subName === "DC Fast") {
            eligible = sc.subName.includes("Public Charging") || sc.subName.includes("Commercial EV");
          } else if (subName === "DC Ultra-Fast") {
            eligible = sc.subName.includes("Highway Charging") || sc.subName.includes("Fleet / Bus Depot");
          }
        }

        // --- 5. Solar Water Pump ---
        else if (tmplName === "Solar Water Pump") {
          eligible = sc.isAgri && sc.subName.includes("Pump");
        }

        // --- 6. Solar Street Light ---
        else if (tmplName === "Solar Street Light") {
          eligible = sc.isLighting;
        }

        // --- 7. Solar Water Heater ---
        else if (tmplName === "Solar Water Heater") {
          eligible = sc.isThermal;
        }

        // --- 8. Mounting Structure ---
        else if (tmplName === "Mounting Structure") {
          if (subName === "RCC Roof") {
            eligible = sc.isResidential || (sc.isCommercial && !sc.subName.includes("Warehouse")) || sc.isInstitutional;
          } else if (subName === "Metal Roof") {
            eligible = sc.subName.includes("Factory") || sc.subName.includes("Warehouse") || sc.subName.includes("Commercial");
          } else if (subName === "Ground Mount") {
            eligible = sc.isUtility || sc.isAgri || sc.isRural;
          } else if (subName === "Carport") {
            eligible = sc.isCarport;
          }
        }

        // --- 9. ACDB & DCDB ---
        else if (tmplName === "ACDB" || tmplName === "DCDB") {
          eligible = sc.isSolarPV || sc.isCarport || (sc.isAgri && sc.subName.includes("Farm")) || sc.isRural;
        }

        // --- 10. Cable & Wire ---
        else if (tmplName === "Cable" || tmplName === "Wire") {
          eligible = sc.isSolarPV || sc.isAgri || sc.isEV || sc.isRural;
        }

        // --- 11. Earthing & Lightning ---
        else if (tmplName === "Earthing Rod" || tmplName === "Earthing Pit" || tmplName === "Lightning Arrester") {
          eligible = sc.isSolarPV || sc.isAgri || sc.isEV || sc.isRural || sc.isLighting;
        }

        // --- 12. Protection & Distribution (MCB, MCCB, SPD, Isolator, Changeover, Net Meter, DB, Clamps, Fasteners) ---
        else {
          eligible = sc.isSolarPV || sc.isCarport || (sc.isAgri && sc.subName.includes("Farm")) || sc.isRural;
        }

        if (eligible) {
          matchedScopeIds.push(sc.scopeId);
        }
      }

      if (matchedScopeIds.length > 0) {
        let subInserted = 0;
        for (const scopeId of matchedScopeIds) {
          const exists = await SubtypeScopeMap.findOne({
            subtype: sub._id,
            subcategory_type: scopeId
          });

          if (!exists) {
            await SubtypeScopeMap.create({
              subtype: sub._id,
              subcategory_type: scopeId
            });
            subInserted++;
            totalInserted++;
          } else {
            totalSkipped++;
          }
        }
        console.log(`[+] [${tmplName} › ${subName}]: Mapped ${subInserted} scopes (${matchedScopeIds.length} total eligible)`);
      }
    }
  }

  const finalCount = await SubtypeScopeMap.countDocuments();

  console.log('\n====================================================');
  console.log('🎉 PROJECT SCOPE MAPPINGS SEEDING COMPLETE!');
  console.log(`📊 New Mappings Inserted  : ${totalInserted}`);
  console.log(`📊 Already Existed Skipped: ${totalSkipped}`);
  console.log(`📊 Total Active Mappings  : ${finalCount}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedScopeMappings().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
