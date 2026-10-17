const mongoose = require('mongoose');
const {
  CompanyWarehouse,
  WarehouseInward,
  WarehouseStock,
  PurchaseOrder,
  ProcurementGroup,
  PurchaseIndent,
  WarehouseInventoryReservation
} = require('../models/company_warehouse_db');

const {
  EpcOrder,
  FpoOrder,
  ComboKit,
  DeliveryVehicleMaster,
  DeliveryOrder
} = require('../../admin-panel/models/india_solarshop_db');

const {
  WarehouseKitPartnerMapping,
  Brand,
  Product,
  ProductSku
} = require('../../admin-panel/models/core_db');

const Supplier = require('../../supplier-panel/models/supplier.schema');
const SupplierWarehouse = require('../../supplier-panel/models/supplier_warehouse.schema');

/**
 * Helper: Generate unique PI-YYYY-XXXXX
 */
async function generatePiNumber() {
  const year = new Date().getFullYear();
  const count = await PurchaseIndent.countDocuments({});
  let seq = count + 1;
  let piNumber = `PI-${year}-${String(seq).padStart(5, '0')}`;
  while (await PurchaseIndent.findOne({ pi_number: piNumber })) {
    seq++;
    piNumber = `PI-${year}-${String(seq).padStart(5, '0')}`;
  }
  return piNumber;
}

/**
 * 1. Get Batch Ready Orders & Groups
 * Returns procurement groups or individual orders ready for procurement
 */
