require('dotenv').config();
require('../modules/admin-panel/config/databases');
const mongoose = require('mongoose');

setTimeout(async () => {
  try {
    const handler = require('../modules/solarshop-india/controller/reseller.portal.handler');
    const req = { body: { email_or_mobile: 'structasoftadmin@gmail.com', password: 'structasoftadmin@gmail.com' } };
    const res = {
      json: (d) => console.log('HANDLER LOGIN RESPONSE:', JSON.stringify(d, null, 2)),
      status: (s) => ({ json: (d) => console.log('HANDLER ERROR:', s, d) })
    };
    await handler.login_reseller(req, res);
  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
