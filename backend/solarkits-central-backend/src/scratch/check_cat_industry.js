const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { core_db } = require('../config/databases');

async function check() {
    await new Promise(r => setTimeout(r, 1000));
    const conn = core_db.connection || mongoose.connection;

    const categories = await conn.collection('sys_filter_categories').find({}).toArray();
    console.log('Categories:', categories.map(c => ({ id: c._id, name: c.name, industry_type_id: c.industry_type_id })));

    const industries = await conn.collection('sys_industry_types').find({}).toArray();
    console.log('Industries:', industries.map(i => ({ id: i._id, name: i.name })));

    process.exit(0);
}
check();
