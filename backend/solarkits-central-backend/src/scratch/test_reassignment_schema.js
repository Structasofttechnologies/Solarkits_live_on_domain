require('dotenv').config();
const mongoose = require('mongoose');
const { BDEReassignmentHistory, BDEProfile, BDELead } = require('../modules/admin-panel/models/india_solarshop_db');

const MONGO_URI = process.env.MONGODB_URI;

async function testReassignmentHistory() {
  try {
    await mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/solarkits_db');
    console.log('✅ Connected to MongoDB');

    const bdes = await BDEProfile.find({}).limit(2).lean();
    if (bdes.length < 2) {
      console.log('Need at least 2 BDEs');
      process.exit(0);
    }

    const lead = await BDELead.findOne({}).lean();

    // Test creating reassignment history with null reassigned_by
    console.log('🧪 Testing BDEReassignmentHistory.create with null reassigned_by...');
    const history = await BDEReassignmentHistory.create({
      entity_type: 'lead',
      lead_id: lead ? lead._id : null,
      previous_bde_id: bdes[0]._id,
      previous_bde_name: bdes[0].full_name,
      new_bde_id: bdes[1]._id,
      new_bde_name: bdes[1].full_name,
      reassigned_by: null,
      reassigned_by_name: 'Admin',
      reassignment_reason: 'Automated test reassignment',
    });

    console.log('✅ Success! Reassignment log created:', history._id);
    await BDEReassignmentHistory.findByIdAndDelete(history._id);
    console.log('🧹 Cleaned up test record.');

    console.log('🎉 REASSIGNMENT VALIDATION TEST PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
}

testReassignmentHistory();
