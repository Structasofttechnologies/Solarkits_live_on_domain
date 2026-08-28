require('dotenv').config();
const mongoose = require('mongoose');
const { getMasterChecklistTemplate, syncActiveStoreSetupsWithMasterSettings } = require('../modules/admin-panel/services/store.setup.service');

const MONGO_URI = process.env.MONGODB_URI;

async function test() {
  try {
    await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/solarkits_db');
    console.log('✅ Connected to MongoDB');

    const template = await getMasterChecklistTemplate();
    console.log('\n📋 Master Checklist Template:');
    console.log('Total Count:', template.total_count);
    console.log('Mandatory Count:', template.mandatory_count);
    console.log('Categories:', template.categories);
    console.log('First 3 Activities:', template.activities.slice(0, 3));

    console.log('\n🔄 Testing sync with active setups:');
    const syncRes = await syncActiveStoreSetupsWithMasterSettings();
    console.log('Sync Result:', syncRes);

    console.log('\n🎉 ALL MASTER DOCUMENT ENGINE TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

test();
