require('dotenv').config();
const mongoose = require('mongoose');
const { BDEProfile, BDETerritoryAssignment } = require('../modules/admin-panel/models/india_solarshop_db');

const MONGO_URI = process.env.MONGODB_URI;

async function checkTerritoryDB() {
  await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/solarkits_db');
  console.log('✅ Connected to MongoDB');

  const bdes = await BDEProfile.find({}).lean();
  for (const b of bdes) {
    const terr = await BDETerritoryAssignment.find({ bde_id: b._id }).lean();
    console.log(`\nBDE: ${b.full_name} (${b.bde_id}, ${b.email})`);
    console.log('Territory Records:', JSON.stringify(terr, null, 2));
  }

  process.exit(0);
}

checkTerritoryDB();
