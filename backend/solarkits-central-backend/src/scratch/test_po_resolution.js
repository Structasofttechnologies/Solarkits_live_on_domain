require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const { FranchiseePlanPoSetting, ResellerPlan, WarehouseComboKit, ResellerPlanSubscription, Reseller } = require('../modules/admin-panel/models/india_solarshop_db');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find active subscriptions
    const subs = await ResellerPlanSubscription.find({ status: 'active' }).populate('plan_id').lean();
    console.log('Found active subscriptions:', subs.length);

    for (const sub of subs) {
      const resellerId = sub.reseller_id;
      const plan = sub.plan_id;
      const planId = plan?._id || plan?.id || plan;

      console.log(`\n========================================`);
      console.log(`Testing Reseller ${resellerId} with Plan: ${plan?.name} (${planId})`);

      // Execute our updated resolution logic
      const poSettingsList = await FranchiseePlanPoSetting.find({
        plan_id: planId,
        is_active: true,
        po_enabled: { $ne: false },
        deleted_at: null,
      })
        .populate({ path: 'allowed_combo_kit_ids', model: WarehouseComboKit })
        .lean();

      let comboKits = [];
      if (poSettingsList.length > 0) {
        poSettingsList.forEach((s) => {
          if (s.po_enabled !== false && Array.isArray(s.allowed_combo_kit_ids)) {
            s.allowed_combo_kit_ids.forEach((k) => {
              if (k && (k._id || k.id)) {
                comboKits.push({
                  id: k._id,
                  name: k.name,
                  po_setting_id: s._id,
                  min_po_quantity: s.min_po_quantity ?? 1,
                  max_po_quantity: s.max_po_quantity ?? null,
                });
              }
            });
          }
        });
      }

      if (comboKits.length === 0) {
        const planKitIds = (plan?.allowed_combo_kit_ids || []).filter(Boolean);
        if (planKitIds.length > 0) {
          const foundKits = await WarehouseComboKit.find({
            _id: { $in: planKitIds },
            is_active: { $ne: false },
            deleted_at: null,
          }).lean();
          foundKits.forEach((k) => {
            comboKits.push({
              id: k._id,
              name: k.name,
              po_setting_id: poSettingsList[0]?._id || null,
              min_po_quantity: poSettingsList[0]?.min_po_quantity ?? 1,
              max_po_quantity: poSettingsList[0]?.max_po_quantity ?? null,
            });
          });
        }
      }

      const uniqueKitsMap = new Map();
      comboKits.forEach((k) => {
        if (k && k.id) {
          const kId = String(k.id);
          if (!uniqueKitsMap.has(kId)) {
            uniqueKitsMap.set(kId, k);
          }
        }
      });
      const uniqueKits = Array.from(uniqueKitsMap.values());

      console.log(`PO Settings count: ${poSettingsList.length}`);
      console.log(`Resolved Combo Kits count: ${uniqueKits.length}`);
      uniqueKits.forEach((k) => {
        console.log(`  - [${k.id}] ${k.name} (Min PO: ${k.min_po_quantity})`);
      });
    }

    await mongoose.disconnect();
  } catch(e) {
    console.error(e);
  }
})();