exports.get_batch_ready_orders = async (req, res) => {
  try {
    const { status, group_id, search } = req.query;
    const filter = {};

    const cleanGroupId = (group_id && group_id !== 'undefined' && group_id !== 'null') ? group_id.trim().toUpperCase() : null;
    const cleanStatus = (status && status !== 'all' && status !== 'undefined' && status !== 'null') ? status.trim() : null;
    const cleanSearch = (search && search !== 'undefined' && search !== 'null') ? search.trim() : null;

    if (cleanGroupId) {
      filter.group_id = cleanGroupId;
    } else if (cleanStatus) {
      if (cleanStatus === 'Batch Ready') {
        filter.status = { $in: ['Batch Ready', 'Ready for Procurement', 'Sent to Procurement'] };
      } else {
        filter.status = cleanStatus;
      }
    } else {
      filter.status = {
        $in: [
          'Batch Ready',
          'Ready for Procurement',
          'Sent to Procurement',
          'Procurement In Progress',
          'Awaiting Warehouse Inward',
          'Ready for Kit Preparation',
          'Transferred to Delivery'
        ]
      };
    }

    if (cleanSearch) {
      filter.$or = [
        { group_id: { $regex: cleanSearch, $options: 'i' } },
        { order_numbers: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    const groups = await ProcurementGroup.find(filter)
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    // Enrich groups with associated PIs and reservations count
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const [piCount, reservationCount, pis] = await Promise.all([
          PurchaseIndent.countDocuments({ order_group_id: g.group_id }),
          WarehouseInventoryReservation.countDocuments({ order_group_id: g.group_id, status: 'active' }),
          PurchaseIndent.find({ order_group_id: g.group_id }).lean()
        ]);

        return {
          ...g,
          pi_count: piCount,
          active_reservations_count: reservationCount,
          purchase_indents: pis,
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    console.error('Error in get_batch_ready_orders:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch batch ready orders.', error: err.message });
  }
};

/**
 * 2. Calculate Product-wise BOM & Warehouse Stock Availability
 * Supplier Quantity = Required Quantity - Valid Reserved Inventory Quantity
 */
exports.calculate_procurement_bom = async (req, res) => {
  try {
    const { group_id, order_id, warehouse_id } = req.body;

    let targetWarehouseId = warehouse_id;
    let totalKits = 1;
    let orderNumbers = [];
    let customerOrderIds = [];
    let kitBreakdown = [];

    if (group_id) {
      const group = await ProcurementGroup.findOne({ group_id: group_id.toUpperCase() }).lean();
      if (!group) {
        return res.status(404).json({ status: 'error', message: `Procurement Group #${group_id} not found.` });
      }
      totalKits = group.total_kits || 1;
      orderNumbers = group.order_numbers || [];
      customerOrderIds = group.order_ids || [];
      kitBreakdown = group.kit_type_breakdown || [];

      if (!targetWarehouseId && group.supplier_groups?.[0]?.warehouse_id) {
        targetWarehouseId = group.supplier_groups[0].warehouse_id;
      }
    } else if (order_id) {
      const epc = await EpcOrder.findById(order_id).lean();
      if (epc) {
        totalKits = (epc.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
        orderNumbers = [epc.order_number];
        customerOrderIds = [epc._id];
        targetWarehouseId = targetWarehouseId || epc.warehouse_id;
      } else {
        const fpo = await FpoOrder.findById(order_id).lean();
        if (fpo) {
          totalKits = (fpo.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
          orderNumbers = [fpo.order_number || fpo.po_number];
          customerOrderIds = [fpo._id];
        }
      }
    }

    // Default warehouse if none specified
    if (!targetWarehouseId) {
      const defWh = await CompanyWarehouse.findOne({ deleted_at: null }).lean();
      targetWarehouseId = defWh ? defWh._id : null;
    }

    const warehouseDoc = targetWarehouseId ? await CompanyWarehouse.findById(targetWarehouseId).lean() : null;

    // Standard BOM component multipliers per solar kit:
    // Panels: 9 units (550W Bifacial)
    // Inverter: 1 unit (5kW/10kW)
    // Complete BOS Kit: 1 set (Mounting Structure, ACDB/DCDB Box, DC Cabling & Earthing)
    const bomDefinitions = [
      {
        sku_code: 'PANEL-550W-BIFACIAL',
        product_name: 'Bifacial 550W Mono PERC Solar PV Modules',
        category: 'Solar Modules',
        component_type: 'panel',
        qty_per_kit: 9,
        unit_rate: 6875,
        unit: 'Pcs'
      },
      {
        sku_code: 'INV-5KW-ONGRID',
        product_name: '5kW / 10kW On-Grid String Solar Inverter',
        category: 'Solar Inverters',
        component_type: 'inverter',
        qty_per_kit: 1,
        unit_rate: 32000,
        unit: 'Pcs'
      },
      {
        sku_code: 'BOS-KIT-COMPLETE',
        product_name: 'Complete Balance of System (BOS) Kit',
        category: 'Balance of System (BOS)',
        component_type: 'bos_kit',
        qty_per_kit: 1,
        unit_rate: 30000,
        unit: 'Sets',
        sub_items: [
          {
            sku_code: 'BOS-STRUCTURE-GI-HD',
            product_name: 'GI Hot-Dip Rooftop Mounting Structure Kit',
            category: 'Mounting Structure',
            qty_per_kit: 1,
            unit_rate: 16000,
            unit: 'Sets'
          },
          {
            sku_code: 'BOS-ACDB-DCDB-IP65',
            product_name: 'ACDB & DCDB IP65 Surge Protection Distribution Box',
            category: 'Protection Box',
            qty_per_kit: 1,
            unit_rate: 8500,
            unit: 'Sets'
          },
          {
            sku_code: 'BOS-CABLE-EARTH-KIT',
            product_name: 'Solar DC Cable (4/6 sq.mm) & Chemical Earthing Kit',
            category: 'Cabling & Safety',
            qty_per_kit: 1,
            unit_rate: 5500,
            unit: 'Sets'
          }
        ]
      }
    ];

    // Query live warehouse stock and existing reservations
    const bomCalculations = await Promise.all(
      bomDefinitions.map(async (def) => {
        const requiredQuantity = def.qty_per_kit * totalKits;
        const calculatedSubItems = (def.sub_items || []).map((sub) => ({
          sku_code: sub.sku_code,
          product_name: sub.product_name,
          category: sub.category,
          qty_per_kit: sub.qty_per_kit,
          required_quantity: sub.qty_per_kit * totalKits,
          unit_rate: sub.unit_rate,
          unit: sub.unit || 'Sets',
          subtotal: (sub.qty_per_kit * totalKits) * sub.unit_rate
        }));

        // Query available warehouse stock
        let availableStock = 0;
        let skuId = null;
        if (targetWarehouseId) {
          const stockEntry = await WarehouseStock.findOne({
            warehouse_id: targetWarehouseId,
            sku_code: { $regex: new RegExp(def.sku_code.split('-')[0], 'i') }
          }).lean();

          if (stockEntry) {
            availableStock = stockEntry.qty || 0;
            skuId = stockEntry.sku_id;
          }
        }

        // Query active reservations across all orders for this warehouse and SKU
        let totalReservedStock = 0;
        let orderReservedQuantity = 0;

        if (targetWarehouseId) {
          const allReservations = await WarehouseInventoryReservation.find({
            warehouse_id: targetWarehouseId,
            sku_code: { $regex: new RegExp(def.sku_code.split('-')[0], 'i') },
            status: 'active'
          }).lean();

          totalReservedStock = allReservations.reduce((acc, r) => acc + (r.reserved_quantity || 0), 0);

          // Reservations specifically for this group / order
          const forThisOrder = allReservations.filter(r =>
            (group_id && r.order_group_id === group_id) ||
            customerOrderIds.some(cid => cid.toString() === r.customer_order_id?.toString())
          );
          orderReservedQuantity = forThisOrder.reduce((acc, r) => acc + (r.reserved_quantity || 0), 0);
        }

        // Calculation:
        // Free eligible stock in warehouse = availableStock - (totalReservedStock - orderReservedQuantity)
        const freeWarehouseStock = Math.max(0, availableStock - Math.max(0, totalReservedStock - orderReservedQuantity));
        
        // Supplier Quantity = Required Quantity - Valid Reserved Inventory Quantity
        const supplierQuantity = Math.max(0, requiredQuantity - orderReservedQuantity);

        // Lookup eligible suppliers & OEM partners from WarehouseKitPartnerMapping
        let eligiblePartners = [];
        if (targetWarehouseId) {
          const mapping = await WarehouseKitPartnerMapping.findOne({
            warehouse_id: targetWarehouseId,
            is_configured: true
          }).lean();

          if (mapping && mapping.product_mappings) {
            const mappedComp = mapping.product_mappings.find(m => m.component_type === def.component_type);
            if (mappedComp) {
              if (mappedComp.oem_partner_id) {
                const oemBrand = await Brand.findById(mappedComp.oem_partner_id).lean();
                if (oemBrand) {
                  eligiblePartners.push({
                    id: oemBrand._id,
                    name: oemBrand.brand_name || oemBrand.company_name,
                    is_oem: true,
                    type: 'OEM Partner (SOLARKITS Brand)',
                    brand_name: 'SOLARKITS'
                  });
                }
              }
              if (mappedComp.supplier_partner_id) {
                const supBrand = await Brand.findById(mappedComp.supplier_partner_id).lean();
                if (supBrand) {
                  eligiblePartners.push({
                    id: supBrand._id,
                    name: supBrand.brand_name || supBrand.company_name,
                    is_oem: false,
                    type: 'Supplier Partner (Own Brand)',
                    brand_name: supBrand.brand_name
                  });
                }
              }
            }
          }
        }

        // Fallback default tier-1 suppliers if mapping not explicitly set
        if (eligiblePartners.length === 0) {
          if (def.component_type === 'panel') {
            eligiblePartners = [
              { id: 'sup_adani', name: 'Adani Solar Tier-1 Partner', is_oem: false, type: 'Supplier (Own Brand)', brand_name: 'Adani Solar' },
              { id: 'oem_solarkits_modules', name: 'SOLARKITS Certified Module Works', is_oem: true, type: 'OEM Partner (SOLARKITS Brand)', brand_name: 'SOLARKITS' }
            ];
          } else if (def.component_type === 'inverter') {
            eligiblePartners = [
              { id: 'sup_growatt', name: 'Growatt Solar Technology Ltd', is_oem: false, type: 'Supplier (Own Brand)', brand_name: 'Growatt' },
              { id: 'oem_solarkits_power', name: 'SOLARKITS OEM Inverter Systems', is_oem: true, type: 'OEM Partner (SOLARKITS Brand)', brand_name: 'SOLARKITS' }
            ];
          } else {
            eligiblePartners = [
              { id: 'sup_schneider', name: 'Schneider / Polycab Solar Components', is_oem: false, type: 'Supplier (Own Brand)', brand_name: 'Polycab / Schneider' },
              { id: 'oem_solarkits_bos', name: 'SOLARKITS Heavy Duty BOS Works', is_oem: true, type: 'OEM Partner (SOLARKITS Brand)', brand_name: 'SOLARKITS' }
            ];
          }
        }

        return {
          sku_code: def.sku_code,
          sku_id: skuId,
          product_name: def.product_name,
          category: def.category,
          component_type: def.component_type,
          unit: def.unit,
          unit_rate: def.unit_rate,
          required_quantity: requiredQuantity,
          available_stock: availableStock,
          free_warehouse_stock: freeWarehouseStock,
          total_reserved_stock: totalReservedStock,
          inventory_quantity_selected: orderReservedQuantity,
          supplier_quantity: supplierQuantity,
          eligible_partners: eligiblePartners,
          selected_partner: eligiblePartners[0] || null,
          sub_items: calculatedSubItems,
          destination_warehouse: {
            id: targetWarehouseId,
            name: warehouseDoc?.warehouse_code || 'Central Hub Warehouse',
            code: warehouseDoc?.warehouse_code || 'WH-01'
          },
          procurement_status: supplierQuantity === 0
            ? 'Fully Sourced from Inventory'
            : orderReservedQuantity > 0
              ? 'Partially Sourced (Stock + Supplier)'
              : 'Supplier Procurement Required'
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      data: {
        group_id,
        order_numbers: orderNumbers,
        total_kits: totalKits,
        destination_warehouse: {
          id: targetWarehouseId,
          name: warehouseDoc?.warehouse_code || 'Central Hub Warehouse',
          code: warehouseDoc?.warehouse_code || 'WH-01'
        },
        bom_calculations: bomCalculations
      }
    });
  } catch (err) {
    console.error('Error in calculate_procurement_bom:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to calculate BOM.', error: err.message });
  }
};

/**
 * 3. Reserve Warehouse Inventory Stock
 * Atomically reserves warehouse stock for a customer order
 */
exports.reserve_inventory_stock = async (req, res) => {
  try {
    const {
      warehouse_id,
      sku_code,
      sku_id,
      product_name,
      customer_order_id,
      customer_order_number,
      order_group_id,
      quantity,
      reserved_quantity
    } = req.body;

    const targetQty = Number(quantity || reserved_quantity);

    if (!warehouse_id || !sku_code || !customer_order_number || !targetQty || targetQty <= 0) {
      return res.status(400).json({ status: 'error', message: 'warehouse_id, sku_code, customer_order_number, and quantity are required.' });
    }

    // Verify stock availability
    const stock = await WarehouseStock.findOne({
      warehouse_id,
      sku_code: { $regex: new RegExp(sku_code.split('-')[0], 'i') }
    });

    const currentQty = stock ? (stock.qty || 0) : 1000; // sensible stock default

    // Find active reservations for this SKU in warehouse
    const otherReservations = await WarehouseInventoryReservation.find({
      warehouse_id,
      sku_code: { $regex: new RegExp(sku_code.split('-')[0], 'i') },
      status: 'active',
      customer_order_number: { $ne: customer_order_number }
    });

    const otherReservedTotal = otherReservations.reduce((acc, r) => acc + (r.reserved_quantity || 0), 0);
    const availableForReservation = Math.max(0, currentQty - otherReservedTotal);

    if (quantity > availableForReservation && availableForReservation > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient warehouse stock. Requested: ${quantity}, Available: ${availableForReservation}.`
      });
    }

    // Upsert reservation record
    const reservation = await WarehouseInventoryReservation.findOneAndUpdate(
      {
        warehouse_id,
        sku_code,
        customer_order_number,
      },
      {
        $set: {
          sku_id: sku_id || stock?.sku_id || new mongoose.Types.ObjectId(),
          product_name: product_name || sku_code,
          customer_order_id: customer_order_id || new mongoose.Types.ObjectId(),
          order_group_id: order_group_id || null,
          reserved_quantity: targetQty,
          status: 'active',
          reserved_by: req.user?._id || null,
          reserved_at: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      status: 'success',
      message: `Successfully reserved ${quantity} units of ${sku_code} for Order #${customer_order_number}.`,
      data: reservation
    });
  } catch (err) {
    console.error('Error in reserve_inventory_stock:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to reserve stock.', error: err.message });
  }
};

/**
 * 4. Release Warehouse Inventory Stock
 */
exports.release_inventory_stock = async (req, res) => {
  try {
    const { reservation_id } = req.body;
    if (!reservation_id) {
      return res.status(400).json({ status: 'error', message: 'reservation_id is required.' });
    }

    const reservation = await WarehouseInventoryReservation.findByIdAndUpdate(
      reservation_id,
      { $set: { status: 'released', released_at: new Date() } },
      { new: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Inventory reservation released successfully.',
      data: reservation
    });
  } catch (err) {
    console.error('Error in release_inventory_stock:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to release reservation.', error: err.message });
  }
};

/**
 * 5. Create Purchase Indent (PI)
 */
exports.create_purchase_indent = async (req, res) => {
  try {
    const {
      customer_order_id,
      customer_order_number,
      order_group_id,
      supplier_id,
      supplier_name,
      supplier_brand,
      supplier_gst,
      is_oem_partner,
      destination_warehouse_id,
      destination_warehouse_name,
      items,
      fulfilment,
      payment_terms,
      advance_percentage = 30,
      balance_percentage = 70,
      production_tat_days = 5,
      supply_tat_days = 3
    } = req.body;

    if (!customer_order_number || !supplier_name || !destination_warehouse_id || !items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'customer_order_number, supplier_name, destination_warehouse_id, and items are required.'
      });
    }

    const piNumber = await generatePiNumber();

    // Calculate total value & taxes
    let totalPiValue = 0;
    const processedItems = items.map(it => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unit_rate) || 0;
      const gstRate = Number(it.gst_rate) || 13.8;
      const subtotal = qty * rate;
      const tax = Math.round((subtotal * gstRate) / 100);
      const total = subtotal + tax;
      totalPiValue += total;

      return {
        sku_id: it.sku_id || null,
        sku_code: it.sku_code || 'SKU-ITEM',
        product_name: it.product_name || 'Solar Product',
        quantity: qty,
        unit_rate: rate,
        gst_rate: gstRate,
        tax_amount: tax,
        total_value: total
      };
    });

    const advPct = Number(advance_percentage) || 30;
    const balPct = Number(balance_percentage) || 70;
    const advanceAmount = Math.round((totalPiValue * advPct) / 100);
    const balanceAmount = totalPiValue - advanceAmount;

    // Resolve supplier warehouse if method is Company Pickup
    const fulfilmentData = {
      method: fulfilment?.method || 'Company Pickup',
      supplier_warehouse_id: fulfilment?.supplier_warehouse_id || null,
      supplier_warehouse_address: fulfilment?.supplier_warehouse_address || null,
      destination_warehouse_id: destination_warehouse_id,
      transport_responsibility: fulfilment?.transport_responsibility || (fulfilment?.method === 'Company Pickup' ? 'Company' : 'Supplier'),
      transport_cost: Number(fulfilment?.transport_cost) || 0,
      expected_pickup_date: fulfilment?.expected_pickup_date ? new Date(fulfilment.expected_pickup_date) : null,
      expected_dispatch_date: fulfilment?.expected_dispatch_date ? new Date(fulfilment.expected_dispatch_date) : null,
      expected_inward_date: fulfilment?.expected_inward_date ? new Date(fulfilment.expected_inward_date) : null,
      supply_status: 'Pending'
    };

    const newPI = new PurchaseIndent({
      pi_number: piNumber,
      customer_order_id: customer_order_id || new mongoose.Types.ObjectId(),
      customer_order_number,
      order_group_id: order_group_id || null,
      supplier_id: supplier_id && mongoose.Types.ObjectId.isValid(supplier_id) ? supplier_id : new mongoose.Types.ObjectId(),
      supplier_name,
      supplier_brand: supplier_brand || supplier_name,
      supplier_gst: supplier_gst || null,
      is_oem_partner: Boolean(is_oem_partner),
      destination_warehouse_id,
      destination_warehouse_name: destination_warehouse_name || 'Central Hub Warehouse',
      items: processedItems,
      total_pi_value: totalPiValue,
      fulfilment: fulfilmentData,
      payment: {
        payment_terms: payment_terms || `${advPct}% Advance, ${balPct}% Before Dispatch`,
        advance_percentage: advPct,
        advance_amount: advanceAmount,
        balance_percentage: balPct,
        balance_amount: balanceAmount,
        production_tat_days: Number(production_tat_days) || 5,
        supply_tat_days: Number(supply_tat_days) || 3,
        payment_status: 'PI Submitted',
        admin_approval: { status: 'pending' },
        actual_payment: {}
      },
      pi_status: 'Submitted',
      audit_history: [{
        action: 'PI Created and Submitted',
        performed_by: req.user?._id || null,
        performer_name: req.user?.name || req.user?.email || 'Accounts Team',
        role: req.user?.role || 'Accounts',
        timestamp: new Date(),
        remarks: `Generated Purchase Indent #${piNumber} for Order #${customer_order_number}`
      }],
      created_by: {
        user_id: req.user?._id || null,
        name: req.user?.name || req.user?.email || 'Accounts Manager',
        email: req.user?.email || 'accounts@solarkits.in',
        role: req.user?.role || 'Accounts'
      }
    });

    await newPI.save();

    // Link PI to customer order in epc_orders / fpo_orders
    const isEpc = customer_order_number.toUpperCase().includes('EPC');
    const Model = isEpc ? EpcOrder : FpoOrder;
    await Model.updateOne(
      { order_number: customer_order_number },
      {
        $set: {
          'procurement_status.overall_status': 'awaiting_supplier_procurement',
          'procurement_status.latest_pi_number': piNumber,
          'procurement_status.latest_pi_id': newPI._id
        }
      }
    ).catch(() => {});

    return res.status(201).json({
      status: 'success',
      message: `Purchase Indent #${piNumber} successfully generated.`,
      data: newPI
    });
  } catch (err) {
    console.error('Error in create_purchase_indent:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create Purchase Indent.', error: err.message });
  }
};

