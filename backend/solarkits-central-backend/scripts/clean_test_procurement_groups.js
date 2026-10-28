const mongoose = require('mongoose');
require('dotenv').config();

async function cleanTestProcurementGroups() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to database:', mongoose.connection.name);
  const db = mongoose.connection.db;

  const targetGroupIds = ['PG-2026-0001', 'PG-2026-0002', 'PG-2026-0003'];

  const pgResult = await db.collection('procurement_groups').deleteMany({
    group_id: { $in: targetGroupIds }
  });
  console.log(`Deleted ${pgResult.deletedCount} test procurement groups.`);

  const piResult = await db.collection('purchase_indents').deleteMany({
    order_group_id: { $in: targetGroupIds }
  });
  console.log(`Deleted ${piResult.deletedCount} related purchase indents.`);

  const resResult = await db.collection('warehouse_inventory_reservations').deleteMany({
    order_group_id: { $in: targetGroupIds }
  });
  console.log(`Deleted ${resResult.deletedCount} related reservations.`);

  // Reset any EPC orders that might have been linked to these groups
  const resetOrdersResult = await db.collection('epc_orders').updateMany(
    { procurement_group_id: { $in: targetGroupIds } },
    { $unset: { procurement_group_id: "", is_grouped: "" } }
  );
  console.log(`Reset ${resetOrdersResult.modifiedCount} EPC orders.`);

  const remainingGroups = await db.collection('procurement_groups').find({}).toArray();
  console.log('Remaining procurement groups count:', remainingGroups.length);

  await mongoose.disconnect();
  console.log('Done!');
}

cleanTestProcurementGroups().catch(err => {
  console.error('Error cleaning test batches:', err);
  process.exit(1);
});
