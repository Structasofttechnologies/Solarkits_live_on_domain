const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
require('dotenv').config({ path: 'd:/SolarKits/SolarKits v2.0/backend/solarkits-central-backend/.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const collection = mongoose.connection.collection('delivery_orders');
  
  // Drop index if needed
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
      kit_preparation_status: 'awaiting_components',
      epcs: [
        {
          epc_id: 'EPC-101',
          epc_name: 'Apex Solar Pune',
          solarkit_model: '10kW Commercial SolarKit Package',
          system_capacity: '10 kW',
          panels_qty: '20 Panels (540W Mono PERC)',
          inverter_qty: '1 Inverter (10kW 3-Phase On-Grid)',
          boskit_qty: '1 BOS Kit (10kW Pre-assembled Enclosure)',
          structure_qty: '4 Rails (4.2m Aluminum) + 24 Clamps',
          payment_status: 'Payment Done',
          share_percentage: 60,
          contact_phone: '+91 98765 43210',
          site_location: 'Plot 44, Phase 2, Industrial Estate, Pune',
          items: [
            { sku: 'PANEL-540W-MONO', product_name: 'Solar Panels 540W Mono PERC', ordered_qty: 20, category: 'Panels' },
            { sku: 'INV-10KW-3P-OG', product_name: 'Solar Inverter 10kW On-Grid', ordered_qty: 1, category: 'Inverter' },
            { sku: 'BOS-KIT-10KW-STD', product_name: 'BOS Kit 10kW (ACDB/DCDB/Cables)', ordered_qty: 1, category: 'BOS Kit' },
            { sku: 'RAIL-4.2M-AL', product_name: 'Aluminum Mounting Rails 4.2m', ordered_qty: 36, category: 'Structure' },
            { sku: 'CLAMP-SET-35MM', product_name: 'End & Mid Clamps 35mm Set', ordered_qty: 72, category: 'Fasteners' }
          ]
        },
        {
          epc_id: 'EPC-102',
          epc_name: 'Mahalaxmi Solar Infra',
          solarkit_model: '5kW Residential SolarKit Package',
          system_capacity: '5 kW',
          panels_qty: '10 Panels (540W Mono PERC)',
          inverter_qty: '1 Inverter (5kW Single-Phase On-Grid)',
          boskit_qty: '1 BOS Kit (5kW Pre-assembled Enclosure)',
          structure_qty: '2 Rails (3.2m Aluminum) + 12 Clamps',
          payment_status: 'Payment Done',
          share_percentage: 40,
          contact_phone: '+91 97654 88990',
          site_location: 'Sector 18, Chakan Industrial Estate, Pune',
          items: [
            { sku: 'PANEL-540W-MONO', product_name: 'Solar Panels 540W Mono PERC', ordered_qty: 10, category: 'Panels' },
            { sku: 'INV-5KW-1P-OG', product_name: 'Solar Inverter 5kW Single-Phase', ordered_qty: 1, category: 'Inverter' },
            { sku: 'BOS-KIT-5KW-STD', product_name: 'BOS Kit 5kW (ACDB/DCDB/Cables)', ordered_qty: 1, category: 'BOS Kit' },
            { sku: 'RAIL-3.2M-AL', product_name: 'Aluminum Mounting Rails 3.2m', ordered_qty: 24, category: 'Structure' },
            { sku: 'CLAMP-SET-35MM', product_name: 'End & Mid Clamps 35mm Set', ordered_qty: 48, category: 'Fasteners' }
          ]
        }
      ],
      items: [
        {
          sku: 'BOS-KIT-10KW-STD',
          product_name: 'BOS Kit 10kW (Pre-assembled ACDB/DCDB/Cables Package)',
          category: 'BOS Kit',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 1,
          received_qty: 0,
          damaged_qty: 0,
          missing_qty: 0,
          pending_qty: 1,
          available_inventory_stock: 1,
          allocated_stock: 0,
          rack_location: 'BAY-BOS-STOCK',
          qc_status: 'Pending'
        },
        {
          sku: 'BOS-KIT-5KW-STD',
          product_name: 'BOS Kit 5kW (Pre-assembled ACDB/DCDB/Cables Package)',
          category: 'BOS Kit',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 1,
          received_qty: 0,
          damaged_qty: 0,
          missing_qty: 0,
          pending_qty: 1,
          available_inventory_stock: 4,
          allocated_stock: 0,
          rack_location: 'BAY-BOS-STOCK',
          qc_status: 'Pending'
        },
        {
          sku: 'BOS-RAIL-4.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 4.2m',
          category: 'Mounting Structure',
          sourcing_type: 'supplier_procurement',
          supply_fulfilment_method: 'company_pickup',
          supplier_name: 'Waaree Solar Infrastructure Ltd',
          supplier_warehouse: {
            name: 'Waaree Chakan Depot, Pune',
            city: 'Pune',
            state: 'Maharashtra'
          },
          pi_reference: {
            pi_number: 'PI-WAA-2026-902',
            pi_value: 145000
          },
          transport_responsibility: 'company',
          transport_cost: 2800,
          supply_status: 'ready_for_pickup',
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
          sourcing_type: 'supplier_procurement',
          supply_fulfilment_method: 'supplier_delivery',
          supplier_name: 'Polycab Fasteners OEM',
          supplier_dispatch_reference: 'DISP-POLY-8891',
          transport_responsibility: 'supplier',
          transport_cost: 0,
          supply_status: 'in_transit',
          ordered_qty: 120,
          received_qty: 0,
          pending_qty: 120,
          available_inventory_stock: 450,
          allocated_stock: 0,
          rack_location: 'Bin-F3-02',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-DC-CABLE-4SQMM-100M',
          product_name: 'Solar DC Cable 4 sq.mm (100m Roll, Red/Black)',
          category: 'Electrical Wiring',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 6,
          received_qty: 0,
          pending_qty: 6,
          available_inventory_stock: 24,
          allocated_stock: 0,
          rack_location: 'Cable-Rack-C2',
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
      audit_trail: [
        {
          action: 'Order Confirmed for Procurement (Dual Fulfilment)',
          performed_by_name: 'Account Manager (Rohan Verma)',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          notes: 'Customer order with Company Pickup & Supplier Delivery items forwarded to Delivery Manager.'
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
      kit_preparation_status: 'awaiting_components',
      epcs: [
        {
          epc_id: 'EPC-201',
          epc_name: 'Kisan Solar Solutions EPC',
          solarkit_model: '5kW Rooftop SolarKit Package',
          system_capacity: '5 kW',
          panels_qty: '10 Panels (540W Mono PERC)',
          inverter_qty: '1 Inverter (5kW Hybrid Solar Inverter)',
          boskit_qty: '1 BOS Kit (5kW Pre-assembled Enclosure)',
          structure_qty: '4 Rails (3.2m Aluminum) + 16 Clamps',
          payment_status: 'Payment Done',
          share_percentage: 100,
          contact_phone: '+91 97654 11223',
          site_location: 'Shop No. 12, Agri Market Yard, Nashik',
          items: [
            { sku: 'PANEL-540W-MONO', product_name: 'Solar Panels 540W Mono PERC', ordered_qty: 10, category: 'Panels' },
            { sku: 'INV-5KW-HYBRID', product_name: 'Hybrid Solar Inverter 5kW', ordered_qty: 1, category: 'Inverter' },
            { sku: 'BOS-KIT-5KW-STD', product_name: 'BOS Kit 5kW Pre-assembled', ordered_qty: 1, category: 'BOS Kit' },
            { sku: 'RAIL-3.2M-AL', product_name: 'Anodized Aluminum Rail 3.2m', ordered_qty: 40, category: 'Structure' },
            { sku: 'FASTENER-SS304', product_name: 'SS304 Bolt & Hardware Sets', ordered_qty: 4, category: 'Fasteners' }
          ]
        }
      ],
      discrepancy_details: [
        {
          sku: 'BOS-RAIL-3.2M-AL',
          damaged_qty: 2,
          missing_qty: 0,
          reported_at: new Date(Date.now() - 10 * 3600 * 1000),
          reported_by_name: 'Delivery Manager (Abhishek Sharma)',
          remarks: 'Bent edges during transit from supplier; isolated in quarantine area.',
          account_notified: true
        }
      ],
      items: [
        {
          sku: 'BOS-KIT-5KW-STD',
          product_name: 'BOS Kit 5kW (Pre-assembled ACDB/DCDB/Cables Package)',
          category: 'BOS Kit',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 1,
          received_qty: 0,
          damaged_qty: 0,
          missing_qty: 0,
          pending_qty: 1,
          available_inventory_stock: 4,
          allocated_stock: 0,
          rack_location: 'BAY-BOS-STOCK',
          qc_status: 'Pending'
        },
        {
          sku: 'BOS-RAIL-3.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 3.2m',
          category: 'Mounting Structure',
          sourcing_type: 'supplier_procurement',
          supply_fulfilment_method: 'supplier_delivery',
          supplier_name: 'Hindalco Aluminum Extrusions',
          supplier_dispatch_reference: 'HIND-DISP-4401',
          ordered_qty: 40,
          received_qty: 38,
          damaged_qty: 2,
          pending_qty: 2,
          available_inventory_stock: 80,
          allocated_stock: 38,
          rack_location: 'Rack-A1-02',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-FASTENER-SS304-SET',
          product_name: 'SS304 Allen Bolt & Spring Nut Hardware Set (Pack of 100)',
          category: 'Fasteners & Clamps',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 4,
          received_qty: 4,
          pending_qty: 0,
          available_inventory_stock: 30,
          allocated_stock: 4,
          rack_location: 'Bin-F2-01',
          qc_status: 'Passed'
        }
      ],
      inward_history: [
        {
          batch_id: 'BATCH-20261014-01',
          inwarded_items: [
            { sku: 'BOS-RAIL-3.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 3.2m', qty: 38 },
            { sku: 'BOS-FASTENER-SS304-SET', product_name: 'SS304 Allen Bolt & Spring Nut Hardware Set', qty: 4 }
          ],
          inwarded_by_name: 'Delivery Manager (Abhishek Sharma)',
          timestamp: new Date(Date.now() - 10 * 3600 * 1000),
          remarks: 'Received 40 rails, 2 found bent/damaged upon gate inspection. Logged discrepancy.'
        }
      ],
      transport_details: {
        vehicle_number: 'MH 15 EF 4920',
        vehicle_type: 'Tata Ace (1.5 Ton)',
        transporter_name: 'Nashik Local Fleet Logistics',
        transporter_id: 'NSK-TRAN-01',
        driver_name: 'Sachin Patil',
        driver_mobile: '9822334455'
      }
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
      kit_preparation_status: 'kit_ready',
      epcs: [
        {
          epc_id: 'EPC-301',
          epc_name: 'GreenSpark Renewable Energy Systems',
          solarkit_model: '10kW Commercial SolarKit Package',
          system_capacity: '10 kW',
          panels_qty: '20 Panels (540W Mono PERC)',
          inverter_qty: '1 Inverter (10kW On-Grid 3-Phase Inverter)',
          boskit_qty: '1 BOS Kit (10kW Pre-assembled Enclosure)',
          structure_qty: '4 Rails (4.2m Aluminum) + 24 Clamps',
          payment_status: 'Payment Done',
          share_percentage: 100,
          contact_phone: '+91 94251 77889',
          site_location: 'Warehouse #7, Transport Nagar, Indore',
          items: [
            { sku: 'PANEL-540W-MONO', product_name: 'Solar Panels 540W Mono PERC', ordered_qty: 20, category: 'Panels' },
            { sku: 'INV-10KW-3P-OG', product_name: 'On-Grid Inverter 10kW 3-Phase', ordered_qty: 1, category: 'Inverter' },
            { sku: 'BOS-KIT-10KW-STD', product_name: 'BOS Kit 10kW Pre-assembled', ordered_qty: 1, category: 'BOS Kit' },
            { sku: 'RAIL-4.2M-AL', product_name: 'Anodized Aluminum Rail 4.2m', ordered_qty: 50, category: 'Structure' },
            { sku: 'CABLE-6SQMM-100M', product_name: 'Solar DC Cable 6 sq.mm (100m Roll)', ordered_qty: 4, category: 'Cables' }
          ]
        }
      ],
      kit_assembly_details: {
        assembly_status: 'completed',
        qc_status: 'passed',
        qc_inspected_by: 'QC Manager (Rajesh)',
        kit_serial_barcode: 'SK-KIT-0950-8841',
        packed_at: new Date(Date.now() - 5 * 3600 * 1000)
      },
      items: [
        {
          sku: 'BOS-KIT-10KW-STD',
          product_name: 'BOS Kit 10kW (Pre-assembled ACDB/DCDB/Cables Package)',
          category: 'BOS Kit',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
          ordered_qty: 1,
          received_qty: 1,
          damaged_qty: 0,
          missing_qty: 0,
          pending_qty: 0,
          available_inventory_stock: 1,
          allocated_stock: 1,
          rack_location: 'BAY-BOS-STOCK',
          qc_status: 'Passed'
        },
        {
          sku: 'BOS-RAIL-4.2M-AL',
          product_name: 'Anodized Aluminum Mounting Rail 4.2m',
          category: 'Mounting Structure',
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
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
          sourcing_type: 'warehouse_inventory',
          supply_fulfilment_method: 'warehouse_stock',
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
          remarks: '100% components verified and packed. BOSKIT assembled & barcode labeled.'
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
      }
    }
  ];

  await DeliveryOrder.insertMany(ordersToInsert);
  console.log('✅ Successfully inserted 3 rich delivery orders with Supplier Pickup, Delivery & BOSKIT stages!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
