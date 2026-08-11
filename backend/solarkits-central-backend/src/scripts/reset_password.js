require('dotenv').config();
require('../modules/admin-panel/config/databases');
const bcrypt = require('bcrypt');

setTimeout(async () => {
  try {
    const { Reseller } = require('../modules/admin-panel/models/india_solarshop_db');
    const newHash = await bcrypt.hash('structasoftadmin@gmail.com', 10);
    const res = await Reseller.updateOne(
      { email: 'structasoftadmin@gmail.com' },
      { $set: { password_hash: newHash } }
    );
    console.log("Password hash updated successfully for structasoftadmin@gmail.com:", res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}, 2000);
