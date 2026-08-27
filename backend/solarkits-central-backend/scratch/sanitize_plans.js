require('dotenv').config();
const mongoose = require('mongoose');
require('../src/keys/config/databases');

async function sanitize() {
  await new Promise((r) => setTimeout(r, 2000));
  const plans = await mongoose.connection.db.collection('reseller_plans').find({}).toArray();
  for (const p of plans) {
    if (Array.isArray(p.allowed_combo_kit_ids)) {
      const clean = p.allowed_combo_kit_ids.filter((id) => id && String(id) !== 'null' && String(id) !== 'undefined');
      console.log('Sanitizing plan:', p.name, '=> before:', p.allowed_combo_kit_ids, '=> after:', clean);
      await mongoose.connection.db.collection('reseller_plans').updateOne(
        { _id: p._id },
        { $set: { allowed_combo_kit_ids: clean } }
      );
    }
  }
  console.log('Sanitization complete!');
  process.exit(0);
}

sanitize().catch((e) => {
  console.error(e);
  process.exit(1);
});
