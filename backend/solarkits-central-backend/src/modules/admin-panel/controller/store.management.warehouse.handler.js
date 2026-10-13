/**
 * store.management.warehouse.handler.js
 *
 * Warehouse Allocation & Physical Fulfillment Readiness Sub-Module
 * Handles:
 *  - Warehouse allocation to stores
 *  - Admin verification of allocated warehouse
 *  - Listing available company warehouses
 */

const mongoose = require('mongoose');
const {
  Reseller,
  StoreSetup,
  StoreStatusHistory,
} = require('../models/india_solarshop_db');
const { CompanyWarehouse } = require('../models/company_warehouse_db');

// ─── 1. ALLOCATE WAREHOUSE TO STORE ───────────────────────────────────────────
const allocate_warehouse = async (req, res) => {
  try {
    const { store_id, warehouse_id, remarks } = req.body;
    const actorId = req.user?.id || req.user?._id || null;

    if (!store_id || !mongoose.Types.ObjectId.isValid(store_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid store_id is required.' });
    }

    if (!warehouse_id || !mongoose.Types.ObjectId.isValid(warehouse_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid warehouse_id is required.' });
    }

    const [store, warehouse] = await Promise.all([
      Reseller.findById(store_id),
      CompanyWarehouse.findById(warehouse_id),
    ]);

    if (!store || store.deleted_at) {
      return res.status(404).json({ status: 'error', message: 'Store not found.' });
    }

    if (!warehouse || warehouse.deleted_at || !warehouse.is_active) {
      return res.status(404).json({ status: 'error', message: 'Warehouse not found or inactive.' });
    }

    let storeSetup = await StoreSetup.findOne({ franchisee_id: store._id });
    if (!storeSetup) {
      return res.status(404).json({ status: 'error', message: 'Store Setup record not found for this store.' });
    }

    const now = new Date();
    storeSetup.warehouse_id = warehouse._id;
    storeSetup.warehouse_allocated = true;
    storeSetup.warehouse_allocation_verified = false; // Reset verification until reviewed
    storeSetup.warehouse_allocated_at = now;
    storeSetup.warehouse_allocated_by = actorId;
    await storeSetup.save();

    // Record audit history
    await StoreStatusHistory.create({
      store_id: store._id,
      reseller_id: store._id,
      store_setup_id: storeSetup._id,
      from_status: store.reseller_lifecycle_status || 'draft',
      to_status: store.reseller_lifecycle_status || 'draft',
      actor_type: 'warehouse',
      actor_id: actorId,
      remarks: `Warehouse allocated: ${warehouse.warehouse_code} (${warehouse.pincode || 'Pincode N/A'}). ${remarks ? `Remarks: ${remarks.trim()}` : ''}`,
      metadata: {
        warehouse_id: warehouse._id,
        warehouse_code: warehouse.warehouse_code,
        allocated_at: now,
      },
    });

    return res.json({
      status: 'success',
      data: {
        store_id: store._id,
        warehouse: {
          id: warehouse._id,
          warehouse_code: warehouse.warehouse_code,
          address: warehouse.address,
          pincode: warehouse.pincode,
        },
        warehouse_allocated: true,
        warehouse_allocation_verified: false,
      },
      message: 'Warehouse allocated successfully. Verification pending.',
    });
  } catch (error) {
    console.error('[store.management.warehouse] allocate_warehouse error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to allocate warehouse.' });
  }
};

// ─── 2. VERIFY WAREHOUSE ALLOCATION ───────────────────────────────────────────
const verify_warehouse_allocation = async (req, res) => {
  try {
    const { store_id, remarks } = req.body;
    const actorId = req.user?.id || req.user?._id || null;

    if (!store_id || !mongoose.Types.ObjectId.isValid(store_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid store_id is required.' });
    }

    const store = await Reseller.findById(store_id);
    if (!store || store.deleted_at) {
      return res.status(404).json({ status: 'error', message: 'Store not found.' });
    }

    const storeSetup = await StoreSetup.findOne({ franchisee_id: store._id }).populate('warehouse_id');
    if (!storeSetup || !storeSetup.warehouse_id || !storeSetup.warehouse_allocated) {
      return res.status(400).json({
        status: 'error',
        message: 'No warehouse allocated to this store to verify.',
      });
    }

    storeSetup.warehouse_allocation_verified = true;
    await storeSetup.save();

    // Record audit history
    await StoreStatusHistory.create({
      store_id: store._id,
      reseller_id: store._id,
      store_setup_id: storeSetup._id,
      from_status: store.reseller_lifecycle_status || 'draft',
      to_status: store.reseller_lifecycle_status || 'draft',
      actor_type: 'warehouse',
      actor_id: actorId,
      remarks: `Warehouse allocation verified for warehouse: ${storeSetup.warehouse_id?.warehouse_code || 'Code N/A'}. ${remarks ? `Remarks: ${remarks.trim()}` : ''}`,
      metadata: {
        warehouse_id: storeSetup.warehouse_id?._id,
        verified: true,
      },
    });

    return res.json({
      status: 'success',
      data: {
        store_id: store._id,
        warehouse_allocated: true,
        warehouse_allocation_verified: true,
      },
      message: 'Warehouse allocation verified successfully.',
    });
  } catch (error) {
    console.error('[store.management.warehouse] verify_warehouse_allocation error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to verify warehouse allocation.' });
  }
};

// ─── 3. LIST COMPANY WAREHOUSES ───────────────────────────────────────────────
const list_warehouses = async (req, res) => {
  try {
    const { state_id, active_only = 'true' } = req.query;
    const query = { deleted_at: null };

    if (active_only === 'true') {
      query.is_active = true;
    }

    if (state_id && mongoose.Types.ObjectId.isValid(state_id)) {
      query.level_1 = state_id;
    }

    const rows = await CompanyWarehouse.find(query)
      .select('warehouse_code warehouse_type address pincode is_active max_kit_capacity allocated_incoming_capacity level_1 level_2')
      .sort({ warehouse_code: 1 })
      .lean();

    const data = rows.map((w) => ({
      id: w._id,
      warehouse_code: w.warehouse_code,
      warehouse_type: w.warehouse_type,
      address: w.address,
      pincode: w.pincode,
      max_kit_capacity: w.max_kit_capacity,
      allocated_incoming_capacity: w.allocated_incoming_capacity,
      is_active: w.is_active,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[store.management.warehouse] list_warehouses error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch warehouses.' });
  }
};

module.exports = {
  allocate_warehouse,
  verify_warehouse_allocation,
  list_warehouses,
};
