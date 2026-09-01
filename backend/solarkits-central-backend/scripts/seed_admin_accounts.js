'use strict';
require('dotenv').config();
require('../src/keys/config/databases');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { seedCMS } = require('../src/modules/admin-panel/config/seeder/cms.seeder');
const { seedSaaS } = require('../src/modules/admin-panel/config/seeder/saas.seeder');

async function seedAdminCredentials() {
  console.log('🚀 Initializing Admin Accounts & CMS Seeder...');
  
  // 1. Run CMS Seeder
  await seedCMS();
  
  // 2. Run SaaS Products Seeder
  try {
    await seedSaaS();
  } catch (err) {
    console.warn('⚠️ SaaS seeder note:', err.message);
  }

  // 3. Ensure India country_id is attached to admin accounts
  const india = await mongoose.connection.db.collection('geolocation_level_0').findOne({ iso2: 'IN' });
  if (india) {
    await mongoose.connection.db.collection('cms_users').updateMany(
      {},
      { $set: { country_id: india._id, country: india._id.toString() } }
    );
    console.log('  ✓ Updated cms_users with India country ID');
  }

  // 4. Verify the 3 developer test credentials
  const targetEmails = [
    'rahil.sunnovative@gmail.com',
    'sushilpiprotar@gmail.com',
    'rahil@solarkits.com'
  ];

  const users = await mongoose.connection.db.collection('cms_users').find({
    email: { $in: targetEmails }
  }).toArray();

  console.log('\n======================================================');
  console.log('✅ DEVELOPER TESTING ACCESS ACCOUNTS VERIFIED:');
  for (const u of users) {
    const isPw1234 = await bcrypt.compare('1234', u.passcode || '');
    console.log(`  👤 ${u.name} (${u.email})`);
    console.log(`     - Role ID: ${u.role_id}`);
    console.log(`     - Passcode '1234' Valid: ${isPw1234 ? 'YES' : 'NO'}`);
    console.log(`     - Verified: ${u.is_verified} | Active: ${u.is_active}`);
  }
  console.log('======================================================\n');
  process.exit(0);
}

// Wait for mongoose connection
setTimeout(() => {
  seedAdminCredentials().catch((err) => {
    console.error('❌ Seeder failed:', err);
    process.exit(1);
  });
}, 2000);
