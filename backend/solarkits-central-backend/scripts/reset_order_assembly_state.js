const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.useDb('test').db;

  await db.collection('delivery_orders').updateOne(
    { _id: new mongoose.Types.ObjectId('6ae2d40daf66c8fe395d4f04') },
    {
      $set: {
        kit_preparation_status: 'awaiting_components',
        kit_assembly_details: {
          assembly_status: 'pending'
        }
      }
    }
  );
  console.log('✅ Successfully reset order 6ae2d40daf66c8fe395d4f04 assembly status to pending');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
