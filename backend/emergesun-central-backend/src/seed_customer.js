require('dotenv').config();
require('./keys/config/databases');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const EpcAccount = require('./modules/solarshop-india/models/india_solarshop_db/epc_accounts.schema');

async function seedCustomer() {
  try {
    const email = 'customer@emergesun.com';
    const password = 'your_password';
    const password_hash = await bcrypt.hash(password, 10);

    const existing = await EpcAccount.findOne({ email });
    if (existing) {
      existing.password_hash = password_hash;
      existing.status = 'approved';
      existing.is_email_verified = true;
      existing.is_whatsapp_verified = true;
      existing.deleted_at = null;
      await existing.save();
      console.log('✅ Updated existing customer@emergesun.com user account in MongoDB!');
    } else {
      await EpcAccount.create({
        name: 'Developer Account',
        email: email,
        whatsapp: '9876543210',
        password_hash: password_hash,
        is_email_verified: true,
        is_whatsapp_verified: true,
        status: 'approved'
      });
      console.log('✅ Created new customer@emergesun.com user account in MongoDB!');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding customer:', err);
    process.exit(1);
  }
}

seedCustomer();
