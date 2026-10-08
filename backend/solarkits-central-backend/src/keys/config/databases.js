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
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Configure Mongoose global options to eliminate deprecation warning logs
mongoose.set('returnDocument', 'after');

// Intercept queries to automatically convert deprecated { new: true } to { returnDocument: 'after' }
const patchDeprecatedOptions = (options) => {
  if (options && typeof options === 'object') {
    if (options.new !== undefined) {
      if (options.new && !options.returnDocument) {
        options.returnDocument = 'after';
      }
      delete options.new;
    }
  }
};

const origFindOneAndUpdate = mongoose.Query.prototype.findOneAndUpdate;
mongoose.Query.prototype.findOneAndUpdate = function (conditions, update, options, callback) {
  patchDeprecatedOptions(options);
  if (this.options) patchDeprecatedOptions(this.options);
  return origFindOneAndUpdate.call(this, conditions, update, options, callback);
};

const origFindOneAndReplace = mongoose.Query.prototype.findOneAndReplace;
mongoose.Query.prototype.findOneAndReplace = function (conditions, replacement, options, callback) {
  patchDeprecatedOptions(options);
  if (this.options) patchDeprecatedOptions(this.options);
  return origFindOneAndReplace.call(this, conditions, replacement, options, callback);
};

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing in .env');
} else {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('✅ Connected to Single Unified MongoDB Database'))
    .catch((error) => console.error('❌ MongoDB Connection Error:', error));
}

const db = mongoose;

module.exports = {
  USER_DB: db,
  user_db: db,
  geolocation_db: db,
  geolocation_boundary_db: db,
  company_warehouse_db: db,
  solarkits_core_db: db,
  core_db: db,
  india_core_db: db,
  india_solarshop_db: db,
  supplier_db: db
};

