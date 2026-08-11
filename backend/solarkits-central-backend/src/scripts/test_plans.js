require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const { ResellerPlan } = require('../modules/admin-panel/models/india_solarshop_db');
    const plans = await ResellerPlan.find({ deleted_at: null }).sort({ sort_order: 1, name: 1 }).lean();
    console.log('SUCCESSFULLY FETCHED PLANS WITHOUT ERROR! COUNT:', plans.length);
    console.log(plans.map(p => ({ name: p.name, fee: p.one_time_fee })));
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
