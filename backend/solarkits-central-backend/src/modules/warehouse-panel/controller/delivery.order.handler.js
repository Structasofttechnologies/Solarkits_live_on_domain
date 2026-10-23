const { DeliveryOrder } = require('../models/company_warehouse_db');

// Initial seed data if collection is empty
const defaultSeedOrders = [
  {
    delivery_order_id: 'DO-2026-0001',
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
    order_id: 'ORD-SK-94112',
    order_number: 'SK-2026-0950',
    warehouse_code: 'MW-01',
    customer_name: 'SuryaTej Green Tech Pvt Ltd',
    customer_phone: '+91 99887 76655',
    customer_email: 'operations@suryatej.com',
    destination: {
      address: 'Plot 108, MIDC Waluj, Sector B',
      state: 'Maharashtra',
      district: 'Chhatrapati Sambhajinagar',
      pincode: '431136',
      landmark: 'Near Golden City Chowk'
    },
    required_vehicle: '17ft Canter (5.0 Ton)',
    order_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    delivery_status: 'ready_for_dispatch',
    delivery_method: 'manual',
    items: [
      {
        sku: 'BOS-RAIL-4.2M-AL',
        product_name: 'Anodized Aluminum Mounting Rail 4.2m',
        category: 'Mounting Structure',
        ordered_qty: 80,
        received_qty: 80,
        pending_qty: 0,
        available_inventory_stock: 140,
        allocated_stock: 80,
        rack_location: 'Rack-A1-04',
        qc_status: 'Passed'
      },
      {
        sku: 'BOS-AJB-DCDB-6IN-6OUT',
        product_name: 'IP65 DCDB 6-In 6-Out with High Voltage Arrestor',
        category: 'Protection Devices',
        ordered_qty: 3,
        received_qty: 3,
        pending_qty: 0,
        available_inventory_stock: 10,
        allocated_stock: 3,
        rack_location: 'Rack-E1-02',
        qc_status: 'Passed'
      },
      {
        sku: 'BOS-DC-CABLE-6SQMM-100M',
        product_name: 'Solar DC Cable 6 sq.mm (100m Roll)',
        category: 'Electrical Wiring',
        ordered_qty: 8,
        received_qty: 8,
        pending_qty: 0,
        available_inventory_stock: 30,
        allocated_stock: 8,
        rack_location: 'Cable-Rack-C2',
        qc_status: 'Passed'
      }
    ],
    inward_history: [
      {
        batch_id: 'BATCH-20261013-02',
        inwarded_items: [
          { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', qty: 80 },
          { sku: 'BOS-AJB-DCDB-6IN-6OUT', product_name: 'IP65 DCDB 6-In 6-Out', qty: 3 },
          { sku: 'BOS-DC-CABLE-6SQMM-100M', product_name: 'Solar DC Cable 6 sq.mm', qty: 8 }
        ],
        inwarded_by_name: 'Delivery Manager (Abhishek Sharma)',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000),
        remarks: 'All BOS products inwarded and QC verified. Ready for dispatch setup.'
      }
    ],
    transport_details: {
      vehicle_number: 'MH 20 CD 3819',
      vehicle_type: '17ft Canter (5.0 Ton)',
      transporter_name: 'Marathwada Cargo Carriers',
      transporter_id: 'MCC-CSN-09',
      driver_name: 'Rameshwar Shinde',
      driver_mobile: '9823456789',
      dispatch_date: new Date(),
      expected_delivery_date: new Date(Date.now() + 24 * 3600 * 1000),
      docket_number: 'DKT-2026-9938',
      lr_number: 'LR-MCC-4410',
      notes: 'Handle DCDB packages with care.'
    },
    eway_bill: {
      requested: true,
      requested_at: new Date(Date.now() - 4 * 3600 * 1000),
      requested_by_name: 'Delivery Manager (Abhishek Sharma)',
      status: 'generated',
      eway_bill_number: '281098451290',
      valid_until: new Date(Date.now() + 48 * 3600 * 1000),
      eway_bill_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      verified_at: new Date(Date.now() - 2 * 3600 * 1000)
    },
    dispatch_evidence: {
      vehicle_rear_photo: '',
      docket_doc: '',
      dispatched_at: null,
      dispatched_by_name: ''
    },
    audit_trail: [
      {
        action: 'All Materials Inwarded - Moved to Out for Delivery',
        performed_by_name: 'System',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000),
        notes: '100% quantity inwarded. Order ready for vehicle dispatch prep.'
      },
      {
        action: 'E-Way Bill Approved & Attached',
        performed_by_name: 'Account Manager (Rohan Verma)',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
        notes: 'E-Way Bill 281098451290 generated and attached to delivery order.'
      }
    ]
  },
  {
    delivery_order_id: 'DO-2026-0004',
    order_id: 'ORD-SK-94120',
    order_number: 'SK-2026-0958',
    warehouse_code: 'MW-01',
    customer_name: 'SunRise Eco Power EPC',
    customer_phone: '+91 94231 99887',
    customer_email: 'dispatch@sunriseecopower.com',
    destination: {
      address: 'Near Old Toll Plaza, Solapur Highway, Hadapsar',
      state: 'Maharashtra',
      district: 'Pune',
      pincode: '412307',
      landmark: 'Next to IOC Petrol Pump'
    },
    required_vehicle: 'Tata Ace (1.5 Ton)',
    order_date: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    delivery_status: 'in_transit',
    delivery_method: 'manual',
    items: [
      {
        sku: 'BOS-RAIL-3.2M-AL',
        product_name: 'Anodized Aluminum Mounting Rail 3.2m',
        category: 'Mounting Structure',
        ordered_qty: 50,
        received_qty: 50,
        pending_qty: 0,
        available_inventory_stock: 50,
        allocated_stock: 50,
        rack_location: 'Rack-A1-02',
        qc_status: 'Passed'
      },
      {
        sku: 'BOS-EARTH-ROD-COPPER-2M',
        product_name: 'Copper Bonded Earthing Electrode Rod 2m',
        category: 'Earthing & Lightning',
        ordered_qty: 6,
        received_qty: 6,
        pending_qty: 0,
        available_inventory_stock: 20,
        allocated_stock: 6,
        rack_location: 'Bay-Ground-02',
        qc_status: 'Passed'
      }
    ],
    inward_history: [
      {
        batch_id: 'BATCH-20261012-01',
        inwarded_items: [
          { sku: 'BOS-RAIL-3.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 3.2m', qty: 50 },
          { sku: 'BOS-EARTH-ROD-COPPER-2M', product_name: 'Copper Bonded Earthing Electrode Rod 2m', qty: 6 }
        ],
        inwarded_by_name: 'Delivery Manager',
        timestamp: new Date(Date.now() - 30 * 3600 * 1000),
        remarks: 'Full inward complete.'
      }
    ],
    transport_details: {
      vehicle_number: 'MH 12 QW 5512',
      vehicle_type: 'Tata Ace (1.5 Ton)',
      transporter_name: 'FastTrack Pune Express',
      transporter_id: 'FTP-PUN-04',
      driver_name: 'Ganesh More',
      driver_mobile: '9850123456',
      dispatch_date: new Date(Date.now() - 5 * 3600 * 1000),
      expected_delivery_date: new Date(Date.now() + 4 * 3600 * 1000),
      docket_number: 'DKT-PN-7721',
      lr_number: 'LR-PN-332',
      notes: 'Direct customer handover.'
    },
    eway_bill: {
      requested: true,
      requested_at: new Date(Date.now() - 8 * 3600 * 1000),
      status: 'generated',
      eway_bill_number: '291084729102',
      valid_until: new Date(Date.now() + 24 * 3600 * 1000),
      eway_bill_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      verified_at: new Date(Date.now() - 6 * 3600 * 1000)
    },
    dispatch_evidence: {
      vehicle_rear_photo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      docket_doc: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      dispatched_at: new Date(Date.now() - 5 * 3600 * 1000),
      dispatched_by_name: 'Delivery Manager (Abhishek Sharma)'
    },
    audit_trail: [
      {
        action: 'Dispatch Initiated',
        performed_by_name: 'Delivery Manager (Abhishek Sharma)',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000),
        notes: 'Rear vehicle photo and signed docket verified. Loaded out for delivery.'
      }
    ]
  }
];

