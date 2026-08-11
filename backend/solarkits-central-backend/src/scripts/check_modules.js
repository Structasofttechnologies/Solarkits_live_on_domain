require('dotenv').config();
require('../modules/admin-panel/config/databases');
const { CmsModule, SaasProduct } = require('../modules/admin-panel/models/user_db/index');

setTimeout(async () => {
  try {
    const modules = await CmsModule.find({
      unique_code: { $in: ['ADM_APPROVE_EPC', 'ADM_ORDER_SETTINGS', 'RSL_MGMT', 'RSL_TYPES', 'RSL_PLAN', 'RSL_TERRITORY', 'RSL_PROD_AUTH', 'RSL_EPC_BUYERS', 'RSL_WALLET'] }
    }).lean();

    console.log("Found Modules:", modules.map(m => ({
      code: m.unique_code,
      context: m.dashboard_context,
      product_id: m.saas_product_id
    })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 2000);