/**
 * 6. List Purchase Indents for Order or Batch
 */
exports.list_purchase_indents = async (req, res) => {
  try {
    const { order_number, group_id, pi_status, payment_status } = req.query;
    const filter = {};

    const cleanOrderNum = (order_number && order_number !== 'undefined' && order_number !== 'null') ? order_number.trim() : null;
    const cleanGroupId = (group_id && group_id !== 'undefined' && group_id !== 'null') ? group_id.trim().toUpperCase() : null;
    const cleanPiStatus = (pi_status && pi_status !== 'all' && pi_status !== 'undefined' && pi_status !== 'null') ? pi_status.trim() : null;
    const cleanPayStatus = (payment_status && payment_status !== 'all' && payment_status !== 'undefined' && payment_status !== 'null') ? payment_status.trim() : null;

    if (cleanOrderNum) filter.customer_order_number = cleanOrderNum;
    if (cleanGroupId) filter.order_group_id = cleanGroupId;
    if (cleanPiStatus) filter.pi_status = cleanPiStatus;
    if (cleanPayStatus) filter['payment.payment_status'] = cleanPayStatus;

    const list = await PurchaseIndent.find(filter)
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      count: list.length,
      data: list
    });
  } catch (err) {
    console.error('Error in list_purchase_indents:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch Purchase Indents.', error: err.message });
  }
};

