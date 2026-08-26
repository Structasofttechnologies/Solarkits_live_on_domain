const axios = require('axios');

async function testAll() {
  const tests = [
    { type: 'Email', id: 'vikram.bde@solarkits.com' },
    { type: 'Mobile', id: '9876543210' },
    { type: 'BDE ID', id: 'BDE-2026-0001' }
  ];

  for (const t of tests) {
    try {
      const res = await axios.post('http://localhost:5000/api/india/v1/bde/auth/login', {
        identifier: t.id,
        password: 'Bde@Test1234',
      });
      console.log(`✅ [${t.type}] Login Succeeded for "${t.id}" -> User: ${res.data.bde?.full_name} (${res.data.bde?.bde_id})`);
    } catch (err) {
      console.error(`❌ [${t.type}] Login Failed for "${t.id}":`, err.response?.data?.message || err.message);
    }
  }
}

testAll();
