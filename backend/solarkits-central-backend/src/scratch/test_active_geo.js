const { geolocation_db } = require('../modules/admin-panel/config/databases');
const { GeoLevel1, GeoLevel2 } = require('../modules/admin-panel/models/geolocation_db');

async function testGeo() {
  // Wait for db connection
  if (geolocation_db.readyState !== 1) {
    await new Promise(resolve => geolocation_db.once('open', resolve));
  }

  const activeStates = await GeoLevel1.find({
    is_active: true,
    $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
  }).sort({ name: 1 });

  console.log(`\n✅ Found ${activeStates.length} Active States in Admin Location Settings:`);
  for (const s of activeStates) {
    const activeDistricts = await GeoLevel2.find({
      is_active: true,
      level_1: s._id,
      $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
    });
    console.log(`- State: ${s.name} (${s._id}) -> ${activeDistricts.length} active districts`);
    if (activeDistricts.length > 0) {
      console.log(`  Active Districts sample:`, activeDistricts.slice(0, 5).map(d => d.name).join(', '));
    }
  }

  process.exit(0);
}

testGeo().catch(err => {
  console.error(err);
  process.exit(1);
});
