const bcrypt = require('bcrypt');
const EpcAccount = require('../modules/solarshop-india/models/india_solarshop_db/epc_accounts.schema');

async function autoSeedCustomerAccounts() {
  try {
    const demoAccounts = [
      {
        email: 'customer@solarkits.com',
        password: '1234',
        name: 'Customer Account',
        whatsapp: '9876543210'
      },
      {
        email: 'rahil.sunnovative@gmail.com',
        password: '1234',
        name: 'Rahil Harsoda (Demo)',
        whatsapp: '9913421453'
      },
      {
        email: 'sushilpiprotar@gmail.com',
        password: '1234',
        name: 'Sushil Piprotar (Demo)',
        whatsapp: '9876543211'
      },
      {
        email: 'structasoft.epc@gmail.com',
        password: '1234',
        name: 'Structasoft EPC Innovations',
        whatsapp: '9900000099'
      }
    ];

    for (const acc of demoAccounts) {
      const password_hash = await bcrypt.hash(acc.password, 10);
      const existing = await EpcAccount.findOne({ email: acc.email });

      if (existing) {
        existing.password_hash = password_hash;
        existing.status = 'approved';
        existing.is_email_verified = true;
        existing.is_whatsapp_verified = true;
        existing.deleted_at = null;
        await existing.save();
        console.log(`✅ Verified/Updated demo account: ${acc.email}`);
      } else {
        await EpcAccount.create({
          name: acc.name,
          email: acc.email,
          whatsapp: acc.whatsapp,
          password_hash: password_hash,
          is_email_verified: true,
          is_whatsapp_verified: true,
          status: 'approved'
        });
        console.log(`✅ Created new demo account: ${acc.email}`);
      }
    }
  } catch (err) {
    console.error('⚠️ Auto-seed demo accounts error:', err.message);
  }
}

// Run auto-seed asynchronously after DB connects
setTimeout(() => {
  autoSeedCustomerAccounts();
}, 5000);

module.exports = autoSeedCustomerAccounts;
