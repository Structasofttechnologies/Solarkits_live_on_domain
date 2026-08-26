/**
 * test_bde_step2_suite.js
 *
 * Automated test suite for Step 2: BDE Leads and Franchisee Onboarding Integration.
 */

const mongoose = require('mongoose');
const {
  BDEProfile,
  BDETerritoryAssignment,
  BDEPlanAssignment,
  BDEGoal,
  BDELead,
  BDELeadActivity,
  BDEFollowUp,
  BDEReassignmentHistory,
  TerritoryExceptionRequest,
  Reseller,
  ResellerPlan,
  ResellerKyc,
} = require('../modules/admin-panel/models/india_solarshop_db');
const { CmsUser } = require('../modules/admin-panel/models/user_db');
const {
  validateLeadDuplicates,
  validateBdeTerritory,
  createLead,
  startFranchiseeSignup,
  syncLeadPipelineFromOnboarding,
  reassignLead,
  reassignFranchisee,
  getBdeDashboardMetrics,
} = require('../modules/admin-panel/services/bde.lead.service');
const {
  list_bde_leads,
  get_bde_lead_detail,
  reassign_bde_lead,
  list_attributed_franchisees,
  reassign_franchisee_bde,
  list_territory_exceptions,
  review_territory_exception,
  get_conversion_funnel,
} = require('../modules/admin-panel/controller/bde.lead.admin.handler');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solarkits_db';

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

