/**
 * ICICI Bank E-Collection End-to-End Test Suite
 *
 * Tests:
 * 1. Hybrid Encryption (RSA 4096 + AES CBC)
 * 2. MSG HOLD API (Real-time Validation)
 * 3. MIS POSTING API (Credit, Auto-Reconciliation, Idempotency / Duplicate Check)
 * 4. Multi-Portal SSE Event Broadcasting
 */

const axios = require('axios');
const { encryptResponse, decryptRequest } = require('../src/modules/icici-ecollection/utils/iciciCrypto.helper');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1/payments/icici';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 STARTING ICICI E-COLLECTION END-TO-END TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // ─── Test 1: Hybrid Cryptography Roundtrip ───────────────────────────
  totalTests++;
  try {
    console.log('Test 1: Testing RSA 4096 + AES CBC Hybrid Cryptography...');
    const samplePayload = {
      ClientCode: 'SLRK',
      VirtualAccountNumber: 'SLRK9876543210',
      Mode: 'RTGS',
      UTR: 'ICIC998877665544',
      Amount: '1500000.00',
      PayerName: 'Apex Solar Energy EPC Pvt Ltd',
      PayerAccNumber: '000123456789',
      PayerBankIFSC: 'HDFC0001234',
      PayerPaymentDate: '20260912',
      BankInternalTransactionNumber: 'REQ20260912001'
    };

    const encryptedPacket = encryptResponse(samplePayload);
    if (!encryptedPacket.encryptedKey || !encryptedPacket.encryptedData) {
      throw new Error('Encrypted packet missing required fields');
    }

    const decrypted = decryptRequest(encryptedPacket);
    if (decrypted.VirtualAccountNumber === samplePayload.VirtualAccountNumber && decrypted.Amount === samplePayload.Amount) {
      console.log('✅ Test 1 PASSED: Encryption & Decryption roundtrip flawless.\n');
      passedTests++;
    } else {
      throw new Error('Decrypted payload mismatch');
    }
  } catch (err) {
    console.error('❌ Test 1 FAILED:', err.message, '\n');
  }

  // ─── Test 2: Virtual Account Details Endpoint ────────────────────────
  totalTests++;
  try {
    console.log('Test 2: Testing /van-details endpoint...');
    const res = await axios.get(`${BASE_URL}/van-details?phone=9876543210`);
    if (res.data?.success && res.data.data.virtual_account_number === 'SLRK9876543210') {
      console.log('✅ Test 2 PASSED: VAN Details resolved correctly:', res.data.data.virtual_account_number);
      console.log('   IFSC:', res.data.data.ifsc_code);
      console.log('   Beneficiary:', res.data.data.beneficiary_name, '\n');
      passedTests++;
    } else {
      throw new Error('Unexpected response format or wrong VAN');
    }
  } catch (err) {
    console.error('❌ Test 2 FAILED:', err.message, '\n');
  }

  // ─── Test 3: MSG HOLD API (Encrypted Webhook) ────────────────────────
  totalTests++;
  try {
    console.log('Test 3: Testing MSG HOLD Webhook with Encrypted Packet...');
    const msgHoldPayload = {
      ClientCode: 'SLRK',
      VirtualAccountNumber: 'SLRK9876543210',
      Mode: 'RTGS',
      UTR: `ICIC${Date.now()}`,
      SenderRemark: 'Solar BOS Kit Advance',
      ClientAccountNo: 'TEL9876543210',
      Amount: '750000.00',
      PayerName: 'Sterling Wilson EPC Ltd',
      PayerAccNumber: '502000112233',
      PayerBankIFSC: 'SBIN0001234',
      PayerPaymentDate: '20260912',
      BankInternalTransactionNumber: `REQ${Date.now()}`
    };

    const encryptedReq = encryptResponse(msgHoldPayload, { service: 'MSG_HOLD' });
    const res = await axios.post(`${BASE_URL}/msg-hold`, encryptedReq);

    // Bank expects encrypted response
    let responseData = res.data;
    if (responseData.encryptedData) {
      responseData = decryptRequest(responseData);
    }

    if (responseData.AcceptOrReject === 'Y' && responseData.Code === '11') {
      console.log('✅ Test 3 PASSED: MSG HOLD returned Accept (Y) with Code: 11.\n');
      passedTests++;
    } else {
      throw new Error(`Expected Accept (Y), got: ${JSON.stringify(responseData)}`);
    }
  } catch (err) {
    console.error('❌ Test 3 FAILED:', err.message, '\n');
  }

  // ─── Test 4: MIS POSTING API (First Credit) ──────────────────────────
  const testUtr = `ICIC${Date.now().toString().slice(-10)}TEST`;
  totalTests++;
  try {
    console.log(`Test 4: Testing MIS POSTING Webhook (First Credit with UTR: ${testUtr})...`);
    const misPostingPayload = {
      ClientCode: 'SLRK',
      VirtualAccountNumber: 'SLRK9876543210',
      Mode: 'RTGS',
      UTR: testUtr,
      SenderRemark: 'Complete Payment for EPC Order',
      ClientAccountNo: 'TEL9876543210',
      Amount: '1250000.00',
      PayerName: 'Premier Energies EPC',
      PayerAccNumber: '00987654321',
      PayerBankIFSC: 'ICIC0000002',
      PayerPaymentDate: '20260912',
      BankInternalTransactionNumber: `TXN${Date.now()}`
    };

    const encryptedReq = encryptResponse(misPostingPayload, { service: 'MIS_POSTING' });
    const res = await axios.post(`${BASE_URL}/mis-posting`, encryptedReq);

    let responseData = res.data;
    if (responseData.encryptedData) {
      responseData = decryptRequest(responseData);
    }

    if (responseData.Response === 'Success' && responseData.Code === '11') {
      console.log('✅ Test 4 PASSED: MIS POSTING successfully credited & returned Code: 11.\n');
      passedTests++;
    } else {
      throw new Error(`Expected Success (11), got: ${JSON.stringify(responseData)}`);
    }
  } catch (err) {
    console.error('❌ Test 4 FAILED:', err.message, '\n');
  }

  // ─── Test 5: MIS POSTING Duplicate UTR Prevention (Idempotency) ──────
  totalTests++;
  try {
    console.log(`Test 5: Testing Duplicate UTR Prevention with re-sent UTR: ${testUtr}...`);
    const duplicatePayload = {
      ClientCode: 'SLRK',
      VirtualAccountNumber: 'SLRK9876543210',
      Mode: 'RTGS',
      UTR: testUtr, // Identical UTR sent again
      Amount: '1250000.00',
      PayerName: 'Premier Energies EPC',
      BankInternalTransactionNumber: `TXN_DUP_${Date.now()}`
    };

    const encryptedReq = encryptResponse(duplicatePayload, { service: 'MIS_POSTING' });
    const res = await axios.post(`${BASE_URL}/mis-posting`, encryptedReq);

    let responseData = res.data;
    if (responseData.encryptedData) {
      responseData = decryptRequest(responseData);
    }

    if (responseData.Response === 'Duplicate UTR' && responseData.Code === '06') {
      console.log('✅ Test 5 PASSED: Idempotency check verified! Returned "Duplicate UTR" (Code: 06).\n');
      passedTests++;
    } else {
      throw new Error(`Expected Duplicate UTR (06), got: ${JSON.stringify(responseData)}`);
    }
  } catch (err) {
    console.error('❌ Test 5 FAILED:', err.message, '\n');
  }

  // ─── Test 6: Audit Log History Endpoint ──────────────────────────────
  totalTests++;
  try {
    console.log('Test 6: Verifying Audit Log in /history endpoint...');
    const res = await axios.get(`${BASE_URL}/history?utr=${testUtr}`);
    if (res.data?.success && res.data.data.length > 0) {
      const log = res.data.data[0];
      console.log('✅ Test 6 PASSED: Found audit log for UTR:', log.utr, '| Status:', log.status, '| Amount: ₹' + log.amount, '\n');
      passedTests++;
    } else {
      throw new Error('Audit log not found in history');
    }
  } catch (err) {
    console.error('❌ Test 6 FAILED:', err.message, '\n');
  }

  console.log('====================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL ICICI E-COLLECTION TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
