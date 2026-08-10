const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const { geolocation_boundary_db } = require('../../../config/databases');
const BoundaryLevel2 = require('../../admin-panel/models/boundary_db/geolocation.level.2.schema');

async function main() {
  try {
    // Wait a brief moment for database connection to be established
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Connection status:', geolocation_boundary_db.readyState);
    console.log('Database name:', geolocation_boundary_db.name);
    console.log('Host:', geolocation_boundary_db.host);

    const count = await BoundaryLevel2.countDocuments({});
    console.log('Total documents via model BoundaryLevel2:', count);

    const rajkot = await BoundaryLevel2.findOne({ name: 'Rajkot' }).lean();
    console.log('Rajkot boundary info from schema:', rajkot ? { name: rajkot.name, lat: rajkot.lat, lng: rajkot.lng, hasCoords: !!rajkot.coordinates } : 'Not found');

    await geolocation_boundary_db.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
