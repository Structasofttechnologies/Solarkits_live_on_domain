require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const handler = require('../modules/admin-panel/controller/reseller.admin.handler');
    const req = { query: { page: 1, limit: 100 } };
    const res = {
      json: (d) => console.log('LIST RESELLERS SUCCESS! COUNT:', d.data?.length, JSON.stringify(d.data, null, 2)),
      status: (code) => ({ json: (err) => console.error('LIST RESELLERS ERROR:', code, err) })
    };
    await handler.list_resellers(req, res);
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
