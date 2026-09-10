const mongoose = require('mongoose');
const { BestSellerKit, WarehouseComboKit } = require('../models/india_solarshop_db');
const { GeoLevel1, GeoLevel2 } = require('../models/geolocation_db');

/**
 * GET /admin-api/best-seller-configs
 * List & search configured best-seller combo kits
 */
const get_best_sellers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      state_id = '',
      district_id = '',
      combo_kit_id = '',
      status = 'all',
      sort_by = 'priority',
      sort_order = 'asc'
    } = req.query;

    const query = { deleted_at: null };

    if (state_id && mongoose.Types.ObjectId.isValid(state_id)) {
      query.state_id = new mongoose.Types.ObjectId(state_id);
    }

    if (district_id && district_id !== 'all') {
      if (district_id === 'state_wide' || district_id === 'null') {
        query.district_id = null;
      } else if (mongoose.Types.ObjectId.isValid(district_id)) {
        query.district_id = new mongoose.Types.ObjectId(district_id);
      }
    }

    if (combo_kit_id && mongoose.Types.ObjectId.isValid(combo_kit_id)) {
      query.combo_kit_id = new mongoose.Types.ObjectId(combo_kit_id);
    }

    if (status === 'active') {
      query.is_active = true;
    } else if (status === 'inactive') {
      query.is_active = false;
    }

    const sortOptions = {};
    if (sort_by === 'priority') {
      sortOptions.priority = sort_order === 'desc' ? -1 : 1;
      sortOptions.created_at = -1;
    } else if (sort_by === 'created_at') {
      sortOptions.created_at = sort_order === 'asc' ? 1 : -1;
    } else {
      sortOptions.priority = 1;
      sortOptions.created_at = -1;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10);
    const usePagination = limitNum > 0;

    let mongoQuery = BestSellerKit.find(query).sort(sortOptions);

    if (usePagination) {
      mongoQuery = mongoQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [rawItems, total, totalActive, distinctStates, distinctDistricts, distinctKits] = await Promise.all([
      mongoQuery.lean(),
      BestSellerKit.countDocuments(query),
      BestSellerKit.countDocuments({ deleted_at: null, is_active: true }),
      BestSellerKit.distinct('state_id', { deleted_at: null, is_active: true }),
      BestSellerKit.distinct('district_id', { deleted_at: null, is_active: true, district_id: { $ne: null } }),
      BestSellerKit.distinct('combo_kit_id', { deleted_at: null, is_active: true })
    ]);

    // Hydrate combo_kit_id from both pc_comobo_kit and pc_combo_kits collections
    const kitIds = rawItems.map(it => it.combo_kit_id).filter(Boolean);

    let kitMap = new Map();
    if (kitIds.length > 0) {
      const [k1, k2] = await Promise.all([
        mongoose.connection.db.collection('pc_comobo_kit').find({ _id: { $in: kitIds } }).toArray().catch(() => []),
        mongoose.connection.db.collection('pc_combo_kits').find({ _id: { $in: kitIds } }).toArray().catch(() => [])
      ]);
      [...k1, ...k2].forEach(k => kitMap.set(k._id.toString(), k));
    }

    const items = rawItems.map(it => {
      const rawId = (it.combo_kit_id?._id || it.combo_kit_id || '').toString();
      const found = kitMap.get(rawId);
      return {
        ...it,
        combo_kit_id: found ? {
          _id: found._id,
          id: found._id,
          name: found.name,
          capacity: found.capacity,
          kit_image: found.kit_image,
          inverter_mode: found.inverter_mode,
          base_price_cached: found.base_price_cached,
          selling_price_cached: found.selling_price_cached
        } : it.combo_kit_id
      };
    });

    // Client-side text search filter if search term provided
    let filteredItems = items;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredItems = items.filter(it => {
        const kitName = (it.combo_kit_id?.name || '').toLowerCase();
        const kitCap = String(it.combo_kit_id?.capacity || '');
        const stateName = (it.state_name || '').toLowerCase();
        const distName = (it.district_name || '').toLowerCase();
        const badge = (it.badge_text || '').toLowerCase();
        return kitName.includes(q) || kitCap.includes(q) || stateName.includes(q) || distName.includes(q) || badge.includes(q);
      });
    }

    return res.status(200).json({
      status: 'success',
      data: filteredItems,
      meta: {
        total,
        page: pageNum,
        limit: usePagination ? limitNum : total,
        totalPages: usePagination ? Math.ceil(total / limitNum) : 1,
        stats: {
          totalActive,
          distinctStatesCount: distinctStates.length,
          distinctDistrictsCount: distinctDistricts.length,
          distinctKitsCount: distinctKits.length
        }
      }
    });

  } catch (error) {
    console.error('[best_seller_kits.get_best_sellers error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch best sellers.' });
  }
};

/**
 * POST /admin-api/best-seller-configs
 * Create a new Best Seller tag for state & district
 */
