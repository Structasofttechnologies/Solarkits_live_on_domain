require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const { FranchiseePlanPoSetting, ResellerPlan, WarehouseComboKit, ResellerPlanSubscription } = require('../modules/admin-panel/models/india_solarshop_db');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check all combo kits
    const allKits = await WarehouseComboKit.find({ deleted_at: null, is_active: { $ne: false } }).lean();
    console.log('=== AVAILABLE COMBO KITS (pc_combo_kits) ===');
    allKits.forEach(k => console.log(k._id.toString(), '|', k.name));

    // Check all PO settings
    const poSettings = await FranchiseePlanPoSetting.find({ deleted_at: null })
      .populate('plan_id', 'name')
      .populate({ path: 'allowed_combo_kit_ids', model: WarehouseComboKit })
      .lean();
    
    console.log('\n=== CURRENT PO SETTINGS IN DB ===');
    poSettings.forEach(s => {
      console.log('Setting:', s._id.toString(), '| Plan:', s.plan_id?.name, '(', s.plan_id?._id?.toString(), ') | Min:', s.min_po_quantity);
      console.log('  Assigned Kits:', (s.allowed_combo_kit_ids || []).map(k => k ? `${k._id} (${k.name})` : 'null'));
    });

    await mongoose.disconnect();
  } catch(e) {
    console.error(e);
  }
})();
