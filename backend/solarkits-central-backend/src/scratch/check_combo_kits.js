const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');
const { WarehouseComboKit: ComboKit, SolarKit, Brand, ProductTemplate, ProductSubtype, ProductSku } = require('../modules/admin-panel/models/core_db');

async function check() {
  try {
    const kits = await ComboKit.find({ deleted_at: null })
      .populate('solar_kit_id')
      .populate('base_components.template_id')
      .populate('base_components.subtype_id')
      .populate('base_components.brand_id')
      .populate('base_components.sku_id')
      .populate('bos_kits.brand_id')
      .populate('bos_kits.sku_id')
      .lean();

    console.log("ComboKits count:", kits.length);
    kits.forEach((k, idx) => {
      console.log(`\n--- ComboKit #${idx + 1} ---`);
      console.log("ID:", k._id);
      console.log("Name:", k.name);
      console.log("SolarKit Blueprint:", k.solar_kit_id ? k.solar_kit_id.name : "NULL");
      console.log("Base Components count:", k.base_components ? k.base_components.length : 0);
      console.log("Base Components:", JSON.stringify(k.base_components, null, 2));
      console.log("BOS Kits count:", k.bos_kits ? k.bos_kits.length : 0);
      console.log("BOS Kits:", JSON.stringify(k.bos_kits, null, 2));
    });

    const masterKits = await SolarKit.find({ deleted_at: null })
      .populate('category_id')
      .populate('subcategory_id')
      .populate('type_id')
      .populate('base_components.template_id')
      .populate('base_components.subtype_id')
      .populate('bos_kits.items.template_id')
      .populate('bos_kits.items.subtype_ids')
      .lean();

    console.log("\nMaster SolarKits Blueprints count:", masterKits.length);
    masterKits.forEach((m, idx) => {
      console.log(`\n=== Master SolarKit Blueprint #${idx + 1} ===`);
      console.log("ID:", m._id);
      console.log("Name:", m.name);
      console.log("Category:", m.category_id ? m.category_id.name : "NULL");
      console.log("Subcategory:", m.subcategory_id ? m.subcategory_id.name : "NULL");
      console.log("Type:", m.type_id ? m.type_id.name : "NULL");
      console.log("Base Components count:", m.base_components ? m.base_components.length : 0);
      console.log("Base Components:", JSON.stringify(m.base_components, null, 2));
    });

    const skus = await ProductSku.find({ deleted_at: null }).lean();
    console.log("\nProduct SKUs count:", skus.length);
    if (skus.length > 0) {
      console.log("Sample SKU:", JSON.stringify(skus[0], null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
