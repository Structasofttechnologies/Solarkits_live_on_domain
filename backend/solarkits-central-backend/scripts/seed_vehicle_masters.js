require('dotenv').config();
const mongoose = require('mongoose');
require('../src/keys/config/databases');
const { DeliveryVehicleMaster } = require('../src/modules/admin-panel/models/india_solarshop_db');

const vehiclesToSeed = [
  {
    name: 'Tata Ace (Chota Hathi)',
    brand_make: 'Tata Motors',
    model: 'Ace Gold Diesel Plus',
    length_ft: 7.2,
    width_ft: 4.9,
    height_ft: 4.0,
    max_load_kg: 750,
    max_delivery_distance_km: 150,
    status: 'Active',
  },
  {
    name: 'Mahindra Bolero Pickup',
    brand_make: 'Mahindra & Mahindra',
    model: 'Bolero Maxi Truck Plus',
    length_ft: 8.2,
    width_ft: 5.5,
    height_ft: 4.5,
    max_load_kg: 1300,
    max_delivery_distance_km: 300,
    status: 'Active',
  },
  {
    name: 'Ashok Leyland Dost+',
    brand_make: 'Ashok Leyland',
    model: 'Dost Plus LCV',
    length_ft: 8.6,
    width_ft: 5.3,
    height_ft: 5.0,
    max_load_kg: 1500,
    max_delivery_distance_km: 350,
    status: 'Active',
  },
  {
    name: 'Tata 407 (10 Ft LCV)',
    brand_make: 'Tata Motors',
    model: '407 Gold SFC 29 WB',
    length_ft: 10.0,
    width_ft: 6.5,
    height_ft: 5.5,
    max_load_kg: 2500,
    max_delivery_distance_km: 500,
    status: 'Active',
  },
  {
    name: 'Eicher Pro 2049 (12 Ft Canter)',
    brand_make: 'Eicher Motors',
    model: 'Pro 2049 High Deck',
    length_ft: 12.0,
    width_ft: 6.6,
    height_ft: 6.0,
    max_load_kg: 3500,
    max_delivery_distance_km: 600,
    status: 'Active',
  },
  {
    name: 'Tata 1109 (14 Ft Canter)',
    brand_make: 'Tata Motors',
    model: 'LPT 1109 Hexa',
    length_ft: 14.0,
    width_ft: 7.0,
    height_ft: 6.5,
    max_load_kg: 6000,
    max_delivery_distance_km: 800,
    status: 'Active',
  },
  {
    name: 'Tata 1613 (19 Ft Open Truck)',
    brand_make: 'Tata Motors',
    model: 'LPT 1613 TCIC',
    length_ft: 19.0,
    width_ft: 7.5,
    height_ft: 7.0,
    max_load_kg: 10000,
    max_delivery_distance_km: 1200,
    status: 'Active',
  },
];

async function seed() {
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('connected', resolve);
  });

  console.log('Connected to DB. Checking existing vehicle masters...');
  
  for (let i = 0; i < vehiclesToSeed.length; i++) {
    const item = vehiclesToSeed[i];
    const existing = await DeliveryVehicleMaster.findOne({
      model: item.model,
      deleted_at: null,
    });

    if (existing) {
      console.log(`Vehicle already exists: ${existing.vehicle_code} - ${existing.name} (${existing.model})`);
      existing.name = item.name;
      existing.brand_make = item.brand_make;
      existing.length_ft = item.length_ft;
      existing.width_ft = item.width_ft;
      existing.height_ft = item.height_ft;
      existing.max_load_kg = item.max_load_kg;
      existing.max_delivery_distance_km = item.max_delivery_distance_km;
      existing.status = item.status;
      await existing.save();
      console.log(`Updated: ${existing.vehicle_code}`);
    } else {
      const count = await DeliveryVehicleMaster.countDocuments();
      const vehicle_code = `VEH-${String(count + 1).padStart(3, '0')}`;
      const doc = new DeliveryVehicleMaster({
        ...item,
        vehicle_code,
      });
      await doc.save();
      console.log(`Created: ${vehicle_code} - ${doc.name} (${doc.model}) [${doc.max_load_kg} KG, ${doc.max_delivery_distance_km} KM]`);
    }
  }

  const allVehicles = await DeliveryVehicleMaster.find({ deleted_at: null }).sort({ vehicle_code: 1 });
  console.log(`\nTotal Vehicle Masters in DB: ${allVehicles.length}`);
  allVehicles.forEach((v) => {
    console.log(`[${v.vehicle_code}] ${v.name} | ${v.brand_make} ${v.model} | L:${v.length_ft}' W:${v.width_ft}' H:${v.height_ft}' | Payload: ${v.max_load_kg} KG | Range: ${v.max_delivery_distance_km} KM | Status: ${v.status}`);
  });

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
