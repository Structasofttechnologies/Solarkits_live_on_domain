const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { core_db } = require('../config/databases');

async function checkCollections() {
    await new Promise(r => setTimeout(r, 1000));
    const conn = core_db.connection || mongoose.connection;
    const cols = await conn.db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name).filter(n => n.includes('category') || n.includes('project') || n.includes('industry')));

    const catDocs = await conn.collection('pc_project_categories').find({}).toArray();
    console.log('pc_project_categories:', catDocs.map(c => ({ id: c._id, name: c.name, industry_type_id: c.industry_type_id })));

    process.exit(0);
}
checkCollections();
