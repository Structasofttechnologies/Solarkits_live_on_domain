require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const { DeliveryOrder } = require('../src/modules/warehouse-panel/models/company_warehouse_db');

  const d = await DeliveryOrder.findOne({ delivery_order_id: 'DO-2026-0001' });
  if (d) {
    d.items.forEach(it => {
      it.received_qty = 0;
      it.pending_qty = it.ordered_qty;
    });
    // Ensure epcs items also mirror the 3 items
    if (d.epcs && d.epcs.length > 0) {
      d.epcs[0].items = d.items.map(it => ({
        sku: it.sku,
        product_name: it.product_name,
        category: it.category,
        ordered_qty: it.ordered_qty,
        received_qty: 0,
        pending_qty: it.ordered_qty,
        rack_location: it.rack_location
      }));
    }
    await d.save();
    console.log('Successfully updated DO-2026-0001 with 3 items:');
    d.items.forEach(i => console.log(`- ${i.sku} | ${i.product_name} | Ordered: ${i.ordered_qty} | Pending: ${i.pending_qty} | Supplier: ${i.supplier_name} | PI: ${i.pi_reference?.pi_number}`));
  }
  process.exit(0);
}

check();