const create_best_seller = async (req, res) => {
  try {
    const {
      state_id,
      district_id,
      combo_kit_id,
      badge_text = 'Our Best Seller',
      priority = 1,
      is_active = true,
      notes = null
    } = req.body;

    if (!state_id || !mongoose.Types.ObjectId.isValid(state_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid State ID is required.' });
    }

    if (!combo_kit_id || !mongoose.Types.ObjectId.isValid(combo_kit_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid Combo Kit ID is required.' });
    }

    // Resolve state name
    const stateDoc = await GeoLevel1.findById(state_id).lean();
    if (!stateDoc) {
      return res.status(404).json({ status: 'error', message: 'Selected State not found.' });
    }
    const state_name = stateDoc.name || 'Unknown State';
    const country_id = stateDoc.country || null;

    // Resolve district name
    let district_name = 'All Districts';
    let validDistrictId = null;
    if (district_id && district_id !== 'all' && district_id !== 'state_wide' && mongoose.Types.ObjectId.isValid(district_id)) {
      const distDoc = await GeoLevel2.findById(district_id).lean();
      if (distDoc) {
        district_name = distDoc.name || 'Unknown District';
        validDistrictId = distDoc._id;
      }
    }

    // Prevent duplicate configuration
    const existing = await BestSellerKit.findOne({
      state_id: new mongoose.Types.ObjectId(state_id),
      district_id: validDistrictId ? new mongoose.Types.ObjectId(validDistrictId) : null,
      combo_kit_id: new mongoose.Types.ObjectId(combo_kit_id),
      deleted_at: null
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `This combo kit is already configured as Best Seller for ${state_name} → ${district_name}.`
      });
    }

    const newDoc = await BestSellerKit.create({
      country_id,
      state_id: new mongoose.Types.ObjectId(state_id),
      state_name,
      district_id: validDistrictId ? new mongoose.Types.ObjectId(validDistrictId) : null,
      district_name,
      combo_kit_id: new mongoose.Types.ObjectId(combo_kit_id),
      badge_text: (badge_text || 'Our Best Seller').trim(),
      priority: Math.max(1, parseInt(priority, 10) || 1),
      is_active: is_active === true || is_active === 'true',
      notes: notes ? notes.trim() : null
    });

    const populated = await BestSellerKit.findById(newDoc._id)
      .populate({
        path: 'combo_kit_id',
        select: 'name capacity kit_image inverter_mode base_price_cached selling_price_cached'
      })
      .lean();

    return res.status(201).json({
      status: 'success',
      message: 'Combo Kit tagged as Best Seller successfully.',
      data: populated
    });

  } catch (error) {
    console.error('[best_seller_kits.create_best_seller error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to create best seller tag.' });
  }
};

/**
 * PUT /admin-api/best-seller-configs/:id
 * Update priority, badge text, district, notes or status
 */
const update_best_seller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID provided.' });
    }

    const item = await BestSellerKit.findOne({ _id: id, deleted_at: null });
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Best Seller configuration not found.' });
    }

    const {
      badge_text,
      priority,
      is_active,
      district_id,
      notes
    } = req.body;

    if (badge_text !== undefined) item.badge_text = (badge_text || 'Our Best Seller').trim();
    if (priority !== undefined) item.priority = Math.max(1, parseInt(priority, 10) || 1);
    if (is_active !== undefined) item.is_active = is_active === true || is_active === 'true';
    if (notes !== undefined) item.notes = notes ? notes.trim() : null;

    if (district_id !== undefined) {
      if (!district_id || district_id === 'all' || district_id === 'state_wide') {
        item.district_id = null;
        item.district_name = 'All Districts';
      } else if (mongoose.Types.ObjectId.isValid(district_id)) {
        const distDoc = await GeoLevel2.findById(district_id).lean();
        if (distDoc) {
          item.district_id = distDoc._id;
          item.district_name = distDoc.name;
        }
      }
    }

    item.updated_at = new Date();
    await item.save();

    const populated = await BestSellerKit.findById(item._id)
      .populate({
        path: 'combo_kit_id',
        select: 'name capacity kit_image inverter_mode base_price_cached selling_price_cached'
      })
      .lean();

    return res.status(200).json({
      status: 'success',
      message: 'Best Seller configuration updated successfully.',
      data: populated
    });

  } catch (error) {
    console.error('[best_seller_kits.update_best_seller error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to update best seller.' });
  }
};

/**
 * DELETE /admin-api/best-seller-configs/:id
 * Soft delete a best seller configuration
 */
const delete_best_seller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID.' });
    }

    const item = await BestSellerKit.findOne({ _id: id, deleted_at: null });
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Best Seller configuration not found.' });
    }

    item.deleted_at = new Date();
    await item.save();

    return res.status(200).json({
      status: 'success',
      message: 'Best Seller tag removed successfully.'
    });

  } catch (error) {
    console.error('[best_seller_kits.delete_best_seller error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to delete best seller.' });
  }
};

/**
 * PATCH /admin-api/best-seller-configs/:id/toggle-status
 * Toggle active state
 */
const toggle_best_seller_status = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await BestSellerKit.findOne({ _id: id, deleted_at: null });
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Best Seller configuration not found.' });
    }

    item.is_active = !item.is_active;
    item.updated_at = new Date();
    await item.save();

    return res.status(200).json({
      status: 'success',
      message: `Status updated to ${item.is_active ? 'Active' : 'Inactive'}.`,
      is_active: item.is_active
    });

  } catch (error) {
    console.error('[best_seller_kits.toggle_best_seller_status error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to toggle status.' });
  }
};

module.exports = {
  get_best_sellers,
  create_best_seller,
  update_best_seller,
  delete_best_seller,
  toggle_best_seller_status
};
