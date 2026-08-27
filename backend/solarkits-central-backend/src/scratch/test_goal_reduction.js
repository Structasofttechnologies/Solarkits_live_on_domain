const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: 'd:/Company_project/SolarKits v2.0/backend/solarkits-central-backend/.env' });
require('d:/Company_project/SolarKits v2.0/backend/solarkits-central-backend/src/keys/config/databases');
const franchiseeGoalService = require('d:/Company_project/SolarKits v2.0/backend/solarkits-central-backend/src/modules/admin-panel/services/franchisee.goal.service');
const { Reseller, FpoOrder, FranchiseeKitTarget } = require('d:/Company_project/SolarKits v2.0/backend/solarkits-central-backend/src/modules/admin-panel/models/india_solarshop_db');

async function testOrderFulfillmentFlow() {
  const reseller = await Reseller.findOne({ email: /structasoftadmin@gmail.com/i, deleted_at: null }).lean();
  console.log('Testing with Reseller:', reseller.business_name, reseller._id);

  const target = await FranchiseeKitTarget.findOne({ is_active: true });
  console.log('Active Target Rule:', target?._id, 'Qty:', target?.target_quantity, 'Stage:', target?.calculation_stage);

  // Check initial widget status
  let widget = await franchiseeGoalService.getGoalWidget(reseller._id);
  console.log('\n[INITIAL STATUS] Monthly Goal:', widget.monthly_goal, '| Eligible:', widget.eligible_kits, '| Balance Remaining:', widget.balance_kits, '| Pct:', widget.achievement_pct + '%');

  // Create simulated FPO Order for 25 kits
  const simulatedOrder = await FpoOrder.create({
    po_number: 'TEST-FPO-' + Date.now(),
    franchisee_id: reseller._id,
    plan_id: target?.plan_id || reseller.plan_subscription_id,
    idempotency_key: 'test-key-' + Date.now(),
    status: 'DELIVERED',
    subtotal_paise: 25000000,
    tax_total_paise: 4500000,
    grand_total_paise: 29500000,
    items: [{
      item_name: '5kW On-Grid Solar Kit',
      quantity: 25,
      delivered_quantity: 25,
      unit_price_paise: 1000000,
      total_price_paise: 25000000,
      tax_paise: 4500000
    }],
    created_at: new Date()
  });
  console.log('\n✓ Created Simulated FPO Order for 25 kits delivered! (PO: ' + simulatedOrder.po_number + ')');

  // Recalculate
  await franchiseeGoalService.recalculateProgress(reseller._id);

  // Check updated widget status
  widget = await franchiseeGoalService.getGoalWidget(reseller._id);
  console.log('\n[AFTER 25 KITS DELIVERED] Monthly Goal:', widget.monthly_goal, '| Eligible:', widget.eligible_kits, '| Balance Remaining:', widget.balance_kits, '| Pct:', widget.achievement_pct + '%', '| Status:', widget.performance_status);

  // Clean up simulated test order
  await FpoOrder.deleteOne({ _id: simulatedOrder._id });
  await franchiseeGoalService.recalculateProgress(reseller._id);
  console.log('\n✓ Cleaned up test simulated order and restored clean state.');

  process.exit(0);
}
testOrderFulfillmentFlow().catch(err => { console.error(err); process.exit(1); });
