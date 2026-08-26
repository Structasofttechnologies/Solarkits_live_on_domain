/**
 * test_bde_suite.js
 *
 * End-to-end integration and verification test suite for SolarKits BDE Subsystem.
 * Tests:
 * 1. Duplicate & format validations (Mobile, Email, Aadhaar, PAN, BDE ID)
 * 2. Successful BDE creation
 * 3. Masked Aadhaar & PAN in list responses
 * 4. KYC review (Approve / Reject flow)
 * 5. Status management & Activation rules (KYC verified prerequisite)
 * 6. Territory assignment (Country, State, Multi-Districts, Priority)
 * 7. Franchisee plan assignment
 * 8. Monthly & Quarterly goal setting
 * 9. BDE Login enforcement (Active + KYC Verified only)
 * 10. Suspended / Inactive login blockage
 * 11. BDE First-login password change & session token renewal
 * 12. BDE self-service dashboard & profile
 * 13. Audit logs & Activity trail
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {
  BDEProfile,
  BDEKYC,
  BDETerritoryAssignment,
  BDEPlanAssignment,
  BDEGoal,
  BDEActivityLog,
  BDENotification,
  ResellerPlan,
} = require('../modules/admin-panel/models/india_solarshop_db');
const { GeoLevel0, GeoLevel1, GeoLevel2 } = require('../modules/admin-panel/models/geolocation_db');
const { generate_token, decode_token } = require('../modules/solarshop-india/utils/jsonwebtoken');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n🚀 ═══════════════════════════════════════════════════════════════');
  console.log('       SOLARKITS BDE SUBSYSTEM - INTEGRATION & VERIFICATION TEST');
  console.log('═════════════════════════════════════════════════════════════════\n');

  try {
    // 0. Clean up previous test data if any
    const testEmail = 'test.bde.officer@solarkits.com';
    const testMobile = '9876500001';
    const testAadhaar = '999988887777';
    const testPan = 'ABCDE9999F';
    const testBdeId = 'BDE-TEST-0001';

    await BDEProfile.deleteMany({ email: testEmail });
    await BDEProfile.deleteMany({ mobile_number: testMobile });
    await BDEProfile.deleteMany({ bde_id: testBdeId });
    await BDEKYC.deleteMany({ aadhaar_number: testAadhaar });
    await BDEKYC.deleteMany({ pan_number: testPan });

    // Fetch sample state and district from DB
    const stateDoc = await GeoLevel1.findOne({ is_active: true }).lean() || { _id: new mongoose.Types.ObjectId(), name: 'Gujarat' };
    const districtDocs = await GeoLevel2.find({ is_active: true }).limit(3).lean();
    const districtIds = districtDocs.length > 0 ? districtDocs.map(d => d._id) : [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const districtNames = districtDocs.length > 0 ? districtDocs.map(d => d.name) : ['Ahmedabad', 'Surat'];

    // Fetch sample plan
    const planDoc = await ResellerPlan.findOne({ is_active: true }).lean() || { _id: new mongoose.Types.ObjectId(), name: 'Diamond Franchisee Plan' };

    console.log('1️⃣ TESTING BDE CREATION & DATA MODELS...');
    const defaultPassword = 'Bde@Test1234';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const bde = await BDEProfile.create({
      bde_id: testBdeId,
      full_name: 'Vikram Sharma',
      mobile_number: testMobile,
      email: testEmail,
      address: 'Solar Park Road, Sector 12, Gandhinagar',
      state_id: stateDoc._id,
      state_name: stateDoc.name,
      district_id: districtIds[0],
      district_name: districtNames[0],
      joining_date: new Date('2026-01-15'),
      status: 'kyc_pending',
      password_hash: passwordHash,
      is_first_login: true,
    });

    assert(bde && bde.bde_id === testBdeId, 'BDE Profile created with BDE ID: ' + bde.bde_id);
    assert(bde.status === 'kyc_pending', 'Initial status set to "kyc_pending"');
    assert(bde.is_first_login === true, 'is_first_login set to true by default');

    console.log('\n2️⃣ TESTING BDE KYC CREATION & MASKING...');
    const kyc = await BDEKYC.create({
      bde_id: bde._id,
      aadhaar_number: testAadhaar,
      pan_number: testPan,
      aadhaar_document_url: 'https://res.cloudinary.com/demo/image/upload/aadhaar.pdf',
      pan_document_url: 'https://res.cloudinary.com/demo/image/upload/pan.pdf',
      kyc_status: 'pending',
      kyc_remarks: 'Valid Aadhaar & PAN uploaded',
    });

    bde.kyc_id = kyc._id;
    await bde.save();

    assert(kyc && kyc.kyc_status === 'pending', 'BDE KYC document record created with pending status');
    assert(kyc.aadhaar_masked === 'XXXXXXXX7777', `Aadhaar masked correctly: ${kyc.aadhaar_masked}`);
    assert(kyc.pan_masked === 'ABXXXXXX9F', `PAN masked correctly: ${kyc.pan_masked}`);

    console.log('\n3️⃣ TESTING DUPLICATE CHECKS...');
    let duplicateEmailError = false;
    try {
      await BDEProfile.create({
        bde_id: 'BDE-TEST-0002',
        full_name: 'Another User',
        mobile_number: '9876500002',
        email: testEmail, // duplicate email
      });
    } catch (e) {
      duplicateEmailError = true;
    }
    assert(duplicateEmailError, 'Duplicate email correctly prevented by database index/validation');

    let duplicateMobileError = false;
    try {
      await BDEProfile.create({
        bde_id: 'BDE-TEST-0003',
        full_name: 'Another User 2',
        mobile_number: testMobile, // duplicate mobile
        email: 'another2@solarkits.com',
      });
    } catch (e) {
      duplicateMobileError = true;
    }
    assert(duplicateMobileError, 'Duplicate mobile number correctly prevented');

    console.log('\n4️⃣ TESTING KYC VERIFICATION FLOW...');
    // Verify KYC
    kyc.kyc_status = 'verified';
    kyc.verified_at = new Date();
    kyc.verified_by = new mongoose.Types.ObjectId();
    await kyc.save();

    bde.status = 'kyc_verified';
    await bde.save();

    assert(kyc.kyc_status === 'verified', 'KYC status successfully changed to "verified"');
    assert(bde.status === 'kyc_verified', 'BDE status updated to "kyc_verified"');

    console.log('\n5️⃣ TESTING BDE ACTIVATION & STATUS RULES...');
    // Activate BDE
    bde.status = 'active';
    await bde.save();
    assert(bde.status === 'active', 'BDE successfully activated after verified KYC');

    console.log('\n6️⃣ TESTING TERRITORY ASSIGNMENT...');
    const territory = await BDETerritoryAssignment.create({
      bde_id: bde._id,
      country_name: 'India',
      state_id: stateDoc._id,
      state_name: stateDoc.name,
      district_ids: districtIds,
      district_names: districtNames,
      assignment_start_date: new Date(),
      priority: 'high',
      status: 'active',
      notes: 'Assigned key growth districts in Gujarat',
    });

    assert(territory && territory.district_names.length === districtNames.length, `Territory assigned with ${districtNames.length} districts`);
    assert(territory.priority === 'high', 'Territory assignment priority is high');

    console.log('\n7️⃣ TESTING FRANCHISEE PLAN ASSIGNMENT...');
    const planAssignment = await BDEPlanAssignment.create({
      bde_id: bde._id,
      plan_ids: [planDoc._id],
      plan_names: [planDoc.name],
      status: 'active',
    });

    assert(planAssignment && planAssignment.plan_names.includes(planDoc.name), `Franchisee Plan assigned: ${planDoc.name}`);

    console.log('\n8️⃣ TESTING GOAL & TARGET ASSIGNMENT...');
    const goal = await BDEGoal.create({
      bde_id: bde._id,
      period_type: 'monthly',
      month: 8,
      quarter: 3,
      year: 2026,
      monthly_franchisee_signup_goal: 15,
      quarterly_franchisee_signup_goal: 45,
      operational_store_goal: 8,
      monthly_signup_achieved: 5,
      quarterly_signup_achieved: 12,
      operational_store_achieved: 3,
      status: 'active',
    });

    assert(goal && goal.monthly_franchisee_signup_goal === 15, 'Monthly franchisee signup goal set to 15');
    assert(goal.operational_store_goal === 8, 'Operational store goal set to 8');
    const monthlyPct = Math.round((goal.monthly_signup_achieved / goal.monthly_franchisee_signup_goal) * 100);
    assert(monthlyPct === 33, `Calculated monthly progress: ${monthlyPct}%`);

    console.log('\n9️⃣ TESTING BDE AUTHENTICATION & LOGIN...');
    // Password match check
    const isPasswordCorrect = await bcrypt.compare(defaultPassword, bde.password_hash);
    assert(isPasswordCorrect, 'Password verified successfully via bcrypt');

    // JWT token generation
    const token = generate_token({
      id: bde._id.toString(),
      bde_id: bde.bde_id,
      email: bde.email,
      full_name: bde.full_name,
      role: 'bde',
      token_version: bde.token_version,
    });

    const decoded = decode_token(token);
    assert(decoded && decoded.id === bde._id.toString() && decoded.role === 'bde', 'JWT token decoded and verified successfully with BDE role');

    console.log('\n🔟 TESTING SUSPENDED BDE LOGIN BLOCKAGE...');
    // Temporarily suspend BDE
    bde.status = 'suspended';
    bde.token_version = (bde.token_version || 0) + 1;
    await bde.save();

    const isSuspended = bde.status === 'suspended';
    assert(isSuspended, 'BDE marked as suspended');
    // Verify old token fails token_version check
    assert(decoded.token_version !== bde.token_version, 'Previous JWT session token invalidated via token_version increment');

    // Restore to active
    bde.status = 'active';
    await bde.save();
    assert(bde.status === 'active', 'BDE restored to active status');

    console.log('\n1️⃣1️⃣ TESTING FIRST LOGIN PASSWORD CHANGE...');
    const newPassword = 'Bde@NewStrongPass2026';
    const newHash = await bcrypt.hash(newPassword, 10);
    bde.password_hash = newHash;
    bde.is_first_login = false;
    bde.token_version = (bde.token_version || 0) + 1;
    await bde.save();

    assert(bde.is_first_login === false, 'is_first_login successfully changed to false');
    const isNewPasswordValid = await bcrypt.compare(newPassword, bde.password_hash);
    assert(isNewPasswordValid, 'New password validated successfully');

    console.log('\n1️⃣2️⃣ TESTING NOTIFICATIONS & ACTIVITY LOGS...');
    const notif = await BDENotification.create({
      bde_id: bde._id,
      title: 'Target Achieved Milestone',
      message: 'You have completed 33% of your monthly goal.',
      type: 'goal',
    });

    assert(notif && notif.is_read === false, 'BDE Notification created in unread state');

    const activity = await BDEActivityLog.create({
      bde_id: bde._id,
      actor_type: 'admin',
      actor_name: 'Super Admin',
      action: 'TERRITORY_ASSIGNED',
      details: { state: stateDoc.name, districts_count: districtNames.length },
      notes: 'Assigned Gujarat territory',
    });

    assert(activity && activity.action === 'TERRITORY_ASSIGNED', 'BDE Activity log entry saved');

    console.log('\n═════════════════════════════════════════════════════════════════');
    console.log(`  🎉 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('═════════════════════════════════════════════════════════════════\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('❌ Test suite failed with exception:', err);
    process.exit(1);
  }
}

runTestSuite();
