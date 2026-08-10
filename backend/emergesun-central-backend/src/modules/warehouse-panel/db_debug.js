const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const { company_warehouse_db, emergesun_core_db, user_db } = require('./config/databases');
const { WarehouseUser, WarehouseInward, WarehouseStock } = require('./models/company_warehouse_db');
const { ProductSkuPrice, ProductSku } = require('./models/core_db');

async function debug() {
  console.log("Connecting to databases...");
  // Wait a moment for connections to establish
  await new Promise(r => setTimeout(r, 2000));

  console.log("\n--- Warehouse Users ---");
  const users = await WarehouseUser.find({}).lean();
  console.log(JSON.stringify(users, null, 2));

  console.log("\n--- Product SKU Prices (Price Master) ---");
  const prices = await ProductSkuPrice.find({}).lean();
  console.log(JSON.stringify(prices, null, 2));

  console.log("\n--- Product SKUs ---");
  const skus = await ProductSku.find({}).lean();
  console.log(JSON.stringify(skus, null, 2));

  console.log("\n--- Warehouse Inwards ---");
  const inwards = await WarehouseInward.find({}).lean();
  console.log(JSON.stringify(inwards, null, 2));

  console.log("\nDone!");
  process.exit(0);
}

debug().catch(err => {
  console.error("Debug script failed:", err);
  process.exit(1);
});
