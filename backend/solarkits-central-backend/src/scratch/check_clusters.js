const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GeoLevel0, GeoLevel1, GeoLevel2, GeoCluster } = require('../modules/admin-panel/models/geolocation_db');
const { CompanyWarehouse } = require('../modules/admin-panel/models/company_warehouse_db');

async function check() {
    await new Promise(r => setTimeout(r, 1000));
    const warehouses = await CompanyWarehouse.find({ deleted_at: null }).lean();
    console.log('Warehouses:', warehouses.map(w => ({ id: w._id, code: w.warehouse_code, l0: w.level_0, l1: w.level_1, l2: w.level_2 })));

    const clusters = await GeoCluster.find({ deleted_at: null }).lean();
    console.log('Clusters:', clusters.map(c => ({ id: c._id, name: c.name })));

    const districts = await GeoLevel2.find({}).lean();
    console.log('Districts count:', districts.length, 'sample:', districts.slice(0, 3));

    process.exit(0);
}
check();
