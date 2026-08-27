const axios = require('axios');

async function testAll() {
  const tests = [
    { type: 'Email', id: 'vikram.bde@solarkits.com' },
    { type: 'Mobile', id: '9876543210' },
    { type: 'BDE ID', id: 'BDE-2026-0001' }
  ];

  const endpoints = [
    'http://localhost:5000/api/bde/v1/auth/login',
    'http://localhost:5000/api/india/v1/bde/auth/login',
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    for (const t of tests) {
      try {
        const res = await axios.post(endpoint, {
          identifier: t.id,
          password: 'Bde@Test1234',
        });
        console.log(`  ✅ [${t.type}] Login Succeeded for "${t.id}" -> User: ${res.data.bde?.full_name} (${res.data.bde?.bde_id}) Token: ${res.data.token ? 'OK' : 'MISSING'}`);
      } catch (err) {
        console.error(`  ❌ [${t.type}] Login Failed for "${t.id}":`, err.response?.data?.message || err.message);
      }
    }
  }
}

testAll();

