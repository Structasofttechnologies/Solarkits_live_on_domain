require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const handler = require('../modules/admin-panel/controller/geolocation.handler');

    const resMock = {
      status: (code) => ({
        json: (d) => console.log(`RESPONSE (${code}):`, d.message || d.status, 'COUNT:', d.data?.length || d.countries?.length || d.states?.length || d.districts?.length)
      })
    };

    console.log("--- Testing get_countries ---");
    await handler.get_countries({}, resMock);

    console.log("--- Testing get_states ---");
    await handler.get_states({ query: { country_id: '69f9be0a711beb75adfcfa7f' } }, resMock);

    console.log("--- Testing get_districts ---");
    await handler.get_districts({ query: { state_id: '69f9be0a711beb75adfcfaab' } }, resMock);

  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    process.exit(0);
  }
}, 3000);
