const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergesun_location_db';

let db = mongoose;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Database for Geolocation Module'))
  .catch((error) => console.error('❌ MongoDB Connection Error:', error));

module.exports = {
  USER_DB: db,
  user_db: db,
  geolocation_db: db,
  geolocation_boundary_db: db,
};
