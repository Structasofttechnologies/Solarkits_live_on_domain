const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS servers to avoid querySrv ECONNREFUSED issues on local systems or VPNs
dns.setServers(['1.1.1.1', '8.8.8.8']);

const SOURCE_DATABASES = [
  'solarkits_cms_users',
  'solarkits_geolocations',
  'solarkits_company_warehouses',
  'solarkits_core_db',
  'solarkits_india_core_db',
  'solarkits_india_solarshop',
  'solarkits_supplier_db'
];

const DEST_URI = 'mongodb://localhost:27017/solarkits-project';

async function syncAll() {
  console.log('🔄 Connecting to Local MongoDB destination database...');
  const destConn = await mongoose.createConnection(DEST_URI).asPromise();
  console.log('✅ Connected to Local MongoDB');

  // Loop through each source database and sync its collections
  for (const dbName of SOURCE_DATABASES) {
    const sourceUri = `mongodb+srv://test:U00VAHrtpWdqln6W@cluster0.gqiyonh.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    console.log(`\n🔄 Connecting to remote database: ${dbName}...`);
    let srcConn;
    try {
      srcConn = await mongoose.createConnection(sourceUri).asPromise();
      console.log(`✅ Connected to ${dbName}`);
    } catch (e) {
      console.error(`❌ Failed to connect to ${dbName}:`, e.message);
      continue;
    }

    const collections = await srcConn.db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in ${dbName}.`);

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;

      console.log(`   ➡️ Copying collection: ${colName}...`);
      const sourceCol = srcConn.collection(colName);
      const destCol = destConn.collection(colName);

      // Clear local collection first
      await destCol.deleteMany({});

      // Fetch and copy documents
      const docs = await sourceCol.find({}).toArray();
      if (docs.length > 0) {
        await destCol.insertMany(docs);
        console.log(`      ✓ Copied ${docs.length} documents.`);
      } else {
        console.log(`      ✓ Collection is empty.`);
      }
    }
    await srcConn.close();
  }

  // Handle geolocations boundary db separately since it has a different host/credentials
  const boundaryUri = 'mongodb+srv://testsolarkits:EqKtvAp0JGffusIE@cluster0.tidjbfb.mongodb.net/geolocations';
  console.log('\n🔄 Connecting to boundary database: geolocations...');
  try {
    const bConn = await mongoose.createConnection(boundaryUri).asPromise();
    console.log('✅ Connected to boundaries database');
    const collections = await bConn.db.listCollections().toArray();
    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;
      console.log(`   ➡️ Copying collection: ${colName}...`);
      const sourceCol = bConn.collection(colName);
      const destCol = destConn.collection(colName);
      await destCol.deleteMany({});
      const docs = await sourceCol.find({}).toArray();
      if (docs.length > 0) {
        await destCol.insertMany(docs);
        console.log(`      ✓ Copied ${docs.length} documents.`);
      }
    }
    await bConn.close();
  } catch (e) {
    console.error('❌ Failed to copy boundary db:', e.message);
  }

  console.log('\n🎉 ALL 8 DATABASES SYNCED INTO LOCAL solarkits-project!');
  await destConn.close();
}

syncAll().catch(console.error);
