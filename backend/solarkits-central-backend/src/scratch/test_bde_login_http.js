const axios = require('axios');

async function testHttpLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/india/v1/bde/auth/login', {
      identifier: 'vikram.bde@solarkits.com',
      password: 'Bde@Test1234',
    });

    console.log('✅ HTTP LOGIN SUCCESSFUL!');
    console.log('Status:', res.data?.status);
    console.log('Message:', res.data?.message);
    console.log('BDE User:', res.data?.data?.bde?.full_name);
    console.log('Token received:', !!res.data?.data?.token);
  } catch (err) {
    console.error('❌ HTTP Login Failed:', err.response?.data || err.message);
  }
}

testHttpLogin();
