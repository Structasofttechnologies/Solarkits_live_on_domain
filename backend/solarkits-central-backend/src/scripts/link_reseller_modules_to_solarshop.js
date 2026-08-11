require('dotenv').config();
require('../modules/admin-panel/config/databases');
const { CmsModule, SaaSProduct } = require('../modules/admin-panel/models/user_db/index');

setTimeout(async () => {
  try {
    const solarshop = await SaaSProduct.findOne({ slug: 'solar-shop' }).lean();
    if (!solarshop) {
      console.error("Solar Shop SaaS product not found!");
      process.exit(1);
    }

    const productId = solarshop._id;
    console.log("Found Solar Shop SaaS Product ID:", productId);

    const resellerCodes = [
      'RSL_TYPES', 'RSL_MGMT', 'RSL_KYC', 'RSL_PLAN', 'RSL_TERRITORY',
      'RSL_PROD_AUTH', 'RSL_COMMISSION', 'RSL_WALLET', 'RSL_AGREEMENT',
      'RSL_EPC_BUYERS', 'RSL_AUDIT', 'RSL_REPORTS'
    ];

    const result = await CmsModule.updateMany(
      { unique_code: { $in: resellerCodes } },
      {
        $set: {
          dashboard_context: 'product',
          saas_product_id: productId
        }
      }
    );

    console.log("Updated Reseller CMS Modules to product context:", result);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 2000);