// Seed helper
const ensureSeedData = async () => {
  try {
    const count = await DeliveryOrder.countDocuments({ delivery_order_id: { $exists: true } });
    if (count === 0) {
      const ordersWithNumber = defaultSeedOrders.map(o => ({
        ...o,
        delivery_number: o.delivery_number || o.delivery_order_id
      }));
      await DeliveryOrder.insertMany(ordersWithNumber);
      console.log('✅ Seeded default delivery orders successfully.');
    }

    // Ensure incoming_truck_group, SLA and Multi-EPC data are populated on existing documents
    await DeliveryOrder.updateMany(
      { delivery_order_id: 'DO-2026-0001' },
      {
        $set: {
          sla_days: 2,
          customer_name: 'Apex Green Energy Infra (Multi-EPC Consignment)',
          incoming_truck_group: {
            group_id: 'TRK-GRP-2026-081',
            group_name: 'Consolidated West Hub Truck (3 EPC Orders)',
            vehicle_number: 'MH-12-PQ-9080',
            vehicle_type: '17ft Eicher (6.0 Ton)',
            transporter_name: 'VRL Logistics Ltd',
            driver_name: 'Ramesh Singh',
            driver_mobile: '+91 98220 11223',
            lr_number: 'VRL-LR-882910',
            total_epc_orders_in_truck: 3,
            unloaded_dock: 'Receiving Dock #2',
            is_claimed: true,
            claimed_at: new Date(Date.now() - 4 * 3600 * 1000),
            claimed_by_name: 'Delivery Manager (Abhishek Sharma)'
          },
          epcs: [
            {
              epc_id: 'EPC-101',
              epc_name: 'Apex Infra Solutions Pvt Ltd',
              contact_person: 'Rohan Mehra',
              phone: '+91 98765 43210',
              email: 'rohan@apexenergy.in',
              destination: {
                address: 'Plot 44, Sector 18, Phase 2, Industrial Estate',
                district: 'Pune',
                state: 'Maharashtra',
                pincode: '411026'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 185000,
                paid_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'done',
                percentage: 50,
                amount: 185000,
                paid_at: new Date(Date.now() - 12 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              items: [
                { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', ordered_qty: 30, received_qty: 30, pending_qty: 0, rack_location: 'Rack-A1-04' },
                { sku: 'BOS-CLAMP-END-35MM', product_name: 'Solar Panel End Clamps (35mm Anodized)', ordered_qty: 60, received_qty: 60, pending_qty: 0, rack_location: 'Bin-F3-02' },
                { sku: 'BOS-DC-CABLE-4SQMM-100M', product_name: 'Solar DC Cable 4 sq.mm (100m Roll)', ordered_qty: 3, received_qty: 3, pending_qty: 0, rack_location: 'Cable-Rack-C2' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'ready_for_dispatch',
              tracking_consignment_id: 'TRK-SK-94101-EPC1'
            },
            {
              epc_id: 'EPC-102',
              epc_name: 'SunShine MegaWatt EPC Solutions',
              contact_person: 'Vikas Deshmukh',
              phone: '+91 98221 44556',
              email: 'vikas@sunshineepc.com',
              destination: {
                address: 'Survey 82, Chakan Industrial Area, Phase 3',
                district: 'Pune',
                state: 'Maharashtra',
                pincode: '410501'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 140000,
                paid_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'pending',
                percentage: 50,
                amount: 140000,
                paid_at: null,
                verified_by: ''
              },
              items: [
                { sku: 'BOS-CLAMP-MID-35MM', product_name: 'Solar Panel Mid Clamps (35mm Anodized)', ordered_qty: 100, received_qty: 100, pending_qty: 0, rack_location: 'Bin-F3-03' },
                { sku: 'BOS-AJB-DCDB-4IN-4OUT', product_name: 'IP65 DCDB 4-In 4-Out Surge Protection', ordered_qty: 2, received_qty: 2, pending_qty: 0, rack_location: 'Rack-E1-01' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'ready_for_dispatch',
              tracking_consignment_id: 'TRK-SK-94101-EPC2'
            },
            {
              epc_id: 'EPC-103',
              epc_name: 'Vidarbha Power Systems EPC',
              contact_person: 'Nilesh Shinde',
              phone: '+91 97665 88990',
              email: 'nilesh@vidarbhapower.in',
              destination: {
                address: 'Gat No. 120, Ranjangaon MIDC, Shirur',
                district: 'Pune',
                state: 'Maharashtra',
                pincode: '412209'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 95000,
                paid_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'done',
                percentage: 50,
                amount: 95000,
                paid_at: new Date(Date.now() - 10 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              items: [
                { sku: 'BOS-EARTH-ROD-COPPER-2M', product_name: 'Copper Bonded Earthing Rod 2m', ordered_qty: 4, received_qty: 4, pending_qty: 0, rack_location: 'Bay-Ground-02' },
                { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', ordered_qty: 30, received_qty: 30, pending_qty: 0, rack_location: 'Rack-A1-04' },
                { sku: 'BOS-CLAMP-END-35MM', product_name: 'Solar Panel End Clamps (35mm Anodized)', ordered_qty: 60, received_qty: 60, pending_qty: 0, rack_location: 'Bin-F3-02' },
                { sku: 'BOS-CLAMP-MID-35MM', product_name: 'Solar Panel Mid Clamps (35mm Anodized)', ordered_qty: 80, received_qty: 80, pending_qty: 0, rack_location: 'Bin-F3-03' },
                { sku: 'BOS-DC-CABLE-4SQMM-100M', product_name: 'Solar DC Cable 4 sq.mm (100m Roll)', ordered_qty: 3, received_qty: 3, pending_qty: 0, rack_location: 'Cable-Rack-C2' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'ready_for_dispatch',
              tracking_consignment_id: 'TRK-SK-94101-EPC3'
            }
          ]
        }
      }
    );
    await DeliveryOrder.updateMany(
      { delivery_order_id: 'DO-2026-0002' },
      {
        $set: {
          sla_days: 2,
          incoming_truck_group: {
            group_id: 'TRK-GRP-2026-081',
            group_name: 'Consolidated West Hub Truck (3 EPC Orders)',
            vehicle_number: 'MH-12-PQ-9080',
            vehicle_type: '17ft Eicher (6.0 Ton)',
            transporter_name: 'VRL Logistics Ltd',
            driver_name: 'Ramesh Singh',
            driver_mobile: '+91 98220 11223',
            lr_number: 'VRL-LR-882910',
            total_epc_orders_in_truck: 3,
            unloaded_dock: 'Receiving Dock #2',
            is_claimed: true,
            claimed_at: new Date(Date.now() - 4 * 3600 * 1000),
            claimed_by_name: 'Delivery Manager (Abhishek Sharma)'
          },
          epcs: [
            {
              epc_id: 'EPC-201',
              epc_name: 'Kisan Solar Solutions EPC',
              contact_person: 'Balasaheb Kadam',
              phone: '+91 97654 11223',
              email: 'support@kisansolar.com',
              destination: {
                address: 'Shop No. 12, Agri Market Yard, Bypass Road',
                district: 'Nashik',
                state: 'Maharashtra',
                pincode: '422003'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 115000,
                paid_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'pending',
                percentage: 50,
                amount: 115000,
                paid_at: null,
                verified_by: ''
              },
              items: [
                { sku: 'BOS-RAIL-3.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 3.2m', ordered_qty: 40, received_qty: 40, pending_qty: 0, rack_location: 'Rack-A1-02' },
                { sku: 'BOS-FASTENER-SS304-SET', product_name: 'SS304 Allen Bolt & Spring Nut Hardware Set', ordered_qty: 4, received_qty: 4, pending_qty: 0, rack_location: 'Bin-F2-01' },
                { sku: 'BOS-MC4-CONN-1000V', product_name: 'Solar MC4 Connectors Male/Female Pair IP68', ordered_qty: 5, received_qty: 2, pending_qty: 3, rack_location: 'Bin-C1-04' },
                { sku: 'BOS-ACDB-10KW-3PH', product_name: '10kW 3-Phase ACDB with MCB', ordered_qty: 1, received_qty: 0, pending_qty: 1, rack_location: 'Rack-E2-03' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'pending',
              tracking_consignment_id: 'TRK-SK-94105-EPC1'
            }
          ]
        }
      }
    );
    await DeliveryOrder.updateMany(
      { delivery_order_id: 'DO-2026-0003' },
      {
        $set: {
          sla_days: 2,
          order_date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
          customer_name: 'SuryaTej Green Tech (Consolidated Multi-EPC Hub)',
          incoming_truck_group: {
            group_id: 'TRK-GRP-2026-074',
            group_name: 'Central Logistics Direct Dispatch',
            vehicle_number: 'MH-15-EF-4920',
            vehicle_type: '14ft Eicher (4.0 Ton)',
            transporter_name: 'TCI Freight Express',
            driver_name: 'Sachin Patil',
            driver_mobile: '+91 98223 34455',
            lr_number: 'TCI-LR-442011',
            total_epc_orders_in_truck: 2,
            unloaded_dock: 'Receiving Bay #1',
            is_claimed: true,
            claimed_at: new Date(Date.now() - 48 * 3600 * 1000),
            claimed_by_name: 'Delivery Manager (Abhishek Sharma)'
          },
          epcs: [
            {
              epc_id: 'EPC-301',
              epc_name: 'SuryaTej Infra Solutions EPC',
              contact_person: 'Amitabh Sen',
              phone: '+91 99887 76655',
              email: 'operations@suryatej.com',
              destination: {
                address: 'Plot 108, MIDC Waluj, Sector B',
                district: 'Chhatrapati Sambhajinagar',
                state: 'Maharashtra',
                pincode: '431136'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 210000,
                paid_at: new Date(Date.now() - 4 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'done',
                percentage: 50,
                amount: 210000,
                paid_at: new Date(Date.now() - 6 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              items: [
                { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', ordered_qty: 50, received_qty: 50, pending_qty: 0, rack_location: 'Rack-A1-04' },
                { sku: 'BOS-AJB-DCDB-6IN-6OUT', product_name: 'IP65 DCDB 6-In 6-Out', ordered_qty: 2, received_qty: 2, pending_qty: 0, rack_location: 'Rack-E1-02' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'ready_for_dispatch',
              tracking_consignment_id: 'TRK-SK-94112-EPC1'
            },
            {
              epc_id: 'EPC-302',
              epc_name: 'Marathwada Solar Parks Ltd',
              contact_person: 'Sandeep Gaikwad',
              phone: '+91 98229 11002',
              email: 'sandeep@marathwadasolar.com',
              destination: {
                address: 'Plot 22, Shendra MIDC Industrial Area',
                district: 'Chhatrapati Sambhajinagar',
                state: 'Maharashtra',
                pincode: '431154'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 165000,
                paid_at: new Date(Date.now() - 4 * 24 * 3600 * 1000),
                verified_by: 'Account Manager (Rohan Verma)'
              },
              payment_second_half: {
                status: 'pending',
                percentage: 50,
                amount: 165000,
                paid_at: null,
                verified_by: ''
              },
              items: [
                { sku: 'BOS-RAIL-4.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 4.2m', ordered_qty: 30, received_qty: 30, pending_qty: 0, rack_location: 'Rack-A1-04' },
                { sku: 'BOS-AJB-DCDB-6IN-6OUT', product_name: 'IP65 DCDB 6-In 6-Out', ordered_qty: 1, received_qty: 1, pending_qty: 0, rack_location: 'Rack-E1-02' },
                { sku: 'BOS-DC-CABLE-6SQMM-100M', product_name: 'Solar DC Cable 6 sq.mm', ordered_qty: 8, received_qty: 8, pending_qty: 0, rack_location: 'Cable-Rack-C2' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'ready_for_dispatch',
              tracking_consignment_id: 'TRK-SK-94112-EPC2'
            }
          ]
        }
      }
    );
    await DeliveryOrder.updateMany(
      { delivery_order_id: 'DO-2026-0004' },
      {
        $set: {
          epcs: [
            {
              epc_id: 'EPC-401',
              epc_name: 'SunRise Eco Power EPC',
              contact_person: 'Ganesh More',
              phone: '+91 94231 99887',
              email: 'dispatch@sunriseecopower.com',
              destination: {
                address: 'Near Old Toll Plaza, Solapur Highway, Hadapsar',
                district: 'Pune',
                state: 'Maharashtra',
                pincode: '412307'
              },
              payment_first_half: {
                status: 'done',
                percentage: 50,
                amount: 140000,
                paid_at: new Date(Date.now() - 5 * 24 * 3600 * 1000),
                verified_by: 'Account Manager'
              },
              payment_second_half: {
                status: 'done',
                percentage: 50,
                amount: 140000,
                paid_at: new Date(Date.now() - 24 * 3600 * 1000),
                verified_by: 'Account Manager'
              },
              items: [
                { sku: 'BOS-RAIL-3.2M-AL', product_name: 'Anodized Aluminum Mounting Rail 3.2m', ordered_qty: 50, received_qty: 50, pending_qty: 0, rack_location: 'Rack-A1-02' },
                { sku: 'BOS-EARTH-ROD-COPPER-2M', product_name: 'Copper Bonded Earthing Electrode Rod 2m', ordered_qty: 6, received_qty: 6, pending_qty: 0, rack_location: 'Bay-Ground-02' }
              ],
              is_removed_by_account: false,
              dispatch_status: 'in_transit',
              tracking_consignment_id: 'TRK-SK-94120-EPC1'
            }
          ]
        }
      }
    );
  } catch (err) {
    console.error('Error seeding delivery orders:', err.message);
  }
};

/**
 * GET /warehouse-api/delivery-orders
 * List orders with search, filters (state, district, pincode, status, date)
 */
exports.get_delivery_orders = async (req, res) => {
  try {
    await ensureSeedData();

    const {
      status,
      state,
      district,
      pincode,
      search,
      delivery_method,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { delivery_order_id: { $exists: true } };

    const now = new Date();
    const slaThresholdDate = new Date(now.getTime() - 2 * 24 * 3600 * 1000);

    if (status && status !== 'all') {
      if (status === 'overdue') {
        filter.delivery_status = { $ne: 'delivered' };
        filter.order_date = { $lte: slaThresholdDate };
      } else if (status === 'pending_inward' || status === 'new_order') {
        filter.delivery_status = { $in: ['new_order', 'partially_inwarded'] };
      } else {
        filter.delivery_status = status;
      }
    }

    if (state && state !== 'all') {
      filter['destination.state'] = new RegExp(`^${state}$`, 'i');
    }

    if (district && district !== 'all') {
      filter['destination.district'] = new RegExp(`^${district}$`, 'i');
    }

    if (pincode) {
      filter['destination.pincode'] = new RegExp(pincode.trim(), 'i');
    }

    if (delivery_method && delivery_method !== 'all') {
      filter.delivery_method = delivery_method;
    }

    if (search) {
      const s = search.trim();
      filter.$or = [
        { delivery_order_id: new RegExp(s, 'i') },
        { order_number: new RegExp(s, 'i') },
        { customer_name: new RegExp(s, 'i') },
        { customer_phone: new RegExp(s, 'i') },
        { 'destination.address': new RegExp(s, 'i') },
        { 'incoming_truck_group.group_id': new RegExp(s, 'i') },
        { 'incoming_truck_group.vehicle_number': new RegExp(s, 'i') },
        { 'incoming_truck_group.transporter_name': new RegExp(s, 'i') }
      ];
    }

    if (startDate || endDate) {
      filter.order_date = {};
      if (startDate) filter.order_date.$gte = new Date(startDate);
      if (endDate) filter.order_date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await DeliveryOrder.countDocuments(filter);
    const rawOrders = await DeliveryOrder.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Base warehouse stock reference map
    const baseInventoryMap = {
      'BOS-RAIL-4.2M-AL': 140,
      'BOS-CLAMP-END-35MM': 450,
      'BOS-CLAMP-MID-35MM': 600,
      'BOS-DC-CABLE-4SQMM-100M': 24,
      'BOS-AJB-DCDB-4IN-4OUT': 8,
      'BOS-EARTH-ROD-COPPER-2M': 35,
      'BOS-RAIL-3.2M-AL': 100,
      'BOS-FASTENER-SS304-SET': 50,
      'BOS-MC4-CONN-1000V': 80,
      'BOS-AJB-DCDB-6IN-6OUT': 12
    };

    // Calculate total allocated stock across ALL active (non-delivered) delivery orders
    const allActiveOrders = await DeliveryOrder.find({
      delivery_order_id: { $exists: true },
      delivery_status: { $ne: 'delivered' }
    });

    const totalAllocatedBySku = {};
    for (const actOrd of allActiveOrders) {
      for (const it of (actOrd.items || [])) {
        if (it.sku && it.allocated_stock > 0) {
          totalAllocatedBySku[it.sku] = (totalAllocatedBySku[it.sku] || 0) + it.allocated_stock;
        }
      }
    }

    // Enrich orders with dynamic available inventory (minus other allocations) and Overdue SLA calculations
    const orders = rawOrders.map(ord => {
      const ordObj = ord.toObject();
      const slaDays = ordObj.sla_days || 2;
      const orderDate = new Date(ordObj.order_date || ordObj.created_at);
      const diffMs = now - orderDate;
      const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const isOverdue = ordObj.delivery_status !== 'delivered' && daysElapsed > slaDays;
      const overdueDays = isOverdue ? (daysElapsed - slaDays) : 0;

      // Available Stock for this order = Base Stock - Stock allocated to OTHER active orders
      const enrichedItems = (ordObj.items || []).map(it => {
        const baseStock = baseInventoryMap[it.sku] !== undefined ? baseInventoryMap[it.sku] : (it.available_inventory_stock || 100);
        const allocatedByOthers = Math.max(0, (totalAllocatedBySku[it.sku] || 0) - (it.allocated_stock || 0));
        const liveAvailableStock = Math.max(0, baseStock - allocatedByOthers);
        return {
          ...it,
          base_warehouse_stock: baseStock,
          available_inventory_stock: liveAvailableStock
        };
      });

      const epcsList = (ordObj.epcs && ordObj.epcs.length > 0)
        ? ordObj.epcs
        : [{
            epc_id: 'EPC-01',
            epc_name: ordObj.customer_name || 'Primary EPC',
            contact_person: ordObj.customer_name,
            phone: ordObj.customer_phone,
            email: ordObj.customer_email,
            destination: ordObj.destination,
            payment_first_half: { status: 'done', percentage: 50, amount: 150000, paid_at: new Date(Date.now() - 48*3600*1000) },
            payment_second_half: {
              status: ['in_transit', 'delivered'].includes(ordObj.delivery_status) ? 'done' : 'pending',
              percentage: 50,
              amount: 150000,
              paid_at: ['in_transit', 'delivered'].includes(ordObj.delivery_status) ? new Date() : null
            },
            items: ordObj.items || [],
            is_removed_by_account: false,
            dispatch_status: ordObj.delivery_status,
            tracking_consignment_id: `TRK-${ordObj.order_number}-EPC1`
          }];

      // If 100% components are fulfilled (either inwarded or allocated from warehouse stock)
      let effectiveKitStatus = ordObj.kit_preparation_status;
      const unallocatedShortage = (ordObj.items || []).reduce((acc, it) => {
        const pending = it.pending_qty || 0;
        const allocated = it.allocated_stock || 0;
        return acc + Math.max(0, pending - allocated);
      }, 0);
      if (effectiveKitStatus === 'awaiting_components' && unallocatedShortage === 0) {
        effectiveKitStatus = 'ready_for_assembly';
      }

      return {
        ...ordObj,
        kit_preparation_status: effectiveKitStatus,
        epcs: epcsList,
        items: enrichedItems,
        days_elapsed: daysElapsed,
        is_overdue: isOverdue,
        overdue_days: overdueDays
      };
    });

    // Summary counts for dashboard badges
    const baseQuery = { delivery_order_id: { $exists: true } };
    const overdueCount = await DeliveryOrder.countDocuments({
      ...baseQuery,
      delivery_status: { $ne: 'delivered' },
      order_date: { $lte: slaThresholdDate }
    });

    const summary = {
      total: await DeliveryOrder.countDocuments(baseQuery),
      new_orders: await DeliveryOrder.countDocuments({ ...baseQuery, delivery_status: { $in: ['new_order', 'partially_inwarded'] } }),
      pending_inward: await DeliveryOrder.countDocuments({ ...baseQuery, delivery_status: { $in: ['new_order', 'partially_inwarded'] } }),
      overdue_orders: overdueCount,
      ready_for_dispatch: await DeliveryOrder.countDocuments({ ...baseQuery, delivery_status: 'ready_for_dispatch' }),
      in_transit: await DeliveryOrder.countDocuments({ ...baseQuery, delivery_status: 'in_transit' }),
      delivered: await DeliveryOrder.countDocuments({ ...baseQuery, delivery_status: 'delivered' })
    };

    return res.status(200).json({
      status: 'success',
      data: orders,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('get_delivery_orders error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * GET /warehouse-api/delivery-orders/:id
 */
exports.get_delivery_order_by_id = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }
    return res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/reserve-inventory
 * Reserve available BOS stock against this delivery order
 */
exports.reserve_inventory = async (req, res) => {
  try {
    const { sku, allocated_stock } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const item = (order.items || []).find(it => it.sku === sku);
    if (!item) {
      return res.status(404).json({ status: 'error', message: `SKU ${sku} not found in this order.` });
    }

    const qtyToAllocate = parseInt(allocated_stock);
    if (isNaN(qtyToAllocate) || qtyToAllocate < 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid allocated quantity.' });
    }

    const baseInventoryMap = {
      'BOS-RAIL-4.2M-AL': 140,
      'BOS-CLAMP-END-35MM': 450,
      'BOS-CLAMP-MID-35MM': 600,
      'BOS-DC-CABLE-4SQMM-100M': 24,
      'BOS-AJB-DCDB-4IN-4OUT': 8,
      'BOS-EARTH-ROD-COPPER-2M': 35,
      'BOS-RAIL-3.2M-AL': 100,
      'BOS-FASTENER-SS304-SET': 50,
      'BOS-MC4-CONN-1000V': 80,
      'BOS-AJB-DCDB-6IN-6OUT': 12
    };

    const otherOrders = await DeliveryOrder.find({
      _id: { $ne: order._id },
      delivery_status: { $ne: 'delivered' }
    });
    let allocatedByOthers = 0;
    for (const ord of otherOrders) {
      for (const it of (ord.items || [])) {
        if (it.sku === sku) {
          allocatedByOthers += (it.allocated_stock || 0);
        }
      }
    }
    const baseStock = baseInventoryMap[sku] !== undefined ? baseInventoryMap[sku] : (item.available_inventory_stock || 100);
    const liveAvailable = Math.max(0, baseStock - allocatedByOthers);

    if (qtyToAllocate > liveAvailable) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot allocate ${qtyToAllocate} units. Free unreserved warehouse stock is only ${liveAvailable} units (${allocatedByOthers} units already reserved by other customer orders).`
      });
    }

    item.allocated_stock = qtyToAllocate;

    order.audit_trail.push({
      action: 'Inventory Stock Allocated',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Reserved ${qtyToAllocate} units of SKU ${sku} (${item.product_name}) for this order.`
    });

    await order.save();
    return res.status(200).json({ status: 'success', message: 'Inventory stock reserved successfully.', data: order });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/request-procurement
 * When BOS kit stock is not available in warehouse inventory, send procurement requisition to Account Manager
 */
exports.request_procurement = async (req, res) => {
  try {
    const { sku, requested_qty, notes } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const item = (order.items || []).find(it => it.sku === sku);
    const itemName = item ? item.product_name : (sku || 'BOS Kit Components');
    const qty = parseInt(requested_qty) || (item ? item.pending_qty : 1);

    order.audit_trail.push({
      action: 'Procurement Requisition Sent to Account Panel',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Requisition of ${qty} units for SKU ${sku} (${itemName}) sent to Account Manager due to warehouse stock shortage. ${notes || ''}`.trim()
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `Procurement requisition for "${itemName}" (${qty} units) forwarded to Account Manager login successfully.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/inward
 * Inward materials against the delivery order.
 * Strictly prevents inward exceeding permissible pending quantity.
 * Automatically moves order to ready_for_dispatch if all items inwarded 100%.
 */
exports.inward_material = async (req, res) => {
  try {
    const {
      items = [],
      remarks = '',
      batch_id,
      inward_type = 'warehouse',
      inward_mode = 'manual',
      scanned_serials = [],
      pickup_location_details
    } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    if (items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No items provided for inwarding.' });
    }

    const inwardedItemsLog = [];

    const orderItems = order.items || [];

    // Validation pass: Ensure no item exceeds pending quantity
    for (const inItem of items) {
      const orderItem = orderItems.find(it => it.sku === inItem.sku);
      if (!orderItem) {
        return res.status(400).json({ status: 'error', message: `Item SKU ${inItem.sku} is not part of this order.` });
      }

      const inwardQty = parseInt(inItem.qty) || 0;
      if (inwardQty <= 0) continue;

      if (inwardQty > orderItem.pending_qty) {
        return res.status(400).json({
          status: 'error',
          message: `Inward quantity (${inwardQty}) for ${orderItem.product_name} exceeds remaining pending quantity (${orderItem.pending_qty}). Unauthorized excess is prohibited.`
        });
      }
    }

    // Execution pass: Apply inward quantities
    for (const inItem of items) {
      const orderItem = orderItems.find(it => it.sku === inItem.sku);
      if (!orderItem) continue;

      const inwardQty = parseInt(inItem.qty) || 0;
      if (inwardQty <= 0) continue;

      orderItem.received_qty += inwardQty;
      orderItem.pending_qty = Math.max(0, orderItem.ordered_qty - orderItem.received_qty);

      if (inItem.rack_location) {
        orderItem.rack_location = inItem.rack_location;
      }

      inwardedItemsLog.push({
        sku: orderItem.sku,
        product_name: orderItem.product_name,
        qty: inwardQty
      });
    }

    if (inwardedItemsLog.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please enter valid inward quantities greater than 0.' });
    }

    // Update Inward Type and Pickup Location Details if provided
    order.inward_type = inward_type;
    if (pickup_location_details) {
      order.pickup_location_details = {
        location_name: pickup_location_details.location_name || '',
        address: pickup_location_details.address || '',
        contact_person: pickup_location_details.contact_person || '',
        contact_phone: pickup_location_details.contact_phone || ''
      };
    }

    // Store Scanned Serials (Barcode / QR gun registry) for matching during outward
    if (Array.isArray(scanned_serials) && scanned_serials.length > 0) {
      if (!order.scanned_serials) order.scanned_serials = [];
      scanned_serials.forEach(sn => {
        const serialCode = typeof sn === 'string' ? sn : sn.serial_code;
        const skuCode = typeof sn === 'object' ? sn.sku : '';
        if (serialCode) {
          order.scanned_serials.push({
            sku: skuCode || '',
            serial_code: serialCode,
            inwarded_at: new Date(),
            verified_for_outward: false
          });
        }
      });
    }

    // Generate Delivery Number upon inwarding if not already present
    if (!order.delivery_number || order.delivery_number.startsWith('DO-')) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      order.delivery_number = `DEL-${dateStr}-${rand}`;
      order.audit_trail.push({
        action: 'Delivery Number Generated',
        performed_by_name: req.user?.name || 'Delivery Manager',
        timestamp: new Date(),
        notes: `Delivery Number ${order.delivery_number} generated upon material inward (${inward_type === 'pickup_location' ? 'Direct Pickup from Site/Supplier' : 'Warehouse Dock Inward'}).`
      });
    }

    // Record Inward History
    const generatedBatchId = batch_id || `BATCH-${Date.now().toString().slice(-6)}`;
    order.inward_history.push({
      batch_id: generatedBatchId,
      inwarded_items: inwardedItemsLog,
      inward_type,
      inward_mode,
      scanned_serials: Array.isArray(scanned_serials) ? scanned_serials : [],
      inwarded_by_name: req.user?.name || 'Delivery Manager (Abhishek Sharma)',
      timestamp: new Date(),
      remarks: remarks || (inward_type === 'pickup_location' ? 'Material directly picked up from site/supplier location.' : 'Material received and verified at warehouse dock.')
    });

    // Check if 100% inward complete across all items
    const totalPending = order.items.reduce((acc, it) => acc + it.pending_qty, 0);

    if (totalPending === 0) {
      order.delivery_status = 'ready_for_dispatch';
      order.audit_trail.push({
        action: '100% Material Inward Complete - Auto Moved to Out for Delivery',
        performed_by_name: req.user?.name || 'Delivery Manager',
        timestamp: new Date(),
        notes: `All ${order.items.length} items inwarded and verified under batch ${generatedBatchId}. Order moved automatically to Out for Delivery.`
      });
    } else {
      order.delivery_status = 'partially_inwarded';
      order.audit_trail.push({
        action: 'Partial Material Inward Recorded',
        performed_by_name: req.user?.name || 'Delivery Manager',
        timestamp: new Date(),
        notes: `Batch ${generatedBatchId} inwarded (${inwardedItemsLog.reduce((s, it) => s + it.qty, 0)} units). Remaining pending units: ${totalPending}. Order remains in New Orders.`
      });
    }

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: totalPending === 0
        ? 'All materials successfully inwarded! Order moved to Out for Delivery.'
        : `Partial inward saved. ${totalPending} units pending.`,
      data: order
    });
  } catch (error) {
    console.error('inward_material error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/transport-details
 * Save vehicle, driver, transporter and docket information
 */
exports.save_transport_details = async (req, res) => {
  try {
    const {
      delivery_method,
      vehicle_number,
      vehicle_type,
      transporter_name,
      transporter_id,
      driver_name,
      driver_mobile,
      dispatch_date,
      expected_delivery_date,
      docket_number,
      lr_number,
      notes
    } = req.body;

    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    if (delivery_method) order.delivery_method = delivery_method;

    order.transport_details = {
      vehicle_number: vehicle_number || order.transport_details.vehicle_number,
      vehicle_type: vehicle_type || order.transport_details.vehicle_type,
      transporter_name: transporter_name || order.transport_details.transporter_name,
      transporter_id: transporter_id || order.transport_details.transporter_id,
      driver_name: driver_name || order.transport_details.driver_name,
      driver_mobile: driver_mobile || order.transport_details.driver_mobile,
      dispatch_date: dispatch_date ? new Date(dispatch_date) : order.transport_details.dispatch_date,
      expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : order.transport_details.expected_delivery_date,
      docket_number: docket_number || order.transport_details.docket_number,
      lr_number: lr_number || order.transport_details.lr_number,
      notes: notes || order.transport_details.notes
    };

    order.audit_trail.push({
      action: 'Transport & Vehicle Details Updated',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Vehicle: ${vehicle_number || 'N/A'}, Driver: ${driver_name || 'N/A'}, Transporter: ${transporter_name || 'N/A'}`
    });

    await order.save();
    return res.status(200).json({ status: 'success', message: 'Transport details updated successfully.', data: order });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/request-eway-bill
 * Submits E-Way bill request to Account Manager
 */
exports.request_eway_bill = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    order.eway_bill.requested = true;
    order.eway_bill.requested_at = new Date();
    order.eway_bill.requested_by_name = req.user?.name || 'Delivery Manager';
    order.eway_bill.status = 'pending';
    order.delivery_status = 'awaiting_eway_bill';

    order.audit_trail.push({
      action: 'E-Way Bill Requested from Account Manager',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: 'Request submitted to Account Manager for GST invoice validation and e-way bill generation.'
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: 'E-Way Bill request submitted successfully to Account Manager.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/verify-eway-bill
 * Simulated or direct Account Manager approval & generation of E-Way Bill
 */
exports.verify_eway_bill = async (req, res) => {
  try {
    const { eway_bill_number, valid_until, eway_bill_pdf } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const generatedEwb = eway_bill_number || `281${Math.floor(100000000 + Math.random() * 900000000)}`;
    const validityDate = valid_until ? new Date(valid_until) : new Date(Date.now() + 72 * 3600 * 1000);

    order.eway_bill.status = 'generated';
    order.eway_bill.eway_bill_number = generatedEwb;
    order.eway_bill.valid_until = validityDate;
    order.eway_bill.eway_bill_pdf = eway_bill_pdf || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    order.eway_bill.verified_at = new Date();
    order.delivery_status = 'ready_to_initiate';

    order.audit_trail.push({
      action: 'E-Way Bill Verified & Issued',
      performed_by_name: 'Account Manager (Rohan Verma)',
      timestamp: new Date(),
      notes: `E-Way Bill #${generatedEwb} approved, valid until ${validityDate.toLocaleString('en-IN')}.`
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: `E-Way Bill #${generatedEwb} successfully generated and verified. Ready to initiate dispatch!`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/initiate-dispatch
 * Gate check: Vehicle rear photo + Delivery docket + Valid E-way bill required.
 * Transitions order to in_transit and moves to Track Delivery.
 */
exports.initiate_dispatch = async (req, res) => {
  try {
    const { vehicle_rear_photo, docket_doc } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    // Check 1: E-Way Bill must be generated and valid
    if (order.eway_bill.status !== 'generated' || !order.eway_bill.eway_bill_number) {
      return res.status(400).json({
        status: 'error',
        message: 'Dispatch initiation disabled: A valid and verified E-Way Bill is mandatory before dispatch.'
      });
    }

    // Check 2: Rear photo of loaded vehicle
    const photo = vehicle_rear_photo || order.dispatch_evidence.vehicle_rear_photo;
    if (!photo) {
      return res.status(400).json({
        status: 'error',
        message: 'Dispatch initiation disabled: Rear-side photo of the loaded delivery vehicle is mandatory.'
      });
    }

    // Check 3: Delivery docket / challan
    const docket = docket_doc || order.dispatch_evidence.docket_doc;
    if (!docket) {
      return res.status(400).json({
        status: 'error',
        message: 'Dispatch initiation disabled: Signed delivery docket / challan document is mandatory.'
      });
    }

    // Save evidence & initiate
    order.dispatch_evidence = {
      vehicle_rear_photo: photo,
      docket_doc: docket,
      dispatched_at: new Date(),
      dispatched_by_name: req.user?.name || 'Delivery Manager (Abhishek Sharma)'
    };

    order.delivery_status = 'in_transit';

    order.audit_trail.push({
      action: 'Delivery Dispatched & Out on Route',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Vehicle loaded, rear photo verified, docket attached, E-Way Bill #${order.eway_bill.eway_bill_number} checked. Moved to Track Delivery.`
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: 'Delivery successfully initiated! Order has been moved to Track Delivery.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/send-otp
 * Generates and shares 6-digit delivery OTP with customer
 */
exports.send_customer_otp = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    order.delivery_completion.otp_code = otp;
    order.delivery_completion.otp_generated_at = new Date();
    order.delivery_completion.failed_otp_attempts = 0;

    order.audit_trail.push({
      action: 'Customer Delivery OTP Generated',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Delivery OTP shared with customer phone ${order.customer_phone}.`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `Delivery OTP successfully sent to ${order.customer_name} (${order.customer_phone}).`,
      otp_preview: otp // Sent for seamless testing in demo
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/verify-otp
 * Validates OTP and marks order Delivered
 */
exports.verify_customer_otp = async (req, res) => {
  try {
    const { otp_code, receiver_name } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    if (!order.delivery_completion.otp_code) {
      return res.status(400).json({ status: 'error', message: 'No OTP generated. Please generate and send OTP first.' });
    }

    if (order.delivery_completion.failed_otp_attempts >= 5) {
      order.delivery_status = 'delivery_exception';
      await order.save();
      return res.status(400).json({
        status: 'error',
        message: 'Maximum failed OTP attempts exceeded. Order flagged as Delivery Exception.'
      });
    }

    if (String(order.delivery_completion.otp_code).trim() !== String(otp_code).trim()) {
      order.delivery_completion.failed_otp_attempts = (order.delivery_completion.failed_otp_attempts || 0) + 1;
      order.audit_trail.push({
        action: 'Failed OTP Attempt',
        performed_by_name: req.user?.name || 'Delivery Personnel',
        timestamp: new Date(),
        notes: `Incorrect OTP entered. Attempt ${order.delivery_completion.failed_otp_attempts} of 5.`
      });
      await order.save();

      return res.status(400).json({
        status: 'error',
        message: `Incorrect OTP. Attempts remaining: ${5 - order.delivery_completion.failed_otp_attempts}`
      });
    }

    // OTP Verified Successfully
    order.delivery_status = 'delivered';
    order.delivery_completion.completed_at = new Date();
    order.delivery_completion.completed_by_name = req.user?.name || 'Delivery Manager (Abhishek Sharma)';
    order.delivery_completion.method = 'auto_otp';
    order.delivery_completion.otp_verified = true;
    order.delivery_completion.receiver_name = receiver_name || order.customer_name;

    order.audit_trail.push({
      action: 'Delivery Completed via Customer OTP Verification',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `OTP successfully verified with customer contact. Handover confirmed to ${order.delivery_completion.receiver_name}.`
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: 'OTP verified! Delivery marked as DELIVERED successfully.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/complete-manual
 * Destination photo proof + date/time + remarks -> Delivered
 */
exports.complete_manual_delivery = async (req, res) => {
  try {
    const { destination_photo, remarks, receiver_name, delivery_datetime } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    if (!destination_photo) {
      return res.status(400).json({
        status: 'error',
        message: 'Destination delivery proof photo is mandatory to complete manual delivery.'
      });
    }

    order.delivery_status = 'delivered';
    order.delivery_completion = {
      completed_at: delivery_datetime ? new Date(delivery_datetime) : new Date(),
      completed_by_name: req.user?.name || 'Delivery Manager (Abhishek Sharma)',
      method: 'manual_photo',
      destination_photo,
      remarks: remarks || 'Delivered and verified at destination site.',
      receiver_name: receiver_name || order.customer_name,
      otp_verified: false
    };

    order.audit_trail.push({
      action: 'Manual Delivery Confirmed with Photo Proof',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Delivery proof photo verified. Remarks: ${remarks || 'None'}. Handover confirmed to ${receiver_name || order.customer_name}.`
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: 'Photo evidence verified! Delivery marked as DELIVERED successfully.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/claim-incoming-shipment
 * Unload and claim incoming consolidated truck shipment for this delivery order
 */
exports.claim_incoming_shipment = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const { dock_bay, remarks } = req.body;
    const userName = req.user?.name || 'Delivery Manager (Abhishek Sharma)';

    if (!order.incoming_truck_group) {
      order.incoming_truck_group = {};
    }

    order.incoming_truck_group.is_claimed = true;
    order.incoming_truck_group.claimed_at = new Date();
    order.incoming_truck_group.claimed_by_name = userName;
    if (dock_bay) order.incoming_truck_group.unloaded_dock = dock_bay;

    order.audit_trail.push({
      action: 'Incoming Consolidated Truck Consignment Claimed & Received',
      performed_by_name: userName,
      timestamp: new Date(),
      notes: `Materials unloaded from incoming vehicle ${order.incoming_truck_group.vehicle_number || 'Truck'} (Group: ${order.incoming_truck_group.group_id || 'N/A'}) at ${dock_bay || 'Receiving Dock'}. ${remarks || ''}`
    });

    await order.save();
    return res.status(200).json({
      status: 'success',
      message: `Shipment claimed & unloaded to warehouse dock successfully!`,
      data: order
    });
  } catch (error) {
    console.error('claim_incoming_shipment error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/send-for-delivery
 * Enabled ONLY when all materials for all items/EPCs are 100% inwarded.
 * Moves order to ready_for_dispatch (Out for Delivery tab) and alerts Account Manager.
 */
exports.send_for_delivery = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    // Check: All items must be 100% inwarded (pending_qty === 0)
    const totalPending = (order.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
    if (totalPending > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot send for delivery: ${totalPending} items are still pending inward. All materials must be 100% inwarded first.`
      });
    }

    order.delivery_status = 'ready_for_dispatch';
    order.sent_for_delivery_at = new Date();
    order.sent_for_delivery_by = req.user?.name || 'Delivery Manager (Abhishek Sharma)';

    // Update dispatch status of active EPCs
    if (order.epcs && order.epcs.length > 0) {
      order.epcs.forEach(epc => {
        (epc.items || []).forEach(it => {
          it.received_qty = it.ordered_qty;
          it.pending_qty = 0;
        });
        if (epc.dispatch_status === 'pending') {
          epc.dispatch_status = 'ready_for_dispatch';
        }
      });
    }

    order.audit_trail.push({
      action: 'Sent for Delivery - Moved to Out for Delivery Tab',
      performed_by_name: req.user?.name || 'Delivery Manager (Abhishek Sharma)',
      timestamp: new Date(),
      notes: `All materials 100% inwarded. Sent to Out for Delivery. Alert sent to Account Manager to verify 2nd half payment across all EPCs.`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: 'Order sent for delivery successfully! Moved to Out for Delivery tab and Account Manager notified.',
      data: order
    });
  } catch (error) {
    console.error('send_for_delivery error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/toggle-ungroup
 * Toggles ungrouped display of EPCs in Out for Delivery
 */
exports.toggle_ungroup = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    order.is_ungrouped = !order.is_ungrouped;
    await order.save();

    return res.status(200).json({
      status: 'success',
      message: order.is_ungrouped ? 'Order ungrouped by EPC successfully.' : 'Order grouped successfully.',
      is_ungrouped: order.is_ungrouped,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/account-remove-epc
 * Account Manager removes an unpaid EPC (2nd half payment not completed).
 * Removes EPC from the active delivery consignment.
 */
exports.account_remove_epc = async (req, res) => {
  try {
    const { epc_id, reason } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const epc = (order.epcs || []).find(e => e.epc_id === epc_id);
    if (!epc) {
      return res.status(404).json({ status: 'error', message: `EPC ${epc_id} not found in this order.` });
    }

    epc.is_removed_by_account = true;
    epc.removed_at = new Date();
    epc.removal_reason = reason || '2nd Half Payment Not Completed';

    order.audit_trail.push({
      action: 'EPC Removed from Consignment by Account Manager',
      performed_by_name: 'Account Manager (Rohan Verma)',
      timestamp: new Date(),
      notes: `EPC "${epc.epc_name}" removed from delivery order DO-${order.order_number} due to unpaid 2nd half payment. Reason: ${epc.removal_reason}`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `EPC "${epc.epc_name}" removed from this delivery order by Account Manager.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/verify-epc-payment
 * Verify/toggle 2nd payment status for an EPC (Account Manager)
 */
exports.verify_epc_payment = async (req, res) => {
  try {
    const { epc_id, payment_phase = 'second', status = 'done', amount } = req.body;
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const epc = (order.epcs || []).find(e => e.epc_id === epc_id);
    if (!epc) {
      return res.status(404).json({ status: 'error', message: `EPC ${epc_id} not found in this order.` });
    }

    if (payment_phase === 'first') {
      epc.payment_first_half.status = status;
      if (status === 'done') epc.payment_first_half.paid_at = new Date();
      if (amount) epc.payment_first_half.amount = amount;
    } else {
      epc.payment_second_half.status = status;
      if (status === 'done') {
        epc.payment_second_half.paid_at = new Date();
        epc.payment_second_half.verified_by = 'Account Manager';
        epc.is_removed_by_account = false;
      } else {
        epc.payment_second_half.paid_at = null;
      }
      if (amount) epc.payment_second_half.amount = amount;
    }

    order.audit_trail.push({
      action: `EPC ${payment_phase === 'first' ? '1st' : '2nd'} Half Payment ${status === 'done' ? 'Received & Confirmed' : 'Marked Pending'}`,
      performed_by_name: 'Account Manager (Rohan Verma)',
      timestamp: new Date(),
      notes: `Payment status for EPC "${epc.epc_name}" updated to "${status}".`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `Payment status for EPC "${epc.epc_name}" updated successfully to ${status}.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/dispatch-for-delivery
 * Dispatches the order if and ONLY if all active EPCs have both 1st & 2nd half payments completed.
 * Generates separate tracking consignments for each EPC and moves to Track Delivery.
 */
exports.dispatch_for_delivery = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const activeEpcs = (order.epcs || []).filter(e => !e.is_removed_by_account);
    if (activeEpcs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot dispatch order: No active EPCs remain in this order.'
      });
    }

    // STRICT CHECK: Every active EPC must have 2nd half payment done!
    const unpaidEpcs = activeEpcs.filter(e => e.payment_second_half?.status !== 'done');
    if (unpaidEpcs.length > 0) {
      const names = unpaidEpcs.map(e => e.epc_name).join(', ');
      return res.status(400).json({
        status: 'error',
        message: `Dispatch Blocked: The following EPC(s) have NOT completed the 2nd half payment: ${names}. Account Manager must remove them from the order or clear the payment before dispatch.`
      });
    }

    // Assign individual tracking consignment IDs to each active EPC
    activeEpcs.forEach((epc, idx) => {
      epc.dispatch_status = 'in_transit';
      if (!epc.tracking_consignment_id) {
        epc.tracking_consignment_id = `TRK-${order.order_number}-${epc.epc_id || (idx + 1)}`;
      }
    });

    order.delivery_status = 'in_transit';
    order.is_ungrouped = true; // Auto-ungroup so tracking is separate for all EPCs

    const { vehicle_rear_photo, docket_doc, notes } = req.body || {};
    if (vehicle_rear_photo) {
      order.dispatch_evidence.vehicle_rear_photo = vehicle_rear_photo;
    }
    if (docket_doc) {
      order.dispatch_evidence.docket_doc = docket_doc;
    }
    order.dispatch_evidence.dispatched_at = new Date();
    order.dispatch_evidence.dispatched_by_name = req.user?.name || 'Delivery Manager (Abhishek Sharma)';

    order.audit_trail.push({
      action: 'Consolidated Order Dispatched for Delivery',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Order dispatched with ${activeEpcs.length} cleared EPCs. All 2nd half payments verified. Tracking separated per EPC in Track Delivery. ${notes || ''}`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `Order successfully dispatched! All ${activeEpcs.length} EPCs moved to Track Delivery with individual tracking.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/inward-discrepancy
 * Records damaged / missing quantity during inwarding.
 * Strictly increments available stock ONLY by physically OK items (received - damaged).
 * Logs discrepancy record and marks accounts_notified = true.
 */
exports.record_inward_discrepancy = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const { sku, received_qty, damaged_qty, missing_qty, remarks } = req.body || {};
    const item = order.items.find(it => it.sku === sku);
    if (!item) {
      return res.status(404).json({ status: 'error', message: `SKU ${sku} not found in this order.` });
    }

    const recQty = Number(received_qty) || 0;
    const damQty = Number(damaged_qty) || 0;
    const misQty = Number(missing_qty) || 0;
    const okQty = Math.max(0, recQty - damQty);

    item.received_qty = (item.received_qty || 0) + okQty;
    item.pending_qty = Math.max(0, item.ordered_qty - item.received_qty);
    item.damaged_qty = (item.damaged_qty || 0) + damQty;
    item.missing_qty = (item.missing_qty || 0) + misQty;

    if (damQty > 0 || misQty > 0) {
      item.supply_status = 'inward_discrepancy';
    } else if (item.pending_qty === 0) {
      item.supply_status = 'inward_completed';
    }

    order.discrepancy_details = order.discrepancy_details || [];
    order.discrepancy_details.push({
      sku: item.sku,
      product_name: item.product_name,
      expected_qty: item.ordered_qty,
      received_qty: recQty,
      damaged_qty: damQty,
      missing_qty: misQty,
      remarks: remarks || 'Discrepancy logged during physical inward.',
      reported_at: new Date(),
      reported_by: req.user?.name || 'Delivery Manager',
      accounts_notified: true
    });

    const totalPending = order.items.reduce((acc, it) => acc + (it.pending_qty || 0), 0);
    if (damQty > 0 || misQty > 0) {
      order.kit_preparation_status = 'awaiting_components';
    } else if (totalPending === 0) {
      order.kit_preparation_status = 'ready_for_assembly';
    }

    order.audit_trail.push({
      action: damQty > 0 || misQty > 0 ? 'Inward Discrepancy Logged (Accounts Notified)' : 'Physical Inward Completed',
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `SKU ${item.sku}: Received=${recQty}, Damaged=${damQty}, Missing=${misQty}, Physically OK Added to Stock=${okQty}. ${remarks || ''}`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: damQty > 0 || misQty > 0
        ? `Inward discrepancy logged for ${item.sku}. Accounts team notified for debit note/replacement.`
        : `Inward verified successfully for ${item.sku}. Stock updated.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/supply-status
 * Updates supply status for a specific item (e.g. ready_for_pickup, picked_up, dispatched, in_transit).
 */
exports.update_supply_status = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const { sku, status, actual_date, notes } = req.body || {};
    const item = order.items.find(it => it.sku === sku);
    if (!item) {
      return res.status(404).json({ status: 'error', message: `SKU ${sku} not found in this order.` });
    }

    item.supply_status = status;
    if (status === 'picked_up' && actual_date) {
      item.actual_pickup_date = new Date(actual_date);
    }
    if (status === 'dispatched' && actual_date) {
      item.actual_dispatch_date = new Date(actual_date);
    }
    if (status === 'inward_completed') {
      item.actual_inward_date = new Date();
    }

    order.audit_trail.push({
      action: `Supply Status Updated for ${item.sku}`,
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Status changed to "${status}". ${notes || ''}`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `Supply status for ${item.sku} updated to ${status}.`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /warehouse-api/delivery-orders/:id/kit-assembly
 * Manages the BOSKIT preparation lifecycle:
 * - 'picked': Picking of components completed
 * - 'assembled': Kit assembled and wiring/connectors joined
 * - 'qc_verified': Quality and completeness verified
 * - 'packed_and_labeled': Packaged with SolarKits barcode label
 * - 'mark_kit_ready': Validates 100% completeness and marks kit ready for dispatch
 */
exports.update_kit_assembly = async (req, res) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Delivery order not found.' });
    }

    const { stage, kit_serial_barcode, notes } = req.body || {};
    order.kit_assembly_details = order.kit_assembly_details || {};

    // 1. Picking -> Assembly Station
    if (stage === 'picked' || stage === 'in_assembly') {
      order.kit_assembly_details.picked_at = order.kit_assembly_details.picked_at || new Date();
      order.kit_assembly_details.picked_by = order.kit_assembly_details.picked_by || (req.user?.name || 'Delivery Manager');
      order.kit_assembly_details.assembly_status = order.kit_assembly_details.assembly_status === 'completed' ? 'completed' : 'in_progress';
      order.kit_preparation_status = 'in_assembly';
    }
    // 2. Assembly Station Completed
    else if (stage === 'assembled') {
      order.kit_assembly_details.picked_at = order.kit_assembly_details.picked_at || new Date();
      order.kit_assembly_details.assembled_at = new Date();
      order.kit_assembly_details.assembled_by = req.user?.name || 'Delivery Manager';
      order.kit_assembly_details.assembly_status = 'completed';
      order.kit_preparation_status = 'in_assembly';
    }
    // 3. QC Inspection Passed
    else if (stage === 'qc_verified' || stage === 'quality_check') {
      order.kit_assembly_details.assembled_at = order.kit_assembly_details.assembled_at || new Date();
      order.kit_assembly_details.assembly_status = 'completed';
      order.kit_assembly_details.qc_verified = true;
      order.kit_assembly_details.qc_status = 'passed';
      order.kit_assembly_details.qc_verified_by = req.user?.name || 'QC Inspector (Ramesh Shinde)';
      order.kit_preparation_status = 'in_assembly';
    }
    // 4. Packaging & Barcode Label
    else if (stage === 'packed_and_labeled' || stage === 'packed') {
      order.kit_assembly_details.qc_verified = true;
      order.kit_assembly_details.qc_status = 'passed';
      order.kit_assembly_details.packed_and_labeled = true;
      order.kit_assembly_details.packed_at = new Date();
      order.kit_assembly_details.kit_serial_barcode = kit_serial_barcode || order.kit_assembly_details.kit_serial_barcode || `SK-KIT-${order.order_number}-${Date.now().toString().slice(-4)}`;
      order.kit_preparation_status = 'in_assembly';
    }
    // 5. Final Dispatch Staging / Kit Ready
    else if (stage === 'mark_kit_ready' || stage === 'kit_ready') {
      const missingItems = order.items.filter(it => {
        const pending = it.pending_qty || 0;
        const allocated = it.allocated_stock || 0;
        return Math.max(0, pending - allocated) > 0;
      });
      if (missingItems.length > 0) {
        order.kit_preparation_status = 'awaiting_components';
        return res.status(400).json({
          status: 'error',
          message: `Cannot mark kit ready: ${missingItems.length} component(s) still have unallocated shortages.`
        });
      }
      order.kit_assembly_details.qc_verified = true;
      order.kit_assembly_details.qc_status = 'passed';
      order.kit_assembly_details.packed_and_labeled = true;
      order.kit_assembly_details.kit_serial_barcode = kit_serial_barcode || order.kit_assembly_details.kit_serial_barcode || `SK-KIT-${order.order_number}-${Date.now().toString().slice(-4)}`;
      order.kit_preparation_status = 'kit_ready';
    }

    order.audit_trail.push({
      action: `BOSKIT Assembly Stage: ${stage}`,
      performed_by_name: req.user?.name || 'Delivery Manager',
      timestamp: new Date(),
      notes: `Kit preparation updated: ${stage}. ${notes || ''}`
    });

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: `BOSKIT preparation successfully updated to stage "${stage}".`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};


