require('dotenv').config({ path: '.env' });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const axios = require('axios');

async function testEpcFlow() {
  const baseURL = 'http://localhost:5000/api';
  console.log('Testing EPC catalogue API via HTTP...');

  try {
    // 1. Login as EPC user structasoft.epc@gmail.com
    let token = null;
    try {
      const loginRes = await axios.post(`${baseURL}/india/v1/auth/login`, {
        email: 'structasoft.epc@gmail.com',
        password: '1234'
      });
      console.log('Login result:', loginRes.data.success ? 'SUCCESS' : 'FAILED');
      token = loginRes.data.accessToken;
    } catch (lErr) {
      console.log('Login attempt failed:', lErr.response?.data || lErr.message);
    }

    // If login failed, generate a test token directly using sign_token
    if (!token) {
      console.log('Signing token directly for test...');
      const { sign_token } = require('./src/modules/solarshop-india/utils/jsonwebtoken');
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      const epc = await mongoose.connection.db.collection('epc_accounts').findOne({ email: 'structasoft.epc@gmail.com' });
      token = sign_token({ account_id: epc._id, company_id: epc.company_id }, { expiresIn: '15m' });
      await mongoose.disconnect();
    }

    console.log('Access token acquired.');

    // 2. Fetch EPC Catalogue
    const catRes = await axios.get(`${baseURL}/india/v1/shop/epc-catalogue`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n=== EPC CATALOGUE RESPONSE ===');
    console.log('Status:', catRes.data.status);
    console.log('Reseller:', catRes.data.reseller_business_name);
    console.log('Total items:', catRes.data.total_items);
    console.log('Catalogue Data:', JSON.stringify(catRes.data.data, null, 2));

    // 3. Fetch EPC Catalogue Status
    const statusRes = await axios.get(`${baseURL}/india/v1/shop/epc-catalogue/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n=== EPC CATALOGUE STATUS RESPONSE ===');
    console.log(JSON.stringify(statusRes.data.data, null, 2));

    // 4. Fetch EPC Wallet
    const walletRes = await axios.get(`${baseURL}/india/v1/reseller/epc/wallet/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n=== EPC WALLET RESPONSE ===');
    console.log(JSON.stringify(walletRes.data.data, null, 2));

  } catch (err) {
    console.error('Error during test:', err.response?.data || err.message);
  }
}

testEpcFlow();
