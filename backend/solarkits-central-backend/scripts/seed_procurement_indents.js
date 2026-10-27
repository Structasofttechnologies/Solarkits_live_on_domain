const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config({ path: 'd:/SolarKits/SolarKits v2.0/backend/solarkits-central-backend/.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const { PurchaseIndent, CompanyWarehouse } = require('../src/modules/account-panel/models/company_warehouse_db');

  let wh = await CompanyWarehouse.findOne();
  const whId = wh ? wh._id : new mongoose.Types.ObjectId();
  const whName = wh ? wh.name : 'Central Master Warehouse (Chakan)';
  const whCode = wh ? wh.warehouse_code : 'MW-01';

  await PurchaseIndent.deleteMany({});
  console.log('Cleared existing Purchase Indents');

  const indents = [
    {
      pi_number: 'PI-2026-00101',
      customer_order_id: new mongoose.Types.ObjectId(),
      customer_order_number: 'ORD-WH-STOCK-BULK-01',
      order_group_id: 'GRP-MAH-NORTH-01',
      supplier_id: new mongoose.Types.ObjectId(),
      supplier_name: 'Waaree Solar Infrastructure Ltd',
      supplier_brand: 'Waaree Solar',
      supplier_gst: '27AABCW1234D1Z5',
      destination_warehouse_id: whId,
      destination_warehouse_name: whName,
      destination_warehouse_code: whCode,
      total_pi_value: 1543000,
      fulfilment: {
        method: 'Supplier Delivery',
        transport_responsibility: 'Supplier',
        carrier_name: 'VRL Logistics Ltd',
        vehicle_details: {
          vehicle_number: 'MH-12-RN-9410',
          driver_name: 'Suresh Patil',
          driver_phone: '+91 98230 11223'
        },
        tracking_reference: 'LR-VRL-889021',
        dispatch_reference: 'DISP-WAA-2026-904',
        expected_dispatch_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        actual_dispatch_date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        expected_inward_date: new Date(),
        supply_status: 'In Transit'
      },
      payment: {
        payment_status: 'Paid',
        advance_percentage: 100,
        advance_amount: 1543000,
        total_paid_amount: 1543000,
        balance_due: 0
      },
      items: [
        {
          sku_id: new mongoose.Types.ObjectId(),
          sku_code: 'SOL-PANEL-545W-MONO',
          product_name: 'Waaree 545W Mono PERC Solar Panels',
          component_type: 'Solar Panel',
          quantity: 150,
          unit_rate: 8200,
          gst_rate: 12,
          tax_amount: 147600,
          total_value: 1377600
        },
        {
          sku_id: new mongoose.Types.ObjectId(),
          sku_code: 'BOS-RAIL-4.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 4.2m',
          component_type: 'Mounting Structure',
          quantity: 100,
          unit_rate: 1450,
          gst_rate: 18,
          tax_amount: 26100,
          total_value: 171100
        }
      ]
    },
    {
      pi_number: 'PI-2026-00102',
      customer_order_id: new mongoose.Types.ObjectId(),
      customer_order_number: 'ORD-WH-STOCK-INV-02',
      order_group_id: 'GRP-MAH-NORTH-01',
      supplier_id: new mongoose.Types.ObjectId(),
      supplier_name: 'Havells Solar & Inverters OEM',
      supplier_brand: 'Havells Enviro',
      supplier_gst: '27AABCH5678K1Z9',
      destination_warehouse_id: whId,
      destination_warehouse_name: whName,
      destination_warehouse_code: whCode,
      total_pi_value: 1040000,
      fulfilment: {
        method: 'Company Pickup',
        transport_responsibility: 'Company',
        carrier_name: 'SolarKits Warehouse Fleet (Eicher 14ft)',
        vehicle_details: {
          vehicle_number: 'MH-14-GH-5521',
          driver_name: 'Ramesh Powar',
          driver_phone: '+91 97654 32109'
        },
        tracking_reference: 'FLEET-PICKUP-094',
        dispatch_reference: 'GATE-PASS-HAVELLS-331',
        expected_pickup_date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        actual_pickup_date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        expected_inward_date: new Date(),
        supply_status: 'Ready for Pickup'
      },
      payment: {
        payment_status: 'Paid',
        advance_percentage: 100,
        advance_amount: 1040000,
        total_paid_amount: 1040000,
        balance_due: 0
      },
      items: [
        {
          sku_id: new mongoose.Types.ObjectId(),
          sku_code: 'INV-5KW-ONGRID-HV',
          product_name: 'Havells 5kW On-Grid String Solar Inverter',
          component_type: 'Solar Inverter',
          quantity: 20,
          unit_rate: 34000,
          gst_rate: 12,
          tax_amount: 81600,
          total_value: 761600
        },
        {
          sku_id: new mongoose.Types.ObjectId(),
          sku_code: 'BOS-DCDB-2IN-2OUT',
          product_name: 'Solar DCDB Box 2-In 2-Out (1000V DC Surge)',
          component_type: 'BOS Protection',
          quantity: 40,
          unit_rate: 2200,
          gst_rate: 18,
          tax_amount: 15840,
          total_value: 103840
        }
      ]
    },
    {
      pi_number: 'PI-2026-00098',
      customer_order_id: new mongoose.Types.ObjectId(),
      customer_order_number: 'ORD-WH-STOCK-CABLES-03',
      order_group_id: 'GRP-MAH-NORTH-01',
      supplier_id: new mongoose.Types.ObjectId(),
      supplier_name: 'Polycab Wires & Cables Ltd',
      supplier_brand: 'Polycab Solar',
      supplier_gst: '27AABCP9999P1Z2',
      destination_warehouse_id: whId,
      destination_warehouse_name: whName,
      destination_warehouse_code: whCode,
      total_pi_value: 187500,
      fulfilment: {
        method: 'Supplier Delivery',
        transport_responsibility: 'Supplier',
        carrier_name: 'TCI Express Ground',
        vehicle_details: {
          vehicle_number: 'GJ-06-AX-4820',
          driver_name: 'Dinesh Shah',
          driver_phone: '+91 94261 88390'
        },
        tracking_reference: 'TCI-EXP-992384',
        dispatch_reference: 'DISP-POLY-7721',
        actual_dispatch_date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        actual_inward_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        supply_status: 'Inward Completed'
      },
      payment: {
        payment_status: 'Paid',
        advance_percentage: 100,
        advance_amount: 187500,
        total_paid_amount: 187500,
        balance_due: 0
      },
      items: [
        {
          sku_id: new mongoose.Types.ObjectId(),
          sku_code: 'BOS-DC-CABLE-4SQMM-100M',
          product_name: 'Solar DC Cable 4 sq.mm (100m Roll, Red/Black)',
          component_type: 'Cables & Wiring',
          quantity: 50,
          unit_rate: 3100,
          gst_rate: 18,
          tax_amount: 27900,
          total_value: 182900
        }
      ]
    }
  ];

  await PurchaseIndent.insertMany(indents);
  console.log('✅ Successfully seeded 3 PurchaseIndents with transport and materials!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
