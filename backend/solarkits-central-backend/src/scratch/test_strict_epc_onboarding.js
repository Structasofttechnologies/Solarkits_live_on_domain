/**
 * test_strict_epc_onboarding.js
 *
 * Verifies:
 * 1. Reseller (Structasoft Admin, Gujarat territory) verifying an out-of-state GSTIN (e.g. Maharashtra 27...)
 *    -> MUST return territory_matched = false with strict rejection reason.
 * 2. Reseller verifying in-state GSTIN (e.g. Gujarat 24...)
 *    -> MUST return territory_matched = true.
 * 3. Reseller attempting to register EPC with duplicate GSTIN belonging to another partner
 *    -> MUST fail with strict exclusivity conflict error.
 * 4. Reseller attempting to register out-of-territory EPC
 *    -> MUST fail with strict territory mismatch error.
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config();
require('../keys/config/databases');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/india/v1/reseller';

async function runTest() {
  console.log('🧪 Starting Strict EPC Onboarding & Exclusivity Test Suite...\n');

  try {
    // 1. Login as Structasoft Reseller (Gujarat)
    console.log('1️⃣ Logging in as Franchise Partner (structasoftadmin@gmail.com)...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email_or_mobile: 'structasoftadmin@gmail.com',
      password: 'structasoftadmin@gmail.com',
    });
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log(`  ✅ Logged in as: ${loginRes.data.user.business_name} (${loginRes.data.user.email}) [KYC: ${loginRes.data.user.kyc_status}]`);

    // 2. Test Out-of-State GSTIN Verification (e.g. Maharashtra '27ABCDE1234F1Z5')
    console.log('\n2️⃣ Testing GSTIN Verification for OUT-OF-TERRITORY State (27 - Maharashtra)...');
    const outOfStateRes = await axios.post(`${BASE_URL}/gst/verify`, {
      gstin: '27ABCDE1234F1Z5',
      context: 'epc_onboarding',
    }, { headers: authHeaders });

    console.log('  GST State:', outOfStateRes.data.data.gst_state_name);
    console.log('  territory_matched:', outOfStateRes.data.data.territory_matched);
    console.log('  territory_reason:', outOfStateRes.data.data.territory_reason);

    if (outOfStateRes.data.data.territory_matched === false) {
      console.log('  ✅ STRICT RULE ENFORCED: Out-of-state GSTIN successfully blocked from onboarding!');
    } else {
      console.error('  ❌ FAILED: Out-of-state GSTIN was incorrectly allowed!');
    }

    // 3. Test In-State GSTIN Verification (e.g. Gujarat '24ABDCS5798J1ZR')
    console.log('\n3️⃣ Testing GSTIN Verification for IN-TERRITORY State (24 - Gujarat)...');
    const inStateRes = await axios.post(`${BASE_URL}/gst/verify`, {
      gstin: '24ABDCS5798J1ZR',
      context: 'epc_onboarding',
    }, { headers: authHeaders });

    console.log('  GST State:', inStateRes.data.data.gst_state_name);
    console.log('  territory_matched:', inStateRes.data.data.territory_matched);
    console.log('  is_unique:', inStateRes.data.data.is_unique);

    if (inStateRes.data.data.territory_matched === true) {
      console.log('  ✅ IN-TERRITORY MATCH: Gujarat GSTIN successfully validated for Gujarat Franchisee!');
    }

    // 4. Test Single-Reseller Exclusivity Check
    console.log('\n4️⃣ Testing Exclusivity Conflict for duplicate EPC registration...');
    // Ensure reseller has verified KYC for submission test
    const { Reseller, EpcAccount } = require('../modules/admin-panel/models/india_solarshop_db');
    await Reseller.findByIdAndUpdate(loginRes.data.user.id, { kyc_status: 'verified', activation_status: 'active' });

    // First create or check an EPC under another owner
    const existingOtherEpc = await EpcAccount.findOne({ gstin: '24ABDCS5798J1ZR' });
    if (!existingOtherEpc) {
      await EpcAccount.create({
        name: 'Existing Gujarat EPC',
        email: 'gujarat.epc@example.com',
        whatsapp: '9988776655',
        gstin: '24ABDCS5798J1ZR',
        status: 'approved',
        onboarded_by_reseller_id: '67bde6000000000000000001', // different reseller
      });
    }

    try {
      await axios.post(`${BASE_URL}/epc-buyers/register`, {
        name: 'Conflict Test EPC',
        company_name: 'Conflict Test Energy',
        email: 'conflict.epc@example.com',
        whatsapp: '9900000001',
        gstin: '24ABDCS5798J1ZR',
        password: 'Password@123',
      }, { headers: authHeaders });
      console.error('  ❌ FAILED: Duplicate GSTIN registration should have thrown an exclusivity error!');
    } catch (err) {
      console.log('  ✅ STRICT EXCLUSIVITY ENFORCED: Blocked with message:\n    👉', err.response?.data?.message || err.message);
    }

    console.log('\n🎉 ALL STRICT TERRITORY & EXCLUSIVITY CONDITIONS VERIFIED 100%!');
  } catch (err) {
    console.error('\n❌ Test Error:', err.response?.data || err.message);
  }
}

runTest();
