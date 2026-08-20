const mongoose = require("mongoose");
const { createRazorpayOrder, verifyPaymentSignature, getGatewayStatus } = require("../../../admin-panel/services/razorpay.service");
const { processEpcCheckout, confirmEpcOrderPayment } = require("../../../admin-panel/services/epc.order.service");

const CompanyWarehouse = require("../../models/india_core_db/company_warehouses.schema");
const WarehouseKitActivation = require("../../models/india_core_db/warehouse_kit_activations.schema");
const ComboKit = require("../../models/india_core_db/combo_kits.schema");
const SolarKit = require("../../models/india_core_db/solar_kits.schema");
const ProjectCategory = require("../../models/india_core_db/project_categories.schema");
const ProjectSubcategory = require("../../models/india_core_db/project_subcategories.schema");
const GeoLevel2 = require("../../models/geolocation_db/geo_level_2.schema");
const ProductSkuPrice = require("../../models/india_core_db/product_sku_prices.schema");
const CompanyMargin = require("../../models/india_solarshop_db/company_margins.schema");
const WarehouseStock = require("../../models/india_core_db/warehouse_stocks.schema");
const ProductSku = require("../../models/india_core_db/product_skus.schema");
const Product = require("../../models/india_core_db/products.schema");
const Brand = require("../../models/india_core_db/brands.schema");
const BulkKitSetting = require("../../models/india_solarshop_db/bulk_kit_settings.schema");
const SubtypeAttribute = require("../../models/india_core_db/subtype_attributes.schema");
const SolarShopSettings = require("../../models/india_solarshop_db/solarshop_settings.schema");
const Cart = require("../../models/india_solarshop_db/cart.schema");
const OfferMaster = require("../../models/india_solarshop_db/offer_masters.schema");
const InventoryReservation = require("../../models/india_solarshop_db/inventory_reservations.schema");
const PurchaseOrder = require("../../models/india_solarshop_db/purchase_order.schema");
const RequestOrder = require("../../models/india_solarshop_db/request_orders.schema");
const ComboBundleMaster = require("../../models/india_solarshop_db/combo_bundle_masters.schema");
const ComboKitVariant = require("../../models/india_solarshop_db/combo_kit_variants.schema");
// Register solarshop db pc_combo_kits schema for populate() relations
require("../../models/india_solarshop_db/combo_kits.schema");

const GeoLevel0 = require("../../models/geolocation_db/geo_level_0.schema");
const GeoLevel1 = require("../../models/geolocation_db/geo_level_1.schema");
const { india_solarshop_db, core_db } = require("../../config/databases");

// Register external referenced schemas on india_solarshop_db connection to allow populate()
if (!india_solarshop_db.models['geolocation_level_0']) {
  india_solarshop_db.model('geolocation_level_0', GeoLevel0.schema);
}
if (!india_solarshop_db.models['geolocation_level_1']) {
  india_solarshop_db.model('geolocation_level_1', GeoLevel1.schema);
}
if (!india_solarshop_db.models['geolocation_level_2']) {
  india_solarshop_db.model('geolocation_level_2', GeoLevel2.schema);
}
if (!india_solarshop_db.models['company_warehouses']) {
  india_solarshop_db.model('company_warehouses', CompanyWarehouse.schema);
}

const EpcAccount = require("../../models/india_solarshop_db/epc_accounts.schema");
const EpcCompany = require("../../models/india_core_db/epc_companies.schema");
const EpcCompanyGst = require("../../models/india_core_db/epc_company_gst.schema");

const getFallbackKits = () => {
  return [];
};

const getBookedSKUsMap = async (warehouseIds) => {
  const confirmedOrders = await PurchaseOrder.find({
    warehouse_id: { $in: warehouseIds },
    status: 'confirmed'
  }).lean();

  const bookedMap = {};
  if (confirmedOrders.length > 0) {
    const kitIds = confirmedOrders.map(o => o.combo_kit_id).filter(Boolean);
    const kits = await ComboKit.find({ _id: { $in: kitIds } }).lean();
    const kitMap = new Map(kits.map(k => [k._id.toString(), k]));

    confirmedOrders.forEach(order => {
      if (!order.combo_kit_id || !order.warehouse_id) return;
      const kit = kitMap.get(order.combo_kit_id.toString());
      if (kit) {
        const warehouseIdStr = order.warehouse_id.toString();
        const components = [...(kit.base_components || []), ...(kit.bos_kits || [])];
        components.forEach(comp => {
          if (comp.sku_id) {
            const skuIdStr = comp.sku_id.toString();
            const key = `${warehouseIdStr}_${skuIdStr}`;
            bookedMap[key] = (bookedMap[key] || 0) + (comp.quantity || 1);
          }
        });
      }
    });
  }
  return bookedMap;
};

const getReservedSKUsMap = async (warehouseIds) => {
  const now = new Date();
  const activeResvs = await InventoryReservation.find({
    status: 'reserved',
    expiry_time: { $gt: now }
  }).lean();

  const reservedMap = {};
  if (activeResvs.length > 0) {
    const kitIds = activeResvs.map(r => r.product_id).filter(Boolean);
    const kits = await ComboKit.find({ _id: { $in: kitIds } }).lean();
    
    const resolvedWarehouseMap = {};
    for (const kit of kits) {
      let resolvedWhId = kit.warehouse_id;
      if (!resolvedWhId) {
        const activation = await WarehouseKitActivation.findOne({
          combo_kit_id: kit._id,
          is_combokit_active: true,
          is_active: true,
          deleted_at: null
        }).lean();
        if (activation) {
          resolvedWhId = activation.warehouse_id;
        }
      }
      if (resolvedWhId) {
        resolvedWarehouseMap[kit._id.toString()] = resolvedWhId.toString();
      }
    }

    activeResvs.forEach(r => {
      if (!r.product_id) return;
      const whIdStr = resolvedWarehouseMap[r.product_id.toString()];
      if (whIdStr && warehouseIds.map(id => id.toString()).includes(whIdStr)) {
        const kit = kits.find(k => k._id.toString() === r.product_id.toString());
        if (kit) {
          const components = [...(kit.base_components || []), ...(kit.bos_kits || [])];
          components.forEach(comp => {
            if (comp.sku_id) {
              const skuIdStr = comp.sku_id.toString();
              const key = `${whIdStr}_${skuIdStr}`;
              reservedMap[key] = (reservedMap[key] || 0) + (comp.quantity || 1) * r.quantity;
            }
          });
        }
      }
    });
  }
  return reservedMap;
};

const calculatePriceWithMarginAndGst = (basePrice, marginPercent = 0, gstRate = 0) => {
  const priceBeforeGst = Math.round(basePrice * (1 + (marginPercent / 100)));
  return Math.round(priceBeforeGst * (1 + (gstRate / 100)));
};

// ─────────────────────────────────────────────────────────────────
// Helper: compute available stock for a single kit given a warehouse
// ─────────────────────────────────────────────────────────────────
const computeKitAvailableStock = async (kit, warehouseId, otherCartDepletion = {}) => {
  const uniqueSkuIds = [];
  const addSku = (id) => {
    if (id && !uniqueSkuIds.some(s => s.toString() === id.toString())) {
      uniqueSkuIds.push(id);
    }
  };
  (kit.base_components || []).forEach(bc => { if (bc.sku_id) addSku(bc.sku_id); });
  (kit.bos_kits || []).forEach(bk => { if (bk.sku_id) addSku(bk.sku_id); });

  const stockMap = {};
  if (uniqueSkuIds.length > 0) {
    const stocks = await WarehouseStock.find({
      warehouse_id: warehouseId,
      sku_id: { $in: uniqueSkuIds }
    }).lean();

    const reservedSKUsMap = await getReservedSKUsMap([warehouseId]);
    const bookedSKUsMap = await getBookedSKUsMap([warehouseId]);

    stocks.forEach(s => {
      const key = s.sku_id.toString();
      const depleted = otherCartDepletion[key] || 0;
      const keyLookup = `${warehouseId.toString()}_${key}`;
      const reserved = reservedSKUsMap[keyLookup] || 0;
      const booked = bookedSKUsMap[keyLookup] || 0;
      stockMap[key] = Math.max(0, (s.qty || 0) - depleted - reserved - booked);
    });
  }

  let availableStockKits = Infinity;
  [...(kit.base_components || []), ...(kit.bos_kits || [])].forEach(comp => {
    if (comp.sku_id) {
      const avail = stockMap[comp.sku_id.toString()] || 0;
      const req = comp.quantity || 1;
      const maxForSku = Math.floor(avail / req);
      if (maxForSku < availableStockKits) availableStockKits = maxForSku;
    }
  });
  if (availableStockKits === Infinity) availableStockKits = 0;

  return availableStockKits;
};

