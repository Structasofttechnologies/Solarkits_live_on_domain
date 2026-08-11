require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const { Reseller, ResellerKyc, ResellerPlanSubscription, AuditLog } = require('../modules/admin-panel/models/india_solarshop_db');
    const { CmsUser } = require('../modules/admin-panel/models/user_db');
    const id = '6a7ab174f85cdf77c813aaac';
    
    console.log("Finding reseller detail...");
    const [reseller, kyc, subscription, auditLogs] = await Promise.all([
      Reseller.findOne({ _id: id, deleted_at: null })
        .populate('reseller_type_id', 'name slug commercial_mode description')
        .lean(),
      ResellerKyc.findOne({ reseller_id: id }).lean(),
      ResellerPlanSubscription.findOne({ reseller_id: id, status: 'active' }).populate('plan_id').lean(),
      AuditLog.find({ entity_id: id }).sort({ created_at: -1 }).limit(50).lean(),
    ]);

    if (kyc && kyc.verified_by) {
      const vUser = await CmsUser.findById(kyc.verified_by).select('name email').lean();
      kyc.verified_by = vUser;
    }

    console.log('RESELLER DETAIL FETCHED SUCCESSFULLY!');
    console.log('Reseller Name:', reseller.business_name);
  } catch (err) {
    console.error('EXACT ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
