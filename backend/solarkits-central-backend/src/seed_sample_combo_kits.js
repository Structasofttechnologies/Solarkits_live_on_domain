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
const GeoLevel2 = require('./modules/solarshop-india/models/geolocation_db/geo_level_2.schema');

async function seedComboKits() {
  try {
    console.log("🔍 Checking India country_id & active warehouses...");

    // Find India ID
    let indiaDoc = await GeoLevel0.findOne({ name: 'India' }).lean();
    if (!indiaDoc) {
      indiaDoc = await GeoLevel0.findOne({ iso2: 'IN' }).lean();
    }
    const indiaCountryId = indiaDoc?._id || null;
    console.log(`🇮🇳 India Country ID: ${indiaCountryId}`);

    // Fetch active warehouses
    let warehouses = await CompanyWarehouse.find({ deleted_at: null }).lean();
    if (warehouses.length === 0) {
      const district = await GeoLevel2.findOne({ deleted_at: null }).lean();
      const defaultWh = await CompanyWarehouse.create({
        warehouse_code: "WH_CENTRAL_01",
        address: "Central Solar Hub, India",
        warehouse_type: "sub",
        level_0: indiaCountryId,
        level_2: district?._id || new mongoose.Types.ObjectId(),
        is_active: true
      });
      warehouses = [defaultWh.toObject()];
    } else {
      await CompanyWarehouse.updateMany({ _id: { $in: warehouses.map(w => w._id) } }, { is_active: true, level_0: indiaCountryId });
    }

    const primaryWarehouse = warehouses[0];

    // Fetch or create project category & subcategory
    let category = await ProjectCategory.findOne({ deleted_at: null }).lean();
    if (!category) {
      category = await ProjectCategory.create({ name: "Residential Solar", code: "RESIDENTIAL", is_active: true });
      category = category.toObject();
    }

    let subcategory = await ProjectSubcategory.findOne({ deleted_at: null }).lean();
    if (!subcategory) {
      subcategory = await ProjectSubcategory.create({ category_id: category._id, name: "Rooftop Grid-Tied", is_active: true });
      subcategory = subcategory.toObject();
    }

    // Fetch or create SolarKit Definition
    let solarKitDef = await SolarKit.findOne({ deleted_at: null }).lean();
    if (!solarKitDef) {
      solarKitDef = await SolarKit.create({
        name: "Standard On-Grid Solar System Kit",
        category_id: category._id,
        subcategory_id: subcategory._id,
        is_active: true
      });
      solarKitDef = solarKitDef.toObject();
    }

    const kitsToSeed = [
      {
        name: "3 kW Residential High Efficiency Solar Combo Kit",
        description: "Complete 3 kW Mono PERC Solar System with Single-Phase String Inverter and Full BOS Protection Kit.",
        capacity: 3,
        base_price_cached: 145000,
        selling_price_cached: 165000,
        kit_image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop",
      },
      {
        name: "5 kW Premium Bifacial Rooftop Solar Combo Kit",
        description: "5 kW Heavy Duty Bifacial Solar System with MPPT Dual String Inverter for Max Generation.",
        capacity: 5,
        base_price_cached: 235000,
        selling_price_cached: 265000,
        kit_image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop",
      },
      {
        name: "10 kW Commercial Three-Phase Solar Power Kit",
        description: "High capacity 10 kW Industrial Solar Kit with 4-Pole ACDB, Dual DCDB, and Remote IoT Telemetry.",
        capacity: 10,
        base_price_cached: 420000,
        selling_price_cached: 480000,
        kit_image: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&auto=format&fit=crop",
      },
      {
        name: "15 kW Agriculture & Industrial High Output Solar Kit",
        description: "15 kW Commercial Off-Grid / Hybrid Solar Kit with Galvanized MMS Structure and ESE Protection.",
        capacity: 15,
        base_price_cached: 640000,
        selling_price_cached: 720000,
        kit_image: "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=600&auto=format&fit=crop",
      }
    ];

    const createdKitIds = [];

    for (const item of kitsToSeed) {
      let existingKit = await ComboKit.findOne({ name: item.name });
      if (!existingKit) {
        existingKit = await ComboKit.create({
          name: item.name,
          description: item.description,
          capacity: item.capacity,
          country_id: indiaCountryId,
          solar_kit_id: solarKitDef._id,
          warehouse_id: primaryWarehouse._id,
          base_price_cached: item.base_price_cached,
          selling_price_cached: item.selling_price_cached,
          kit_image: item.kit_image,
          is_custom: false,
          is_active: true,
          deleted_at: null
        });
        console.log(`✅ Created Combo Kit with country_id: ${item.name}`);
      } else {
        existingKit.country_id = indiaCountryId;
        existingKit.is_custom = false;
        existingKit.is_active = true;
        existingKit.deleted_at = null;
        await existingKit.save();
        console.log(`ℹ️ Updated existing Combo Kit with country_id: ${item.name}`);
      }

      createdKitIds.push(existingKit._id);

      // Create or Update Warehouse Activations
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

    // Also update any other existing ComboKits with country_id so all show up in Admin
    await ComboKit.updateMany({ country_id: null }, { country_id: indiaCountryId, is_custom: false, is_active: true, deleted_at: null });

    console.log(`🎉 Successfully linked ${createdKitIds.length} Combo Kits to India country_id (${indiaCountryId})!`);
    process.exit(0);

  } catch (err) {
    console.error("❌ Error seeding Combo Kits:", err);
    process.exit(1);
  }
}

seedComboKits();
