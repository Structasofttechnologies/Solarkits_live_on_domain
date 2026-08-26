/**
 * test_store_setup_suite.js
 *
 * Comprehensive end-to-end integration test suite for Step 3:
 * Franchisee Store Setup, Operations, Expansion Planning & Performance Tracking.
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');

const mongoose = require('mongoose');
const {
  StoreSetup,
  StoreSetupSetting,
  StoreSetupChecklist,
  StoreSetupDelay,
  StoreSetupVerification,
  ExpansionPlan,
  Reseller,
  ResellerType,
  ResellerPlan,
  BDEProfile,
  BDEGoal,
  BDENotification,
} = require('../modules/admin-panel/models/india_solarshop_db');
const { CmsUser } = require('../modules/admin-panel/models/user_db');
const {
  getOrCreateSettings,
  createStoreSetupForFranchisee,
  calculateStoreSetupProgress,
  startFranchiseeOperations,
  updateBdePerformanceMetrics,
} = require('../modules/admin-panel/services/store.setup.service');
const adminHandler = require('../modules/admin-panel/controller/store.setup.admin.handler');
const employeeHandler = require('../modules/admin-panel/controller/store.setup.employee.handler');
const bdePortalHandler = require('../modules/solarshop-india/controller/bde.portal.handler');

function mockRes() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🚀 Starting Step 3 Store Setup & Operations Integration Test Suite...\n');

  try {
    // 0. Setup mock Admin, Employee, BDE, and Franchisee
    let adminUser = await CmsUser.findOne({ is_active: true });
    if (!adminUser) {
      adminUser = await CmsUser.create({
        name: 'Super Admin Test',
        email: `admin_${Date.now()}@solarkits.test`,
        phone: '91' + Date.now().toString().slice(-8),
        phone_code: '+91',
        password_hash: 'mockhash',
        is_active: true,
      });
    }

    let stateEmployee = await CmsUser.findOne({ email: 'state.emp@solarkits.test' });
    if (!stateEmployee) {
      stateEmployee = await CmsUser.create({
        name: 'Rajesh Kumar (State Coordinator)',
        email: 'state.emp@solarkits.test',
        phone: '92' + Date.now().toString().slice(-8),
        phone_code: '+91',
        password_hash: 'mockhash',
        is_active: true,
      });
    }

    let testBde = await BDEProfile.findOne({ email: 'bde.step3@solarkits.test' });
    if (!testBde) {
      testBde = await BDEProfile.create({
        bde_id: 'BDE-2026-TEST3',
        full_name: 'Amit Sharma BDE',
        email: 'bde.step3@solarkits.test',
        mobile_number: '9123456780',
        password_hash: 'mockhash',
        status: 'active',
      });
    }

    let testPlan = await ResellerPlan.findOne({ is_active: true });
    if (!testPlan) {
      testPlan = await ResellerPlan.create({
        name: 'District Franchise Partner',
        code: 'DIST_PARTNER',
        slug: 'dist-partner',
        subscription_fee: 50000,
        is_active: true,
      });
    }

    let testType = await ResellerType.findOne({ is_active: true });
    if (!testType) {
      testType = await ResellerType.create({
        name: 'Authorized Franchisee Partner',
        slug: 'authorized-franchisee',
        code: 'FRANCHISEE',
        is_active: true,
      });
    }

    let testReseller = await Reseller.findOne({ email: 'store.partner@solarkits.test' });
    if (!testReseller) {
      testReseller = await Reseller.create({
        business_name: 'Surya Kiran Solar Store',
        contact_person: 'Vikas Gupta',
        email: 'store.partner@solarkits.test',
        mobile: '9988776655',
        password_hash: 'mockhash',
        reseller_type_id: testType._id,
        gst_number: '27AABCS1429B1ZB',
        gst_verified_at: new Date(),
        agreement_status: 'signed',
        agreement_signed_at: new Date(),
        fee_payment_status: 'verified',
        fee_payment_amount: 50000,
        fee_payment_verified_at: new Date(),
        bde_id: testBde._id,
        original_bde_id: testBde._id,
        activation_status: 'pending',
      });
    } else {
      testReseller.reseller_type_id = testType._id;
      testReseller.password_hash = testReseller.password_hash || 'mockhash';
      testReseller.agreement_status = 'signed';
      testReseller.fee_payment_status = 'verified';
      testReseller.gst_verified_at = new Date();
      testReseller.bde_id = testBde._id;
      testReseller.is_operational = false;
      await testReseller.save();
    }

    // Clean any prior test store setup for clean run
    const priorSetup = await StoreSetup.findOne({ franchisee_id: testReseller._id });
    if (priorSetup) {
      await StoreSetupChecklist.deleteMany({ store_setup_id: priorSetup._id });
      await StoreSetupDelay.deleteMany({ store_setup_id: priorSetup._id });
      await StoreSetupVerification.deleteMany({ store_setup_id: priorSetup._id });
      await StoreSetup.deleteOne({ _id: priorSetup._id });
    }

    // ── TEST 1: Auto Store Setup Creation ─────────────────────────────────────
    console.log('\n--- 1. Automatic Store Setup Creation on Payment + Agreement ---');
    const createdSetup = await createStoreSetupForFranchisee(testReseller._id, adminUser._id);
    assert(createdSetup !== null, 'Store setup record created successfully');
    assert(createdSetup.store_setup_id.startsWith('ST-'), `Generated Store Setup ID format valid: ${createdSetup?.store_setup_id}`);
    assert(createdSetup.status === 'not_started', `Initial status is "not_started" (Got: ${createdSetup?.status})`);
    assert(createdSetup.total_activities >= 15, `Created master checklist snapshot items (Count: ${createdSetup?.total_activities})`);

    // ── TEST 2: Idempotency Check ─────────────────────────────────────────────
    console.log('\n--- 2. Duplicate Prevention / Idempotency ---');
    const duplicateCall = await createStoreSetupForFranchisee(testReseller._id, adminUser._id);
    assert(duplicateCall._id.toString() === createdSetup._id.toString(), 'Idempotent: returned existing record without creating duplicate');
    const countCheck = await StoreSetup.countDocuments({ franchisee_id: testReseller._id });
    assert(countCheck === 1, `Exactly 1 store setup exists for this franchisee (Count: ${countCheck})`);

    // ── TEST 3: Admin State Employee Assignment ───────────────────────────────
    console.log('\n--- 3. State Employee Assignment ---');
    const reqAssign = {
      params: { id: createdSetup._id.toString() },
      body: { employee_id: stateEmployee._id.toString(), notes: 'Assigning to lead regional coordinator' },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resAssign = mockRes();
    await adminHandler.assign_employee(reqAssign, resAssign);
    assert(resAssign.statusCode === 200, 'Employee assigned with HTTP 200');
    assert(resAssign.jsonData.data.assigned_employee_name === stateEmployee.name, `Assigned employee name saved: ${resAssign.jsonData.data.assigned_employee_name}`);
    assert(resAssign.jsonData.data.status === 'employee_assigned', `Status updated to "employee_assigned" (Got: ${resAssign.jsonData.data.status})`);

    // ── TEST 4: Scoped State Employee Actions ─────────────────────────────────
    console.log('\n--- 4. Scoped State Employee List & Start Setup ---');
    const reqEmpList = { user: { id: stateEmployee._id, _id: stateEmployee._id, email: stateEmployee.email }, query: {} };
    const resEmpList = mockRes();
    await employeeHandler.list_assigned_setups(reqEmpList, resEmpList);
    assert(resEmpList.statusCode === 200, 'Employee fetched assigned setups');
    assert(resEmpList.jsonData.data.length >= 1, `Employee sees their assigned setup (Found: ${resEmpList.jsonData.data.length})`);

    const reqStart = { params: { id: createdSetup._id.toString() }, user: { id: stateEmployee._id, _id: stateEmployee._id } };
    const resStart = mockRes();
    await employeeHandler.start_setup(reqStart, resStart);
    assert(resStart.statusCode === 200, 'Employee started store setup');
    assert(resStart.jsonData.data.status === 'in_progress', `Status transitioned to "in_progress" (Got: ${resStart.jsonData.data.status})`);

    // ── TEST 5: Checklist Update & Proof Validation ───────────────────────────
    console.log('\n--- 5. Checklist Activity Completion & Proof Enforcing ---');
    const checklistItems = await StoreSetupChecklist.find({ store_setup_id: createdSetup._id }).sort({ display_order: 1 });
    const firstMandatory = checklistItems.find(c => c.is_mandatory && c.proof_required);

    // Attempt completing without proof
    const reqNoProof = {
      params: { id: createdSetup._id.toString(), activity_id: firstMandatory._id.toString() },
      body: { status: 'completed', employee_remarks: 'Completed without photos', proofs: [] },
      user: { id: stateEmployee._id, _id: stateEmployee._id },
    };
    const resNoProof = mockRes();
    await employeeHandler.update_checklist_activity(reqNoProof, resNoProof);
    assert(resNoProof.statusCode === 400, 'Blocked completing mandatory proof item when 0 proofs uploaded');

    // Complete with proof
    const reqWithProof = {
      params: { id: createdSetup._id.toString(), activity_id: firstMandatory._id.toString() },
      body: {
        status: 'completed',
        employee_remarks: 'Verified shop lease document and captured high-res scan',
        proofs: [{ url: 'https://cdn.solarkits.test/proofs/shop_lease.pdf', filename: 'shop_lease.pdf' }],
      },
      user: { id: stateEmployee._id, _id: stateEmployee._id },
    };
    const resWithProof = mockRes();
    await employeeHandler.update_checklist_activity(reqWithProof, resWithProof);
    assert(resWithProof.statusCode === 200, 'Activity completed with proof successfully');
    assert(resWithProof.jsonData.data.progress.completed_activities === 1, `Progress updated: completed count = ${resWithProof.jsonData.data.progress.completed_activities}`);
    assert(resWithProof.jsonData.data.progress.progress_percentage > 0, `Progress percentage > 0% (Got: ${resWithProof.jsonData.data.progress.progress_percentage}%)`);

    // ── TEST 6: Timeline Extension / Delay Request Flow ───────────────────────
    console.log('\n--- 6. Timeline Extension & Admin Delay Approval ---');
    const reqDelay = {
      params: { id: createdSetup._id.toString() },
      body: {
        reason: 'Signboard Fabrication Delay',
        description: 'Vendor delayed Solarkits main glow signboard delivery due to heavy monsoon rains',
        responsible_party: 'branding_agency',
        supporting_proof_urls: ['https://cdn.solarkits.test/proofs/vendor_delay_letter.pdf'],
        corrective_action: 'Expedited alternative local LED signage printer',
        additional_days_requested: 7,
      },
      user: { id: stateEmployee._id, _id: stateEmployee._id, name: stateEmployee.name },
    };
    const resDelay = mockRes();
    await employeeHandler.submit_delay_request(reqDelay, resDelay);
    assert(resDelay.statusCode === 200, 'Delay request submitted');
    assert(resDelay.jsonData.data.decision_status === 'pending', 'Delay request status is "pending"');

    const createdDelay = resDelay.jsonData.data;
    const reqReviewDelay = {
      params: { delay_id: createdDelay._id.toString() },
      body: { decision: 'approved', approved_days: 7, admin_remarks: 'Approved 7 days extension for monsoon delay' },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resReviewDelay = mockRes();
    await adminHandler.review_delay_request(reqReviewDelay, resReviewDelay);
    assert(resReviewDelay.statusCode === 200, 'Admin approved delay request');
    assert(resReviewDelay.jsonData.data.setup.status === 'delay_approved', `Setup status set to "delay_approved" (Got: ${resReviewDelay.jsonData.data.setup.status})`);
    assert(resReviewDelay.jsonData.data.setup.revised_completion_date !== null, 'Revised completion date calculated and saved');

    // ── TEST 7: Complete Remaining Checklist Items ────────────────────────────
    console.log('\n--- 7. Complete All Mandatory Checklist Items ---');
    const latestChecklist = await StoreSetupChecklist.find({ store_setup_id: createdSetup._id });
    for (const item of latestChecklist) {
      if (item.status !== 'completed') {
        item.status = 'completed';
        item.proofs = [{ url: 'https://cdn.solarkits.test/proofs/mock_proof.jpg', filename: 'photo.jpg' }];
        item.completed_at = new Date();
        item.completed_by = stateEmployee._id;
        await item.save();
      }
    }
    const finalProgress = await calculateStoreSetupProgress(createdSetup._id);
    assert(finalProgress.mandatory_pending_activities === 0, `All mandatory activities completed (Pending: ${finalProgress.mandatory_pending_activities})`);
    assert(finalProgress.progress_percentage === 100, `Progress percentage is 100% (Got: ${finalProgress.progress_percentage}%)`);

    // ── TEST 8: Submit for Admin Verification & Correction Cycle ──────────────
    console.log('\n--- 8. Employee Verification Submission & Admin Correction Review ---');
    const reqSubmitVerif = {
      params: { id: createdSetup._id.toString() },
      body: { employee_final_remarks: 'Store setup 100% complete and ready for audit' },
      user: { id: stateEmployee._id, _id: stateEmployee._id, name: stateEmployee.name },
    };
    const resSubmitVerif = mockRes();
    await employeeHandler.submit_for_admin_verification(reqSubmitVerif, resSubmitVerif);
    assert(resSubmitVerif.statusCode === 200, 'Submitted for Admin verification');
    assert(resSubmitVerif.jsonData.data.status === 'admin_verification_pending', 'Status is "admin_verification_pending"');

    // Admin asks for correction
    const reqCorrection = {
      params: { id: createdSetup._id.toString() },
      body: { action: 'correction_required', admin_remarks: 'Please re-upload clearer photo of LiFePO4 battery rack' },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resCorrection = mockRes();
    await adminHandler.review_final_verification(reqCorrection, resCorrection);
    assert(resCorrection.statusCode === 200, 'Admin flagged correction required');
    assert(resCorrection.jsonData.data.status === 'correction_required', 'Status transitioned to "correction_required"');

    // Admin approves verification
    const reqApproveVerif = {
      params: { id: createdSetup._id.toString() },
      body: { action: 'approve', admin_remarks: 'All site photos and branding verified. Excellent work.' },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resApproveVerif = mockRes();
    await adminHandler.review_final_verification(reqApproveVerif, resApproveVerif);
    assert(resApproveVerif.statusCode === 200, 'Admin verified store setup');
    assert(resApproveVerif.jsonData.data.status === 'admin_verified', 'Status transitioned to "admin_verified"');

    // ── TEST 9: Operations Start Activation ───────────────────────────────────
    console.log('\n--- 9. Operations Start & BDE Performance Integration ---');
    const reqStartOps = {
      params: { id: createdSetup._id.toString() },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resStartOps = mockRes();
    await adminHandler.start_operations(reqStartOps, resStartOps);
    assert(resStartOps.statusCode === 200, 'Operations started successfully with HTTP 200');
    assert(resStartOps.jsonData.data.status === 'operations_started', 'Setup status marked "operations_started"');
    assert(resStartOps.jsonData.data.is_operational === true, 'Reseller marked is_operational = true');

    const updatedReseller = await Reseller.findById(testReseller._id);
    assert(updatedReseller.is_operational === true, 'Reseller in DB is operational');
    assert(updatedReseller.activation_status === 'active', 'Reseller activation_status is active');

    // Check BDE metrics update
    const bdeMetrics = await updateBdePerformanceMetrics(testBde._id);
    assert(bdeMetrics.operational_stores >= 1, `BDE operational stores updated to ${bdeMetrics.operational_stores}`);

    // ── TEST 10: BDE Portal Store Setup Access ────────────────────────────────
    console.log('\n--- 10. BDE Portal Attributed Store Setup View ---');
    const reqBdeSetups = { user: { id: testBde._id, _id: testBde._id } };
    const resBdeSetups = mockRes();
    await bdePortalHandler.get_my_store_setups(reqBdeSetups, resBdeSetups);
    assert(resBdeSetups.statusCode === 200, 'BDE fetched attributed store setups');
    assert(resBdeSetups.jsonData.data.length >= 1, `BDE sees attributed store setup (Count: ${resBdeSetups.jsonData.data.length})`);
    assert(resBdeSetups.jsonData.data[0].status === 'operations_started', `BDE sees operational status: ${resBdeSetups.jsonData.data[0].status}`);

    // ── TEST 11: Expansion Plans Tracking ─────────────────────────────────────
    console.log('\n--- 11. Regional Expansion Plans Target vs Actuals ---');
    const reqCreateExp = {
      body: {
        title: 'Maharashtra Q3 Solar Expansion',
        financial_year: '2026-2027',
        quarter: 3,
        target_signups: 10,
        target_fee_paid: 8,
        target_operational_stores: 5,
        assigned_bde_id: testBde._id,
        assigned_bde_name: testBde.full_name,
        priority: 'high',
      },
      user: { id: adminUser._id, _id: adminUser._id },
    };
    const resCreateExp = mockRes();
    await adminHandler.create_expansion_plan(reqCreateExp, resCreateExp);
    assert(resCreateExp.statusCode === 200, 'Expansion plan created');

    const resListExp = mockRes();
    await adminHandler.list_expansion_plans({ query: {} }, resListExp);
    assert(resListExp.statusCode === 200, 'Expansion plans listed');
    assert(resListExp.jsonData.data.length >= 1, 'Expansion plans data returned with calculated actuals');

    // ── TEST 12: Franchisee Performance Ranking ───────────────────────────────
    console.log('\n--- 12. Franchisee Performance Ranking Tiers ---');
    const resRanking = mockRes();
    await adminHandler.get_franchisee_performance_ranking({ query: {} }, resRanking);
    assert(resRanking.statusCode === 200, 'Franchisee performance ranking calculated');
    assert(resRanking.jsonData.data.ranking.length >= 1, `Operational franchisees ranked (Total: ${resRanking.jsonData.data.ranking.length})`);
    assert(resRanking.jsonData.data.ranking[0].category !== undefined, `Tier assigned: ${resRanking.jsonData.data.ranking[0].category}`);

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('❌ Test suite failed with exception:', err);
    process.exit(1);
  }
}

runTests();
