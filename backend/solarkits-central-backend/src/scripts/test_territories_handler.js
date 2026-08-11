require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const handler = require('../modules/admin-panel/controller/reseller.territory.handler');
    const req = { params: { id: '6a7ab174f85cdf77c813aaac' } };
    const res = {
      json: (d) => console.log('TERRITORIES SUCCESS! DATA:', d),
      status: (code) => ({ json: (err) => console.error('TERRITORIES ERROR CODE:', code, err) })
    };
    await handler.list_reseller_territories(req, res);
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