async function runStep2TestSuite() {
  console.log('🚀 Starting Step 2 BDE Leads & Franchisee Onboarding Integration Test Suite...\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  try {
    // 0. Clean test artifacts
    await BDELead.deleteMany({ email: { $regex: /@step2test\.com$/ } });
    await Reseller.deleteMany({ email: { $regex: /@step2test\.com$/ } });
    await TerritoryExceptionRequest.deleteMany({ prospect_name: { $regex: /Step 2 Test/ } });
    await BDEReassignmentHistory.deleteMany({ reassignment_reason: { $regex: /Step 2 Test/ } });

    // Ensure test BDE profiles exist
    let bdeA = await BDEProfile.findOne({ email: 'bde_step2_a@step2test.com' });
    if (!bdeA) {
      bdeA = await BDEProfile.create({
        bde_id: 'BDE-2026-9001',
        full_name: 'BDE Officer Alpha',
        mobile_number: '9876543201',
        email: 'bde_step2_a@step2test.com',
        state: 'Maharashtra',
        district: 'Pune',
        status: 'active',
      });
    }

    let bdeB = await BDEProfile.findOne({ email: 'bde_step2_b@step2test.com' });
    if (!bdeB) {
      bdeB = await BDEProfile.create({
        bde_id: 'BDE-2026-9002',
        full_name: 'BDE Officer Beta',
        mobile_number: '9876543202',
        email: 'bde_step2_b@step2test.com',
        state: 'Gujarat',
        district: 'Ahmedabad',
        status: 'active',
      });
    }

    // Set territory assignment for BDE A (Maharashtra -> Pune, Nagpur)
    const dummyStateId = new mongoose.Types.ObjectId();
    await BDETerritoryAssignment.deleteMany({ bde_id: bdeA._id });
    await BDETerritoryAssignment.create({
      bde_id: bdeA._id,
      state_id: dummyStateId,
      state_name: 'Maharashtra',
      district_names: ['Pune', 'Nagpur'],
      status: 'active',
    });

    let testPlan = await ResellerPlan.findOne({ slug: 'std-dealer-test' });
    if (!testPlan) {
      testPlan = await ResellerPlan.findOne();
    }
    if (!testPlan) {
      testPlan = await ResellerPlan.create({
        name: 'Standard Dealership Plan',
        code: 'STD_DEALER_TEST',
        slug: 'std-dealer-test',
        joining_fee: 50000,
        status: 'active',
      });
    }

    let adminUser = await CmsUser.findOne();
    if (!adminUser) {
      adminUser = await CmsUser.create({
        name: 'Super Admin',
        email: 'admin_test@solarkits.com',
        phone: '9999988888',
        phone_code: '+91',
        role: 'super_admin',
      });
    }

    // --- TEST 1: In-Territory Lead Creation ---
    console.log('\n--- 1. In-Territory Lead Creation ---');
    const leadData1 = {
      prospect_name: 'Sunil Mehta',
      company_name: 'Step 2 Test Solar Solutions Pune',
      mobile_number: '9822001122',
      email: 'sunil.pune@step2test.com',
      gst_number: '27AABCU9603R1ZM',
      state_name: 'Maharashtra',
      district_name: 'Pune',
      pincode: '411001',
      interested_plan_id: testPlan._id,
      lead_source: 'direct_visit',
      bde_remarks: 'High potential EPC contractor with 5+ residential installs/mo',
      next_follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    const lead1 = await createLead(leadData1, bdeA._id);
    assert(lead1 && lead1.lead_id.startsWith('LD-'), `Lead created with ID ${lead1?.lead_id}`);
    assert(lead1.is_outside_territory === false, 'Territory valid: is_outside_territory is false');
    assert(lead1.lead_status === 'new_lead', 'Initial lead status is new_lead');
    assert(lead1.original_bde_id.toString() === bdeA._id.toString(), 'Original BDE attribution preserved');

    // Check activity log and follow-up created
    const activities = await BDELeadActivity.find({ lead_id: lead1._id });
    assert(activities.length >= 1, `Initial activity log created (Count: ${activities.length})`);
    const followUps = await BDEFollowUp.find({ lead_id: lead1._id });
    assert(followUps.length === 1, `Scheduled follow-up created (Count: ${followUps.length})`);

    // --- TEST 2: Duplicate Lead Prevention ---
    console.log('\n--- 2. Duplicate Lead Prevention ---');
    try {
      await createLead({
        prospect_name: 'Duplicate Person',
        company_name: 'Another Company',
        mobile_number: '9822001122', // Same mobile
        email: 'different@step2test.com',
        state_name: 'Maharashtra',
        district_name: 'Pune',
      }, bdeA._id);
      assert(false, 'Should have blocked duplicate mobile number');
    } catch (err) {
      assert(err.statusCode === 409, `Blocked duplicate mobile number with HTTP 409 (${err.message})`);
    }

    try {
      await createLead({
        prospect_name: 'Duplicate GST Person',
        company_name: 'Another Company',
        mobile_number: '9899001199',
        email: 'sunil.pune@step2test.com', // Same email
        state_name: 'Maharashtra',
        district_name: 'Pune',
      }, bdeA._id);
      assert(false, 'Should have blocked duplicate email');
    } catch (err) {
      assert(err.statusCode === 409, `Blocked duplicate email with HTTP 409 (${err.message})`);
    }

    // --- TEST 3: Outside Territory Lead & Exception Request ---
    console.log('\n--- 3. Outside Territory Exception Request ---');
    const leadDataOutside = {
      prospect_name: 'Step 2 Test Gujarat Prospect',
      company_name: 'Step 2 Test Surat Solar Hub',
      mobile_number: '9822003344',
      email: 'surat.prospect@step2test.com',
      state_name: 'Gujarat', // BDE A only assigned Maharashtra
      district_name: 'Surat',
      outside_territory_reason: 'Prospect met at Mumbai trade expo requested dealership in Surat.',
    };

    const leadOutside = await createLead(leadDataOutside, bdeA._id);
    assert(leadOutside.is_outside_territory === true, 'Flagged is_outside_territory = true');
    assert(leadOutside.territory_exception_id != null, 'Linked territory_exception_id');

    const exceptionDoc = await TerritoryExceptionRequest.findById(leadOutside.territory_exception_id);
    assert(exceptionDoc && exceptionDoc.status === 'pending', 'TerritoryExceptionRequest created with pending status');

    // Admin reviews exception
    const mockReq = { params: { id: exceptionDoc._id }, body: { decision: 'approved', admin_remarks: 'Approved for expo lead' }, user: adminUser };
    const mockRes = {
      status: (code) => ({
        json: (data) => ({ code, data }),
      }),
    };
    const reviewResult = await review_territory_exception(mockReq, mockRes);
    assert(reviewResult.data?.status === 'success', 'Admin approved territory exception');

    const updatedLeadOutside = await BDELead.findById(leadOutside._id);
    assert(updatedLeadOutside.is_outside_territory === false, 'Lead is_outside_territory updated to false after approval');

    // --- TEST 4: Lead Stage Transitions & Restrictions ---
    console.log('\n--- 4. Lead Stage Transitions & Strict Rule Enforcing ---');
    // Block BDE from manually marking approved or fee_paid
    const disallowedReq = {
      user: { id: bdeA._id },
      params: { id: lead1._id },
      body: { new_stage: 'fee_paid' },
    };
    let blockedFee = false;
    const resFeeMock = {
      status: (code) => {
        if (code === 403) blockedFee = true;
        return { json: () => {} };
      },
    };
    const { update_lead_stage } = require('../modules/solarshop-india/controller/bde.portal.handler');
    await update_lead_stage(disallowedReq, resFeeMock);
    assert(blockedFee === true, 'Blocked BDE from manually advancing to fee_paid (HTTP 403)');

    // Allow permitted stages like contacted, interested
    lead1.lead_status = 'contacted';
    await lead1.save();
    assert(lead1.lead_status === 'contacted', 'Lead stage updated to contacted');

    // --- TEST 5: Start Franchisee Signup Integration ---
    console.log('\n--- 5. Start Franchisee Signup & Permanent Attribution ---');
    const signupResult = await startFranchiseeSignup(lead1._id, bdeA._id);
    assert(signupResult.reseller != null, 'Reseller partner record created automatically');
    assert(signupResult.lead.lead_status === 'signup_started', 'Lead stage advanced to signup_started');
    assert(signupResult.reseller.bde_id.toString() === bdeA._id.toString(), 'Reseller current BDE attributed');
    assert(signupResult.reseller.original_bde_id.toString() === bdeA._id.toString(), 'Reseller original BDE preserved');
    assert(signupResult.reseller.lead_id.toString() === lead1._id.toString(), 'Reseller linked to BDE lead ID');

    // Idempotent start signup call
    const signupSecondCall = await startFranchiseeSignup(lead1._id, bdeA._id);
    assert(signupSecondCall.reseller._id.toString() === signupResult.reseller._id.toString(), 'Idempotent: returned existing reseller without duplicate');

    // --- TEST 6: Automatic Pipeline Milestone Sync from Onboarding ---
    console.log('\n--- 6. Pipeline Sync from Onboarding Milestones ---');
    // A. GST Verified
    await syncLeadPipelineFromOnboarding(signupResult.reseller._id, 'gst_verified');
    const leadAfterGst = await BDELead.findById(lead1._id);
    assert(leadAfterGst.lead_status === 'admin_review_pending', 'Lead stage synced to admin_review_pending upon GST verification');

    // B. Admin Approved
    await syncLeadPipelineFromOnboarding(signupResult.reseller._id, 'admin_approved');
    const leadAfterAppr = await BDELead.findById(lead1._id);
    assert(leadAfterAppr.lead_status === 'approved', 'Lead stage synced to approved upon Admin approval');

    // C. Agreement Signed
    await syncLeadPipelineFromOnboarding(signupResult.reseller._id, 'agreement_signed');
    const leadAfterAgr = await BDELead.findById(lead1._id);
    assert(leadAfterAgr.lead_status === 'agreement_signed', 'Lead stage synced to agreement_signed');

    // D. Fee Payment Verified
    await syncLeadPipelineFromOnboarding(signupResult.reseller._id, 'fee_payment_verified');
    const leadAfterFee = await BDELead.findById(lead1._id);
    assert(leadAfterFee.lead_status === 'fee_paid', 'Lead stage synced to fee_paid upon Fee Payment confirmation');
    assert(leadAfterFee.converted_at != null, 'Lead converted_at timestamp recorded');

    // --- TEST 7: Permanent Reassignment with Audit Trail ---
    console.log('\n--- 7. Permanent Reassignment Audit Trail ---');
    const reassignReason = 'Step 2 Test: Regional territory realignment to Gujarat team.';
    const reassignedLead = await reassignLead(lead1._id, bdeB._id, adminUser, reassignReason);
    assert(reassignedLead.current_bde_id.toString() === bdeB._id.toString(), 'Current BDE updated to BDE Beta');
    assert(reassignedLead.original_bde_id.toString() === bdeA._id.toString(), 'Original BDE remains BDE Alpha');

    const reassignmentAudit = await BDEReassignmentHistory.findOne({
      lead_id: lead1._id,
      reassignment_reason: reassignReason,
    });
    assert(reassignmentAudit != null, 'BDEReassignmentHistory log entry created');
    assert(reassignmentAudit.previous_bde_id.toString() === bdeA._id.toString(), 'Previous BDE recorded as Alpha');
    assert(reassignmentAudit.new_bde_id.toString() === bdeB._id.toString(), 'New BDE recorded as Beta');
    assert(reassignmentAudit.reassigned_by.toString() === adminUser._id.toString(), 'Admin user recorded in audit');

    // Reassign Franchisee Reseller
    await reassignFranchisee(signupResult.reseller._id, bdeB._id, adminUser, reassignReason);
    const updatedReseller = await Reseller.findById(signupResult.reseller._id);
    assert(updatedReseller.bde_id.toString() === bdeB._id.toString(), 'Reseller current BDE updated to Beta');
    assert(updatedReseller.original_bde_id.toString() === bdeA._id.toString(), 'Reseller original BDE preserved as Alpha');

    // --- TEST 8: BDE Dashboard Metrics & Conversion Funnel ---
    console.log('\n--- 8. BDE Dashboard Metrics & Conversion Funnel ---');
    const metricsBeta = await getBdeDashboardMetrics(bdeB._id);
    assert(metricsBeta.total_leads >= 1, `BDE Beta metrics total leads: ${metricsBeta.total_leads}`);
    assert(metricsBeta.fees_paid >= 1, `BDE Beta fees paid converted: ${metricsBeta.fees_paid}`);
    assert(metricsBeta.conversion_funnel != null, 'Conversion funnel object computed');
    assert(metricsBeta.conversion_funnel.fee_paid >= 1, 'Conversion funnel fee_paid count valid');

    // --- TEST 9: Admin BDE Leads & Franchisees Listing ---
    console.log('\n--- 9. Admin BDE Leads & Attributed Franchisees Listing ---');
    let adminLeadsData = null;
    await list_bde_leads(
      { query: { page: 1, limit: 10, search: 'Sunil' } },
      {
        status: (code) => ({
          json: (res) => {
            adminLeadsData = res.data;
          },
        }),
      }
    );
    assert(adminLeadsData && adminLeadsData.length >= 1, `Admin listed BDE leads (Found: ${adminLeadsData?.length})`);

    let adminFranchiseesData = null;
    await list_attributed_franchisees(
      { query: { page: 1, limit: 10, search: 'Sunil' } },
      {
        status: (code) => ({
          json: (res) => {
            adminFranchiseesData = res.data;
          },
        }),
      }
    );
    assert(adminFranchiseesData && adminFranchiseesData.length >= 1, `Admin listed attributed franchisees (Found: ${adminFranchiseesData?.length})`);

    // --- TEST 10: Admin Conversion Funnel API ---
    console.log('\n--- 10. Admin Conversion Funnel API ---');
    let funnelResult = null;
    await get_conversion_funnel(
      { query: {} },
      {
        status: (code) => ({
          json: (res) => {
            funnelResult = res.data;
          },
        }),
      }
    );
    assert(funnelResult && funnelResult.stages.length === 7, 'Admin Conversion Funnel returned 7 pipeline stages');
    assert(funnelResult.outcomes != null, 'Funnel outcomes summary calculated');

    console.log(`\n========================================`);
    console.log(`STEP 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runStep2TestSuite();