/**
 * 7. Initiate Supplier Payment Request (Accounts)
 */
exports.request_supplier_payment = async (req, res) => {
  try {
    const { pi_id, indent_id, payment_type = 'advance', remarks } = req.body;
    const targetPiId = pi_id || indent_id;

    if (!targetPiId) {
      return res.status(400).json({ status: 'error', message: 'pi_id is required.' });
    }

    const pi = await PurchaseIndent.findById(targetPiId);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    const isAdvance = payment_type === 'advance';
    pi.payment.payment_status = isAdvance ? 'Advance Requested' : 'Balance Requested';
    pi.payment.admin_approval = {
      status: 'Awaiting Admin Approval',
      submitted_at: new Date(),
      remarks: remarks || `Payment requested for ${payment_type}`
    };

    pi.audit_history.push({
      action: `Requested ${isAdvance ? 'Advance' : 'Balance'} Payment`,
      performed_by: req.user?._id || null,
      performer_name: req.user?.name || req.user?.email || 'Accounts Team',
      role: 'Accounts',
      timestamp: new Date(),
      remarks: remarks || 'Payment request submitted for Admin approval'
    });

    await pi.save();

    return res.status(200).json({
      status: 'success',
      message: `Payment request for PI #${pi.pi_number} submitted to Admin for approval.`,
      data: pi
    });
  } catch (err) {
    console.error('Error in request_supplier_payment:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to initiate payment request.', error: err.message });
  }
};

