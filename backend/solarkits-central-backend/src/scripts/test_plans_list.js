require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const handler = require('../modules/admin-panel/controller/reseller.plans.handler');
    const req = { query: { active_only: 'true' } };
    const res = { json: (d) => console.log('PLANS LIST SUCCESS:', d.status, 'COUNT:', d.data?.length) };
    await handler.list_reseller_plans(req, res);
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
