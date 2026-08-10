const mongoose = require('mongoose');
const dns = require('dns');

// Overwrite mongoose.model and Connection.prototype.model globally to prevent OverwriteModelError.
// Since all modules are consolidated to run on a single database connection, some models
// with the same name are compiled multiple times across different modules. This patch
// safely intercepts the calls and returns the existing compiled model.
const originalModel = mongoose.model;
mongoose.model = function (name, schema, collection, skipInit) {
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  return originalModel.apply(this, arguments);
};

const originalConnectionModel = mongoose.Connection.prototype.model;
mongoose.Connection.prototype.model = function (name, schema, collection) {
  if (this.models[name]) {
    return this.models[name];
  }
  return originalConnectionModel.apply(this, arguments);
};

// Set DNS servers to avoid querySrv ECONNREFUSED issues on local systems or VPNs
dns.setServers(['1.1.1.1', '8.8.8.8']);

const MONGODB_URI = process.env.MONGODB_URI;

let db = mongoose;
let userDbConn, geoDbConn, warehouseDbConn, coreDbConn, indiaCoreDbConn, solarshopDbConn, supplierDbConn;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to Single Unified MongoDB Database'))
    .catch((error) => console.error('❌ MongoDB Connection Error:', error));

  userDbConn = db;
  geoDbConn = db;
  warehouseDbConn = db;
  coreDbConn = db;
  indiaCoreDbConn = db;
  solarshopDbConn = db;
  supplierDbConn = db;
} else {
  console.log('ℹ️ MONGODB_URI not set. Connecting to individual databases...');

  const userUri = process.env.MONGODB_CMS_USERS || process.env.USER_MONGO_URI;
  const geoUri = process.env.MONGODB_GEOLOCATIONS || process.env.GEOLOCATION_MONGO_URI;
  const warehouseUri = process.env.MONGODB_COMPANY_WAREHOUSES;
  const coreUri = process.env.MONGODB_CORE_DB;
  const indiaCoreUri = process.env.MONGODB_INDIA_CORE_DB;
  const solarshopUri = process.env.MONGODB_INDIA_SOLARSHOP;
  const supplierUri = process.env.MONGODB_SUPPLIER_DB || coreUri;

  const createConn = (uri, name) => {
    if (!uri) return db;
    const conn = mongoose.createConnection(uri);
    conn.on('error', (err) => console.error(`❌ ${name} Connection Error:`, err));
    conn.once('open', () => console.log(`✅ Connected to ${name}`));
    return conn;
  };

  userDbConn = createConn(userUri, 'USER_DB (emergesun_cms_users)');
  geoDbConn = createConn(geoUri, 'geolocation_db (emergesun_geolocations)');
  warehouseDbConn = createConn(warehouseUri, 'company_warehouse_db (emergesun_company_warehouses)');
  coreDbConn = createConn(coreUri, 'core_db (emergesun_core_db)');
  indiaCoreDbConn = createConn(indiaCoreUri, 'india_core_db (emergesun_india_core_db)');
  solarshopDbConn = createConn(solarshopUri, 'india_solarshop_db (emergesun_india_solarshop)');
  supplierDbConn = createConn(supplierUri, 'supplier_db');
}

let BOUNDARY_URI = process.env.MONGODB_GEOLOCATION_BOUNDARIES;
if (!BOUNDARY_URI || BOUNDARY_URI.includes('emergesun_central_db')) {
  if (MONGODB_URI && (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1'))) {
    BOUNDARY_URI = MONGODB_URI;
  } else {
    BOUNDARY_URI = 'mongodb+srv://testemergesun:EqKtvAp0JGffusIE@cluster0.tidjbfb.mongodb.net/geolocations';
  }
}

const boundaryConn = mongoose.createConnection(BOUNDARY_URI);
boundaryConn.on('error', (err) => console.error('❌ Boundaries DB Connection Error:', err));
boundaryConn.once('open', () => console.log('✅ Connected to Boundaries Database'));

module.exports = {
  USER_DB: userDbConn,
  user_db: userDbConn,
  geolocation_db: geoDbConn,
  geolocation_boundary_db: boundaryConn,
  company_warehouse_db: warehouseDbConn,
  emergesun_core_db: coreDbConn,
  core_db: coreDbConn,
  india_core_db: indiaCoreDbConn,
  india_solarshop_db: solarshopDbConn,
  supplier_db: supplierDbConn
};
