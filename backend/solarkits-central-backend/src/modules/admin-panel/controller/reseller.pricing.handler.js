const mongoose = require('mongoose');
const { ResellerListing, ResellerPricingRule } = require('../models/india_solarshop_db');
const { Product, ProjectCategory, ProjectSubcategory, Brand, IndustryType, WarehouseComboKit } = require('../models/core_db');
const {
  calculateResellerItemPricing,
  createOrUpdateResellerListing,
} = require('../services/reseller.pricing.service');
const { logAudit } = require('../utils/audit.service');

async function syncResellerListingsForReseller(resellerId) {
  try {
    const {
      ResellerPlanSubscription,
      FranchiseePlanPOSetting,
      FranchiseePlanPoSetting,
      ResellerProductAuthorization,
      ResellerListing,
    } = require('../models/india_solarshop_db');
    const { SolarKit, WarehouseComboKit } = require('../models/core_db');

    // 1. Fetch active plan subscription
    const activeSub = await ResellerPlanSubscription.findOne({
      reseller_id: resellerId,
      status: 'active',
    }).populate('plan_id').sort({ start_date: -1 }).lean();

    const activePlan = activeSub?.plan_id;
    const authorizedKitIds = new Set();

    if (activePlan) {
      // Check PO Settings
      const PlanPoModel = FranchiseePlanPOSetting || FranchiseePlanPoSetting;
      const poSetting = PlanPoModel ? await PlanPoModel.findOne({
        plan_id: activePlan._id,
        is_active: true,
      }).lean() : null;

      const poKitIds = (poSetting?.allowed_combo_kit_ids || []).map(String);
      const planKitIds = (activePlan.allowed_combo_kit_ids || []).map(String);
      const combined = [...poKitIds, ...planKitIds];

      if (combined.length > 0) {
        combined.forEach((id) => authorizedKitIds.add(id));
      } else {
        // Fall back to category/subcategory/project type matching for plan
        const planCatIds = (activePlan.allowed_category_ids || []).map(String);
        const planSubcatIds = (activePlan.allowed_subcategory_ids || []).map(String);
        const planProjectTypeIds = (activePlan.allowed_project_type_ids || []).map(String);

        let comboKitQuery = { is_active: { $ne: false }, deleted_at: null };
        if (planCatIds.length > 0 || planSubcatIds.length > 0 || planProjectTypeIds.length > 0) {
          const defQuery = { deleted_at: null };
          if (planCatIds.length > 0) defQuery.category_id = { $in: planCatIds };
          if (planSubcatIds.length > 0) defQuery.subcategory_id = { $in: planSubcatIds };
          if (planProjectTypeIds.length > 0) defQuery.type_id = { $in: planProjectTypeIds };

          const matchingDefs = await SolarKit.find(defQuery).select('_id').lean();
          const defIds = matchingDefs.map((d) => d._id);
          comboKitQuery.solar_kit_id = { $in: defIds };
        }
        const kits = await WarehouseComboKit.find(comboKitQuery).select('_id').lean();
        kits.forEach((k) => authorizedKitIds.add(String(k._id)));
      }
    }

    // 2. Fetch explicit admin rules
    const adminRules = await ResellerProductAuthorization.find({
      reseller_id: resellerId,
      status: 'active',
    }).lean();

    for (const r of adminRules) {
      if (r.scope_type === 'kit' && r.kit_id) {
        const kId = String(r.kit_id._id || r.kit_id);
        if (r.is_authorized === false) {
          authorizedKitIds.delete(kId);
        } else {
          authorizedKitIds.add(kId);
        }
      } else if (r.scope_type === 'category' || r.category_id || r.scope_type === 'all') {
        if (r.is_authorized !== false) {
          let catKitsQuery = { is_active: { $ne: false }, deleted_at: null };
          if (r.category_id) {
            const cId = r.category_id._id || r.category_id;
            const matchingDefs = await SolarKit.find({ category_id: cId, deleted_at: null }).select('_id').lean();
            const defIds = matchingDefs.map((d) => d._id);
            catKitsQuery.$or = [
              { category_id: cId },
              { solar_kit_id: { $in: defIds } },
            ];
          }
          const catKits = await WarehouseComboKit.find(catKitsQuery).select('_id').lean();
          catKits.forEach((k) => authorizedKitIds.add(String(k._id)));
        }
      }
    }

    // 3. For each authorized kit, ensure ResellerListing exists
    for (const kitId of authorizedKitIds) {
      if (!mongoose.Types.ObjectId.isValid(kitId)) continue;
      const existing = await ResellerListing.findOne({ reseller_id: resellerId, kit_id: kitId });
      if (!existing) {
        const kit = await WarehouseComboKit.findById(kitId).lean();
        if (kit) {
          const costPriceInr = kit.base_price_cached || kit.selling_price_cached || 5000;
          const costPaise = Math.round(costPriceInr * 100);
          await ResellerListing.create({
            reseller_id: resellerId,
            kit_id: kit._id,
            scope_type: 'kit',
            title: kit.name || kit.kit_name || 'Solar Combo Kit',
            description: kit.description || 'Franchisee Plan Allocated Solar Kit',
            image_url: kit.kit_image || kit.image || null,
            cost_price_paise: costPaise,
            selling_price_paise: costPaise,
            margin_paise: 0,
            stock_quantity: 100,
            assignment_status: 'assigned',
            is_published: true,
            is_active: true,
            category_id: kit.category_id || null,
            subcategory_id: kit.subcategory_id || null,
            brand_id: kit.brand_id || null,
          });
        }
      } else if (!existing.image_url) {
        const kit = await WarehouseComboKit.findById(kitId).lean();
        if (kit && (kit.kit_image || kit.image)) {
          await ResellerListing.updateOne({ _id: existing._id }, { $set: { image_url: kit.kit_image || kit.image } });
        }
      }
    }
  } catch (err) {
    console.error('[syncResellerListingsForReseller] error:', err);
  }
}

