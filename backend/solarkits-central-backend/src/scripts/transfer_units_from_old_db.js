/**
 * =========================================================================
 * TRANSFER UNITS MANAGEMENT (UNIT GROUPS & UNITS) FROM OLD DB TO NEW DB
 * =========================================================================
 * Old Database Cluster : solarkits-e-shop.2tdrpuq.mongodb.net/solarkits_central_db
 * New Database Cluster : (from backend/.env MONGODB_URI)
 * Collections          : pc_unit_groups, pc_units
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

async function transferUnits() {
  console.log('====================================================');
  console.log('🚀 STARTING UNITS MANAGEMENT DATA TRANSFER (OLD -> NEW)');
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

    // 1. Fetch from Old DB
    const [oldGroups, oldUnits] = await Promise.all([
      oldDb.collection('pc_unit_groups').find({}).toArray(),
      oldDb.collection('pc_units').find({}).toArray()
    ]);

    console.log(`\n📦 Found in Old DB:`);
    console.log(`   - pc_unit_groups : ${oldGroups.length}`);
    console.log(`   - pc_units       : ${oldUnits.length}`);

    if (oldGroups.length === 0) {
      console.log('No unit groups to transfer.');
      return;
    }

    // 2. Prepare Unit Groups BulkWrite
    const groupOps = oldGroups.map(g => ({
      updateOne: {
        filter: { _id: new ObjectId(g._id) },
        update: {
          $set: {
            _id: new ObjectId(g._id),
            name: g.name.trim(),
            code: g.code ? g.code.trim() : null,
            is_system: typeof g.is_system === 'boolean' ? g.is_system : true,
            is_active: typeof g.is_active === 'boolean' ? g.is_active : true,
            deleted_at: g.deleted_at || null,
            created_at: g.created_at ? new Date(g.created_at) : new Date(),
            __v: g.__v || 0
          }
        },
        upsert: true
      }
    }));

    console.log(`\nWriting ${groupOps.length} Unit Groups to New Database...`);
    const groupResult = await newDb.collection('pc_unit_groups').bulkWrite(groupOps);
    console.log('✅ Unit Groups BulkWrite Result:', {
      matchedCount: groupResult.matchedCount,
      modifiedCount: groupResult.modifiedCount,
      upsertedCount: groupResult.upsertedCount
    });

    // 3. Prepare Units BulkWrite
    const unitOps = oldUnits.map(u => ({
      updateOne: {
        filter: { _id: new ObjectId(u._id) },
        update: {
          $set: {
            _id: new ObjectId(u._id),
            name: u.name.trim(),
            symbol: u.symbol.trim(),
            unit_group_id: new ObjectId(u.unit_group_id),
            is_base_unit: Boolean(u.is_base_unit),
            conversion_factor: typeof u.conversion_factor === 'number' ? u.conversion_factor : 1,
            is_system: typeof u.is_system === 'boolean' ? u.is_system : true,
            is_active: typeof u.is_active === 'boolean' ? u.is_active : true,
            deleted_at: u.deleted_at || null,
            created_at: u.created_at ? new Date(u.created_at) : new Date(),
            __v: u.__v || 0
          }
        },
        upsert: true
      }
    }));

    console.log(`\nWriting ${unitOps.length} Units to New Database...`);
    const unitResult = await newDb.collection('pc_units').bulkWrite(unitOps);
    console.log('✅ Units BulkWrite Result:', {
      matchedCount: unitResult.matchedCount,
      modifiedCount: unitResult.modifiedCount,
      upsertedCount: unitResult.upsertedCount
    });

    // 4. Verification in New DB
    const [newGroupCount, newUnitCount] = await Promise.all([
      newDb.collection('pc_unit_groups').countDocuments(),
      newDb.collection('pc_units').countDocuments()
    ]);

    console.log(`\n====================================================`);
    console.log(`🎉 UNITS TRANSFER COMPLETED SUCCESSFULLY!`);
    console.log(`📊 Total Unit Groups in New DB : ${newGroupCount}`);
    console.log(`📊 Total Units in New DB       : ${newUnitCount}`);
    console.log(`====================================================\n`);

  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

transferUnits().catch(err => {
  console.error('❌ Migration Error:', err);
  process.exit(1);
});