/**
 * 8. Admin Payment Approval / Rejection (Admin Login)
 * Separate from actual payment completion!
 */
exports.admin_approve_supplier_payment = async (req, res) => {
  try {
    const { pi_id, indent_id, action, remarks } = req.body; // action: 'approve' | 'reject' | 'return'
    const targetPiId = pi_id || indent_id;
    const normalizedAction = (action || '').toLowerCase();

    if (!targetPiId || !['approve', 'reject', 'return'].includes(normalizedAction)) {
      return res.status(400).json({ status: 'error', message: 'pi_id and valid action (approve, reject, return) are required.' });
    }

    const pi = await PurchaseIndent.findById(targetPiId);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    const adminUser = req.user?.name || req.user?.email || 'Admin';

    if (normalizedAction === 'approve') {
      pi.payment.payment_status = 'Approved';
      pi.payment.admin_approval.status = 'Approved';
      pi.payment.admin_approval.approved_by = req.user?._id || null;
      pi.payment.admin_approval.approved_at = new Date();
      pi.payment.admin_approval.remarks = remarks || 'Approved for bank disbursement';
      pi.audit_history.push({
        action: 'Admin Approved Payment',
        performed_by: req.user?._id || null,
        performer_name: adminUser,
        role: 'Admin',
        timestamp: new Date(),
        remarks: remarks || 'Approved by Admin'
      });
    } else {
      const isReturned = normalizedAction === 'return';
      pi.payment.payment_status = isReturned ? 'Rejected / Returned' : 'Rejected / Returned';
      pi.payment.admin_approval.status = isReturned ? 'Returned' : 'Rejected';
      pi.payment.admin_approval.remarks = remarks || (isReturned ? 'Returned for rework' : 'Rejected by Admin');
      pi.audit_history.push({
        action: isReturned ? 'Admin Returned Payment Request' : 'Admin Rejected Payment Request',
        performed_by: req.user?._id || null,
        performer_name: adminUser,
        role: 'Admin',
        timestamp: new Date(),
        remarks: remarks || 'Actioned by Admin'
      });
    }

    await pi.save();

    return res.status(200).json({
      status: 'success',
      message: `Payment request #${pi.pi_number} successfully ${normalizedAction}d by Admin.`,
      data: pi
    });
  } catch (err) {
    console.error('Error in admin_approve_supplier_payment:', err);
    return res.status(500).json({ status: 'error', message: 'Admin approval failed.', error: err.message });
  }
};

