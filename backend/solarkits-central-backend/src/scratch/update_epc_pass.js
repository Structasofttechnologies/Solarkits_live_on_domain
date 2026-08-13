const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/solarkits_central_db');
  await client.connect();
  const db = client.db();
  const accounts = await db.collection('epc_accounts').find({}).toArray();
  console.log('--- ALL EPC ACCOUNTS IN DB ---');
  accounts.forEach(a => console.log({ id: a._id, email: a.email, name: a.name, status: a.status }));
  await client.close();
  process.exit(0);
}
run();
