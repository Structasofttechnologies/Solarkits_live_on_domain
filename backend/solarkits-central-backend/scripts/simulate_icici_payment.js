/**
 * ICICI E-Collection Real-Time Payment Simulator
 *
 * Use this script to test and see real-time UTR popups in:
 * 1. Admin Portal
 * 2. Accounts Portal
 * 3. Franchise Dashboard
 * 4. EPC Buyer Checkout
 *
 * Usage:
 *   node scripts/simulate_icici_payment.js
 *   node scripts/simulate_icici_payment.js --amount 1250000 --buyer "Tata Solar EPC" --type direct
 *   node scripts/simulate_icici_payment.js --amount 2500000 --buyer "Adani Green Partner" --type onboarded
 *   node scripts/simulate_icici_payment.js --amount 800000 --type po
 */

const axios = require('axios');
const { encryptResponse, decryptRequest } = require('../src/modules/icici-ecollection/utils/iciciCrypto.helper');

// Parse CLI Arguments
const args = process.argv.slice(2);
function getArg(key, defaultValue) {
  const index = args.indexOf(`--${key}`);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}

const type = getArg('type', 'direct').toLowerCase(); // 'direct' | 'onboarded' | 'po'

let defaultBuyer = 'Apex Solar EPC (Direct)';
let defaultPhone = '9913421453';
let defaultRemark = '[SCENARIO:DIRECT] Direct EPC Transaction';
let defaultVan = 'SLRK9913421453';

if (type === 'onboarded') {
  defaultBuyer = 'Ravi kumar (Urja Grid EPC)';
  defaultPhone = '7383034778';
  defaultRemark = '[SCENARIO:ONBOARDED] Onboarded EPC Purchase';
  defaultVan = 'SLRK7383034778';
} else if (type === 'po') {
  defaultBuyer = 'Gujarat SolarTech Enterprises (Franchisee)';
  defaultPhone = '9876543210';
  defaultRemark = '[SCENARIO:PO] Franchisee PO Order Payment';
  defaultVan = 'SLRKF987654321';
}

const amount = parseFloat(getArg('amount', '1250000'));
const buyerName = getArg('buyer', defaultBuyer);
const phone = getArg('phone', defaultPhone);
const mode = getArg('mode', 'RTGS');
const virtualAccount = getArg('van', defaultVan);
const senderRemark = getArg('remark', defaultRemark);

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1/payments/icici';

async function simulatePayment() {
  const utr = `ICIC${Date.now().toString().slice(-10)}`;
  const txnNumber = `TXN${Date.now().toString().slice(-8)}`;

  console.log('\n=============================================================');
  console.log('⚡ SIMULATING ICICI BANK E-COLLECTION TRANSFER (NO REAL MONEY)');
  console.log('=============================================================');
  console.log(`💰 Transfer Amount:  ₹${amount.toLocaleString('en-IN')}`);
  console.log(`🏦 Virtual Account:   ${virtualAccount}`);
  console.log(`👤 Remitter / Buyer:  ${buyerName}`);
  console.log(`🔢 Simulated UTR:     ${utr}`);
  console.log(`⚡ Payment Mode:      ${mode}`);
  console.log(`🏷️  Scenario Type:     ${type.toUpperCase()} (${senderRemark})`);
  console.log('-------------------------------------------------------------');
  console.log('👉 Browser tabs open rakhein (Admin, Accounts, ya Franchise)');
  console.log('👉 Turant Audio Chime bajega aur Popup aayega!\n');

  // Step 1: Simulate MSG HOLD (Bank remitter validation)
  console.log('1️⃣ Sending MSG HOLD request (Validation)...');
  const msgHoldPacket = {
    ClientCode: 'SLRK',
    VirtualAccountNumber: virtualAccount,
    Mode: mode,
    UTR: utr,
    SenderRemark: senderRemark,
    ClientAccountNo: `TEL${phone.slice(-10)}`,
    Amount: amount.toFixed(2),
    PayerName: buyerName,
    PayerAccNumber: '502000889911',
    PayerBankIFSC: 'HDFC0001234',
    PayerPaymentDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    BankInternalTransactionNumber: txnNumber
  };

  try {
    const encMsgHold = encryptResponse(msgHoldPacket, { service: 'MSG_HOLD' });
    const msgHoldRes = await axios.post(`${BASE_URL}/msg-hold`, encMsgHold);
    const decMsgHold = decryptRequest(msgHoldRes.data);

    if (decMsgHold.AcceptOrReject === 'Y') {
      console.log('   ✅ MSG HOLD Accepted by SolarKits server (Code: 11)');
    } else {
      console.log('   ⚠️ MSG HOLD Response:', decMsgHold);
    }
  } catch (err) {
    console.warn('   ⚠️ MSG HOLD warning:', err.message);
  }

  // Small pause to mimic bank settlement processing (1 second)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 2: Simulate MIS POSTING (Credit Confirmation)
  console.log('2️⃣ Sending MIS POSTING request (Credit Confirmation & Real-time Alert)...');
  const misPostingPacket = {
    ClientCode: 'SLRK',
    VirtualAccountNumber: virtualAccount,
    Mode: mode,
    UTR: utr,
    SenderRemark: senderRemark,
    ClientAccountNo: `TEL${phone.slice(-10)}`,
    Amount: amount.toFixed(2),
    PayerName: buyerName,
    PayerAccNumber: '502000889911',
    PayerBankIFSC: 'HDFC0001234',
    PayerPaymentDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    BankInternalTransactionNumber: txnNumber
  };

  try {
    const encMisPosting = encryptResponse(misPostingPacket, { service: 'MIS_POSTING' });
    const misPostingRes = await axios.post(`${BASE_URL}/mis-posting`, encMisPosting);
    const decMisPosting = decryptRequest(misPostingRes.data);

    console.log('   ✅ MIS POSTING Response from server:', decMisPosting);
    console.log('\n🎉 SUCCESS: Real-Time Payment Broadcast dispatched!');
    console.log('👉 Apne browser me dekhein: Pop-up visible ho gaya hoga!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('❌ MIS POSTING Error:', err.message);
  }
}

simulatePayment();
