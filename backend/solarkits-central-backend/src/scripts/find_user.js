require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const { Reseller } = require('../modules/admin-panel/models/india_solarshop_db');
    const resellers = await Reseller.find({}).select('business_name email mobile password_hash activation_status kyc_status created_at').lean();
    console.log("ALL RESELLERS IN DB:", JSON.stringify(resellers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 3000);
