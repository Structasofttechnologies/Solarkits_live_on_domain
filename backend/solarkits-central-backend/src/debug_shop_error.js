require('dotenv').config();
require('./keys/config/databases');
const mongoose = require('mongoose');

const shopHandler = require('./modules/solarshop-india/controller/v1.handlers/shop.handler');

async function testEndpoints() {
  console.log("🔍 Testing get_combo_kits_by_district logic...");

  const req = { query: {} };
  const res = {
    status: (code) => {
      console.log("Response HTTP Status:", code);
      return res;
    },
    json: (data) => {
      console.log("Response JSON Output:", JSON.stringify(data, null, 2).substring(0, 300));
      return res;
    }
  };

  try {
    await shopHandler.get_combo_kits_by_district(req, res);
  } catch (err) {
    console.error("❌ Exception caught in get_combo_kits_by_district:", err);
  }
}

testEndpoints();
