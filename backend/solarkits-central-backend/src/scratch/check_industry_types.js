const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');
const { IndustryType } = require('../modules/admin-panel/models/core_db');

async function check() {
  try {
    const all = await IndustryType.find({}).lean();
    console.log("ALL IndustryTypes count:", all.length);
    console.log("ALL IndustryTypes:", JSON.stringify(all, null, 2));

    const activeOnly = await IndustryType.find({ deleted_at: null, is_active: true }).lean();
    console.log("Active IndustryTypes count:", activeOnly.length);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
