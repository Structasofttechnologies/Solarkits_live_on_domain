const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config({ path: 'd:/SolarKits/SolarKits v2.0/backend/solarkits-central-backend/.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const collection = mongoose.connection.collection('delivery_orders');
  
  // Try dropping delivery_number_1 index if it's not sparse
  try {
    await collection.dropIndex('delivery_number_1');
    console.log('Dropped delivery_number_1 index');
  } catch (err) {
    console.log('Notice dropping index:', err.message);
  }

  // Clear existing delivery orders
  const del = await collection.deleteMany({});
  console.log('Cleared existing delivery orders:', del.deletedCount);

  const { DeliveryOrder } = require('../src/modules/warehouse-panel/models/company_warehouse_db');
  
  const ordersToInsert = [
    {
      delivery_order_id: 'DO-2026-0001',
      delivery_number: 'DO-2026-0001',
      order_id: 'ORD-SK-94101',
      order_number: 'SK-2026-0941',
      warehouse_code: 'MW-01',
      customer_name: 'Apex Green Energy Infra Pvt Ltd',
      customer_phone: '+91 98765 43210',
      customer_email: 'procurement@apexenergy.in',
      destination: {
        address: 'Plot 44, Sector 18, Phase 2, Industrial Estate',
        state: 'Maharashtra',
        district: 'Pune',
        pincode: '411026',
        landmark: 'Near Tata Motors Gate 3'
      },
      required_vehicle: '14ft Eicher (4.0 Ton)',
      order_date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      delivery_status: 'new_order',
      delivery_method: 'manual',
      items: [
        {
          sku: 'BOS-RAIL-4.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 4.2m',
          category: 'Mounting Structure',
          ordered_qty: 60,
          received_qty: 0,
          pending_qty: 60,
          available_inventory_stock: 120,
          allocated_stock: 0,
          rack_location: 'Rack-A1-04',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-CLAMP-END-35MM',
          product_name: 'Solar Panel End Clamps (35mm Anodized)',
          category: 'Fasteners & Clamps',
          ordered_qty: 120,
          received_qty: 0,
          pending_qty: 120,
          available_inventory_stock: 450,
          allocated_stock: 0,
          rack_location: 'Bin-F3-02',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-CLAMP-MID-35MM',
          product_name: 'Solar Panel Mid Clamps (35mm Anodized)',
          category: 'Fasteners & Clamps',
          ordered_qty: 180,
          received_qty: 0,
          pending_qty: 180,
          available_inventory_stock: 600,
          allocated_stock: 0,
          rack_location: 'Bin-F3-03',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-DC-CABLE-4SQMM-100M',
          product_name: 'Solar DC Cable 4 sq.mm (100m Roll, Red/Black)',
          category: 'Electrical Wiring',
          ordered_qty: 6,
          received_qty: 0,
          pending_qty: 6,
          available_inventory_stock: 24,
          allocated_stock: 0,
          rack_location: 'Cable-Rack-C2',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-AJB-DCDB-4IN-4OUT',
          product_name: 'IP65 DCDB 4-In 4-Out with 1000V Surge Protection',
          category: 'Protection Devices',
          ordered_qty: 2,
          received_qty: 0,
          pending_qty: 2,
          available_inventory_stock: 8,
          allocated_stock: 0,
          rack_location: 'Rack-E1-01',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-EARTH-ROD-COPPER-2M',
          product_name: 'Copper Bonded Earthing Electrode Rod 2m with Chemical Compound',
          category: 'Earthing & Lightning',
          ordered_qty: 4,
          received_qty: 0,
          pending_qty: 4,
          available_inventory_stock: 35,
          allocated_stock: 0,
          rack_location: 'Bay-Ground-02',
          qc_status: 'Passed'
        }
      ],
      inward_history: [],
      transport_details: {
        vehicle_number: '',
        vehicle_type: '14ft Eicher (4.0 Ton)',
        transporter_name: 'VRL Logistics Hub',
        transporter_id: 'VRL-PN-88',
        driver_name: '',
        driver_mobile: '',
        dispatch_date: null,
        expected_delivery_date: null,
        docket_number: '',
        lr_number: '',
        notes: ''
      },
      eway_bill: {
        requested: false,
        requested_at: null,
        status: 'not_requested',
        eway_bill_number: '',
        valid_until: null,
        eway_bill_pdf: ''
      },
      audit_trail: [
        {
          action: 'Order Confirmed for Procurement',
          performed_by_name: 'Account Manager (Rohan Verma)',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          notes: 'Sales order confirmed by client; forwarded to procurement & Delivery Manager.'
        },
        {
          action: 'Delivery Order Generated',
          performed_by_name: 'System',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          notes: 'DO-2026-0001 created automatically for BOS Kit fulfillment.'
        }
      ]
    },
    {
      delivery_order_id: 'DO-2026-0002',
      delivery_number: 'DO-2026-0002',
      order_id: 'ORD-SK-94105',
      order_number: 'SK-2026-0945',
      warehouse_code: 'MW-01',
      customer_name: 'Kisan Solar Solutions EPC',
      customer_phone: '+91 97654 11223',
      customer_email: 'support@kisansolar.com',
      destination: {
        address: 'Shop No. 12, Agri Market Yard, Bypass Road',
        state: 'Maharashtra',
        district: 'Nashik',
        pincode: '422003',
        landmark: 'Opposite State Warehousing Corp'
      },
      required_vehicle: 'Tata Ace (1.5 Ton)',
      order_date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      delivery_status: 'partially_inwarded',
      delivery_method: 'manual',
      items: [
        {
          sku: 'BOS-RAIL-3.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 3.2m',
          category: 'Mounting Structure',
          ordered_qty: 40,
          received_qty: 40,
          pending_qty: 0,
          available_inventory_stock: 80,
          allocated_stock: 40,
          rack_location: 'Rack-A1-02',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-FASTENER-SS304-SET',
          product_name: 'SS304 Allen Bolt & Spring Nut Hardware Set (Pack of 100)',
          category: 'Fasteners & Clamps',
          ordered_qty: 4,
          received_qty: 4,
          pending_qty: 0,
          available_inventory_stock: 30,
          allocated_stock: 4,
          rack_location: 'Bin-F2-01',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-MC4-CONN-1000V',
          product_name: 'Solar MC4 Connectors Male/Female Pair IP68 (Pack of 20)',
          category: 'Electrical Wiring',
          ordered_qty: 5,
          received_qty: 2,
          pending_qty: 3,
          available_inventory_stock: 25,
          allocated_stock: 2,
          rack_location: 'Bin-C1-04',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-ACDB-10KW-3PH',
          product_name: '10kW 3-Phase ACDB with MCB & Type II SPD',
          category: 'Protection Devices',
          ordered_qty: 1,
          received_qty: 0,
          pending_qty: 1,
          available_inventory_stock: 5,
          allocated_stock: 0,
          rack_location: 'Rack-E2-03',
          qc_status: 'Pending'
        }
      ],
      inward_history: [
        {
          batch_id: 'BATCH-20261014-01',
          inwarded_items: [
            { sku: 'BOS-RAIL-3.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 3.2m', qty: 40 },
            { sku: 'BOS-FASTENER-SS304-SET', product_name: 'SS304 Allen Bolt & Spring Nut Hardware Set', qty: 4 },
            { sku: 'BOS-MC4-CONN-1000V', product_name: 'Solar MC4 Connectors Male/Female Pair IP68', qty: 2 }
          ],
          inwarded_by_name: 'Delivery Manager (Abhishek Sharma)',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000),
          remarks: 'First partial batch inwarded from supplier consignment. ACDB pending arrival.'
        }
      ],
      transport_details: {
        vehicle_number: 'MH 15 EF 4920',
        vehicle_type: 'Tata Ace (1.5 Ton)',
        transporter_name: 'Nashik Local Fleet Logistics',
        transporter_id: 'NSK-TRAN-01',
        driver_name: 'Sachin Patil',
        driver_mobile: '9822334455',
        dispatch_date: null,
        expected_delivery_date: null,
        docket_number: '',
        lr_number: '',
        notes: ''
      },
      eway_bill: {
        requested: false,
        requested_at: null,
        status: 'not_requested',
        eway_bill_number: '',
        valid_until: null,
        eway_bill_pdf: ''
      },
      audit_trail: [
        {
          action: 'Partial Inward Verified',
          performed_by_name: 'Delivery Manager (Abhishek Sharma)',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000),
          notes: 'Inwarded rails and fasteners. Remaining items flagged pending.'
        }
      ]
    },
    {
      delivery_order_id: 'DO-2026-0003',
      delivery_number: 'DO-2026-0003',
      order_id: 'ORD-SK-94112',
      order_number: 'SK-2026-0950',
      warehouse_code: 'MW-01',
      customer_name: 'GreenSpark Renewable Energy Systems',
      customer_phone: '+91 94251 77889',
      customer_email: 'dispatch@greensparkenergy.com',
      destination: {
        address: 'Warehouse #7, Transport Nagar, AB Road',
        state: 'Madhya Pradesh',
        district: 'Indore',
        pincode: '452010',
        landmark: 'Behind BPCL Petrol Pump'
      },
      required_vehicle: '14ft Eicher (4.0 Ton)',
      order_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      delivery_status: 'ready_for_dispatch',
      delivery_method: 'manual',
      items: [
        {
          sku: 'BOS-RAIL-4.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 4.2m',
          category: 'Mounting Structure',
          ordered_qty: 50,
          received_qty: 50,
          pending_qty: 0,
          available_inventory_stock: 120,
          allocated_stock: 50,
          rack_location: 'Rack-A1-04',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-DC-CABLE-6SQMM-100M',
          product_name: 'Solar DC Cable 6 sq.mm (100m Roll, Red/Black)',
          category: 'Electrical Wiring',
          ordered_qty: 4,
          received_qty: 4,
          pending_qty: 0,
          available_inventory_stock: 18,
          allocated_stock: 4,
          rack_location: 'Cable-Rack-C3',
          qc_status: 'Passed'
        }
      ],
      inward_history: [
        {
          batch_id: 'BATCH-20261013-01',
          inwarded_items: [
            { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', qty: 50 },
            { sku: 'BOS-DC-CABLE-6SQMM-100M', product_name: 'Solar DC Cable 6 sq.mm', qty: 4 }
          ],
          inwarded_by_name: 'Delivery Manager (Abhishek Sharma)',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          remarks: '100% components verified and packed. Ready for outward vehicle assignment.'
        }
      ],
      transport_details: {
        vehicle_number: 'MP 09 GH 7120',
        vehicle_type: '14ft Eicher (4.0 Ton)',
        transporter_name: 'Central India Freight Carriers',
        transporter_id: 'CIFC-IND-09',
        driver_name: 'Deepak Chouhan',
        driver_mobile: '9893012345',
        dispatch_date: new Date().toISOString().slice(0, 10),
        expected_delivery_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10),
        docket_number: 'CIFC-882910',
        lr_number: 'LR-MP-9021',
        notes: 'Driver verified. Awaiting Account Manager E-Way Bill clearance.'
      },
      eway_bill: {
        requested: true,
        requested_at: new Date(Date.now() - 4 * 3600 * 1000),
        status: 'pending',
        eway_bill_number: '',
        valid_until: null,
        eway_bill_pdf: ''
      },
      audit_trail: [
        {
          action: 'All Materials Inwarded (100%)',
          performed_by_name: 'Delivery Manager (Abhishek Sharma)',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          notes: 'Full order inwarded. Moved to Out for Delivery Station.'
        }
      ]
    }
  ];

  await DeliveryOrder.insertMany(ordersToInsert);
  console.log('✅ Successfully inserted 3 clean rich delivery orders with items!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
