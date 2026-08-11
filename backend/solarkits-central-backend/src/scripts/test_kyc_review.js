require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const handler = require('../modules/admin-panel/controller/reseller.admin.handler');
    const req = { params: { id: '6a7ab174f85cdf77c813aaac' }, body: { decision: 'verify' }, user: { id: 'admin123' } };
    const res = {
      json: (d) => console.log('KYC VERIFY SUCCESS:', d),
      status: (c) => ({ json: (e) => console.error('KYC VERIFY ERROR:', c, e) })
    };
    await handler.review_kyc(req, res);
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