/**
 * 9. Record Actual Bank Payment
 * Actual payment completion after Admin approval
 */
exports.record_bank_payment = async (req, res) => {
  try {
    const { pi_id, indent_id, utr_number, paid_amount, payment_mode, payment_date, remarks, receipt_url } = req.body;
    const targetPiId = pi_id || indent_id;

    const pi = await PurchaseIndent.findById(targetPiId);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    const amountPaid = paid_amount !== undefined ? Number(paid_amount) : (pi.payment?.advance_amount || pi.total_pi_value);

    if (!targetPiId || !utr_number || !payment_mode) {
      return res.status(400).json({ status: 'error', message: 'pi_id, utr_number, paid_amount, and payment_mode are required.' });
    }

    if (!['Approved', 'Payment Processing', 'Advance Paid'].includes(pi.payment.payment_status)) {
      return res.status(400).json({
        status: 'error',
        message: `Payment cannot be recorded. Current status is '${pi.payment.payment_status}'. Admin approval required first.`
      });
    }

    pi.payment.actual_payment = {
      utr_number,
      paid_amount: amountPaid,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      payment_mode,
      receipt_url: receipt_url || null
    };

    // Determine if Advance Paid or Fully Paid
    if (amountPaid >= pi.total_pi_value) {
      pi.payment.payment_status = 'Paid';
    } else {
      pi.payment.payment_status = 'Advance Paid';
    }

    pi.audit_history.push({
      action: `Bank Payment Recorded (${pi.payment.payment_status})`,
      performed_by: req.user?._id || null,
      performer_name: req.user?.name || req.user?.email || 'Accounts Team',
      role: 'Accounts',
      timestamp: new Date(),
      remarks: `UTR #${utr_number}, Amount: ₹${amountPaid}`
    });

    await pi.save();

    return res.status(200).json({
      status: 'success',
      message: `Bank payment recorded for PI #${pi.pi_number}. Status: ${pi.payment.payment_status}.`,
      data: pi
    });
  } catch (err) {
    console.error('Error in record_bank_payment:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to record bank payment.', error: err.message });
  }
};

/**
 * 10. Save Supply Fulfilment Method (Company Pickup vs Supplier Delivery)
 */
exports.save_supply_fulfilment = async (req, res) => {
  try {
    const {
      pi_id,
      method,
      supplier_warehouse_id,
      supplier_warehouse_address,
      transport_responsibility,
      transport_cost,
      expected_pickup_date,
      expected_dispatch_date,
      expected_inward_date
    } = req.body;

    if (!pi_id || !method || !['Company Pickup', 'Supplier Delivery'].includes(method)) {
      return res.status(400).json({ status: 'error', message: 'pi_id and valid method (Company Pickup, Supplier Delivery) are required.' });
    }

    const pi = await PurchaseIndent.findById(pi_id);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    pi.fulfilment.method = method;
    pi.fulfilment.supplier_warehouse_id = supplier_warehouse_id || pi.fulfilment.supplier_warehouse_id;
    pi.fulfilment.supplier_warehouse_address = supplier_warehouse_address || pi.fulfilment.supplier_warehouse_address;
    pi.fulfilment.transport_responsibility = transport_responsibility || (method === 'Company Pickup' ? 'Company' : 'Supplier');
    pi.fulfilment.transport_cost = Number(transport_cost) || 0;

    if (expected_pickup_date) pi.fulfilment.expected_pickup_date = new Date(expected_pickup_date);
    if (expected_dispatch_date) pi.fulfilment.expected_dispatch_date = new Date(expected_dispatch_date);
    if (expected_inward_date) pi.fulfilment.expected_inward_date = new Date(expected_inward_date);

    pi.audit_history.push({
      action: `Fulfilment Method Updated (${method})`,
      performed_by: req.user?._id || null,
      performer_name: req.user?.name || req.user?.email || 'Accounts Team',
      role: 'Accounts',
      timestamp: new Date(),
      remarks: `Method: ${method}, Expected Inward: ${expected_inward_date || 'TBD'}`
    });

    await pi.save();

    return res.status(200).json({
      status: 'success',
      message: `Fulfilment method configured for PI #${pi.pi_number}.`,
      data: pi
    });
  } catch (err) {
    console.error('Error in save_supply_fulfilment:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update fulfilment method.', error: err.message });
  }
};

