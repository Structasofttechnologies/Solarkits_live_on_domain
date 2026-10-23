require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const { PurchaseIndent, ProcurementGroup } = require('../src/modules/account-panel/models/company_warehouse_db');

  const pg = await ProcurementGroup.findOne({ group_id: 'PG-2026-0002' });
  if (!pg) {
    console.log('PG-2026-0002 not found');
    process.exit(1);
  }

  const existingPIs = await PurchaseIndent.find({ order_group_id: 'PG-2026-0002' });
  console.log(`Existing PIs for PG-2026-0002: ${existingPIs.map(p => p.pi_number)}`);

  const hasInverterPI = existingPIs.some(p => p.bom_sku_code === 'HAV-STR-5KW' || p.component_type === 'inverter');
  const hasBosPI = existingPIs.some(p => p.bom_sku_code === 'BOS-KIT-COMPLETE' || p.component_type === 'bos');

  const sourceOrder = pg.source_orders?.[0] || {};
  const warehouseId = sourceOrder.warehouse_id ? new mongoose.Types.ObjectId(sourceOrder.warehouse_id) : new mongoose.Types.ObjectId("6a7d545ccea1dec404aefe04");
  const customerOrderId = sourceOrder.id ? new mongoose.Types.ObjectId(sourceOrder.id) : new mongoose.Types.ObjectId();
  const customerOrderNum = sourceOrder.order_number || "ORD-EPC-20261023-2680";

  if (!hasInverterPI) {
    const year = new Date().getFullYear();
    const count = await PurchaseIndent.countDocuments({});
    const piNumber = `PI-${year}-${String(count + 1).padStart(5, '0')}`;

    const qty = 25;
    const rate = 32000;
    const subtotal = qty * rate;
    const gstRate = 13.8;
    const tax = Math.round((subtotal * gstRate) / 100);
    const totalPiValue = subtotal + tax;
    const advAmount = Math.round(totalPiValue * 0.3);
    const balAmount = totalPiValue - advAmount;

    const inverterPI = new PurchaseIndent({
      pi_number: piNumber,
      customer_order_id: customerOrderId,
      customer_order_number: customerOrderNum,
      order_group_id: 'PG-2026-0002',
      bom_sku_code: 'HAV-STR-5KW',
      component_type: 'inverter',
      supplier_id: new mongoose.Types.ObjectId('6adaf10d508fef1603c9da2f'),
      supplier_name: 'Supplier B (PowerTech Inverters)',
      supplier_brand: 'PowerTech Inverters',
      is_oem_partner: false,
      destination_warehouse_id: warehouseId,
      destination_warehouse_name: 'WH-IND-GJ-001',
      items: [{
        sku_id: null,
        sku_code: 'HAV-STR-5KW',
        product_name: 'Solar Inverter 5kW/10kW String Inverter',
        parent_sku_code: 'HAV-STR-5KW',
        component_type: 'inverter',
        quantity: qty,
        unit_rate: rate,
        gst_rate: gstRate,
        tax_amount: tax,
        total_value: totalPiValue
      }],
      total_pi_value: totalPiValue,
      is_above_benchmark: false,
      benchmark_cost: rate,
      requires_admin_approval: false,
      po_approval: {
        status: 'approved',
        approved_by_name: 'System',
        approved_at: new Date(),
        remarks: 'Auto-approved within standard benchmark cost',
        submitted_at: new Date()
      },
      fulfilment: {
        method: 'Supplier Delivery',
        supplier_warehouse_address: 'PowerTech Works, Ahmedabad',
        destination_warehouse_id: warehouseId,
        transport_responsibility: 'Supplier',
        transport_cost: 0,
        expected_dispatch_date: new Date(Date.now() + 3*24*3600*1000),
        expected_inward_date: new Date(Date.now() + 5*24*3600*1000),
        supply_status: 'Pending'
      },
      payment: {
        payment_terms: '30% Advance, 70% Before Dispatch',
        advance_percentage: 30,
        advance_amount: advAmount,
        balance_percentage: 70,
        balance_amount: balAmount,
        payment_status: 'PI Submitted',
        total_paid_amount: 0,
        balance_due: totalPiValue,
        advance_approval: { status: 'approved' },
        admin_approval: { status: 'approved', remarks: 'Auto-approved within benchmark cost' }
      },
      pi_status: 'Submitted'
    });

    await inverterPI.save();
    console.log(`Created Inverter PI: ${piNumber} (Supplier B - ₹${totalPiValue.toLocaleString('en-IN')})`);
  }

  if (!hasBosPI) {
    const year = new Date().getFullYear();
    const count = await PurchaseIndent.countDocuments({});
    const piNumber = `PI-${year}-${String(count + 1).padStart(5, '0')}`;

    const qty = 25;
    const rate = 30000;
    const subtotal = qty * rate;
    const gstRate = 13.8;
    const tax = Math.round((subtotal * gstRate) / 100);
    const totalPiValue = subtotal + tax;
    const advAmount = Math.round(totalPiValue * 0.3);
    const balAmount = totalPiValue - advAmount;

    const bosPI = new PurchaseIndent({
      pi_number: piNumber,
      customer_order_id: customerOrderId,
      customer_order_number: customerOrderNum,
      order_group_id: 'PG-2026-0002',
      bom_sku_code: 'BOS-KIT-COMPLETE',
      component_type: 'bos',
      supplier_id: new mongoose.Types.ObjectId('6adaf10d508fef1603c9da2d'),
      supplier_name: 'Supplier A (Structural Metals Ltd)',
      supplier_brand: 'Structural Metals Ltd',
      is_oem_partner: false,
      destination_warehouse_id: warehouseId,
      destination_warehouse_name: 'WH-IND-GJ-001',
      items: [{
        sku_id: null,
        sku_code: 'BOS-KIT-COMPLETE',
        product_name: 'Complete Balance of System (BOS) Kit',
        parent_sku_code: 'BOS-KIT-COMPLETE',
        component_type: 'bos',
        quantity: qty,
        unit_rate: rate,
        gst_rate: gstRate,
        tax_amount: tax,
        total_value: totalPiValue
      }],
      total_pi_value: totalPiValue,
      is_above_benchmark: false,
      benchmark_cost: rate,
      requires_admin_approval: false,
      po_approval: {
        status: 'approved',
        approved_by_name: 'System',
        approved_at: new Date(),
        remarks: 'Auto-approved within standard benchmark cost',
        submitted_at: new Date()
      },
      fulfilment: {
        method: 'Supplier Delivery',
        supplier_warehouse_address: 'Structural Metals Works, Rajkot',
        destination_warehouse_id: warehouseId,
        transport_responsibility: 'Supplier',
        transport_cost: 0,
        expected_dispatch_date: new Date(Date.now() + 3*24*3600*1000),
        expected_inward_date: new Date(Date.now() + 5*24*3600*1000),
        supply_status: 'Pending'
      },
      payment: {
        payment_terms: '30% Advance, 70% Before Dispatch',
        advance_percentage: 30,
        advance_amount: advAmount,
        balance_percentage: 70,
        balance_amount: balAmount,
        payment_status: 'PI Submitted',
        total_paid_amount: 0,
        balance_due: totalPiValue,
        advance_approval: { status: 'approved' },
        admin_approval: { status: 'approved', remarks: 'Auto-approved within benchmark cost' }
      },
      pi_status: 'Submitted'
    });

    await bosPI.save();
    console.log(`Created BOS Kit PI: ${piNumber} (Supplier A - ₹${totalPiValue.toLocaleString('en-IN')})`);
  }

  const finalPIs = await PurchaseIndent.find({ order_group_id: 'PG-2026-0002' });
  console.log(`Final count of PIs for PG-2026-0002: ${finalPIs.length}`);
  finalPIs.forEach(p => console.log(`- ${p.pi_number} | ${p.supplier_name} | ${p.items?.[0]?.product_name} | Val: ₹${p.total_pi_value}`));

  process.exit(0);
}

run();
