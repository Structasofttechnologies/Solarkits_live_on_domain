require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function syncAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const procurementHandler = require('../src/modules/account-panel/controller/procurement.handler');
    const { PurchaseIndent } = require('../src/modules/account-panel/models/company_warehouse_db');
    const { DeliveryOrder } = require('../src/modules/warehouse-panel/models/company_warehouse_db');

    const advancePaidPIs = await PurchaseIndent.find({
      $or: [
        { 'payment.advance_payment.utr_number': { $exists: true, $ne: '' } },
        { 'payment.payment_status': { $in: ['Advance Paid', 'Paid'] } }
      ]
    });

    console.log(`Found ${advancePaidPIs.length} Advance Paid PIs`);

    for (const pi of advancePaidPIs) {
      console.log(`Syncing PI: ${pi.pi_number} (Supplier: ${pi.supplier_name}, Order: ${pi.customer_order_number}, Group: ${pi.order_group_id})...`);
      const doDoc = await procurementHandler.sync_delivery_order_from_pi(pi, { name: 'System Sync' });
      if (doDoc) {
        console.log(`-> Successfully synced to DeliveryOrder: ${doDoc.delivery_order_id} (Order: #${doDoc.order_number}, Status: ${doDoc.delivery_status})`);
      } else {
        console.log(`-> Failed to sync PI ${pi.pi_number}`);
      }
    }

    const totalDOs = await DeliveryOrder.countDocuments({});
    console.log(`Total Delivery Orders now in company_warehouse_db: ${totalDOs}`);

    const allDOs = await DeliveryOrder.find({}).lean();
    allDOs.forEach(d => {
      console.log(`DO ID: ${d.delivery_order_id} | Order #: ${d.order_number} | Customer: ${d.customer_name} | Items: ${d.items?.length} | Status: ${d.delivery_status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

syncAll();