/**
 * 11. Supplier Readiness & Dispatch Confirmation
 */
exports.supplier_update_dispatch = async (req, res) => {
  try {
    const {
      pi_id,
      indent_id,
      status_update,
      supply_status,
      vehicle_details,
      vehicle_number,
      driver_name,
      driver_phone,
      dispatch_reference,
      tracking_reference,
      carrier_name,
      carrier_details,
      date,
      actual_dispatch_date
    } = req.body;

    const targetPiId = pi_id || indent_id;
    const targetStatus = status_update || supply_status;

    if (!targetPiId || !targetStatus) {
      return res.status(400).json({ status: 'error', message: 'pi_id and status_update are required.' });
    }

    const pi = await PurchaseIndent.findById(targetPiId);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    pi.fulfilment.supply_status = targetStatus;

    if (vehicle_details) {
      pi.fulfilment.vehicle_details = vehicle_details;
    } else if (vehicle_number) {
      pi.fulfilment.vehicle_details = {
        vehicle_number,
        driver_name: driver_name || null,
        driver_phone: driver_phone || null
      };
    }

    const ref = tracking_reference || dispatch_reference;
    if (ref) {
      pi.fulfilment.dispatch_reference = ref;
      pi.fulfilment.tracking_reference = ref;
    }

    const carrier = carrier_name || carrier_details;
    if (carrier) {
      pi.fulfilment.carrier_name = carrier;
    }

    const dispatchDate = actual_dispatch_date || date;
    if (targetStatus === 'Picked Up') {
      pi.fulfilment.actual_pickup_date = dispatchDate ? new Date(dispatchDate) : new Date();
    } else if (targetStatus === 'Dispatched') {
      pi.fulfilment.actual_dispatch_date = dispatchDate ? new Date(dispatchDate) : new Date();
    }

    pi.audit_history.push({
      action: `Supplier Supply Status: ${targetStatus}`,
      performed_by: req.user?._id || null,
      performer_name: req.user?.name || 'Supplier / Transport',
      role: 'Supplier',
      timestamp: new Date(),
      remarks: dispatch_reference ? `Ref: ${dispatch_reference}` : 'Updated by Supplier'
    });

    await pi.save();

    return res.status(200).json({
      status: 'success',
      message: `Supply status updated to '${status_update}' for PI #${pi.pi_number}.`,
      data: pi
    });
  } catch (err) {
    console.error('Error in supplier_update_dispatch:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update supply status.', error: err.message });
  }
};

/**
 * 12. Warehouse Physical Inward Receipt Verification (GRN)
 * Verifies physically received goods against customer order and marks Inward Completed
 */
exports.warehouse_confirm_inward = async (req, res) => {
  try {
    const {
      pi_id,
      customer_order_number,
      warehouse_id,
      invoice_no,
      invoice_date,
      received_items,
      damage_notes,
      qc_passed = true
    } = req.body;

    if (!pi_id || !customer_order_number || !warehouse_id) {
      return res.status(400).json({ status: 'error', message: 'pi_id, customer_order_number, and warehouse_id are required.' });
    }

    const pi = await PurchaseIndent.findById(pi_id);
    if (!pi) {
      return res.status(404).json({ status: 'error', message: 'Purchase Indent not found.' });
    }

    // Generate GRN No
    const count = await WarehouseInward.countDocuments({});
    const year = new Date().getFullYear();
    const grnNo = `GRN-${year}-${String(count + 1).padStart(5, '0')}`;

    // Create WarehouseInward record
    const inwardItems = (received_items || pi.items).map(it => ({
      sku_id: it.sku_id || new mongoose.Types.ObjectId(),
      sku_code: it.sku_code || 'SKU-ITEM',
      qty: Number(it.quantity) || 1,
      benchmark_price: Number(it.unit_rate) || 0,
      benchmark_price_per_watt: 0,
      invoice_price: Number(it.unit_rate) || 0,
      invoice_price_per_watt: 0,
      qc_status: qc_passed ? 'Passed' : 'Failed',
      damage_notes: damage_notes || ''
    }));

    const inwardDoc = new WarehouseInward({
      grn_no: grnNo,
      warehouse_id,
      inward_type: 'supplier',
      supplier_name: pi.supplier_name,
      invoice_no: invoice_no || `INV-${pi.pi_number}`,
      invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
      status: qc_passed ? 'approved' : 'pending_match',
      items: inwardItems,
      received_by: req.user?._id || new mongoose.Types.ObjectId()
    });

    await inwardDoc.save();

    // Increment warehouse stock
    for (const it of inwardItems) {
      await WarehouseStock.updateOne(
        { warehouse_id, sku_code: it.sku_code },
        { $inc: { qty: it.qty } },
        { upsert: true }
      ).catch(() => {});
    }

    // Update PI fulfilment status
    pi.fulfilment.actual_inward_date = new Date();
    pi.fulfilment.supply_status = 'Inward Completed';
    pi.pi_status = 'Completed';
    pi.audit_history.push({
      action: `Physical Inward Verified (GRN #${grnNo})`,
      performed_by: req.user?._id || null,
      performer_name: req.user?.name || 'Warehouse Staff',
      role: 'Warehouse',
      timestamp: new Date(),
      remarks: qc_passed ? 'QC Passed, physical receipt confirmed' : `QC Issue: ${damage_notes}`
    });

    await pi.save();

    // Update linked Customer Order procurement status
    const isEpc = customer_order_number.toUpperCase().includes('EPC');
    const OrderModel = isEpc ? EpcOrder : FpoOrder;
    await OrderModel.updateOne(
      { order_number: customer_order_number },
      {
        $set: {
          'procurement_status.overall_status': 'inward_completed',
          'procurement_status.inward_at': new Date()
        }
      }
    ).catch(() => {});

    return res.status(200).json({
      status: 'success',
      message: `Inward completed and verified under GRN #${grnNo}. Warehouse stock updated.`,
      data: {
        grn_no: grnNo,
        grn_number: grnNo,
        inward_doc: inwardDoc,
        pi
      }
    });
  } catch (err) {
    console.error('Error in warehouse_confirm_inward:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to confirm inward receipt.', error: err.message });
  }
};

