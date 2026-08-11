require('dotenv').config();
require('../modules/admin-panel/config/databases');

setTimeout(async () => {
  try {
    const { GeoLevel0, GeoLevel1, GeoLevel2 } = require('../modules/admin-panel/models/geolocation_db');
    const countries = await GeoLevel0.find({ is_active: true }).lean();
    const states = await GeoLevel1.find({ is_active: true }).limit(5).lean();
    const districts = await GeoLevel2.find({ is_active: true }).limit(5).lean();
    console.log("ACTIVE COUNTRIES:", countries.map(c => ({ id: c._id, name: c.name, is_active: c.is_active })));
    console.log("ACTIVE STATES:", states.map(s => ({ id: s._id, name: s.name, country: s.level_0 })));
    console.log("ACTIVE DISTRICTS:", districts.map(d => ({ id: d._id, name: d.name, state: d.level_1 })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 3000);
