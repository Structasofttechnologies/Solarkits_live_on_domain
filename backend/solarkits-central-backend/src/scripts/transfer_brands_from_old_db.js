/**
 * =========================================================================
 * TRANSFER BRANDS FROM OLD DATABASE TO NEW UNIFIED DATABASE
 * =========================================================================
 * Old Database Cluster : solarkits-e-shop.2tdrpuq.mongodb.net/solarkits_central_db
 * New Database Cluster : (from backend/.env MONGODB_URI)
 * =========================================================================
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const OLD_URI = 'mongodb+srv://ravistructasoftadmin_db_user:oWoo6Hal5T050ALF@solarkits-e-shop.2tdrpuq.mongodb.net/solarkits_central_db?retryWrites=true&w=majority';
const NEW_URI = process.env.MONGODB_URI;

if (!NEW_URI) {
  console.error('❌ MONGODB_URI is missing in backend .env');
  process.exit(1);
}

// Known spelling / alias mapping between old district names and new district names
const DISTRICT_ALIASES = {
  'kanchipuram': 'kancheepuram',
  'kachchh': 'kutch'
};

async function transferBrands() {
  console.log('====================================================');
  console.log('🚀 STARTING BRAND DATA TRANSFER (OLD DB -> NEW DB)');
  console.log('====================================================');

  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    console.log('Connecting to Old Database...');
    await oldClient.connect();
    const oldDb = oldClient.db('solarkits_central_db');
    console.log('✅ Connected to Old Database (solarkits_central_db)');

    console.log('Connecting to New Database...');
    await newClient.connect();
    const newDb = newClient.db();
    console.log(`✅ Connected to New Database (${newDb.databaseName})`);

    // 1. Fetch old brands
    const oldBrands = await oldDb.collection('brands').find({}).toArray();
    console.log(`\n📦 Found ${oldBrands.length} brands in Old Database.`);

    if (oldBrands.length === 0) {
      console.log('No brands to transfer.');
      return;
    }

    // 2. Fetch geolocation mapping references
    console.log('\n🗺️ Fetching Geolocation maps from both databases...');
    const [oldStates, oldDistricts, newCountry, newStates, newDistricts] = await Promise.all([
      oldDb.collection('geolocation_level_1').find({}, { projection: { name: 1 } }).toArray(),
      oldDb.collection('geolocation_level_2').find({}, { projection: { name: 1 } }).toArray(),
      newDb.collection('geolocation_level_0').findOne({ name: 'India' }),
      newDb.collection('geolocation_level_1').find({}, { projection: { name: 1 } }).toArray(),
      newDb.collection('geolocation_level_2').find({}, { projection: { name: 1 } }).toArray()
    ]);

    if (!newCountry) {
      throw new Error('Could not find India in new database geolocation_level_0');
    }
    console.log(`✅ Target Country (India) ID: ${newCountry._id}`);

    // Map old IDs to lowercase trimmed names
    const oldStateIdToName = new Map(oldStates.map(s => [s._id.toString(), s.name.trim().toLowerCase()]));
    const oldDistrictIdToName = new Map(oldDistricts.map(d => [d._id.toString(), d.name.trim().toLowerCase()]));

    // Map lowercase trimmed names to new ObjectIds
    const newStateNameToId = new Map(newStates.map(s => [s.name.trim().toLowerCase(), s._id]));
    const newDistrictNameToId = new Map(newDistricts.map(d => [d.name.trim().toLowerCase(), d._id]));

    // 3. Prepare bulk operations
    const bulkOps = [];
    let stats = {
      processed: 0,
      statesMapped: 0,
      statesMissing: 0,
      districtsMapped: 0,
      districtsMissing: 0
    };

    for (const b of oldBrands) {
      stats.processed++;

      // Map Country IDs
      const mappedCountryIds = [newCountry._id];

      // Map State IDs
      const mappedStateIds = [];
      if (Array.isArray(b.state_ids)) {
        for (const oldSid of b.state_ids) {
          const sName = oldStateIdToName.get(oldSid.toString());
          if (sName && newStateNameToId.has(sName)) {
            mappedStateIds.push(newStateNameToId.get(sName));
            stats.statesMapped++;
          } else {
            console.warn(`  ⚠️ State "${sName}" (Old ID: ${oldSid}) not found in new DB for brand "${b.brand_name}"`);
            stats.statesMissing++;
          }
        }
      }

      // Map District IDs
      const mappedDistrictIds = [];
      if (Array.isArray(b.district_ids)) {
        for (const oldDid of b.district_ids) {
          let dName = oldDistrictIdToName.get(oldDid.toString());
          if (dName && DISTRICT_ALIASES[dName]) {
            dName = DISTRICT_ALIASES[dName];
          }

          if (dName && newDistrictNameToId.has(dName)) {
            mappedDistrictIds.push(newDistrictNameToId.get(dName));
            stats.districtsMapped++;
          } else {
            console.warn(`  ⚠️ District "${dName}" (Old ID: ${oldDid}) not found in new DB for brand "${b.brand_name}"`);
            stats.districtsMissing++;
          }
        }
      }

      const brandDoc = {
        _id: new ObjectId(b._id),
        brand_name: b.brand_name.trim(),
        company_name: b.company_name ? b.company_name.trim() : null,
        logo: b.logo || null,
        country_ids: mappedCountryIds,
        state_ids: [...new Set(mappedStateIds.map(id => id.toString()))].map(id => new ObjectId(id)),
        district_ids: [...new Set(mappedDistrictIds.map(id => id.toString()))].map(id => new ObjectId(id)),
        deleted_at: b.deleted_at || null,
        created_at: b.created_at ? new Date(b.created_at) : new Date(),
        updated_at: b.updated_at ? new Date(b.updated_at) : new Date(),
        __v: b.__v || 0
      };

      bulkOps.push({
        updateOne: {
          filter: { _id: brandDoc._id },
          update: { $set: brandDoc },
          upsert: true
        }
      });
    }

    console.log(`\nWriting ${bulkOps.length} brands to New Database...`);
    const bulkResult = await newDb.collection('brands').bulkWrite(bulkOps);
    console.log('✅ BulkWrite Result:', {
      matchedCount: bulkResult.matchedCount,
      modifiedCount: bulkResult.modifiedCount,
      upsertedCount: bulkResult.upsertedCount
    });

    // 4. Verification
    const finalCount = await newDb.collection('brands').countDocuments();
    console.log(`\n====================================================`);
    console.log(`🎉 TRANSFER COMPLETED SUCCESSFULLY!`);
    console.log(`📊 Total Brands in New DB: ${finalCount}`);
    console.log(`📍 States mapped: ${stats.statesMapped}, missing: ${stats.statesMissing}`);
    console.log(`📍 Districts mapped: ${stats.districtsMapped}, missing: ${stats.districtsMissing}`);
    console.log(`====================================================\n`);

  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

transferBrands().catch(err => {
  console.error('❌ Migration Error:', err);
  process.exit(1);
});
