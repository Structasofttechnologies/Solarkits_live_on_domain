require('dotenv').config();
const mongoose = require('mongoose');
const { BDEProfile, BDETerritoryAssignment } = require('../modules/admin-panel/models/india_solarshop_db');

const MONGO_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/solarkits_db');
  console.log('✅ Connected to MongoDB');

  const bdes = await BDEProfile.find({}).lean();
  console.log(`Found ${bdes.length} BDE profiles:`);
  for (const b of bdes) {
    const terrs = await BDETerritoryAssignment.find({ bde_id: b._id }).lean();
    console.log(`- BDE ${b.bde_id} (${b.full_name}, ${b.mobile_number}):`, terrs.map(t => ({
      state: t.state_name,
      districts: t.district_names,
      status: t.status,
    })));
  }

  process.exit(0);
}

check();
