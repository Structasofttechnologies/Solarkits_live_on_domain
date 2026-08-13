/**
 * epc.catalogue.handler.js
 *
 * Controller for EPC Catalogue View.
 * Enforces strict Tenant Isolation and Confidentiality:
 * - EPC users see ONLY products published by their assigned primary reseller.
 * - Displays the Final Selling Price (Reseller cost + Reseller Margin + Applicable GST).
 * - Base price, company margin, reseller cost, reseller margin, and admin bounds are STRICTLY OMITTED.
 *
 * Bug fixes applied:
 *   - Bug 2: route now has verify_auth middleware (handled in shop.route.js)
 *   - Bug 3: JWT claim is account_id (not _id) — fixed here
 */

const mongoose = require('mongoose');
const { ResellerListing, EpcAccount, EpcResellerRelationship, Reseller } = require('../../admin-panel/models/india_solarshop_db');
const { Product, ProjectCategory, ProjectSubcategory, Brand, IndustryType } = require('../../admin-panel/models/core_db');

/**
 * Resolve the EPC account from the authenticated request.
 * The JWT payload (set by verify_auth) has shape { account_id, company_id }.
 */
async function resolveEpcAccount(req) {
  // Bug 3 fix: use account_id from JWT, not _id
  const accountId = req.user?.account_id || req.user?._id || req.epc?._id;
  if (!accountId) return null;
  return EpcAccount.findOne({ _id: accountId, deleted_at: null }).lean();
}

/**
 * Resolve the primary reseller for an EPC account.
 * Tries (1) primary_reseller_id, (2) onboarded_by_reseller_id, (3) active relationship.
 */
async function resolveResellerId(epcAccount) {
  if (!epcAccount) return null;

  if (epcAccount.primary_reseller_id) return epcAccount.primary_reseller_id;
  if (epcAccount.onboarded_by_reseller_id) return epcAccount.onboarded_by_reseller_id;

  const rel = await EpcResellerRelationship.findOne({
    epc_id: epcAccount._id,
    status: 'active',
  }).lean();
  return rel ? rel.reseller_id : null;
}

// ─── GET EPC CATALOGUE ────────────────────────────────────────────────────────
/**
 * GET /api/india/v1/shop/epc-catalogue
 * Authenticated. Returns published products for the EPC user's reseller.
 * Query params: search, category_id, subcategory_id, brand_id, industry_type_id,
 *               min_price, max_price, sort (newest|price_asc|price_desc|title_asc|title_desc)
 */
