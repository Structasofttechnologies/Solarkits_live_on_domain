require('dotenv').config();
const { company_warehouse_db } = require('./config/databases');
const { PurchaseOrder } = require('./models/company_warehouse_db');

async function test() {
  // Wait a bit for connection to be established
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
    const list = await PurchaseOrder.find({})
      .populate('warehouse_id')
      .lean();
    console.log("Total purchase orders:", list.length);
    if (list.length > 0) {
      list.forEach(po => {
        console.log(`PO: ${po.po_number}`);
        console.log(`Warehouse ID field type: ${typeof po.warehouse_id}, value:`, po.warehouse_id);
      });
    } else {
      console.log("No purchase orders found.");
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    process.exit(0);
  }
}

test();