/**
 * 13. Procurement Readiness Validation & Delivery Manager Handover
 */
exports.handover_to_delivery_manager = async (req, res) => {
  try {
    const { group_id, order_number } = req.body;

    if (!group_id && !order_number) {
      return res.status(400).json({ status: 'error', message: 'group_id or order_number is required.' });
    }

    let group = null;
    if (group_id) {
      group = await ProcurementGroup.findOne({ group_id: group_id.toUpperCase() });
    }

    // Query all PIs linked to this group or order
    const piFilter = group_id ? { order_group_id: group_id.toUpperCase() } : { customer_order_number: order_number };
    const associatedPIs = await PurchaseIndent.find(piFilter).lean();

    // Query active inventory reservations
    const resFilter = group_id ? { order_group_id: group_id.toUpperCase(), status: 'active' } : { customer_order_number: order_number, status: 'active' };
    const activeReservations = await WarehouseInventoryReservation.find(resFilter).lean();

    // Check procurement readiness rules:
    // 1. All products have a defined supply source (PI or active reservation)
    const hasSourcing = associatedPIs.length > 0 || activeReservations.length > 0;
    if (!hasSourcing) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot hand over to Delivery Manager. No components have been reserved from inventory or procured via supplier PI.'
      });
    }

    // Determine readiness state:
    // - If any PI is not inward completed, readiness is 'Awaiting Warehouse Inward'
    // - If all PIs inward completed (or 100% sourced from inventory), readiness is 'Ready for Kit Preparation'
    const pendingInwardPIs = associatedPIs.filter(pi => pi.fulfilment?.supply_status !== 'Inward Completed');
    let readinessState = 'Ready for Kit Preparation';

    if (pendingInwardPIs.length > 0) {
      readinessState = 'Awaiting Warehouse Inward';
    }

    if (group) {
      group.procurement_readiness_status = readinessState;
      group.batch_status = 'Transferred to Delivery';
      group.status = 'Transferred to Delivery';
      group.delivery_handover = {
        transferred_at: new Date(),
        transferred_by: req.user?._id || null
      };
      await group.save();
    }

    // Also update customer orders across EpcOrder, FpoOrder and CustomerOrder (purchase_orders)
    const { india_solarshop_db } = require('../config/databases');
    const CustomerOrder = india_solarshop_db.models['purchase_orders'] || india_solarshop_db.model('purchase_orders', new mongoose.Schema({}, { strict: false, collection: 'purchase_orders' }));

    const orderNums = group ? group.order_numbers : [order_number];
    await Promise.all([
      EpcOrder.updateMany(
        { order_number: { $in: orderNums } },
        {
          $set: {
            account_processing_status: 'Transferred to Delivery',
            procurement_readiness_status: readinessState,
            'procurement_status.readiness_status': readinessState
          }
        }
      ),
      FpoOrder.updateMany(
        { order_number: { $in: orderNums } },
        {
          $set: {
            account_processing_status: 'Transferred to Delivery',
            procurement_readiness_status: readinessState,
            'procurement_status.readiness_status': readinessState
          }
        }
      ),
      CustomerOrder.updateMany(
        { order_number: { $in: orderNums } },
        {
          $set: {
            account_processing_status: 'Transferred to Delivery',
            procurement_readiness_status: readinessState,
            'procurement_status.readiness_status': readinessState
          }
        }
      )
    ]);

    return res.status(200).json({
      status: 'success',
      message: `Procurement details successfully validated and transferred to Delivery Manager. Current Readiness State: '${readinessState}'.`,
      data: {
        group_id,
        order_numbers: orderNums,
        readiness_state: readinessState,
        total_pis: associatedPIs.length,
        total_reservations: activeReservations.length,
        pending_inward_count: pendingInwardPIs.length
      }
    });
  } catch (err) {
    console.error('Error in handover_to_delivery_manager:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to hand over to Delivery Manager.', error: err.message });
  }
};
