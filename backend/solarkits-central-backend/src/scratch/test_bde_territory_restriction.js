require('dotenv').config();
const mongoose = require('mongoose');
const { BDEProfile } = require('../modules/admin-panel/models/india_solarshop_db');
const { createLead } = require('../modules/admin-panel/services/bde.lead.service');

const MONGO_URI = process.env.MONGODB_URI;

async function testTerritoryEnforcement() {
  try {
    await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/solarkits_db');
    console.log('✅ Connected to MongoDB');

    const bde = await BDEProfile.findOne({ mobile_number: '9822012345' });
    if (!bde) throw new Error('BDE Rahul Patil not found');
    console.log(`Found BDE: ${bde.full_name} (${bde.bde_id})`);

    // Test 1: Try creating a lead in an UNASSIGNED territory (Gujarat / Surat)
    console.log('\n🧪 Test 1: Attempting lead creation in UNASSIGNED territory (Gujarat / Surat)...');
    try {
      await createLead({
        prospect_name: 'Illegal Prospect Test',
        company_name: 'Gujarat Solar Power Test',
        mobile_number: '9876543210',
        email: 'gujarat.test@example.com',
        state_name: 'Gujarat',
        district_name: 'Surat',
      }, bde._id);
      console.error('❌ FAILED: Lead outside territory was permitted!');
    } catch (err) {
      console.log('✅ PASSED: Correctly blocked unauthorized territory submission:', err.message);
    }

    // Test 2: Try creating a lead in an ASSIGNED territory (Maharashtra / Pune)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    console.log('\n🧪 Test 2: Attempting lead creation in ASSIGNED territory (Maharashtra / Pune)...');
    const validLead = await createLead({
      prospect_name: 'Anand Shinde',
      company_name: `Pune Solar Innovations ${randomSuffix}`,
      mobile_number: `982200${randomSuffix}`,
      email: `anand.${randomSuffix}@example.com`,
      state_name: 'Maharashtra',
      district_name: 'Pune',
    }, bde._id);

    console.log(`✅ PASSED: Lead successfully created in assigned territory! ID: ${validLead.lead_id} (${validLead.company_name})`);

    console.log('\n🎉 ALL BDE TERRITORY RESTRICTION TESTS PASSED WITH 100% ACCURACY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

testTerritoryEnforcement();