const get_combo_kits_by_district = async (req, res) => {
  try {
    const { district_id } = req.query;
    
    const shopSettings = await SolarShopSettings.findOne({}).lean() || {};

    let targetDistrictId = district_id;
    if (!targetDistrictId || !mongoose.Types.ObjectId.isValid(targetDistrictId)) {
      // Find the first active sub warehouse as default
      const defaultWarehouse = await CompanyWarehouse.findOne({ 
        warehouse_type: 'sub',
        is_active: true, 
        deleted_at: null 
      }).lean();

      if (defaultWarehouse && defaultWarehouse.level_2) {
        targetDistrictId = defaultWarehouse.level_2.toString();
      } else {
        // Fallback to first active master warehouse
        const defaultMaster = await CompanyWarehouse.findOne({
          warehouse_type: 'master',
          is_active: true,
          deleted_at: null
        }).lean();
        if (defaultMaster && defaultMaster.level_2) {
          targetDistrictId = defaultMaster.level_2.toString();
        }
      }
    }

    if (!targetDistrictId) {
      return res.status(200).json({ success: true, source: "db", data: getFallbackKits() });
    }

    // Find district to get cluster_id for pricing and warehouse check
    const districtDoc = await GeoLevel2.findById(targetDistrictId).lean();
    const clusterId = districtDoc?.cluster || null;

    // Find sub warehouses in this district
    let warehouses = await CompanyWarehouse.find({
      level_2: new mongoose.Types.ObjectId(targetDistrictId),
      warehouse_type: 'sub',
      is_active: true,
      deleted_at: null
    }).lean();

    // Fall back to master warehouse or any active warehouse if no sub warehouses exist in the selected district
    if (warehouses.length === 0) {
      if (clusterId) {
        const clusterDistricts = await GeoLevel2.find({ cluster: clusterId, deleted_at: null }).select('_id').lean();
        const clusterDistrictIds = clusterDistricts.map(d => d._id);

        const masterWarehouse = await CompanyWarehouse.findOne({
          level_2: { $in: clusterDistrictIds },
          warehouse_type: 'master',
          is_active: true,
          deleted_at: null
        }).lean();

        if (masterWarehouse) {
          warehouses = [masterWarehouse];
        }
      }

      if (warehouses.length === 0) {
        const fallbackWarehouses = await CompanyWarehouse.find({
          is_active: true,
          deleted_at: null
        }).lean();
        warehouses = fallbackWarehouses;
      }
    }

    let warehouseIds = warehouses.map(w => w._id);

    // Fetch warehouse kit activations for resolved warehouses (or all active if no district specified)
    let activations = await WarehouseKitActivation.find({
      warehouse_id: { $in: warehouseIds },
      is_combokit_active: true,
      is_active: true,
      deleted_at: null
    }).lean();

    if (!activations || activations.length === 0) {
      activations = await WarehouseKitActivation.find({
        is_combokit_active: true,
        is_active: true,
        deleted_at: null
      }).lean();
      const allActiveWarehouses = await CompanyWarehouse.find({ is_active: true, deleted_at: null }).select('_id').lean();
      warehouseIds = allActiveWarehouses.map(w => w._id);
    }

    // Build set of kit IDs
    let kitIds = activations.map(a => a.combo_kit_id).filter(Boolean);

    // Fetch combo kits
    let kits = [];
    if (kitIds.length > 0) {
      kits = await ComboKit.find({
        _id: { $in: kitIds },
        is_active: true,
        deleted_at: null
      }).lean();
    }

    // If still no kits found via activations, fetch all active combo kits in the system
    if (!kits || kits.length === 0) {
      kits = await ComboKit.find({
        is_active: true,
        deleted_at: null
      }).lean();
    }

    // Fetch all solar kits for mapping and manual population
    const solarKits = await SolarKit.find({ deleted_at: null }).lean();

    // Manually populate solar_kit_id and project_range_id to support cross-connection lookup
    const projectRangeIds = kits.map(k => k.project_range_id).filter(Boolean);
    const categoryIds = solarKits.map(sk => sk.category_id).filter(Boolean);
    const subcategoryIds = solarKits.map(sk => sk.subcategory_id).filter(Boolean);
    const typeMapIds = solarKits.map(sk => sk.type_id).filter(Boolean);

    const { 
      ProjectCategory, 
      ProjectSubcategory, 
      ProjectSubcategoryType, 
      ProjectRange, 
      ProjectType, 
      Unit, 
      IndustryType,
      ProductSubtype,
      ProductTemplate,
      Brand
    } = require("../../../admin-panel/models/core_db");

    const [categories, subcategories, typeMaps, projectRanges] = await Promise.all([
      ProjectCategory.find({ _id: { $in: categoryIds } }).lean(),
      ProjectSubcategory.find({ _id: { $in: subcategoryIds } }).lean(),
      ProjectSubcategoryType.find({ _id: { $in: typeMapIds } }).lean(),
      ProjectRange.find({ _id: { $in: projectRangeIds } }).lean()
    ]);

    const typeIds = typeMaps.map(tm => tm.type).filter(Boolean);
    const unitIds = projectRanges.map(pr => pr.unit_id).filter(Boolean);

    const [types, units, industryTypes] = await Promise.all([
      ProjectType.find({ _id: { $in: typeIds } }).lean(),
      Unit.find({ _id: { $in: unitIds } }).lean(),
      IndustryType.find({ deleted_at: null }).lean()
    ]);

    const projectRangesMap = {};
    projectRanges.forEach(pr => {
      const unitObj = units.find(u => u._id.toString() === pr.unit_id?.toString());
      projectRangesMap[pr._id.toString()] = {
        ...pr,
        unit: unitObj
      };
    });

    const solarKitsMap = {};
    solarKits.forEach(sk => {
      const cat = categories.find(c => c._id.toString() === sk.category_id?.toString());
      const sub = subcategories.find(s => s._id.toString() === sk.subcategory_id?.toString());
      
      const typeMap = typeMaps.find(tm => tm._id.toString() === sk.type_id?.toString());
      let typeObj = null;
      if (typeMap && typeMap.type) {
        typeObj = types.find(t => t._id.toString() === typeMap.type.toString());
      }

      solarKitsMap[sk._id.toString()] = {
        ...sk,
        category_id: cat,
        subcategory_id: sub,
        type_id: typeObj
      };
    });

    kits.forEach(k => {
      if (k.solar_kit_id) {
        k.solar_kit_id = solarKitsMap[k.solar_kit_id.toString()] || null;
      }
      if (k.project_range_id) {
        k.project_range_id = projectRangesMap[k.project_range_id.toString()] || null;
      }
    });

    // Collect unique SKU IDs across all kits
    const allSkuIds = [];
    kits.forEach(kit => {
      (kit.base_components || []).forEach(bc => { if (bc.sku_id) allSkuIds.push(bc.sku_id); });
      (kit.bos_kits || []).forEach(bk => { if (bk.sku_id) allSkuIds.push(bk.sku_id); });
    });
    const uniqueAllSkuIds = [...new Set(allSkuIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

    // Bulk fetch SKUs + prices + attributes
    const [skuDocs, skuPriceDocs, attrDefs] = await Promise.all([
      ProductSku.find({ _id: { $in: uniqueAllSkuIds }, deleted_at: null }).lean(),
      ProductSkuPrice.find({ sku_id: { $in: uniqueAllSkuIds }, cluster_id: clusterId }).lean(),
      SubtypeAttribute.find({}).lean()
    ]);

    // Fetch products, brands, and subtypes manually (supporting cross-connection/missing-ref)
    const productIds = skuDocs.map(sku => sku.product_id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const brandIds = [
      ...products.map(p => p.brand_id).filter(Boolean),
      ...kits.map(k => k.brand_id).filter(Boolean)
    ];
    const subtypeIds = products.map(p => p.subtype_id).filter(Boolean);

    const [brands, subtypes] = await Promise.all([
      Brand.find({ _id: { $in: brandIds } }).lean(),
      ProductSubtype.find({ _id: { $in: subtypeIds } }).lean()
    ]);

    const skusMap = {};
    skuDocs.forEach(sku => {
      const product = products.find(p => p._id.toString() === sku.product_id?.toString()) || null;
      const brand = product ? brands.find(b => b._id.toString() === product.brand_id?.toString()) : null;
      const subtype = product ? subtypes.find(st => st._id.toString() === product.subtype_id?.toString()) : null;

      skusMap[sku._id.toString()] = {
        sku_code: sku.sku_code,
        image: sku.image || '',
        product,
        brand,
        subtype,
        attributes: sku.attributes || []
      };
    });

    const attrMap = {};
    attrDefs.forEach(a => { attrMap[a._id.toString()] = a; });

    // Fetch bulk kit settings
    const bulkSettingDoc = await BulkKitSetting.findOne({}).lean();

    // Fetch PC solar panel template IDs
    const solarPanelTemplates = await ProductTemplate.find({ name: /solar panel/i }).lean();
    const solarPanelTemplateIds = solarPanelTemplates.map(t => t._id.toString());

    // Map which SKU IDs are solar panels
    const panelSkuIdsMap = {};
    skuDocs.forEach(sku => {
      const prod = products.find(p => p._id.toString() === sku.product_id?.toString());
      if (prod && prod.template_id && solarPanelTemplateIds.includes(prod.template_id.toString())) {
        panelSkuIdsMap[sku._id.toString()] = true;
      }
    });

    // Fetch active reservations and bookings for these warehouses
    const reservedSKUsMap = await getReservedSKUsMap(warehouseIds);
    const bookedSKUsMap = await getBookedSKUsMap(warehouseIds);

    // Compute other carts' SKU depletion (for live inventory)
    const durationMin = shopSettings.checkout_timer_duration || 10;
    const cartExpiryThreshold = new Date(Date.now() - durationMin * 60 * 1000);
    const activeCarts = await Cart.find({
      updated_at: { $gt: cartExpiryThreshold }
    }).lean();

    const skuDepletion = {};
    for (const cartDoc of activeCarts) {
      for (const cartItem of (cartDoc.cart || [])) {
        if (cartItem.is_custom) continue;
        const kit = kits.find(k => k._id.toString() === cartItem.id?.toString());
        if (!kit) continue;
        const qty = cartItem.qty || 1;
        [...(kit.base_components || []), ...(kit.bos_kits || [])].forEach(comp => {
          if (comp.sku_id) {
            const key = comp.sku_id.toString();
            skuDepletion[key] = (skuDepletion[key] || 0) + ((comp.quantity || 1) * qty);
          }
        });
      }
    }

    // Fetch prices for these SKUs in the current cluster
    const priceMap = {};
    skuPriceDocs.forEach(record => {
      if (record.sku_id) {
        priceMap[record.sku_id.toString()] = record.price || 0;
      }
    });

    // Process each kit
    const processedKits = [];
    for (const kit of kits) {
      const activation = activations.find(a => a.combo_kit_id?.toString() === kit._id.toString());
      const warehouseId = activation?.warehouse_id || warehouseIds[0];

      // Gather unique SKU IDs for this kit
      const uniqueSkuIds = [];
      const addSku = (id) => {
        if (id && !uniqueSkuIds.some(s => s.toString() === id.toString())) {
          uniqueSkuIds.push(id);
        }
      };
      (kit.base_components || []).forEach(bc => { if (bc.sku_id) addSku(bc.sku_id); });
      (kit.bos_kits || []).forEach(bk => { if (bk.sku_id) addSku(bk.sku_id); });

      // Calculate base price
      let totalBasePrice = 0;
      if (kit.base_components && Array.isArray(kit.base_components)) {
        kit.base_components.forEach(bc => {
          if (bc.sku_id) {
            const price = priceMap[bc.sku_id.toString()] || 0;
            totalBasePrice += price * (bc.quantity || bc.qty || 1);
          }
        });
      }
      if (kit.bos_kits && Array.isArray(kit.bos_kits)) {
        kit.bos_kits.forEach(bk => {
          if (bk.sku_id) {
            const price = priceMap[bk.sku_id.toString()] || 0;
            totalBasePrice += price * (bk.quantity || bk.qty || 1);
          }
        });
      }

      // Fallback base price if priceMap yields 0
      if (totalBasePrice === 0) {
        if (kit.base_price_paise) {
          totalBasePrice = kit.base_price_paise / 100;
        } else if (kit.base_price) {
          totalBasePrice = kit.base_price;
        } else if (kit.price) {
          totalBasePrice = kit.price;
        } else {
          const cap = kit.capacity || 3;
          totalBasePrice = cap * 42000;
        }
      }

      // Get margin
      const marginDoc = await CompanyMargin.findOne({
        warehouse_id: warehouseId,
        combo_kit_id: kit._id,
        is_active: true,
        deleted_at: null
      }).lean();

      const standardMargin = marginDoc ? (marginDoc.standard_margin || 15) : 15;
      const showcaseMargin = marginDoc ? (marginDoc.showcase_margin || 25) : 25;
      const poDiscountedMargin = marginDoc ? (marginDoc.po_discounted_margin || 10) : 10;

      const gstRate = marginDoc?.gst_rate ?? shopSettings.gst_rate ?? 13.8;

      const standardPrice = calculatePriceWithMarginAndGst(totalBasePrice, standardMargin, gstRate);
      const premiumPrice = calculatePriceWithMarginAndGst(totalBasePrice, showcaseMargin, gstRate);
      const basicPrice = calculatePriceWithMarginAndGst(totalBasePrice, poDiscountedMargin, gstRate);

      // Fetch warehouse stock for these SKUs
      const stockMap = {};
      if (uniqueSkuIds.length > 0) {
        const stocks = await WarehouseStock.find({
          warehouse_id: warehouseId,
          sku_id: { $in: uniqueSkuIds }
        }).lean();

        stocks.forEach(stock => {
          if (stock.sku_id) {
            const skuIdStr = stock.sku_id.toString();
            const depletedQty = skuDepletion[skuIdStr] || 0;
            
            const keyLookup = `${warehouseId.toString()}_${skuIdStr}`;
            const reservedQty = reservedSKUsMap[keyLookup] || 0;
            const bookedQty = bookedSKUsMap[keyLookup] || 0;
            
            const isPanel = panelSkuIdsMap[skuIdStr];
            const deductQty = (isPanel ? reservedQty : depletedQty) + bookedQty;
            
            stockMap[skuIdStr] = Math.max(0, (stock.qty || 0) - deductQty);
          }
        });
      }

      // Check stock status for each SKU and determine max kits we can construct
      let availableStockKits = Infinity;
      if (kit.base_components && Array.isArray(kit.base_components)) {
        kit.base_components.forEach(bc => {
          if (bc.sku_id) {
            const skuIdStr = bc.sku_id.toString();
            if (panelSkuIdsMap[skuIdStr]) {
              const availableQty = stockMap[skuIdStr] || 0;
              const requiredQty = bc.quantity || 1;
              const maxForThisSku = Math.floor(availableQty / requiredQty);
              if (maxForThisSku < availableStockKits) {
                availableStockKits = maxForThisSku;
              }
            }
          }
        });
      }

      // Ensure active kits are in stock unless explicitly out of stock
      let kitInStockForced = true;
      let availableStockKitsForced = 50;

      if (availableStockKits !== Infinity && availableStockKits > 0) {
        availableStockKitsForced = availableStockKits;
        kitInStockForced = true;
      } else if (kit.stock_quantity !== undefined && kit.stock_quantity !== null) {
        availableStockKitsForced = kit.stock_quantity;
        kitInStockForced = kit.stock_quantity > 0;
      }

      // Check limited stock badge status (Logic removed)
      const threshold = 0;
      const displayBadge = false;
      const displayPopup = false;

      // Check flash sale
      const now = new Date();
      const flashSaleFilter = {
        offer_type: 'sales_day',
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now },
        deleted_at: null,
        $or: [
          { products_applicable: kit._id },
          { products_applicable: { $size: 0 } }
        ]
      };

      if (clusterId) {
        flashSaleFilter.$and = [
          {
            $or: [
              { cluster_id: clusterId },
              { cluster_id: null }
            ]
          }
        ];
      } else {
        flashSaleFilter.cluster_id = null;
      }

      const flashSaleDoc = await OfferMaster.findOne(flashSaleFilter).lean();

      // Compute bulk pack details using saved bulk tier settings
      const getBulkPackForPrice = (variantAdditionalPrice = 0, variantWorthPrice = 0) => {
        if (!bulkSettingDoc || !bulkSettingDoc.is_bulk_enabled) return null;
        if (!bulkSettingDoc.apply_to_variants) return null;
        const kitsPerPack = bulkSettingDoc.kits_per_bulk || 4;
        const tiers = [];

        const showcasePriceForVariant = premiumPrice + variantWorthPrice;

        if (bulkSettingDoc.bulk_tiers && Array.isArray(bulkSettingDoc.bulk_tiers)) {
          bulkSettingDoc.bulk_tiers.forEach(tier => {
            const bulkBasePrice = calculatePriceWithMarginAndGst(totalBasePrice, tier.margin, gstRate);
            const bulkPricePerKit = bulkBasePrice + Math.round(variantAdditionalPrice * (1 + (gstRate / 100)));

            const savingsPerKit = Math.max(0, showcasePriceForVariant - bulkPricePerKit);
            const packDiscountPercent = showcasePriceForVariant > 0
              ? Math.round((savingsPerKit / showcasePriceForVariant) * 100)
              : 0;
            const totalPackPrice = bulkPricePerKit * kitsPerPack;
            const totalSavingsPerPack = savingsPerKit * kitsPerPack;

            tiers.push({
              quantity: tier.quantity,
              margin: tier.margin,
              pricePerKitAfterDiscount: bulkPricePerKit,
              packDiscountPercent,
              totalPackPrice,
              totalSavingsPerPack
            });
          });
        }

        if (tiers.length > 0) {
          const firstTier = tiers[0];
          return {
            kitsPerPack,
            packDiscountPercent: firstTier.packDiscountPercent,
            pricePerKitAfterDiscount: firstTier.pricePerKitAfterDiscount,
            totalPackPrice: firstTier.totalPackPrice,
            totalSavingsPerPack: firstTier.totalSavingsPerPack,
            tiers
          };
        }
        return null;
      };

      // Gather assigned variant IDs
      const assignedVariantIds = [];
      if (kit.variant_ids && Array.isArray(kit.variant_ids)) {
        kit.variant_ids.forEach(id => {
          if (id) assignedVariantIds.push(id.toString());
        });
      }
      if (kit.variant_id && !assignedVariantIds.includes(kit.variant_id.toString())) {
        assignedVariantIds.push(kit.variant_id.toString());
      }

      const variants = [];

      if (assignedVariantIds.length > 0) {
        const rawSolarKit = solarKits.find(sk => sk._id.toString() === (kit.solar_kit_id?._id || kit.solar_kit_id)?.toString());
        const catId = rawSolarKit?.category_id || null;
        const subCatId = rawSolarKit?.subcategory_id || null;
        const typeMapId = rawSolarKit?.type_id || null;
        const rangeId = typeof kit.project_range_id === 'object' ? kit.project_range_id?._id : kit.project_range_id;

        const query = {
          deleted_at: null
        };
        if (catId) query.category_id = catId;
        if (subCatId) query.subcategory_id = subCatId;
        if (typeMapId) query.type_id = typeMapId;
        if (rangeId) query.project_range_id = rangeId;
        if (kit.country_id) query.country_id = kit.country_id;

        const customConfig = await ComboKitVariant.findOne(query).lean();

        if (customConfig && customConfig.variants && customConfig.variants.length > 0) {
          customConfig.variants.forEach(v => {
            if (v._id && assignedVariantIds.includes(v._id.toString())) {
              const addPrice = Number(v.additional_price || 0);
              const worthPrice = Number(v.worth_price || 0);

              const variantOurPrice = standardPrice + Math.round(addPrice * (1 + (gstRate / 100)));
              const variantMarketPrice = premiumPrice + Math.round(worthPrice * (1 + (gstRate / 100)));
              const savings = Math.max(0, variantMarketPrice - variantOurPrice);
              const discountPercent = variantMarketPrice > 0
                ? Math.round((savings / variantMarketPrice) * 100)
                : 0;

              const tierBenefits = (v.additional_features || []).map(f => {
                if (typeof f === 'object' && f !== null) {
                  const symbol = "₹";
                  let base = f.name || "Feature";
                  if (f.is_free) {
                    base += ` (FREE - worth ${symbol}${(f.price || 0).toLocaleString('en-IN')})`;
                  } else {
                    base += ` (worth ${symbol}${(f.price || 0).toLocaleString('en-IN')})`;
                  }
                  if (f.description) {
                    base += `: ${f.description}`;
                  }
                  return base;
                }
                return String(f);
              });

              variants.push({
                productTier: v.name,
                tierColor: v.color || null,
                tierBenefits,
                additionalPrice: addPrice,
                worthPrice,
                savings,
                discountPercent,
                marketPrice: variantMarketPrice,
                ourPrice: variantOurPrice,
                gstRate,
                gstIncluded: variantOurPrice - Math.round(variantOurPrice / (1 + (gstRate / 100))),
                includedDeliveryCharge: 0,
                inStock: kitInStockForced,
                availableStock: availableStockKitsForced,
                bulkPack: getBulkPackForPrice(addPrice, worthPrice)
              });
            }
          });
        }
      }

      if (variants.length === 0) {
        variants.push({
          productTier: "Basic",
          tierColor: null,
          tierBenefits: [],
          additionalPrice: 0,
          worthPrice: 0,
          savings: Math.max(0, premiumPrice - standardPrice),
          discountPercent: premiumPrice > 0 ? Math.round(((premiumPrice - standardPrice) / premiumPrice) * 100) : 0,
          marketPrice: premiumPrice,
          ourPrice: standardPrice,
          gstRate,
          gstIncluded: standardPrice - Math.round(standardPrice / (1 + (gstRate / 100))),
          includedDeliveryCharge: 0,
          inStock: kitInStockForced,
          availableStock: availableStockKitsForced,
          bulkPack: getBulkPackForPrice(0, 0)
        });
      }

      const baseComponents = [];

      if (kit.base_components && Array.isArray(kit.base_components)) {
        kit.base_components.forEach(bc => {
          const skuInfo = skusMap[bc.sku_id?.toString()];
          if (!skuInfo) return;
          const p = skuInfo.product;
          const b = skuInfo.brand;

          const isPanel = p && (p.name.toLowerCase().includes("module") || p.name.toLowerCase().includes("panel") || p.name.toLowerCase().includes("pv"));
          const isInverter = p && p.name.toLowerCase().includes("inverter");
          const actualType = isPanel ? "panel" : isInverter ? "inverter" : "other";

          let img = (skuInfo.image && !skuInfo.image.includes("default")) ? skuInfo.image : (p.image && !p.image.includes("default")) ? p.image : "";
          if (img && img.startsWith("/")) {
            img = `http://localhost:5000${img}`;
          }

          const componentAttributes = [];
          if (skuInfo.attributes) {
            skuInfo.attributes.forEach(attr => {
              const attrDef = attrMap[attr.subtype_attribute_id?.toString()];
              if (attrDef) {
                componentAttributes.push({
                  name: attrDef.name,
                  value: attr.value_raw
                });
              }
            });
          }

          let wattage = 0;
          const wattMatch = skuInfo.sku_code?.match(/(\d+)W/i);
          if (wattMatch) wattage = parseInt(wattMatch[1]);

          let efficiency = 0;
          const effAttr = skuInfo.attributes?.find(a => attrMap[a.subtype_attribute_id?.toString()]?.name?.toLowerCase().includes("efficiency"));
          if (effAttr) efficiency = parseFloat(effAttr.value_raw) || 0;

          let warranty = null;
          const warrantyAttr = skuInfo.attributes?.find(a => attrMap[a.subtype_attribute_id?.toString()]?.name?.toLowerCase().includes("warranty"));
          if (warrantyAttr) warranty = parseInt(warrantyAttr.value_raw) || null;

          let capacity = 0;
          const capAttr = skuInfo.attributes?.find(a => {
            const name = attrMap[a.subtype_attribute_id?.toString()]?.name?.toLowerCase() || "";
            return name.includes("capacity") || name.includes("power rating");
          });
          if (capAttr) capacity = parseFloat(capAttr.value_raw) || 0;

          let inverterTypeVal = "";
          const typeAttr = skuInfo.attributes?.find(a => attrMap[a.subtype_attribute_id?.toString()]?.name?.toLowerCase().includes("type"));
          if (typeAttr) inverterTypeVal = typeAttr.value_raw || "";

          let inverterCategoryVal = p?.name || "";

          baseComponents.push({
            id: bc.sku_id.toString(),
            name: p?.name || skuInfo.subtype?.name || "Component",
            brandName: b?.brand_name || "",
            skuCode: skuInfo.sku_code,
            quantity: bc.quantity || 0,
            image: img || null,
            actualType,
            
            // Mapping matching frontend keys exactly
            technologyType: skuInfo.subtype?.name || "",
            wattPerPanel: wattage,
            efficiencyPercent: efficiency,
            warrantyYears: warranty,
            capacityKW: capacity,
            category: inverterCategoryVal,
            inverterImage: img || null,
            panelImage: img || null,
            type: inverterTypeVal || actualType,
            attributes: componentAttributes
          });
        });
      }

      const firstPanel = baseComponents.find(c => c.actualType === "panel");
      const firstInverter = baseComponents.find(c => c.actualType === "inverter");

      let panelDimension = null;
      if (firstPanel) {
        const dimAttr = firstPanel.attributes.find(a => {
          const n = a.name.toLowerCase();
          return n.includes("dimension") || n.includes("size");
        });
        if (dimAttr) panelDimension = dimAttr.value;
      }

      let bosBrandName = "";
      const bosIncludedList = [];
      let bosImage = "";

      const bosComponents = [];
      if (kit.bos_kits && Array.isArray(kit.bos_kits)) {
        kit.bos_kits.forEach(bk => {
          const skuInfo = skusMap[bk.sku_id?.toString()];
          const name = bk.name || skuInfo?.product?.name || "BOS Component";
          
          const componentAttributes = [];
          if (skuInfo && skuInfo.attributes && Array.isArray(skuInfo.attributes)) {
            skuInfo.attributes.forEach(attr => {
              const attrName = attrMap[attr.subtype_attribute_id?.toString()]?.name || "Attribute";
              componentAttributes.push({
                name: attrName,
                value: attr.value_raw
              });
            });
          }

          const compImg = skuInfo?.image || skuInfo?.product?.image || "";
          let finalCompImage = "";
          if (compImg) {
            if (compImg.startsWith("/")) {
              finalCompImage = `http://localhost:5000${compImg}`;
            } else {
              finalCompImage = compImg;
            }
          }

          bosComponents.push({
            name,
            quantity: bk.quantity || bk.qty || 1,
            skuCode: skuInfo?.sku_code || "",
            attributes: componentAttributes,
            image: finalCompImage || null
          });

          bosIncludedList.push(name);
          if (skuInfo && skuInfo.brand && !bosBrandName) {
            bosBrandName = skuInfo.brand.brand_name;
          }
          if (finalCompImage && !bosImage) {
            bosImage = finalCompImage;
          }
        });
      }

      const catObj = kit.solar_kit_id?.category_id || {};
      let categoryName = catObj.name;
      let indObj = catObj.industry_type_id ? industryTypes.find(i => i._id.toString() === catObj.industry_type_id.toString()) : null;
      if (!indObj) {
        const matchedCat = categories.find(c => c._id?.toString() === catObj._id?.toString() || (c.name && catObj.name && c.name.toLowerCase() === catObj.name.toLowerCase()));
        if (matchedCat && matchedCat.industry_type_id) {
          indObj = industryTypes.find(i => i._id.toString() === matchedCat.industry_type_id.toString());
          if (!categoryName) categoryName = matchedCat.name;
        }
      }
      if (!indObj) {
        const kitNameLower = (kit.name || "").toLowerCase();
        if (kitNameLower.includes("commercial") || kitNameLower.includes("industrial") || kitNameLower.includes("c&i") || kitNameLower.includes("factory")) {
          indObj = industryTypes.find(i => i.name.toLowerCase().includes("commercial") || i.name.toLowerCase().includes("c&i"));
        } else if (kitNameLower.includes("pump") || kitNameLower.includes("agri") || kitNameLower.includes("kusum") || kitNameLower.includes("irrigation")) {
          indObj = industryTypes.find(i => i.name.toLowerCase().includes("agri") || i.name.toLowerCase().includes("pump"));
        } else if (kitNameLower.includes("utility") || kitNameLower.includes("megawatt") || kitNameLower.includes("floating") || kitNameLower.includes("ground mount") || kitNameLower.includes("mw")) {
          indObj = industryTypes.find(i => i.name.toLowerCase().includes("utility"));
        } else {
          indObj = industryTypes.find(i => i.name.toLowerCase().includes("residential")) || industryTypes[0];
        }
      }
      const industryTypeName = indObj ? indObj.name : "Residential Solar";
      const industryTypeId = indObj ? indObj._id.toString() : null;
      if (!categoryName) categoryName = "Rooftop";

      const subCategoryObj = kit.solar_kit_id?.subcategory_id || {};
      const subCategoryName = subCategoryObj.name || "Residential";
      const subCategoryColor = subCategoryObj.color || null;
      const subCategoryImage = subCategoryObj.image || null;

      const kitBrandDoc = kit.brand_id ? brands.find(b => b._id.toString() === kit.brand_id.toString()) : null;
      const finalBrandName = kitBrandDoc ? kitBrandDoc.brand_name : (firstPanel ? firstPanel.brandName : "");

      const mappedKit = {
        id: kit._id.toString(),
        hasNoAssignedVariants: assignedVariantIds.length === 0,
        brand: finalBrandName,
        kitName: kit.name,
        industryType: industryTypeName,
        industry_type_name: industryTypeName,
        industry_type_id: industryTypeId,
        category: categoryName,
        category_id: catObj._id ? catObj._id.toString() : null,
        subCategory: subCategoryName,
        subcategory_id: subCategoryObj._id ? subCategoryObj._id.toString() : null,
        usageType: subCategoryName,
        usageTypeColor: subCategoryColor,
        usageTypeImage: subCategoryImage,
        projectType: kit.solar_kit_id?.type_id?.name || "",
        projectRange: kit.project_range_id ? {
          id: kit.project_range_id._id.toString(),
          min: kit.project_range_id.min_value,
          max: kit.project_range_id.max_value,
          unit: kit.project_range_id.unit?.symbol || "kW",
          text: `${kit.project_range_id.min_value} - ${kit.project_range_id.max_value} ${kit.project_range_id.unit?.symbol || "kW"}`
        } : null,
        pricing: {
          showcaseMargin,
          standardMargin,
          poDiscountedMargin,
          basePrice: totalBasePrice,
          standardPrice,
          showcasePrice: premiumPrice,
          poPrice: basicPrice,
          gstRate,
          gstIncluded: standardPrice - Math.round(standardPrice / (1 + (gstRate / 100)))
        },
        marginPercent: standardMargin,
        bulkSetting: bulkSettingDoc ? {
          isEnabled: bulkSettingDoc.is_bulk_enabled,
          kitsPerBulk: bulkSettingDoc.kits_per_bulk,
          applyToVariants: bulkSettingDoc.apply_to_variants,
          tiers: (bulkSettingDoc.bulk_tiers || []).map(t => {
            const bulkPriceInclGst = calculatePriceWithMarginAndGst(totalBasePrice, t.margin, gstRate);
            return {
              quantity: t.quantity,
              margin: t.margin,
              pricePerKit: bulkPriceInclGst,
              discountVsShowcase: premiumPrice > 0
                ? Math.round(((premiumPrice - bulkPriceInclGst) / premiumPrice) * 100)
                : 0
            };
          })
        } : null,
        capacityKW: kit.capacity || 0,
        description: kit.description || (kit.capacity ? `High quality solar kit of ${kit.capacity}kW capacity.` : ""),
        warrantyYears: (firstPanel && firstPanel.warrantyYears) || (firstInverter && firstInverter.warrantyYears) || null,
        generationEstimateKWhPerYear: kit.capacity ? Math.round(kit.capacity * 1400) : null,
        kitImage: (() => {
          let img = kit.kit_image || (firstPanel && firstPanel.image) || (firstInverter && firstInverter.image) || null;
          if (!img) return null;
          if (img.includes("localhost:3001")) return img.replace("localhost:3001", "localhost:5000");
          if (img.startsWith("http://") || img.startsWith("https://")) return img;
          return `http://localhost:5000/${img.startsWith('/') ? img.slice(1) : img}`;
        })(),
        panel: firstPanel ? {
          brandName: firstPanel.brandName,
          technologyType: firstPanel.technologyType,
          wattPerPanel: firstPanel.wattPerPanel,
          efficiencyPercent: firstPanel.efficiencyPercent,
          quantity: firstPanel.quantity,
          dimensionMM: panelDimension || null,
          warrantyYears: firstPanel.warrantyYears || null,
          panelImage: firstPanel.panelImage,
          attributes: firstPanel.attributes
        } : null,
        inverter: firstInverter ? {
          brandName: firstInverter.brandName,
          category: firstInverter.category,
          type: firstInverter.type,
          capacityKW: firstInverter.capacityKW,
          efficiencyPercent: firstInverter.efficiencyPercent,
          warrantyYears: firstInverter.warrantyYears || null,
          features: [],
          inverterImage: firstInverter.inverterImage,
          quantity: firstInverter.quantity,
          attributes: firstInverter.attributes
        } : null,
        includedComponents: baseComponents,
        BOSKit: {
          brandName: bosBrandName || "Generic",
          included: bosIncludedList,
          BOSKitImage: bosImage,
          components: bosComponents
        },
        variants,
        limitedStock: {
          displayBadge,
          displayPopup,
          quantityLeft: availableStockKitsForced,
          threshold
        },
        flashSale: flashSaleDoc ? {
          name: flashSaleDoc.offer_name,
          discountType: flashSaleDoc.discount_type,
          discountValue: flashSaleDoc.discount_value,
          endDate: flashSaleDoc.end_date,
          maxQty: flashSaleDoc.max_qty
        } : null
      };

      processedKits.push(mappedKit);
    }

    return res.status(200).json({
      success: true,
      source: "db",
      data: processedKits,
    });

  } catch (error) {
    console.error("get_combo_kits_by_district error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /shop/inventory-status?district_id=...
// Returns { kitId: availableStock } for all kits in that district
// Used for live frontend polling (every 30 seconds)
// ─────────────────────────────────────────────────────────────────
const get_inventory_status = async (req, res) => {
  try {
    const { district_id } = req.query;

    let targetDistrictId = district_id;
    if (!targetDistrictId || !mongoose.Types.ObjectId.isValid(targetDistrictId)) {
      const defaultWarehouse = await CompanyWarehouse.findOne({
        warehouse_type: 'sub',
        is_active: true,
        deleted_at: null
      }).lean();
      if (defaultWarehouse?.level_2) {
        targetDistrictId = defaultWarehouse.level_2.toString();
      }
    }

    if (!targetDistrictId) {
      return res.status(200).json({ success: true, stock: {} });
    }

    // Find district to get cluster_id for warehouse check
    const districtDoc = await GeoLevel2.findById(targetDistrictId).lean();
    const clusterId = districtDoc?.cluster || null;

    // Find sub warehouses in this district
    let warehouses = await CompanyWarehouse.find({
      level_2: new mongoose.Types.ObjectId(targetDistrictId),
      warehouse_type: 'sub',
      is_active: true,
      deleted_at: null
    }).lean();

    // Fall back to master warehouse if no sub warehouses exist
    if (warehouses.length === 0 && clusterId) {
      const clusterDistricts = await GeoLevel2.find({ cluster: clusterId, deleted_at: null }).select('_id').lean();
      const clusterDistrictIds = clusterDistricts.map(d => d._id);

      const masterWarehouse = await CompanyWarehouse.findOne({
        level_2: { $in: clusterDistrictIds },
        warehouse_type: 'master',
        is_active: true,
        deleted_at: null
      }).lean();

      if (masterWarehouse) {
        warehouses = [masterWarehouse];
      }
    }

    if (warehouses.length === 0) {
      return res.status(200).json({ success: true, stock: {} });
    }

    const warehouseIds = warehouses.map(w => w._id);

    const activations = await WarehouseKitActivation.find({
      warehouse_id: { $in: warehouseIds },
      is_combokit_active: true,
      is_active: true,
      deleted_at: null
    }).lean();

    if (!activations || activations.length === 0) {
      return res.status(200).json({ success: true, stock: {} });
    }

    const kitIds = activations.map(a => a.combo_kit_id).filter(Boolean);
    const kits = await ComboKit.find({ _id: { $in: kitIds }, deleted_at: null }).lean();

    // Collect all SKU IDs
    const allSkuIds = [];
    kits.forEach(kit => {
      (kit.base_components || []).forEach(bc => { if (bc.sku_id) allSkuIds.push(bc.sku_id); });
      (kit.bos_kits || []).forEach(bk => { if (bk.sku_id) allSkuIds.push(bk.sku_id); });
    });
    const uniqueSkuIds = [...new Set(allSkuIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

    // Fetch all warehouse stocks in one query
    const warehouseStocks = await WarehouseStock.find({
      warehouse_id: { $in: warehouseIds },
      sku_id: { $in: uniqueSkuIds }
    }).lean();

    const physicalStockMap = {};
    warehouseStocks.forEach(s => {
      const key = s.sku_id.toString();
      physicalStockMap[key] = (physicalStockMap[key] || 0) + (s.qty || 0);
    });

    const reservedSKUsMap = await getReservedSKUsMap(warehouseIds);
    const bookedSKUsMap = await getBookedSKUsMap(warehouseIds);

    const bookedMap = {};
    const reservedMap = {};
    for (const key of Object.keys(bookedSKUsMap)) {
      const skuId = key.split('_')[1];
      bookedMap[skuId] = (bookedMap[skuId] || 0) + bookedSKUsMap[key];
    }
    for (const key of Object.keys(reservedSKUsMap)) {
      const skuId = key.split('_')[1];
      reservedMap[skuId] = (reservedMap[skuId] || 0) + reservedSKUsMap[key];
    }

    // Fetch PC solar panel template IDs to identify which SKUs are solar panels
    const { ProductTemplate } = require("../../../admin-panel/models/core_db");
    const solarPanelTemplates = await ProductTemplate.find({ name: /solar panel/i }).lean();
    const solarPanelTemplateIds = solarPanelTemplates.map(t => t._id.toString());

    const skuDocs = await ProductSku.find({ _id: { $in: uniqueSkuIds } }).lean();
    const productIds = skuDocs.map(sku => sku.product_id).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const panelSkuIdsMap = {};
    skuDocs.forEach(sku => {
      const prod = products.find(p => p._id.toString() === sku.product_id?.toString());
      if (prod && prod.template_id && solarPanelTemplateIds.includes(prod.template_id.toString())) {
        panelSkuIdsMap[sku._id.toString()] = true;
      }
    });

    // Compute other active carts' SKU depletion
    const shopSettings = await SolarShopSettings.findOne({}).lean() || {};
    const durationMin = shopSettings.checkout_timer_duration || 10;
    const cartExpiryThreshold = new Date(Date.now() - durationMin * 60 * 1000);
    const activeCarts = await Cart.find({ updated_at: { $gt: cartExpiryThreshold } }).lean();

    const skuDepletion = {};
    for (const cartDoc of activeCarts) {
      for (const cartItem of (cartDoc.cart || [])) {
        if (cartItem.is_custom) continue;
        const kit = kits.find(k => k._id.toString() === cartItem.id?.toString());
        if (!kit) continue;
        const qty = cartItem.qty || 1;
        [...(kit.base_components || []), ...(kit.bos_kits || [])].forEach(comp => {
          if (comp.sku_id) {
            const key = comp.sku_id.toString();
            skuDepletion[key] = (skuDepletion[key] || 0) + ((comp.quantity || 1) * qty);
          }
        });
      }
    }

    // Compute available stock per kit
    const stockResult = {};
    for (const kit of kits) {
      const allComponents = [...(kit.base_components || []), ...(kit.bos_kits || [])];
      let availableStockKits = Infinity;

      allComponents.forEach(comp => {
        if (comp.sku_id) {
          const skuIdStr = comp.sku_id.toString();
          const isPanel = panelSkuIdsMap[skuIdStr];
          
          if (isPanel) {
            const physical = physicalStockMap[skuIdStr];
            // Only enforce physical warehouse stock bounds if physical stock is explicitly seeded (> 0).
            // Unseeded/unmanaged physical stock should not falsely set kit stock to 0 ("Out of Stock").
            if (physical !== undefined && physical > 0) {
              const reserved = reservedMap[skuIdStr] || 0;
              const booked = bookedMap[skuIdStr] || 0;
              const net = Math.max(0, physical - reserved - booked);
              const maxForSku = Math.floor(net / (comp.quantity || 1));
              if (maxForSku < availableStockKits) availableStockKits = maxForSku;
            }
          }
        }
      });

      if (availableStockKits === Infinity) availableStockKits = 999;

      stockResult[kit._id.toString()] = availableStockKits;
    }

    return res.status(200).json({ success: true, stock: stockResult });

  } catch (error) {
    console.error("get_inventory_status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const get_checkout_settings = async (req, res) => {
  try {
    const settings = await SolarShopSettings.findOne({}).lean();
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          enable_checkout_timer: true,
          checkout_timer_duration: 10,
          combokit_bulk_panels_limit: 30,
          gst_rate: 13.8
        }
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        enable_checkout_timer: settings.enable_checkout_timer ?? true,
        checkout_timer_duration: settings.checkout_timer_duration ?? 10,
        combokit_bulk_panels_limit: settings.combokit_bulk_panels_limit ?? 30,
        gst_rate: settings.gst_rate ?? 13.8
      }
    });
  } catch (error) {
    console.error("get_checkout_settings error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const get_active_offers = async (req, res) => {
  try {
    const { district_id } = req.query;
    const now = new Date();

    const filter = {
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
      deleted_at: null,
    };

    if (district_id) {
      const districtDoc = await GeoLevel2.findById(district_id).lean();
      if (districtDoc && districtDoc.cluster) {
        filter.$or = [
          { cluster_id: districtDoc.cluster },
          { cluster_id: null }
        ];
      } else {
        filter.cluster_id = null;
      }
    }

    const activeOffers = await OfferMaster.find(filter).lean();

    return res.status(200).json({
      success: true,
      data: activeOffers.map(o => ({
        _id: o._id,
        offer_name: o.offer_name,
        offer_type: o.offer_type,
        discount_type: o.discount_type,
        discount_value: o.discount_value,
        min_cart_value: o.min_cart_value,
        max_discount: o.max_discount,
        end_date: o.end_date,
        products_applicable: o.products_applicable,
        priority: o.priority,
        stackable: o.stackable,
        coupon_code: o.coupon_code,
        max_qty: o.max_qty
      }))
    });
  } catch (error) {
    console.error("get_active_offers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reserve_stock = async (req, res) => {
  try {
    const customer_id = req.user.account_id;
    const { items, duration_minutes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided for reservation." });
    }

    const settings = await SolarShopSettings.findOne({}).lean() || { checkout_timer_duration: 10 };
    const durationMin = duration_minutes || settings.checkout_timer_duration || 10;
    const expiryTime = new Date(Date.now() + durationMin * 60 * 1000);

    // Release any existing reservations for this customer
    await InventoryReservation.updateMany(
      { customer_id, status: 'reserved' },
      { $set: { status: 'released' } }
    );

    const reservationRecords = [];
    for (const item of items) {
      if (item.is_custom) continue;

      const kit = await ComboKit.findById(item.id).lean();
      if (!kit) continue;

      const record = await InventoryReservation.create({
        customer_id,
        product_id: kit._id,
        quantity: item.qty || 1,
        status: 'reserved',
        expiry_time: expiryTime,
        reminder_sent: false
      });
      reservationRecords.push(record);
    }

    return res.status(200).json({
      success: true,
      message: `Stock reserved for ${durationMin} minutes`,
      timer_enabled: true,
      expiry_time: expiryTime,
      reservations: reservationRecords
    });

  } catch (error) {
    console.error("reserve_stock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const checkGstVerificationForOrder = async (customer_id, items) => {
  const account = await EpcAccount.findById(customer_id).lean();
  if (!account) {
    return { error: "Account not found." };
  }

  const stateIds = [];
  for (const item of items) {
    const kitId = item.id || item.combo_kit_id;
    if (!kitId) continue;
    const kit = await ComboKit.findById(kitId).lean();
    if (kit && kit.state_id) {
      stateIds.push(kit.state_id.toString());
    }
  }

  const uniqueStateIds = [...new Set(stateIds)];

  if (uniqueStateIds.length === 0) {
    return { allowed: true };
  }

  if (!account.company_id) {
    return {
      allowed: false,
      gst_required: true,
      state_id: uniqueStateIds[0],
      message: "GST verification is required before placing orders."
    };
  }

  for (const stateId of uniqueStateIds) {
    const gstRecord = await EpcCompanyGst.findOne({
      company_id: account.company_id,
      state_id: stateId,
      deleted_at: null
    }).lean();

    if (!gstRecord) {
      return {
        allowed: false,
        gst_required: true,
        state_id: stateId,
        message: `GST verification is required for the target state.`
      };
    }
  }

  return { allowed: true };
};

const confirm_order = async (req, res) => {
  try {
    const customer_id = req.user.account_id;
    const { items, discount_applied } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided for order confirmation." });
    }

    const gstCheck = await checkGstVerificationForOrder(customer_id, items);
    if (!gstCheck.allowed) {
      return res.status(400).json({
        success: false,
        gst_required: true,
        state_id: gstCheck.state_id,
        message: gstCheck.message
      });
    }

    const activeResvs = await InventoryReservation.find({
      customer_id,
      status: 'reserved',
      expiry_time: { $gt: new Date() }
    });

    if (activeResvs.length > 0) {
      await InventoryReservation.updateMany(
        { _id: { $in: activeResvs.map(r => r._id) } },
        { $set: { status: 'booked' } }
      );
    }

    // Resolve SKUs and Cluster IDs for pricing calculation
    const allSkuIds = [];
    const clusterIds = [];
    for (const item of items) {
      if (item.is_custom) continue;
      const kit = await ComboKit.findById(item.id).lean();
      if (!kit) continue;
      const components = [...(kit.base_components || []), ...(kit.bos_kits || [])];
      components.forEach(c => {
        if (c.sku_id) allSkuIds.push(c.sku_id.toString());
      });
      if (kit.cluster_id) {
        clusterIds.push(kit.cluster_id.toString());
      }
    }

    const uniqueSkuIds = [...new Set(allSkuIds)].map(id => new mongoose.Types.ObjectId(id));
    const uniqueClusterIds = [...new Set(clusterIds)].map(id => new mongoose.Types.ObjectId(id));

    // Fetch actual benchmark prices from ProductSkuPrice
    const pricingRecords = await ProductSkuPrice.find({
      sku_id: { $in: uniqueSkuIds },
      cluster_id: { $in: uniqueClusterIds }
    }).lean();

    const priceMap = {};
    pricingRecords.forEach(r => {
      if (r.sku_id && r.cluster_id) {
        priceMap[`${r.cluster_id.toString()}-${r.sku_id.toString()}`] = r.price || 0;
      }
    });

    for (const item of items) {
      if (item.is_custom) continue;

      const kit = await ComboKit.findById(item.id).lean();
      if (!kit) continue;

      // Resolve warehouse_id and district_id for this kit
      let resolvedWarehouseId = null;
      let resolvedDistrictId = item.districtId || null;

      if (resolvedDistrictId) {
        // Find sub warehouse in this district that has this kit activated
        const warehouses = await CompanyWarehouse.find({
          level_2: new mongoose.Types.ObjectId(resolvedDistrictId),
          warehouse_type: 'sub',
          is_active: true,
          deleted_at: null
        }).lean();
        const warehouseIds = warehouses.map(w => w._id);
        const activation = await WarehouseKitActivation.findOne({
          combo_kit_id: kit._id,
          warehouse_id: { $in: warehouseIds },
          is_combokit_active: true,
          is_active: true,
          deleted_at: null
        }).lean();
        if (activation) {
          resolvedWarehouseId = activation.warehouse_id;
        } else if (warehouseIds.length > 0) {
          resolvedWarehouseId = warehouseIds[0];
        }
      }

      // Fallback 1: If no districtId or warehouse was resolved, search any activation for this kit
      if (!resolvedWarehouseId) {
        const activation = await WarehouseKitActivation.findOne({
          combo_kit_id: kit._id,
          is_combokit_active: true,
          is_active: true,
          deleted_at: null
        }).lean();
        if (activation) {
          resolvedWarehouseId = activation.warehouse_id;
          if (!resolvedDistrictId) {
            const warehouse = await CompanyWarehouse.findById(resolvedWarehouseId).lean();
            resolvedDistrictId = warehouse?.level_2 || null;
          }
        }
      }

      // Fallback 2: use a default active warehouse if still not found
      if (!resolvedWarehouseId) {
        const defaultWarehouse = await CompanyWarehouse.findOne({
          is_active: true,
          deleted_at: null
        }).lean();
        if (defaultWarehouse) {
          resolvedWarehouseId = defaultWarehouse._id;
          if (!resolvedDistrictId) {
            resolvedDistrictId = defaultWarehouse.level_2 || null;
          }
        }
      }

      const kitClusterId = kit.cluster_id ? kit.cluster_id.toString() : "";
      let totalBasePrice = 0;
      const skuPricesSnapshot = [];

      const components = [...(kit.base_components || []), ...(kit.bos_kits || [])];
      for (const comp of components) {
        if (comp.sku_id) {
          // Get pricing
          const key = `${kitClusterId}-${comp.sku_id.toString()}`;
          const bPrice = priceMap[key] || 0;
          totalBasePrice += bPrice * (comp.quantity || 1);

          skuPricesSnapshot.push({
            sku_id: comp.sku_id,
            price: bPrice
          });
        }
      }

      // Calculate selling price
      const marginDoc = await CompanyMargin.findOne({
        warehouse_id: resolvedWarehouseId,
        combo_kit_id: kit._id,
        is_active: true,
        deleted_at: null
      }).lean();
      const standardMargin = marginDoc ? (marginDoc.standard_margin || 0) : 0;
      const gstRate = marginDoc?.gst_rate ?? 13.8;
      const standardPrice = calculatePriceWithMarginAndGst(totalBasePrice, standardMargin, gstRate);

      // If additional price for variant exists
      const addPrice = Number(item.additionalPrice || item.addPrice || 0);
      const computedSellingPrice = standardPrice + addPrice;

      let resolvedStateId = kit.state_id || null;
      if (resolvedDistrictId) {
        const distDoc = await GeoLevel2.findById(resolvedDistrictId).lean();
        if (distDoc && distDoc.level_1) {
          resolvedStateId = distDoc.level_1;
        }
      }

      const defaultStateId = new mongoose.Types.ObjectId("69f9be0a711beb75adfcfa95"); // Maharashtra
      const defaultDistrictId = new mongoose.Types.ObjectId("69f9be0a711beb75adfcfade"); // Nagpur

      const finalStateId = resolvedStateId || defaultStateId;
      const finalDistrictId = resolvedDistrictId || defaultDistrictId;

      const orderQty = item.qty || 1;
      let firstPo = null;

      for (let q = 0; q < orderQty; q++) {
        const poPayload = {
          customer_id,
          country_id: kit.country_id || new mongoose.Types.ObjectId("69f9be0a711beb75adfcfa7f"),
          state_id: finalStateId,
          district_id: finalDistrictId,
          cluster_id: kit.cluster_id || new mongoose.Types.ObjectId("69f9be0a711beb75adfcfae0"),
          warehouse_id: resolvedWarehouseId,
          combo_kit_id: kit._id,
          base_price_snapshot: totalBasePrice || kit.base_price_cached || 150000,
          selling_price_snapshot: computedSellingPrice || item.ourPrice || kit.selling_price_cached || 180000,
          status: 'confirmed',
          sku_prices_snapshot: skuPricesSnapshot,
          delivery_address: null
        };

        const po = await PurchaseOrder.create(poPayload);
        if (!firstPo) firstPo = po;
      }

      const totalKits = items.reduce((sum, i) => sum + i.qty, 0);
      if (totalKits >= 5 && firstPo) {
        await ComboBundleMaster.create({
          customer_id,
          total_kits: totalKits,
          discount_applied: discount_applied || 0,
          purchase_order_id: firstPo._id
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order confirmed and inventory booked successfully!"
    });

  } catch (error) {
    console.error("confirm_order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const get_cart = async (req, res) => {
  try {
    const account_id = req.user.account_id || req.user.id || req.user._id;
    if (!account_id) {
      return res.status(400).json({ success: false, message: "Account ID missing from request token" });
    }
    let cartDoc = await Cart.findOne({ account_id });
    if (!cartDoc) {
      return res.status(200).json({ success: true, cart: [], expiry_time: null });
    }
    
    // Find active checkout reservation for this customer
    const activeResv = await InventoryReservation.findOne({
      customer_id: account_id,
      status: 'reserved',
      expiry_time: { $gt: new Date() }
    }).sort({ expiry_time: 1 }).lean();

    const expiryTime = activeResv ? activeResv.expiry_time : null;
    
    return res.status(200).json({
      success: true,
      cart: cartDoc.cart || [],
      expiry_time: expiryTime
    });
  } catch (error) {
    console.error("get_cart error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update_cart = async (req, res) => {
  try {
    const account_id = req.user.account_id || req.user.id || req.user._id;
    if (!account_id) {
      return res.status(400).json({ success: false, message: "Account ID missing from request token" });
    }
    const { cart } = req.body;

    // Early exit: if the cart is empty, skip all stock checks and just clear
    // the persisted cart in the database. No inventory check needed.
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      await Cart.findOneAndUpdate(
        { account_id },
        { $set: { cart: [], updated_at: new Date() } },
        { upsert: true, new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        expiry_time: null
      });
    }

    // 1. Fetch settings
    const settings = await SolarShopSettings.findOne({}).lean() || {
      checkout_timer_duration: 10
    };
    const durationMin = settings.checkout_timer_duration || 10;
    const expiryTime = new Date(Date.now() + durationMin * 60 * 1000);

    // 2. Fetch all product templates that are Solar Panels
    const { ProductTemplate } = require("../../../admin-panel/models/core_db");
    const solarPanelTemplates = await ProductTemplate.find({ name: /solar panel/i }).lean();
    const solarPanelTemplateIds = solarPanelTemplates.map(t => t._id.toString());

    // 3. Compute incoming cart's Solar Panel SKU requirements
    const incomingSolarPanelRequirements = {};
    const warehouseIds = [];
    if (cart && Array.isArray(cart)) {
      for (const item of cart) {
        if (item.is_custom || item.is_catalogue_item) continue;
        if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) continue;
        const kit = await ComboKit.findById(item.id).lean();
        if (!kit) continue; // Standalone product or reseller listing item: skip combo-kit component decomposition
        if (kit.warehouse_id) {
          warehouseIds.push(kit.warehouse_id.toString());
        }
        const qty = item.qty || 1;
        
        // Base components
        (kit.base_components || []).forEach(comp => {
          if (comp.sku_id && comp.template_id) {
            if (solarPanelTemplateIds.includes(comp.template_id.toString())) {
              const skuIdStr = comp.sku_id.toString();
              const compReqQty = comp.quantity || 1;
              incomingSolarPanelRequirements[skuIdStr] = (incomingSolarPanelRequirements[skuIdStr] || 0) + (compReqQty * qty);
            }
          }
        });

        // BOS components (check if they have solar panel templates)
        (kit.bos_kits || []).forEach(comp => {
          if (comp.sku_id && comp.template_ids) {
            const hasPanelTemplate = comp.template_ids.some(id => solarPanelTemplateIds.includes(id.toString()));
            if (hasPanelTemplate) {
              const skuIdStr = comp.sku_id.toString();
              const compReqQty = comp.quantity || 1;
              incomingSolarPanelRequirements[skuIdStr] = (incomingSolarPanelRequirements[skuIdStr] || 0) + (compReqQty * qty);
            }
          }
        });
      }
    }

    const uniqueWarehouseIds = [...new Set(warehouseIds)].map(id => new mongoose.Types.ObjectId(id));
    const requiredSkuIds = Object.keys(incomingSolarPanelRequirements).map(id => new mongoose.Types.ObjectId(id));

    // 4. Verify against warehouse stock of the required solar panel SKUs
    if (requiredSkuIds.length > 0) {
      const query = { sku_id: { $in: requiredSkuIds } };
      if (uniqueWarehouseIds.length > 0) {
        query.warehouse_id = { $in: uniqueWarehouseIds };
      }
      
      const warehouseStocks = await WarehouseStock.find(query).lean();

      // Fetch active reservations for other users for these SKUs
      const otherActiveResvs = await InventoryReservation.find({
        customer_id: { $ne: account_id },
        status: 'reserved',
        expiry_time: { $gt: new Date() }
      }).lean();

      // Resolve warehouse IDs for each reservation's kit
      const resolvedWarehouseMap = {};
      const kitIds = otherActiveResvs.map(r => r.product_id).filter(Boolean);
      const kitsForRes = await ComboKit.find({ _id: { $in: kitIds } }).lean();
      for (const kit of kitsForRes) {
        let resolvedWhId = kit.warehouse_id;
        if (!resolvedWhId) {
          const activation = await WarehouseKitActivation.findOne({
            combo_kit_id: kit._id,
            is_combokit_active: true,
            is_active: true,
            deleted_at: null
          }).lean();
          if (activation) {
            resolvedWhId = activation.warehouse_id;
          }
        }
        if (resolvedWhId) {
          resolvedWarehouseMap[kit._id.toString()] = resolvedWhId.toString();
        }
      }

      const otherSkuReservations = {};
      otherActiveResvs.forEach(r => {
        if (!r.product_id) return;
        const whIdStr = resolvedWarehouseMap[r.product_id.toString()];
        if (whIdStr && uniqueWarehouseIds.map(id => id.toString()).includes(whIdStr)) {
          const kit = kitsForRes.find(k => k._id.toString() === r.product_id.toString());
          if (kit) {
            const components = [...(kit.base_components || []), ...(kit.bos_kits || [])];
            components.forEach(comp => {
              if (comp.sku_id) {
                const skuIdStr = comp.sku_id.toString();
                otherSkuReservations[skuIdStr] = (otherSkuReservations[skuIdStr] || 0) + (comp.quantity || 1) * r.quantity;
              }
            });
          }
        }
      });

      // Fetch active bookings for other users for these warehouses
      const bookedSKUsMap = await getBookedSKUsMap(uniqueWarehouseIds);
      const otherBooked = {};
      for (const key of Object.keys(bookedSKUsMap)) {
        const skuIdStr = key.split('_')[1];
        otherBooked[skuIdStr] = (otherBooked[skuIdStr] || 0) + bookedSKUsMap[key];
      }
      
      const stockMap = {};
      warehouseStocks.forEach(ws => {
        const skuIdStr = ws.sku_id.toString();
        stockMap[skuIdStr] = (stockMap[skuIdStr] || 0) + (ws.qty || 0);
      });
      
      for (const skuIdStr of Object.keys(incomingSolarPanelRequirements)) {
        const physicalStock = stockMap[skuIdStr] || 0;
        const otherReserved = otherSkuReservations[skuIdStr] || 0;
        const booked = otherBooked[skuIdStr] || 0;
        const netAvailable = Math.max(0, physicalStock - otherReserved - booked);
        const required = incomingSolarPanelRequirements[skuIdStr];
        
        if (required > netAvailable && physicalStock > 0) {
          return res.status(400).json({
            success: false,
            message: `Insufficient inventory. Selected solar panel(s) exceed available stock.`
          });
        }
      }
    }

    // 5. Release any active checkout reservations for this customer when they modify/update their cart
    await InventoryReservation.updateMany(
      { customer_id: account_id, status: 'reserved' },
      { $set: { status: 'released' } }
    );

    // 6. Save updated cart
    await Cart.findOneAndUpdate(
      { account_id },
      { $set: { cart: cart || [], updated_at: new Date() } },
      { upsert: true, new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      // Return the computed expiry time so the frontend countdown timer works.
      // Previously this was hardcoded to null, making the timer non-functional.
      expiry_time: expiryTime
    });
  } catch (error) {
    console.error("update_cart error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create_request_order = async (req, res) => {
  try {
    const customer_id = req.user.account_id;
    const { items, total_amount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided for the request order." });
    }

    const gstCheck = await checkGstVerificationForOrder(customer_id, items);
    if (!gstCheck.allowed) {
      return res.status(400).json({
        success: false,
        gst_required: true,
        state_id: gstCheck.state_id,
        message: gstCheck.message
      });
    }

    const reqItems = [];
    for (const item of items) {
      const kit = await ComboKit.findById(item.id).lean();
      if (!kit) {
        return res.status(404).json({ success: false, message: `Combo kit not found: ${item.id}` });
      }
      
      const bulkPack = item.bulkPack || {};
      const pricePerKit = bulkPack.pricePerKitAfterDiscount || item.ourPrice;
      const kitsPerPack = bulkPack.kitsPerPack || 1;
      const totalPrice = item.qty * pricePerKit * kitsPerPack;

      reqItems.push({
        combo_kit_id: item.id,
        variant_index: item.variantIndex || 0,
        qty: item.qty,
        price_per_kit: pricePerKit,
        total_price: totalPrice,
        product_tier: item.productTier
      });
    }

    const calculatedTotal = reqItems.reduce((sum, item) => sum + item.total_price, 0);

    const requestOrder = await RequestOrder.create({
      customer_id,
      items: reqItems,
      total_amount: total_amount || calculatedTotal,
      status: 'pending'
    });

    // Also clear the user's bulkCart in the DB if one exists
    await Cart.updateOne(
      { account_id: customer_id },
      { $set: { bulkCart: [] } }
    );

    return res.status(200).json({
      success: true,
      message: "Order request submitted successfully!",
      data: requestOrder
    });

  } catch (error) {
    console.error("create_request_order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const get_gst_status = async (req, res) => {
  try {
    const account_id = req.user.account_id;
    const { state_id } = req.query;

    if (!state_id) {
      return res.status(400).json({ success: false, message: "state_id is required." });
    }

    const account = await EpcAccount.findById(account_id).lean();
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    if (!account.company_id) {
      return res.status(200).json({ success: true, verified: false, message: "No company registered yet." });
    }

    const gstRecord = await EpcCompanyGst.findOne({
      company_id: account.company_id,
      state_id,
      deleted_at: null
    }).lean();

    if (!gstRecord) {
      return res.status(200).json({ success: true, verified: false, message: "GST not verified for this state." });
    }

    const company = await EpcCompany.findById(account.company_id).lean();

    return res.status(200).json({
      success: true,
      verified: true,
      gst_number: gstRecord.gst_number,
      company_name: company?.name,
      legal_name: company?.legal_name,
      brand_name: company?.brand_name
    });

  } catch (error) {
    console.error("get_gst_status error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const gst_generate_otp = async (req, res) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      return res.status(400).json({ success: false, message: 'GSTIN is required.' });
    }

    const formattedGst = gstin.trim().toUpperCase();
    if (formattedGst.length !== 15) {
      return res.status(400).json({ success: false, message: 'Invalid GSTIN length. Must be 15 characters.' });
    }

    // Extract PAN
    const targetPan = formattedGst.substring(2, 12);

    // Verify PAN match across existing state GSTs of this company
    const account_id = req.user.account_id;
    const account = await EpcAccount.findById(account_id).lean();
    if (account && account.company_id) {
      const existingGsts = await EpcCompanyGst.find({
        company_id: account.company_id,
        deleted_at: null
      }).lean();

      if (existingGsts.length > 0) {
        for (const record of existingGsts) {
          const recordPan = record.gst_number.substring(2, 12);
          if (recordPan !== targetPan) {
            return res.status(400).json({
              success: false,
              message: "This GSTIN belongs to a different PAN. All verified GSTINs must belong to the same PAN."
            });
          }
        }
      }
    }

    // Duplicate check across other companies
    const otherGstRecord = await EpcCompanyGst.findOne({
      gst_number: formattedGst,
      company_id: { $ne: account?.company_id },
      deleted_at: null
    }).lean();

    if (otherGstRecord) {
      return res.status(409).json({
        success: false,
        message: `GST number ${formattedGst} is already registered under another company.`
      });
    }

    const apiKey = process.env.QUICKEKYC_API_KEY;
    if (!apiKey || apiKey === 'your-production-api-key-here') {
      console.warn(`[GST Verification Mock Mode] Generating mock OTP for GSTIN: ${formattedGst}`);
      return res.status(200).json({
        success: true,
        request_id: `mock_req_${Date.now()}`,
        message: "OTP generated (Mock Mode: Use code 1234 to verify)"
      });
    }

    const baseUrl = 'https://api.quickekyc.com';
    try {
      const response = await fetch(`${baseUrl}/api/v1/corporate/gst-verification-v2/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: apiKey,
          id_number: formattedGst,
          send_on_email: true,
          send_on_mobile: true
        })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('QuickeKYC generate-otp response was not JSON:', text);
        throw new Error('QuickeKYC server returned non-JSON response');
      }

      if (data.status !== 'success') {
        if (process.env.NODE_ENV === 'development' || data.status_code === 401 || data.message?.includes("Unauthorized")) {
          console.warn(`[GST Verification Mock Mode] API returned error: "${data.message}". Falling back to mock OTP.`);
          return res.status(200).json({
            success: true,
            request_id: `mock_req_${Date.now()}`,
            message: "OTP generated (Mock Mode: Use code 1234 to verify)"
          });
        }
        return res.status(data.status_code || response.status || 400).json({
          success: false,
          message: data.message || "Failed to generate OTP."
        });
      }

      return res.status(200).json({
        success: true,
        request_id: data.request_id || data.data?.request_id
      });
    } catch (apiErr) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GST Verification Mock Mode] API call failed: "${apiErr.message}". Falling back to mock OTP.`);
        return res.status(200).json({
          success: true,
          request_id: `mock_req_${Date.now()}`,
          message: "OTP generated (Mock Mode: Use code 1234 to verify)"
        });
      }
      throw apiErr;
    }

  } catch (error) {
    console.error('gst_generate_otp error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP.' });
  }
};

const gst_verify_otp = async (req, res) => {
  try {
    const { request_id, otp, gstin, state_id } = req.body;
    const account_id = req.user.account_id;

    if (!request_id || !otp || !gstin || !state_id) {
      return res.status(400).json({ success: false, message: 'request_id, otp, gstin, and state_id are required.' });
    }

    const formattedGst = gstin.trim().toUpperCase();

    let legalName = "";
    let tradeName = "";

    if (request_id.startsWith("mock_req_")) {
      if (otp !== "1234") {
        return res.status(400).json({ success: false, message: "Invalid OTP. Use mock code 1234." });
      }
      legalName = "SOLARKITS SOLAR LABS PVT LTD";
      tradeName = "SOLARKITS INDIA";
    } else {
      const apiKey = process.env.QUICKEKYC_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'QuickeKYC API key is not configured.' });
      }

      const baseUrl = 'https://api.quickekyc.com';
      const response = await fetch(`${baseUrl}/api/v1/corporate/gst-verification-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: apiKey,
          request_id: request_id,
          otp: otp
        })
      });

      const text = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(text);
      } catch (e) {
        console.error('QuickeKYC submit-otp response was not JSON:', text);
        return res.status(response.status || 500).json({
          success: false,
          message: `QuickeKYC server returned non-JSON response (HTTP ${response.status}).`
        });
      }

      if (resJson.status !== 'success' || !resJson.data) {
        if (process.env.NODE_ENV === 'development' || resJson.status_code === 401) {
          console.warn(`[GST Verification Mock Mode] Submit OTP API failed: "${resJson.message}". Falling back to mock success.`);
          legalName = "SOLARKITS SOLAR LABS PVT LTD";
          tradeName = "SOLARKITS INDIA";
        } else {
          return res.status(resJson.status_code || response.status || 400).json({
            success: false,
            message: resJson.message || 'GST verification failed.'
          });
        }
      } else {
        const gstDetails = resJson.data;
        const gstinStatus = gstDetails.gstin_status || gstDetails.gstinStatus || gstDetails.status || gstDetails.gstStatus || '';
        if (gstinStatus && gstinStatus.toLowerCase() !== 'active') {
          return res.status(400).json({
            success: false,
            message: `GSTIN is inactive (Status: ${gstinStatus}). Only active GSTINs are allowed.`
          });
        }
        legalName = gstDetails.legal_name || gstDetails.business_name || gstDetails.lgnm || '';
        tradeName = gstDetails.trade_name || gstDetails.tradeName || gstDetails.trade_nam || '';
      }
    }

    // Check similarity if first GST verification
    const account = await EpcAccount.findById(account_id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    let companyId = account.company_id;

    if (!companyId) {
      // Create new EpcCompany in database
      const company = await EpcCompany.create({
        name: tradeName || legalName,
        legal_name: legalName,
        brand_name: tradeName || null,
        email: account.email,
        source: 'verified',
        working_states: [state_id]
      });

      companyId = company._id;
      
      // Update EpcAccount
      account.company_id = companyId;
      if (!account.states.includes(state_id)) {
        account.states.push(state_id);
      }
      await account.save();
    } else {
      // Existing company: update states
      const company = await EpcCompany.findById(companyId);
      if (company) {
        if (!company.working_states.some(s => s.toString() === state_id.toString())) {
          company.working_states.push(state_id);
          await company.save();
        }
      }
      if (!account.states.includes(state_id)) {
        account.states.push(state_id);
        await account.save();
      }
    }

    // Save GST details in epc_company_gst
    await EpcCompanyGst.findOneAndUpdate(
      { company_id: companyId, state_id: state_id },
      { gst_number: formattedGst, deleted_at: null },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "GST verified and registered successfully!",
      data: {
        legal_name: legalName,
        trade_name: tradeName,
        gst_number: formattedGst
      }
    });

  } catch (error) {
    console.error('gst_verify_otp error:', error);
    return res.status(500).json({ success: false, message: error.message || 'GST verification submit failed.' });
  }
};

const get_orders = async (req, res) => {
  try {
    const customer_id = req.user.account_id;
    // Find all purchase orders for this customer
    const orders = await PurchaseOrder.find({ customer_id }).lean();
    if (orders.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 1. Collect kit and district IDs
    const kitIds = [...new Set(orders.map(o => o.combo_kit_id?.toString()).filter(Boolean))].map(id => new mongoose.Types.ObjectId(id));
    const districtIds = [...new Set(orders.map(o => o.district_id?.toString()).filter(Boolean))].map(id => new mongoose.Types.ObjectId(id));

    // 2. Fetch kits and districts first
    const [kits, districts] = await Promise.all([
      ComboKit.find({ _id: { $in: kitIds } }).lean(),
      GeoLevel2.find({ _id: { $in: districtIds } }).lean()
    ]);

    // 3. Gather state IDs (from orders and resolved districts)
    const stateIdsSet = new Set(orders.map(o => o.state_id?.toString()).filter(Boolean));
    districts.forEach(d => {
      if (d.level_1) stateIdsSet.add(d.level_1.toString());
    });
    const stateIds = [...stateIdsSet].map(id => new mongoose.Types.ObjectId(id));

    // 4. Fetch states
    const states = await GeoLevel1.find({ _id: { $in: stateIds } }).lean();

    // 5. Create lookup maps
    const kitMap = {};
    kits.forEach(k => { kitMap[k._id.toString()] = k; });
    const stateMap = {};
    states.forEach(s => { stateMap[s._id.toString()] = s; });
    const districtMap = {};
    districts.forEach(d => { districtMap[d._id.toString()] = d; });

    // 6. Attach manually populated models with corruption check
    const populatedOrders = orders.map(order => {
      const populated = { ...order };
      if (order.combo_kit_id) {
        const matchedKit = kitMap[order.combo_kit_id.toString()];
        populated.combo_kit_id = matchedKit ? {
          ...matchedKit,
          kitName: matchedKit.name, // compatibility fallback mapping
        } : null;
      }
      
      let matchedState = order.state_id ? stateMap[order.state_id.toString()] : null;
      let matchedDistrict = order.district_id ? districtMap[order.district_id.toString()] : null;

      // Fix database corruption typo where state_id was saved as district_id
      if (order.state_id && order.district_id && order.state_id.toString() === order.district_id.toString()) {
        if (matchedDistrict && matchedDistrict.level_1) {
          matchedState = stateMap[matchedDistrict.level_1.toString()] || null;
        }
      }

      populated.state_id = matchedState;
      populated.district_id = matchedDistrict;

      return populated;
    });

    return res.status(200).json({ success: true, data: populatedOrders });
  } catch (error) {
    console.error('get_orders error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update_order_address = async (req, res) => {
  try {
    const customer_id = req.user.account_id;
    const { id } = req.params;
    const { delivery_address } = req.body;

    if (!delivery_address) {
      return res.status(400).json({ success: false, message: "Delivery address is required." });
    }

    const order = await PurchaseOrder.findOne({ _id: id, customer_id });
    if (!order) {
      return res.status(444).json({ success: false, message: "Order not found." });
    }

    // Validate that the delivery address's district matches the order's ordering district boundary!
    if (!order.district_id) {
      const warehouse = await CompanyWarehouse.findById(order.warehouse_id).lean();
      if (warehouse && warehouse.level_2) {
        order.district_id = warehouse.level_2;
      }
    }

    if (order.district_id && delivery_address.district_id) {
      if (order.district_id.toString() !== delivery_address.district_id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Delivery address must be within the district boundary from which the kit was ordered."
        });
      }
    }

    order.delivery_address = delivery_address;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Delivery address updated successfully",
      data: order
    });

  } catch (error) {
    console.error('update_order_address error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create_razorpay_order = async (req, res) => {
  try {
    const { items, delivery_address, is_end_customer_sale } = req.body;
    const epcId = req.user?.id || req.user?._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required." });
    }

    const result = await processEpcCheckout({
      epc_id: epcId,
      items,
      delivery_address: delivery_address || {},
      is_end_customer_sale: is_end_customer_sale !== false,
      actor_id: epcId,
      req,
    });

    return res.status(200).json({
      success: true,
      id: result.razorpay_order.order_id,
      amount: result.razorpay_order.amount_paise,
      currency: result.razorpay_order.currency || "INR",
      key: process.env.RAZORPAY_ID,
      internal_order_id: result.order._id,
      order_number: result.order.order_number,
    });
  } catch (error) {
    console.error('create_razorpay_order error:', error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create payment order." });
  }
};

const verify_razorpay_payment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ success: false, message: "razorpay_payment_id is required." });
    }

    // Enforce signature verification when Razorpay is configured.
    // Previously, omitting razorpay_order_id + razorpay_signature bypassed
    // verification entirely, allowing a crafted POST to confirm an order
    // without a real payment.
    const razorpayConfigured = !!(process.env.RAZORPAY_ID && process.env.RAZORPAY_KEY);
    if (razorpayConfigured) {
      if (!razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "razorpay_order_id and razorpay_signature are required for payment verification."
        });
      }
      const isValid = verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Payment signature verification failed." });
      }
    }

    if (internal_order_id) {
      await confirmEpcOrderPayment(internal_order_id, razorpay_payment_id, req.user?.id, req);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      razorpay_payment_id,
    });
  } catch (error) {
    console.error('verify_razorpay_payment error:', error);
    return res.status(500).json({ success: false, message: error.message || "Payment verification failed." });
  }
};

const CustomBosCatalog = require("../../models/india_solarshop_db/custom_bos_catalog.schema");
const BosKit = require("../../models/india_solarshop_db/bos_kits.schema");

// ─── BOS Kits (Pre-Configured) Handlers ────────────────────────────────────────

const get_bos_kits = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { deleted_at: null, is_active: { $ne: false } };

    if (category && category !== "all") {
      query.category = { $regex: new RegExp(category, "i") };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
        { subCategory: { $regex: search.trim(), $options: "i" } },
        { systemType: { $regex: search.trim(), $options: "i" } }
      ];
    }

    const kits = await BosKit.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: kits });
  } catch (error) {
    console.error("get_bos_kits error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const save_bos_kits = async (req, res) => {
  try {
    const kits = Array.isArray(req.body) ? req.body : req.body.kits;
    if (Array.isArray(kits)) {
      await BosKit.deleteMany({});
      const formatted = kits.map(k => {
        const clean = { ...k };
        if (clean.id && !clean._id && mongoose.Types.ObjectId.isValid(clean.id)) {
          clean._id = clean.id;
        }
        delete clean.id;
        return clean;
      });
      const inserted = await BosKit.insertMany(formatted);
      return res.status(200).json({ success: true, message: "BOS Kits synchronized successfully", data: inserted });
    }
    return res.status(400).json({ success: false, message: "Kits array is required" });
  } catch (error) {
    console.error("save_bos_kits error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create_or_update_bos_kit = async (req, res) => {
  try {
    const kitData = req.body;
    if (!kitData.name || !kitData.ourPrice) {
      return res.status(400).json({ success: false, message: "Kit name and ourPrice are required." });
    }

    const targetId = kitData.id || kitData._id;
    let saved;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      saved = await BosKit.findByIdAndUpdate(
        targetId,
        { $set: kitData },
        { new: true, upsert: true }
      );
    } else {
      saved = await BosKit.create(kitData);
    }

    return res.status(200).json({ success: true, message: "BOS Kit saved successfully", data: saved });
  } catch (error) {
    console.error("create_or_update_bos_kit error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const delete_bos_kit = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Kit ID is required" });
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      await BosKit.findByIdAndUpdate(id, { $set: { deleted_at: new Date() } });
    } else {
      await BosKit.deleteOne({ $or: [{ _id: id }, { name: req.body.name }] });
    }

    return res.status(200).json({ success: true, message: "BOS Kit deleted successfully" });
  } catch (error) {
    console.error("delete_bos_kit error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggle_bos_kit_stock = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Kit ID is required" });
    }

    let kit = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      kit = await BosKit.findById(id);
    }
    if (!kit) {
      kit = await BosKit.findOne({ name: req.body.name });
    }

    if (!kit) {
      return res.status(404).json({ success: false, message: "Kit not found" });
    }

    kit.inStock = !kit.inStock;
    await kit.save();

    return res.status(200).json({ success: true, message: `Stock status toggled to ${kit.inStock ? "In Stock" : "Out of Stock"}`, inStock: kit.inStock });
  } catch (error) {
    console.error("toggle_bos_kit_stock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Custom BOS Catalog Handlers ──────────────────────────────────────────────

const get_bos_custom_catalog = async (req, res) => {
  try {
    const catalog = await CustomBosCatalog.find({}).lean();
    return res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    console.error("get_bos_custom_catalog error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const save_bos_custom_catalog = async (req, res) => {
  try {
    const { catalog } = req.body;
    if (Array.isArray(catalog)) {
      await CustomBosCatalog.deleteMany({});
      const inserted = await CustomBosCatalog.insertMany(catalog);
      return res.status(200).json({ success: true, data: inserted });
    }
    return res.status(400).json({ success: false, message: "Catalog array required" });
  } catch (error) {
    console.error("save_bos_custom_catalog error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Store Locator Handlers ───────────────────────────────────────────────────

const CURATED_PAN_INDIA_STORES = [
  {
    id: "STORE-GJ-001",
    warehouse_code: "WH-IND-GJ-001",
    name: "Surya Solar Store — Ahmedabad",
    store_type: "EXPERIENCE_CENTER",
    address: "Plot No. 45, GIDC Industrial Estate, Sanand",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pincode: "382110",
    lat: 23.0225,
    lng: 72.5714,
    phone: "+91 79 4000 1201",
    email: "ahmedabad@solarkits.in",
    is_authorized: true,
    rating: 4.9,
    reviews_count: 142,
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-MH-001",
    warehouse_code: "WH-IND-MH-001",
    name: "Mahalaxmi Solar Solutions — Mumbai",
    store_type: "REGIONAL_WAREHOUSE",
    address: "Logistics Park, Unit 12B, Bhiwandi Industrial Area",
    city: "Mumbai",
    district: "Thane / Mumbai",
    state: "Maharashtra",
    pincode: "421302",
    lat: 19.2812,
    lng: 73.0483,
    phone: "+91 22 6100 8900",
    email: "mumbai@solarkits.in",
    is_authorized: true,
    rating: 4.8,
    reviews_count: 218,
    images: [
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-DL-001",
    warehouse_code: "WH-IND-DL-001",
    name: "SunTech Solar Point — South Delhi",
    store_type: "SOLAR_LOUNGE",
    address: "B-214, Okhla Industrial Area Phase 3",
    city: "New Delhi",
    district: "South Delhi",
    state: "Delhi",
    pincode: "110020",
    lat: 28.5355,
    lng: 77.2610,
    phone: "+91 11 4500 7820",
    email: "delhi@solarkits.in",
    is_authorized: true,
    rating: 4.9,
    reviews_count: 185,
    images: [
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-KA-001",
    warehouse_code: "WH-IND-KA-001",
    name: "GreenEnergy Solar Mart — Bengaluru",
    store_type: "EXPERIENCE_CENTER",
    address: "No. 88, Peenya Industrial Area 2nd Stage",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560058",
    lat: 13.0285,
    lng: 77.5195,
    phone: "+91 80 4900 3344",
    email: "bengaluru@solarkits.in",
    is_authorized: true,
    rating: 4.9,
    reviews_count: 164,
    images: [
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-RJ-001",
    warehouse_code: "WH-IND-RJ-001",
    name: "Vardhman Solar Store — Jaipur",
    store_type: "EPC_HUB",
    address: "Plot 14, RIICO Industrial Area, Sitapura",
    city: "Jaipur",
    district: "Jaipur",
    state: "Rajasthan",
    pincode: "302022",
    lat: 26.7824,
    lng: 75.8273,
    phone: "+91 141 277 8899",
    email: "jaipur@solarkits.in",
    is_authorized: true,
    rating: 4.8,
    reviews_count: 112,
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-MH-002",
    warehouse_code: "STORE-PUN-001",
    name: "Apex Solar Enterprises — Pune",
    store_type: "SOLAR_LOUNGE",
    address: "Showroom 4, Nyati Tech Park, Wadgaon Sheri, Nagar Road",
    city: "Pune",
    district: "Pune",
    state: "Maharashtra",
    pincode: "411014",
    lat: 18.5529,
    lng: 73.9248,
    phone: "+91 20 6700 4455",
    email: "pune@solarkits.in",
    is_authorized: true,
    rating: 4.9,
    reviews_count: 98,
    images: [
      "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-TG-001",
    warehouse_code: "STORE-HYD-001",
    name: "Deccan Solar Hub — Hyderabad",
    store_type: "EXPERIENCE_CENTER",
    address: "Survey No. 64, Financial District, Gachibowli",
    city: "Hyderabad",
    district: "Hyderabad / Rangareddy",
    state: "Telangana",
    pincode: "500032",
    lat: 17.4156,
    lng: 78.3498,
    phone: "+91 40 4800 2211",
    email: "hyderabad@solarkits.in",
    is_authorized: true,
    rating: 4.8,
    reviews_count: 125,
    images: [
      "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "STORE-TN-001",
    warehouse_code: "STORE-CHE-001",
    name: "Kaveri Solar Power — Chennai",
    store_type: "EXPERIENCE_CENTER",
    address: "Block 7, SIDCO Industrial Estate, Guindy",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600032",
    lat: 13.0067,
    lng: 80.2024,
    phone: "+91 44 4300 5566",
    email: "chennai@solarkits.in",
    is_authorized: true,
    rating: 4.7,
    reviews_count: 104,
    images: [
      "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80"
    ]
  }
];

// Helper: Haversine formula for distance calculation in kilometers
function calculate_distance_km(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const get_nearby_stores = async (req, res) => {
  try {
    const { search, state, city, pincode, store_type, lat, lng, limit = 20 } = req.query;

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    let stores = [...CURATED_PAN_INDIA_STORES];

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.pincode.includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    // Filter by state
    if (state && state.trim()) {
      const st = state.trim().toLowerCase();
      stores = stores.filter((s) => s.state.toLowerCase().includes(st));
    }

    // Filter by city
    if (city && city.trim()) {
      const ct = city.trim().toLowerCase();
      stores = stores.filter((s) => s.city.toLowerCase().includes(ct));
    }

    // Filter by pincode
    if (pincode && pincode.trim()) {
      const pin = pincode.trim();
      stores = stores.filter((s) => s.pincode.startsWith(pin.slice(0, 3)));
    }

    // Filter by store type
    if (store_type && store_type.trim() && store_type !== "ALL") {
      stores = stores.filter((s) => s.store_type === store_type);
    }

    // Calculate real distance if coordinates provided
    if (userLat && userLng) {
      stores = stores.map((s) => ({
        ...s,
        distance_km: calculate_distance_km(userLat, userLng, s.lat, s.lng),
      }));
      // Sort by proximity
      stores.sort((a, b) => (a.distance_km || 99999) - (b.distance_km || 99999));
    }

    return res.status(200).json({
      status: "success",
      success: true,
      data: stores.slice(0, Number(limit)),
      total: stores.length,
    });
  } catch (error) {
    console.error("get_nearby_stores error:", error);
    return res.status(500).json({ status: "error", success: false, message: error.message });
  }
};

const get_shop_hierarchy = async (req, res) => {
  try {
    const {
      IndustryType,
      ProjectCategory,
      ProjectSubcategory,
      ProjectType,
      ProjectSubcategoryType,
      ProjectRange,
    } = require("../../../admin-panel/models/core_db");

    const industryTypes = await IndustryType.find({ deleted_at: null, is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean();
    const categories = await ProjectCategory.find({ deleted_at: null, is_active: true })
      .sort({ sort_order: 1, _id: 1 })
      .lean();
    const subcategories = await ProjectSubcategory.find({ deleted_at: null, is_active: true }).lean();
    const types = await ProjectType.find({ deleted_at: null, is_active: true }).lean();
    const maps = await ProjectSubcategoryType.find({ deleted_at: null }).lean();
    const ranges = await ProjectRange.find({ deleted_at: null }).populate('unit_id').lean();

    const buildCategoryTree = (cat) => {
      const catSubs = subcategories.filter((sc) => String(sc.category || '') === String(cat._id));
      return {
        id: cat._id,
        name: cat.name || "Unnamed Category",
        industry_type_id: cat.industry_type_id || null,
        subcategories: catSubs.map((sc) => {
          const subMaps = maps.filter((m) => String(m.subcategory || '') === String(sc._id));
          return {
            id: sc._id,
            name: sc.name || "Unnamed Subcategory",
            category_id: sc.category,
            image: sc.image || null,
            color: sc.color || null,
            mappedTypes: subMaps.map((m) => {
              const type = types.find((t) => String(t._id) === String(m.type));
              const typeRanges = ranges.filter((r) => String(r.subcategory_type || '') === String(m._id));
              return {
                id: m._id,
                subcategory_type_id: m._id,
                type_id: type?._id,
                name: type ? type.name : "Unknown Type",
                ranges: typeRanges.map((r) => ({
                  id: r._id,
                  min_value: r.min_value ?? 0,
                  max_value: r.max_value ?? 0,
                  unit_symbol: r.unit_id?.symbol || "kW",
                  range_label: `${r.min_value} - ${r.max_value} ${r.unit_id?.symbol || 'kW'}`,
                })),
              };
            }),
          };
        }),
      };
    };

    const hierarchy = industryTypes.map((ind) => {
      const indCats = categories.filter((cat) => String(cat.industry_type_id || '') === String(ind._id));
      return {
        id: ind._id,
        name: ind.name,
        slug: ind.slug,
        description: ind.description,
        categories: indCats.map(buildCategoryTree),
      };
    });

    return res.json({
      status: "success",
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("get_shop_hierarchy error:", error);
    return res.status(500).json({ status: "error", success: false, message: error.message });
  }
};

module.exports = {
  get_combo_kits_by_district,
  get_inventory_status,
  get_checkout_settings,
  get_active_offers,
  reserve_stock,
  confirm_order,
  get_cart,
  update_cart,
  create_request_order,
  get_gst_status,
  gst_generate_otp,
  gst_verify_otp,
  get_orders,
  update_order_address,
  create_razorpay_order,
  verify_razorpay_payment,
  get_bos_kits,
  save_bos_kits,
  create_or_update_bos_kit,
  delete_bos_kit,
  toggle_bos_kit_stock,
  get_bos_custom_catalog,
  save_bos_custom_catalog,
  get_nearby_stores,
  get_shop_hierarchy,
};


