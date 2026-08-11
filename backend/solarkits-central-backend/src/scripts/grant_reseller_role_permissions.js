require('dotenv').config();
require('../modules/admin-panel/config/databases');
const { CmsRole, CmsModule, CmsRoleWiseModule } = require('../modules/admin-panel/models/user_db/index');

setTimeout(async () => {
  try {
    const roles = await CmsRole.find({}).lean();
    console.log("Roles found:", roles.length);

    const resellerModules = await CmsModule.find({
      unique_code: { $in: ['RSL_TYPES', 'RSL_MGMT', 'RSL_KYC', 'RSL_PLAN', 'RSL_TERRITORY', 'RSL_PROD_AUTH', 'RSL_EPC_BUYERS', 'RSL_WALLET'] }
    }).lean();

    for (const role of roles) {
      for (const mod of resellerModules) {
        await CmsRoleWiseModule.updateOne(
          { role_id: role._id, module_id: mod._id },
          {
            $set: {
              role_id: role._id,
              module_id: mod._id,
              can_view: true,
              can_add: true,
              can_edit: true,
              can_delete: true,
            }
          },
          { upsert: true }
        );
      }
    }
    console.log("Granted full reseller permissions to all active roles!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 2000);