// ─── 1. LIST RESELLER LISTINGS (Enhanced search & filters) ─────────────────────
/**
 * GET /api/india/v1/reseller/listings OR /admin-api/reseller-mgmt/listings/:id
 * Query params: ?search=...&industry_type_id=...&category_id=...&subcategory_id=...&brand_id=...&assignment_status=...&stock_status=...&sort=...
 */
const list_reseller_listings = async (req, res) => {
  try {
    const resellerId = req.reseller?._id || req.params.id || req.query.reseller_id;
    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    // Auto-sync listings for authorized kits
    await syncResellerListingsForReseller(resellerId);

    const {
      search,
      industry_type_id,
      category_id,
      subcategory_id,
      brand_id,
      assignment_status,
      stock_status,
      sort,
    } = req.query;

    const filter = { reseller_id: resellerId };

    if (assignment_status && assignment_status !== 'all') {
      filter.assignment_status = assignment_status;
    }

    if (industry_type_id) filter.industry_type_id = industry_type_id;
    if (category_id) filter.category_id = category_id;
    if (subcategory_id) filter.subcategory_id = subcategory_id;
    if (brand_id) filter.brand_id = brand_id;

    if (stock_status === 'in_stock') {
      filter.stock_quantity = { $gt: 0 };
    } else if (stock_status === 'out_of_stock') {
      filter.stock_quantity = 0;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOption = { created_at: -1 };
    if (sort === 'price_asc') sortOption = { selling_price_paise: 1 };
    else if (sort === 'price_desc') sortOption = { selling_price_paise: -1 };
    else if (sort === 'title_asc') sortOption = { title: 1 };
    else if (sort === 'title_desc') sortOption = { title: -1 };

    const rows = await ResellerListing.find(filter)
      .populate({ path: 'product_id', model: Product, select: 'name sku_code description image base_price_paise min_margin_paise max_margin_paise specifications' })
      .populate({ path: 'kit_id', model: WarehouseComboKit, select: 'name kit_name kit_code base_price_cached selling_price_cached kit_image description' })
      .populate({ path: 'category_id', model: ProjectCategory, select: 'name' })
      .populate({ path: 'subcategory_id', model: ProjectSubcategory, select: 'name' })
      .populate({ path: 'brand_id', model: Brand, select: 'name logo' })
      .populate({ path: 'industry_type_id', model: IndustryType, select: 'name slug' })
      .sort(sortOption)
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[reseller.pricing] list_reseller_listings error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. RESELLER PURCHASE / ACCEPT ASSIGNED PRODUCT ─────────────────────────────
/**
 * POST /api/india/v1/reseller/listings/:id/purchase
 */
const purchase_reseller_product = async (req, res) => {
  try {
    const resellerId = req.reseller?._id;
    const { id } = req.params;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Unauthorized reseller request' });
    }

    const listing = await ResellerListing.findOne({ _id: id, reseller_id: resellerId });
    if (!listing) return res.status(404).json({ status: 'error', message: 'Product listing not found' });

    if (['purchased', 'margin_pending', 'ready_to_publish', 'published'].includes(listing.assignment_status)) {
      return res.json({ status: 'success', message: 'Product already purchased', data: listing });
    }

    listing.assignment_status = 'purchased';
    listing.purchased_at = new Date();
    listing.audit_history.push({
      status: 'purchased',
      actor_type: 'reseller',
      actor_id: resellerId,
      notes: 'Reseller accepted/purchased assigned product',
      timestamp: new Date(),
    });

    await listing.save();

    return res.json({
      status: 'success',
      message: 'Product successfully purchased/accepted. Now configure your selling margin.',
      data: listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] purchase_reseller_product error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. UPDATE RESELLER PROFIT MARGIN ─────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/listings/:id/margin
 * Body: { reseller_margin_inr?, reseller_margin_pct? }
 */
const update_reseller_margin = async (req, res) => {
  try {
    const resellerId = req.reseller?._id;
    const { id } = req.params;
    const { reseller_margin_inr, reseller_margin_pct } = req.body;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Unauthorized reseller request' });
    }

    const listing = await ResellerListing.findOne({ _id: id, reseller_id: resellerId });
    if (!listing) return res.status(404).json({ status: 'error', message: 'Product listing not found' });

    if (!['accepted', 'purchased', 'margin_pending', 'ready_to_publish', 'published'].includes(listing.assignment_status)) {
      return res.status(400).json({ status: 'error', message: 'You must purchase/accept the product before setting a margin' });
    }

    let marginPaise = 0;
    let marginPct = 0;

    if (reseller_margin_inr != null) {
      marginPaise = Math.round(Number(reseller_margin_inr) * 100);
      marginPct = listing.cost_price_paise > 0 ? (marginPaise / listing.cost_price_paise) * 100 : 0;
    } else if (reseller_margin_pct != null) {
      marginPct = Number(reseller_margin_pct);
      marginPaise = Math.round((listing.cost_price_paise * marginPct) / 100);
    } else {
      return res.status(400).json({ status: 'error', message: 'Reseller margin is required' });
    }

    if (marginPaise < listing.min_margin_paise || marginPaise > listing.max_margin_paise) {
      const minInr = (listing.min_margin_paise / 100).toFixed(2);
      const maxInr = (listing.max_margin_paise / 100).toFixed(2);
      return res.status(400).json({
        status: 'error',
        message: `Margin violates Super Admin rules! Margin must be between ₹${minInr} and ₹${maxInr}`,
        min_margin_inr: minInr,
        max_margin_inr: maxInr,
      });
    }

    const costPrice = listing.cost_price_paise;
    const taxRate = listing.tax_rate_pct || 18;

    const subtotalWithMargin = costPrice + marginPaise;
    const taxesPaise = Math.round((subtotalWithMargin * taxRate) / 100);
    const finalSellingPricePaise = subtotalWithMargin + taxesPaise;

    listing.reseller_margin_paise = marginPaise;
    listing.reseller_margin_pct = Number(marginPct.toFixed(2));
    listing.taxes_and_charges_paise = taxesPaise;
    listing.selling_price_paise = finalSellingPricePaise;

    if (listing.assignment_status !== 'published') {
      listing.assignment_status = 'ready_to_publish';
    }

    listing.audit_history.push({
      status: listing.assignment_status,
      actor_type: 'reseller',
      actor_id: resellerId,
      notes: `Reseller updated margin to ₹${(marginPaise / 100).toFixed(2)} (${marginPct.toFixed(1)}%). Final EPC Price: ₹${(finalSellingPricePaise / 100).toFixed(2)}`,
      timestamp: new Date(),
    });

    await listing.save();

    return res.json({
      status: 'success',
      message: 'Margin updated successfully. Ready to publish to storefront and EPC catalogue.',
      data: listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] update_reseller_margin error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. PUBLISH RESELLER LISTING ──────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/listings/:id/publish
 */
const publish_reseller_listing = async (req, res) => {
  try {
    const resellerId = req.reseller?._id;
    const { id } = req.params;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Unauthorized reseller request' });
    }

    const listing = await ResellerListing.findOne({ _id: id, reseller_id: resellerId });
    if (!listing) return res.status(404).json({ status: 'error', message: 'Product listing not found' });

    if (!['ready_to_publish', 'published', 'purchased', 'accepted'].includes(listing.assignment_status)) {
      return res.status(400).json({ status: 'error', message: 'Product must be purchased and priced before publishing' });
    }

    listing.assignment_status = 'published';
    listing.published_at = new Date();
    listing.status = 'active';

    listing.audit_history.push({
      status: 'published',
      actor_type: 'reseller',
      actor_id: resellerId,
      notes: 'Reseller published product to storefront and EPC catalogue',
      timestamp: new Date(),
    });

    await listing.save();

    return res.json({
      status: 'success',
      message: 'Product successfully published to storefront and visible to onboarded EPC companies!',
      data: listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] publish_reseller_listing error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. UNPUBLISH RESELLER LISTING ────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/listings/:id/unpublish
 */
const unpublish_reseller_listing = async (req, res) => {
  try {
    const resellerId = req.reseller?._id;
    const { id } = req.params;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Unauthorized reseller request' });
    }

    const listing = await ResellerListing.findOne({ _id: id, reseller_id: resellerId });
    if (!listing) return res.status(404).json({ status: 'error', message: 'Product listing not found' });

    listing.assignment_status = 'suspended';
    listing.status = 'paused';

    listing.audit_history.push({
      status: 'suspended',
      actor_type: 'reseller',
      actor_id: resellerId,
      notes: 'Reseller unpublished/suspended product listing from storefront',
      timestamp: new Date(),
    });

    await listing.save();

    return res.json({
      status: 'success',
      message: 'Product unpublished from storefront and EPC catalogue',
      data: listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] unpublish_reseller_listing error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 6. CREATE / UPDATE RESELLER LISTING (Legacy compatibility) ───────────────
const upsert_reseller_listing = async (req, res) => {
  try {
    const resellerId = req.reseller?._id || req.body.reseller_id;
    const { item_type, product_id, kit_id, selling_price_paise, allow_map_override, status } = req.body;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller_id is required' });
    }
    if (!item_type || !['product', 'kit'].includes(item_type)) {
      return res.status(400).json({ status: 'error', message: 'item_type must be product or kit' });
    }

    const result = await createOrUpdateResellerListing({
      reseller_id: resellerId,
      item_type,
      product_id: product_id || null,
      kit_id: kit_id || null,
      selling_price_paise,
      allow_map_override: Boolean(allow_map_override),
      status: status || 'active',
      actor_id: req.user?.id || req.reseller?._id || null,
      req,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        code: result.code,
        message: result.message,
        map_price_paise: result.map_price_paise,
        requested_price_paise: result.requested_price_paise,
      });
    }

    return res.json({
      status: 'success',
      message: 'Reseller storefront listing updated successfully',
      data: result.listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] upsert_reseller_listing error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

// ─── 7. LIST PRICING RULES (Admin) ────────────────────────────────────────────
const list_pricing_rules = async (req, res) => {
  try {
    const rules = await ResellerPricingRule.find({ status: 'active' })
      .populate('reseller_id', 'business_name email')
      .populate('product_id', 'name sku_code')
      .populate('kit_id', 'kit_name kit_code')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rules });
  } catch (error) {
    console.error('[reseller.pricing] list_pricing_rules error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 8. CREATE PRICING RULE (Admin) ───────────────────────────────────────────
const create_pricing_rule = async (req, res) => {
  try {
    const {
      scope_type,
      reseller_type_id,
      reseller_id,
      category_id,
      product_id,
      kit_id,
      min_margin_pct,
      max_markup_pct,
      default_commission_pct,
      map_price_paise,
    } = req.body;

    if (!scope_type || !['global', 'reseller_type', 'reseller', 'category', 'product', 'kit'].includes(scope_type)) {
      return res.status(400).json({ status: 'error', message: 'Valid scope_type is required' });
    }

    const rule = await ResellerPricingRule.create({
      scope_type,
      reseller_type_id: reseller_type_id || null,
      reseller_id: reseller_id || null,
      category_id: category_id || null,
      product_id: product_id || null,
      kit_id: kit_id || null,
      min_margin_pct: min_margin_pct != null ? Number(min_margin_pct) : 0,
      max_markup_pct: max_markup_pct != null ? Number(max_markup_pct) : 100,
      default_commission_pct: default_commission_pct != null ? Number(default_commission_pct) : 5,
      map_price_paise: map_price_paise != null ? Number(map_price_paise) : null,
      status: 'active',
      created_by: req.user?.id || null,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRICING_RULE_CREATE',
      entity_type: 'reseller_pricing_rules',
      entity_id: rule._id,
      after_snapshot: rule.toObject(),
      req,
    });

    return res.status(201).json({ status: 'success', message: 'Pricing rule created successfully', data: rule });
  } catch (error) {
    console.error('[reseller.pricing] create_pricing_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 9. DELETE PRICING RULE (Admin) ───────────────────────────────────────────
const delete_pricing_rule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid rule ID is required' });
    }

    const rule = await ResellerPricingRule.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRICING_RULE_DELETE',
      entity_type: 'reseller_pricing_rules',
      entity_id: id,
      before_snapshot: rule.toObject(),
      req,
    });

    return res.json({ status: 'success', message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('[reseller.pricing] delete_pricing_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_listings,
  purchase_reseller_product,
  update_reseller_margin,
  publish_reseller_listing,
  unpublish_reseller_listing,
  upsert_reseller_listing,
  list_pricing_rules,
  create_pricing_rule,
  delete_pricing_rule,
};
