const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');
const { CompanyWarehouse } = require('../modules/admin-panel/models/company_warehouse_db');
const { GeoLevel0, GeoLevel1, GeoLevel2 } = require('../modules/admin-panel/models/geolocation_db');

async function check() {
  try {
    const warehouses = await CompanyWarehouse.find({ deleted_at: null }).lean();
    console.log("TOTAL WAREHOUSES IN DB:", warehouses.length);

    for (let idx = 0; idx < warehouses.length; idx++) {
      const w = warehouses[idx];
      const l0 = w.level_0 ? await GeoLevel0.findById(w.level_0).lean() : null;
      const l1 = w.level_1 ? await GeoLevel1.findById(w.level_1).lean() : null;
      const l2 = w.level_2 ? await GeoLevel2.findById(w.level_2).populate('cluster').lean() : null;

      console.log(`\n--- WAREHOUSE #${idx + 1} ---`);
      console.log("ID:", w._id);
      console.log("Code:", w.warehouse_code);
      console.log("Type:", w.warehouse_type);
      console.log("Address:", w.address);
      console.log("Pincode:", w.pincode);
      console.log("Lat/Lng:", w.lat, w.lng);
      console.log("Country (level_0):", l0 ? `${l0.name} (${l0.iso2})` : "NULL", "ID:", w.level_0);
      console.log("State (level_1):", l1 ? l1.name : "NULL", "ID:", w.level_1);
      console.log("District (level_2):", l2 ? l2.name : "NULL", "ID:", w.level_2);
      console.log("Cluster:", l2 && l2.cluster ? l2.cluster.name : "NULL");
      console.log("Status ID:", w.status);
      console.log("Is Active:", w.is_active);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