const get_epc_catalogue = async (req, res) => {
  try {
    // 1. Resolve EPC account
    const epcAccount = await resolveEpcAccount(req);
    if (!epcAccount) {
      return res.status(401).json({
        status: 'error',
        code: 'EPC_AUTH_FAILED',
        message: 'EPC account not found. Please log in again.',
      });
    }

    // 2. Check EPC approval status
    if (epcAccount.status === 'pending') {
      return res.status(403).json({
        status: 'error',
        code: 'EPC_PENDING_APPROVAL',
        message: 'Your EPC account is awaiting admin approval. Products will be visible once approved.',
        contact_support: true,
      });
    }
    if (epcAccount.status === 'rejected') {
      return res.status(403).json({
        status: 'error',
        code: 'EPC_REJECTED',
        message: 'Your EPC account has been rejected. Please contact your reseller or admin.',
        contact_support: true,
      });
    }

    // 3. Resolve reseller
    const resellerId = await resolveResellerId(epcAccount);
    if (!resellerId) {
      return res.status(400).json({
        status: 'error',
        code: 'NO_RESELLER_ASSIGNED',
        message: 'No reseller has been assigned to your EPC account. Please contact your channel partner.',
        contact_support: true,
      });
    }

    // 4. Verify reseller is active
    const reseller = await Reseller.findOne({
      _id: resellerId,
      is_active: true,
      activation_status: 'active',
      deleted_at: null,
    }).lean();

    if (!reseller) {
      return res.status(403).json({
        status: 'error',
        code: 'RESELLER_INACTIVE',
        message: 'Your assigned reseller account is currently inactive. Please contact your channel partner.',
        contact_support: true,
      });
    }

    // 5. Build strict filter — ONLY published, active, in-stock listings for this reseller
    const filter = {
      reseller_id: new mongoose.Types.ObjectId(resellerId.toString()),
      assignment_status: 'published',
      status: 'active',
      stock_quantity: { $gt: 0 },
    };

    const {
      search,
      category_id,
      subcategory_id,
      brand_id,
      industry_type_id,
      min_price,
      max_price,
      sort,
    } = req.query;

    if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
      filter.category_id = new mongoose.Types.ObjectId(category_id);
    }
    if (subcategory_id && mongoose.Types.ObjectId.isValid(subcategory_id)) {
      filter.subcategory_id = new mongoose.Types.ObjectId(subcategory_id);
    }
    if (brand_id && mongoose.Types.ObjectId.isValid(brand_id)) {
      filter.brand_id = new mongoose.Types.ObjectId(brand_id);
    }
    if (industry_type_id && mongoose.Types.ObjectId.isValid(industry_type_id)) {
      filter.industry_type_id = new mongoose.Types.ObjectId(industry_type_id);
    }

    if (min_price || max_price) {
      filter.selling_price_paise = {};
      if (min_price) filter.selling_price_paise.$gte = Math.round(Number(min_price) * 100);
      if (max_price) filter.selling_price_paise.$lte = Math.round(Number(max_price) * 100);
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOption = { published_at: -1 };
    if (sort === 'price_asc') sortOption = { selling_price_paise: 1 };
    else if (sort === 'price_desc') sortOption = { selling_price_paise: -1 };
    else if (sort === 'title_asc') sortOption = { title: 1 };
    else if (sort === 'title_desc') sortOption = { title: -1 };

    // 6. Query listings
    const listings = await ResellerListing.find(filter)
      .populate({ path: 'product_id', model: Product, select: 'name sku_code description image specifications features' })
      .populate({ path: 'category_id', model: ProjectCategory, select: 'name' })
      .populate({ path: 'subcategory_id', model: ProjectSubcategory, select: 'name' })
      .populate({ path: 'brand_id', model: Brand, select: 'name logo' })
      .populate({ path: 'industry_type_id', model: IndustryType, select: 'name slug' })
      .sort(sortOption)
      .lean();

    // 7. SANITIZE — DO NOT EXPOSE cost_price, reseller_margin, base_price, company_margin
    const sanitizedCatalogue = listings.map((item) => {
      const p = item.product_id;
      const sellingPricePaise = item.selling_price_paise || 0;
      const taxesPaise = item.taxes_and_charges_paise || 0;
      const gstRate = item.tax_rate_pct || 18;

      // Compute base-before-tax so EPC can see how GST was calculated without exposing margins
      const priceBeforeTaxPaise = sellingPricePaise - taxesPaise;

      return {
        id: item._id,
        listing_id: item._id,
        item_type: item.item_type || 'product',
        product_id: p?._id || item.product_id,

        // Identifiers
        title: item.title || p?.name || 'Solar Product',
        sku_code: p?.sku_code || null,
        description: item.description || p?.description || '',
        features: p?.features || [],
        image_url: item.image_url || p?.image || null,
        specifications: item.specifications || p?.specifications || {},

        // Classification
        category: item.category_id ? { id: item.category_id._id, name: item.category_id.name } : null,
        subcategory: item.subcategory_id ? { id: item.subcategory_id._id, name: item.subcategory_id.name } : null,
        brand: item.brand_id ? { id: item.brand_id._id, name: item.brand_id.name, logo: item.brand_id.logo } : null,
        industry_type: item.industry_type_id ? { id: item.industry_type_id._id, name: item.industry_type_id.name, slug: item.industry_type_id.slug } : null,

        // Stock
        stock_quantity: item.stock_quantity,
        availability: item.stock_quantity > 10 ? 'In Stock' : item.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock',
        availability_label: item.stock_quantity > 10 ? 'in_stock' : item.stock_quantity > 0 ? 'low_stock' : 'out_of_stock',

        // PRICE — Final reseller selling price only (confidential fields omitted completely)
        selling_price_paise: sellingPricePaise,
        selling_price_inr: (sellingPricePaise / 100).toFixed(2),
        price_before_tax_paise: priceBeforeTaxPaise,
        price_before_tax_inr: (priceBeforeTaxPaise / 100).toFixed(2),
        taxes_and_charges_paise: taxesPaise,
        taxes_and_charges_inr: (taxesPaise / 100).toFixed(2),
        gst_rate_pct: gstRate,
        currency: 'INR',

        // Reseller info (public facing)
        reseller_name: reseller.business_name,

        // Status
        publication_status: item.assignment_status,
        listing_status: item.status,
        published_at: item.published_at,
      };
    });

    return res.json({
      status: 'success',
      reseller_business_name: reseller.business_name,
      epc_name: epcAccount.name,
      total_items: sanitizedCatalogue.length,
      data: sanitizedCatalogue,
    });
  } catch (error) {
    console.error('[epc.catalogue] get_epc_catalogue error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── GET EPC CATALOGUE STATUS ─────────────────────────────────────────────────
/**
 * GET /api/india/v1/shop/epc-catalogue/status
 * Returns onboarding status and diagnostic reasons for empty catalogue.
 */
const get_epc_catalogue_status = async (req, res) => {
  try {
    const epcAccount = await resolveEpcAccount(req);
    if (!epcAccount) {
      return res.status(401).json({ status: 'error', message: 'EPC account not found.' });
    }

    const resellerId = await resolveResellerId(epcAccount);
    let resellerInfo = null;
    let publishedCount = 0;

    if (resellerId) {
      const reseller = await Reseller.findOne({ _id: resellerId, deleted_at: null }).lean();
      if (reseller) {
        resellerInfo = {
          id: reseller._id,
          business_name: reseller.business_name,
          activation_status: reseller.activation_status,
          is_active: reseller.is_active,
          email: reseller.email,
          mobile: reseller.mobile,
        };
        publishedCount = await ResellerListing.countDocuments({
          reseller_id: new mongoose.Types.ObjectId(resellerId.toString()),
          assignment_status: 'published',
          status: 'active',
          stock_quantity: { $gt: 0 },
        });
      }
    }

    return res.json({
      status: 'success',
      data: {
        epc_status: epcAccount.status,
        onboarding_source: epcAccount.onboarding_source || 'direct',
        reseller_assigned: !!resellerId,
        reseller: resellerInfo,
        published_products_count: publishedCount,
        can_view_catalogue:
          epcAccount.status === 'approved' &&
          !!resellerId &&
          resellerInfo?.is_active &&
          resellerInfo?.activation_status === 'active',
      },
    });
  } catch (error) {
    console.error('[epc.catalogue] get_epc_catalogue_status error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  get_epc_catalogue,
  get_epc_catalogue_status,
};
