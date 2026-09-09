const mongoose = require('mongoose');
const { PincodeDeliveryCost } = require('../models/india_solarshop_db');
const ComboKit = require('../models/india_solarshop_db/combo_kits.schema');

/**
 * GET /admin-api/pincode-delivery-costs
 * List configured pincode delivery freight rules with filters & pagination
 */
const get_delivery_costs = async (req, res) => {
  try {
    const {
      state_name,
      district_name,
      pincode,
      combo_kit_id,
      is_active,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (state_name && state_name.trim()) {
      query.state_name = new RegExp(`^${state_name.trim()}$`, 'i');
    }

    if (district_name && district_name.trim()) {
      const d = district_name.trim();
      const flexible = d
        .replace(/oo|u/gi, '(?:oo|u)')
        .replace(/ee|i/gi, '(?:ee|i)')
        .replace(/\s+/g, '\\s*');
      query.district_name = new RegExp(`^${flexible}$`, 'i');
    }

    if (pincode && pincode.trim()) {
      query.pincode = new RegExp(pincode.trim(), 'i');
    }

    if (combo_kit_id) {
      if (combo_kit_id === 'default' || combo_kit_id === 'null') {
        query.combo_kit_id = null;
      } else if (mongoose.Types.ObjectId.isValid(combo_kit_id)) {
        query.combo_kit_id = new mongoose.Types.ObjectId(combo_kit_id);
      }
    }

    if (is_active !== undefined && is_active !== '') {
      query.is_active = is_active === 'true' || is_active === true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const flexibleQ = q
        .replace(/oo|u/gi, '(?:oo|u)')
        .replace(/ee|i/gi, '(?:ee|i)');
      query.$or = [
        { pincode: new RegExp(q, 'i') },
        { state_name: new RegExp(q, 'i') },
        { district_name: new RegExp(flexibleQ, 'i') },
        { combo_kit_name: new RegExp(q, 'i') },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      PincodeDeliveryCost.find(query)
        .populate('combo_kit_id', 'name kit_image capacity')
        .sort({ updated_at: -1, created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PincodeDeliveryCost.countDocuments(query),
    ]);

    // Summary stats
    const [totalActive, distinctPincodes, distinctDistricts] = await Promise.all([
      PincodeDeliveryCost.countDocuments({ is_active: true }),
      PincodeDeliveryCost.distinct('pincode'),
      PincodeDeliveryCost.distinct('district_name'),
    ]);

    return res.status(200).json({
      status: 'success',
      data: items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalActive,
        distinctPincodesCount: distinctPincodes.length,
        distinctDistrictsCount: distinctDistricts.length,
      },
    });
  } catch (error) {
    console.error('Error in get_delivery_costs:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};

/**
 * POST /admin-api/pincode-delivery-costs
 * Create or upsert a new delivery cost rule
 */
const create_delivery_cost = async (req, res) => {
  try {
    const {
      state_name,
      district_name,
      pincode,
      combo_kit_id,
      delivery_cost,
      estimated_days_min = 3,
      estimated_days_max = 7,
      is_active = true,
      notes = null,
      country_id = null,
      state_id = null,
      district_id = null,
    } = req.body;

    if (!state_name || !district_name || !pincode || delivery_cost === undefined || delivery_cost === null) {
      return res.status(400).json({
        status: 'error',
        message: 'State, District, Pincode, and Delivery Cost are required.',
      });
    }

    const cleanPincode = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
    }

    const costNum = parseFloat(delivery_cost);
    if (isNaN(costNum) || costNum < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery cost must be a valid non-negative number.',
      });
    }

    let targetKitId = null;
    let comboKitName = null;
    if (combo_kit_id && mongoose.Types.ObjectId.isValid(combo_kit_id)) {
      targetKitId = new mongoose.Types.ObjectId(combo_kit_id);
      const kitDoc = await ComboKit.findById(targetKitId).select('name').lean();
      if (kitDoc) {
        comboKitName = kitDoc.name;
      }
    }

    // Check if duplicate already exists
    const existing = await PincodeDeliveryCost.findOne({
      pincode: cleanPincode,
      combo_kit_id: targetKitId,
    });

    if (existing) {
      existing.state_name = state_name.trim();
      existing.district_name = district_name.trim();
      existing.delivery_cost = costNum;
      existing.estimated_days_min = Number(estimated_days_min) || 3;
      existing.estimated_days_max = Number(estimated_days_max) || 7;
      existing.is_active = is_active !== false;
      existing.notes = notes || existing.notes;
      existing.updated_at = new Date();
      if (comboKitName) existing.combo_kit_name = comboKitName;
      if (state_id) existing.state_id = state_id;
      if (district_id) existing.district_id = district_id;

      await existing.save();
      return res.status(200).json({
        status: 'success',
        message: 'Existing delivery cost rule updated successfully.',
        data: existing,
      });
    }

    const newRule = new PincodeDeliveryCost({
      country_id: country_id || null,
      state_id: state_id || null,
      state_name: state_name.trim(),
      district_id: district_id || null,
      district_name: district_name.trim(),
      pincode: cleanPincode,
      combo_kit_id: targetKitId,
      combo_kit_name: comboKitName,
      delivery_cost: costNum,
      estimated_days_min: Number(estimated_days_min) || 3,
      estimated_days_max: Number(estimated_days_max) || 7,
      is_active: is_active !== false,
      notes: notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newRule.save();

    return res.status(201).json({
      status: 'success',
      message: 'Pincode delivery cost rule created successfully.',
      data: newRule,
    });
  } catch (error) {
    console.error('Error in create_delivery_cost:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};

/**
 * PUT /admin-api/pincode-delivery-costs/:id
 * Update an existing delivery cost rule
 */
const update_delivery_cost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid delivery cost ID.' });
    }

    const existing = await PincodeDeliveryCost.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Delivery cost rule not found.' });
    }

    const {
      state_name,
      district_name,
      pincode,
      combo_kit_id,
      delivery_cost,
      estimated_days_min,
      estimated_days_max,
      is_active,
      notes,
    } = req.body;

    if (state_name) existing.state_name = state_name.trim();
    if (district_name) existing.district_name = district_name.trim();
    if (pincode) {
      const clean = String(pincode).trim();
      if (!/^\d{6}$/.test(clean)) {
        return res.status(400).json({ status: 'error', message: 'Please enter a valid 6-digit PIN code.' });
      }
      existing.pincode = clean;
    }

    if (combo_kit_id !== undefined) {
      if (!combo_kit_id || combo_kit_id === 'null' || combo_kit_id === 'default') {
        existing.combo_kit_id = null;
        existing.combo_kit_name = null;
      } else if (mongoose.Types.ObjectId.isValid(combo_kit_id)) {
        existing.combo_kit_id = new mongoose.Types.ObjectId(combo_kit_id);
        const kitDoc = await ComboKit.findById(existing.combo_kit_id).select('name').lean();
        if (kitDoc) existing.combo_kit_name = kitDoc.name;
      }
    }

    if (delivery_cost !== undefined) {
      const costNum = parseFloat(delivery_cost);
      if (isNaN(costNum) || costNum < 0) {
        return res.status(400).json({ status: 'error', message: 'Delivery cost must be a non-negative number.' });
      }
      existing.delivery_cost = costNum;
    }

    if (estimated_days_min !== undefined) existing.estimated_days_min = Number(estimated_days_min) || 3;
    if (estimated_days_max !== undefined) existing.estimated_days_max = Number(estimated_days_max) || 7;
    if (is_active !== undefined) existing.is_active = is_active === true || is_active === 'true';
    if (notes !== undefined) existing.notes = notes;

    existing.updated_at = new Date();
    await existing.save();

    return res.status(200).json({
      status: 'success',
      message: 'Delivery cost rule updated successfully.',
      data: existing,
    });
  } catch (error) {
    console.error('Error in update_delivery_cost:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};

/**
 * DELETE /admin-api/pincode-delivery-costs/:id
 * Delete a delivery cost rule
 */
const delete_delivery_cost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid delivery cost ID.' });
    }

    const deleted = await PincodeDeliveryCost.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Delivery cost rule not found.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Delivery cost rule deleted successfully.',
    });
  } catch (error) {
    console.error('Error in delete_delivery_cost:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};

/**
 * POST /admin-api/pincode-delivery-costs/bulk-import
 * Batch import or upload delivery freight rules
 */
const bulk_import_delivery_costs = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Items array cannot be empty.' });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const {
          state_name,
          district_name,
          pincode,
          combo_kit_id,
          delivery_cost,
          estimated_days_min = 3,
          estimated_days_max = 7,
          is_active = true,
          notes,
        } = item;

        const cleanPincode = String(pincode || '').trim();
        if (!state_name || !district_name || !/^\d{6}$/.test(cleanPincode) || delivery_cost === undefined) {
          failedCount++;
          errors.push(`Row ${i + 1}: Missing fields or invalid 6-digit pincode (${cleanPincode})`);
          continue;
        }

        const cost = parseFloat(delivery_cost);
        if (isNaN(cost) || cost < 0) {
          failedCount++;
          errors.push(`Row ${i + 1}: Invalid cost ${delivery_cost}`);
          continue;
        }

        let targetKitId = null;
        let comboKitName = null;
        if (combo_kit_id && mongoose.Types.ObjectId.isValid(combo_kit_id)) {
          targetKitId = new mongoose.Types.ObjectId(combo_kit_id);
          const kit = await ComboKit.findById(targetKitId).select('name').lean();
          if (kit) comboKitName = kit.name;
        }

        await PincodeDeliveryCost.findOneAndUpdate(
          { pincode: cleanPincode, combo_kit_id: targetKitId },
          {
            $set: {
              state_name: state_name.trim(),
              district_name: district_name.trim(),
              delivery_cost: cost,
              estimated_days_min: Number(estimated_days_min) || 3,
              estimated_days_max: Number(estimated_days_max) || 7,
              is_active: is_active !== false,
              notes: notes || null,
              combo_kit_name: comboKitName,
              updated_at: new Date(),
            },
            $setOnInsert: {
              created_at: new Date(),
            },
          },
          { upsert: true, new: true }
        );

        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Bulk import completed: ${successCount} processed, ${failedCount} failed.`,
      data: { successCount, failedCount, errors },
    });
  } catch (error) {
    console.error('Error in bulk_import_delivery_costs:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
  }
};

module.exports = {
  get_delivery_costs,
  create_delivery_cost,
  update_delivery_cost,
  delete_delivery_cost,
  bulk_import_delivery_costs,
};
