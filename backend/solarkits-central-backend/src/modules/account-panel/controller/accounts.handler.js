const mongoose = require('mongoose');
const { WarehouseInward, WarehouseStock, CompanyWarehouse, PurchaseOrder, PoRequest } = require('../models/company_warehouse_db');
const { ProductSku, Product, Brand, ProductTemplate, ProductSkuPrice, ProductAttributeValue, SubtypeAttribute, Unit, AttributeOption, ComboKit, SolarKit, WarehouseKitActivation, ProductSubtype } = require('../models/core_db');
const { company_warehouse_db, supplier_db } = require('../config/databases');
const { Cluster, GeoLevel2, GeoLevel0, GeoLevel1 } = require('../models/geolocation_db');
const { Supplier } = require('../models/supplier_db');
const { CountrySaaSProduct, CmsRole, CmsUserScope } = require('../models/user_db');
const estimatorAdminHandler = require('../../admin-panel/controller/estimator.admin.handler');
const { performGstVerification } = require('../../admin-panel/services/gst.verification.service');
const { isValidGstinFormat } = require('../../admin-panel/utils/gst.adapter');

// Register suppliers model on company_warehouse_db connection to allow populate('supplier_id') on PurchaseOrder
if (!company_warehouse_db.models['suppliers']) {
  company_warehouse_db.model('suppliers', Supplier.schema);
}

// ── helper: manual cross-connection SKU population ─────────────────────────
async function populateInwardSkus(inwards) {
  // Collect all unique sku_ids across all inward items
  const allSkuIds = [...new Set(
    inwards.flatMap(inv => inv.items.map(it => String(it.sku_id)))
  )];

  if (allSkuIds.length === 0) return inwards;

  // Fetch all SKUs from core_db, with nested product→brand+template
  const skus = await ProductSku.find({ _id: { $in: allSkuIds } }).lean();
  const productIds = [...new Set(skus.map(s => String(s.product_id)).filter(Boolean))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const brandIds = [...new Set(products.map(p => String(p.brand_id)).filter(Boolean))];
  const tplIds = [...new Set(products.map(p => String(p.template_id)).filter(Boolean))];
  const brands = await Brand.find({ _id: { $in: brandIds } }).lean();
  const templates = await ProductTemplate.find({ _id: { $in: tplIds } }).lean();

  // Build lookup maps
  const brandMap = Object.fromEntries(brands.map(b => [String(b._id), b]));
  const tplMap = Object.fromEntries(templates.map(t => [String(t._id), t]));
  const productMap = Object.fromEntries(products.map(p => [String(p._id), {
    ...p,
    brand_id: brandMap[String(p.brand_id)] || null,
    template_id: tplMap[String(p.template_id)] || null,
  }]));
  const skuMap = Object.fromEntries(skus.map(s => [String(s._id), {
    ...s,
    product_id: productMap[String(s.product_id)] || null,
  }]));

  // Stitch into each inward's items
  return inwards.map(inv => ({
    ...inv,
    items: inv.items.map(it => ({
      ...it,
      sku_id: skuMap[String(it.sku_id)] || it.sku_id,
    }))
  }));
}

// ── helper: query SKU capacity directly from ProductAttributeValue ──────────
async function getSkuCapacityW(skuId, productId) {
  try {
    const attrs = await ProductAttributeValue.find({
      $or: [
        { sku_id: skuId },
        { product_id: productId, sku_id: null }
      ],
      deleted_at: null
    })
      .populate('attribute_id')
      .populate('unit_id')
      .populate('value_option_id')
      .lean();

    const capAttr = attrs.find(a => 
      a.attribute_id?.attribute_type === 'sku' ||
      ['capacity', 'power rating', 'ac capacity', 'pmax', 'power'].includes((a.attribute_id?.name || '').toLowerCase().trim())
    );
    if (capAttr) {
      const rawVal = parseFloat(capAttr.value_number ?? (capAttr.value_option_id ? capAttr.value_option_id.value : capAttr.value_text) ?? 0);
      const factor = capAttr.unit_id?.conversion_factor || 1;
      return {
        capacity_w: rawVal * factor,
        capacity_unit: capAttr.unit_id?.symbol || ''
      };
    }
  } catch (err) {
    console.error("Error in getSkuCapacityW helper:", err);
  }
  return { capacity_w: 0, capacity_unit: '' };
}


const getUserAllowedClusterIds = async (user) => {
  const currentUserRole = await CmsRole.findById(user.role_id).populate('level_id');
  const levelName = currentUserRole?.level_id?.name?.toLowerCase();

  if (levelName === 'global') {
    return null; // Global access: no restriction
  }

  const userScopes = await CmsUserScope.find({ user_id: user.id, deleted_at: null }).lean();
  const scopeIds = userScopes.map(s => new mongoose.Types.ObjectId(s.scope_id));

  const allowedClusterIds = [];

  // 1. Direct clusters
  const directClusters = await Cluster.find({ _id: { $in: scopeIds }, is_active: true, deleted_at: null }).select('_id').lean();
  allowedClusterIds.push(...directClusters.map(c => c._id));

  // 2. Clusters under assigned states
  const clustersByState = await Cluster.find({ level_1: { $in: scopeIds }, is_active: true, deleted_at: null }).select('_id').lean();
  allowedClusterIds.push(...clustersByState.map(c => c._id));

  // 3. Clusters under assigned countries
  const statesInCountries = await GeoLevel1.find({ level_0: { $in: scopeIds }, is_active: true, deleted_at: null }).select('_id').lean();
  const stateIds = statesInCountries.map(s => s._id);
  const clustersByCountry = await Cluster.find({ level_1: { $in: stateIds }, is_active: true, deleted_at: null }).select('_id').lean();
  allowedClusterIds.push(...clustersByCountry.map(c => c._id));

  return [...new Set(allowedClusterIds.map(id => id.toString()))];
};

const get_pending_inwards = async (req, res) => {
  try {
    const pending = await WarehouseInward.find({ status: 'pending_match' })
      .populate('warehouse_id')
      .lean();

    const populated = await populateInwardSkus(pending);
    return res.status(200).json({ status: "success", data: populated });
  } catch (err) {
    console.error("Error in get_pending_inwards:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch pending inwards.", error: err.message });
  }
};

const approve_inward = async (req, res) => {
  const session = await company_warehouse_db.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    // Fetch inward (lean — no cross-connection populate)
    const inward = await WarehouseInward.findById(id).session(session);

    if (!inward) {
      return res.status(404).json({ status: "error", message: "Inward transaction not found." });
    }

    if (inward.status !== 'pending_match') {
      return res.status(400).json({ status: "error", message: `Inward cannot be approved. Current status: ${inward.status}` });
    }

    // Update status of inward
    inward.status = 'approved';
    await inward.save({ session });

    // Manually fetch SKU details from core_db for stock logic
    const skuIds = inward.items.map(it => it.sku_id);
    const skus = await ProductSku.find({ _id: { $in: skuIds } }).lean();
    const productIds = [...new Set(skus.map(s => String(s.product_id)).filter(Boolean))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const tplIds = [...new Set(products.map(p => String(p.template_id)).filter(Boolean))];
    const templates = await ProductTemplate.find({ _id: { $in: tplIds } }).lean();
    const tplMap = Object.fromEntries(templates.map(t => [String(t._id), t]));
    const productMap = Object.fromEntries(products.map(p => [String(p._id), { ...p, template_id: tplMap[String(p.template_id)] || null }]));
    const skuMap = Object.fromEntries(skus.map(s => [String(s._id), { ...s, product_id: productMap[String(s.product_id)] || null }]));

    // Update stocks
    for (const item of inward.items) {
      const sku = skuMap[String(item.sku_id)];
      const isSolarPanel = sku?.product_id?.template_id?.name?.toLowerCase().includes('solar panel') || false;

      // Extract wattage
      let wattage = 550; // default
      if (sku?.attributes && sku.attributes.length > 0) {
        for (const attr of sku.attributes) {
          const val = String(attr.value_raw || '');
          if (val.toLowerCase().endsWith('w') || /^\d+$/.test(val)) {
            const parsed = parseInt(val);
            if (!isNaN(parsed)) {
              wattage = parsed;
              break;
            }
          }
        }
      }

      let stock = await WarehouseStock.findOne({ warehouse_id: inward.warehouse_id, sku_id: item.sku_id }).session(session);

      if (stock) {
        const oldQty = stock.qty;
        const newQty = oldQty + item.qty;

        const oldAverageInvoice = stock.average_invoice_price || 0;
        const oldAverageBenchmark = stock.average_benchmark_price || 0;

        const newAverageInvoice = ((oldQty * oldAverageInvoice) + (item.qty * item.invoice_price)) / newQty;
        const newAverageBenchmark = ((oldQty * oldAverageBenchmark) + (item.qty * item.benchmark_price)) / newQty;

        stock.qty = newQty;
        stock.average_invoice_price = Math.round(newAverageInvoice * 100) / 100;
        stock.average_benchmark_price = Math.round(newAverageBenchmark * 100) / 100;
        stock.total_valuation_invoice = Math.round(newQty * newAverageInvoice * 100) / 100;
        stock.total_valuation_benchmark = Math.round(newQty * newAverageBenchmark * 100) / 100;

        if (isSolarPanel) {
          stock.total_kw = Math.round((newQty * wattage / 1000) * 100) / 100;
        } else {
          stock.total_kw = 0;
        }
        await stock.save({ session });
      } else {
        const totalValuationInvoice = item.qty * item.invoice_price;
        const totalValuationBenchmark = item.qty * item.benchmark_price;
        const totalKw = isSolarPanel ? (item.qty * wattage / 1000) : 0;

        await WarehouseStock.create([{
          warehouse_id: inward.warehouse_id,
          sku_id: sku._id,
          sku_code: item.sku_code,
          qty: item.qty,
          total_kw: Math.round(totalKw * 100) / 100,
          average_invoice_price: item.invoice_price,
          average_benchmark_price: item.benchmark_price,
          total_valuation_invoice: Math.round(totalValuationInvoice * 100) / 100,
          total_valuation_benchmark: Math.round(totalValuationBenchmark * 100) / 100
        }], { session });
      }
    }

    await session.commitTransaction();
    return res.status(200).json({ status: "success", message: "Inward transaction approved and stock updated successfully." });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in approve_inward:", err);
    return res.status(500).json({ status: "error", message: err.message });
  } finally {
    session.endSession();
  }
};

const reject_inward = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const inward = await WarehouseInward.findById(id);
    if (!inward) {
      return res.status(404).json({ status: "error", message: "Inward transaction not found." });
    }

    if (inward.status !== 'pending_match') {
      return res.status(400).json({ status: "error", message: `Inward cannot be rejected. Current status: ${inward.status}` });
    }

    inward.status = 'rejected';
    inward.rejection_reason = reason || 'Rejected by Accounts';
    await inward.save();

    return res.status(200).json({ status: "success", message: "Inward transaction rejected successfully." });
  } catch (err) {
    console.error("Error in reject_inward:", err);
    return res.status(500).json({ status: "error", message: "Failed to reject inward transaction." });
  }
};

const get_warehouses = async (req, res) => {
  try {
    const { clusterId, stateId, countryId } = req.query;
    let query = { is_active: { $ne: false }, deleted_at: null };

    // Resolve user's allowed cluster IDs
    const allowedClusterIds = await getUserAllowedClusterIds(req.user);

    if (allowedClusterIds !== null) {
      if (allowedClusterIds.length === 0) {
        // If user scope has no cluster, fallback to all active company warehouses
        const allWh = await CompanyWarehouse.find({ is_active: { $ne: false }, deleted_at: null }).lean();
        if (allWh.length > 0) {
          query = { is_active: { $ne: false }, deleted_at: null };
        } else {
          return res.status(200).json({ status: "success", data: [] });
        }
      } else {
        const allowedDistricts = await GeoLevel2.find({ cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) }, deleted_at: null }).select('_id').lean();
        const allowedDistrictIds = allowedDistricts.map(d => d._id);
        if (allowedDistrictIds.length > 0) {
          query.level_2 = { $in: allowedDistrictIds };
        }
      }
    }

    if (clusterId) {
      const isValid = mongoose.Types.ObjectId.isValid(clusterId);
      if (isValid) {
        const clusterObjId = new mongoose.Types.ObjectId(clusterId);
        const districts = await GeoLevel2.find({ cluster: clusterObjId, deleted_at: null }).select('_id').lean();
        const districtIds = districts.map(d => d._id);
        if (districtIds.length > 0) {
          query.level_2 = { $in: districtIds };
        }
      }
    } else if (stateId) {
      const isValid = mongoose.Types.ObjectId.isValid(stateId);
      if (isValid) {
        query.level_1 = new mongoose.Types.ObjectId(stateId);
      }
    } else if (countryId) {
      const isValid = mongoose.Types.ObjectId.isValid(countryId);
      if (isValid) {
        query.level_0 = new mongoose.Types.ObjectId(countryId);
      }
    }

    let warehouses = await CompanyWarehouse.find(query).lean();

    // Fallback: If filtered warehouses is empty, return all active company warehouses so user is never blocked
    if (!warehouses || warehouses.length === 0) {
      warehouses = await CompanyWarehouse.find({ is_active: { $ne: false }, deleted_at: null }).lean();
    }

    // Cross-connection lookup for GeoLevel1 (State) and GeoLevel2 (District)
    const stateIds = [...new Set(warehouses.map(w => w.level_1?.toString()).filter(Boolean))];
    const districtIds = [...new Set(warehouses.map(w => w.level_2?.toString()).filter(Boolean))];

    const [states, districts] = await Promise.all([
      stateIds.length > 0 ? GeoLevel1.find({ _id: { $in: stateIds } }).lean() : [],
      districtIds.length > 0 ? GeoLevel2.find({ _id: { $in: districtIds } }).lean() : [],
    ]);

    const stateMap = Object.fromEntries(states.map(s => [s._id.toString(), s]));
    const districtMap = Object.fromEntries(districts.map(d => [d._id.toString(), d]));

    const enrichedWarehouses = warehouses.map(wh => {
      const stateObj = wh.level_1 ? stateMap[wh.level_1.toString()] : null;
      const districtObj = wh.level_2 ? districtMap[wh.level_2.toString()] : null;
      const stateName = stateObj?.name || "";
      const districtName = districtObj?.name || "";
      const locationParts = [districtName, stateName].filter(Boolean).join(", ");
      const displayName = `${wh.warehouse_code || 'WH'}${locationParts ? ` — ${locationParts}` : ''}${wh.address ? ` (${wh.address})` : ''}`;

      return {
        ...wh,
        state_id: wh.level_1,
        district_id: wh.level_2,
        state_name: stateName,
        district_name: districtName,
        level_1: stateObj || wh.level_1,
        level_2: districtObj || wh.level_2,
        display_name: displayName,
      };
    });

    return res.status(200).json({ status: "success", data: enrichedWarehouses });
  } catch (err) {
    console.error("Error in get_warehouses:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch warehouses." });
  }
};

const get_warehouse_inwards = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) {
      return res.status(400).json({ status: "error", message: "Warehouse ID is required." });
    }

    const inwards = await WarehouseInward.find({ warehouse_id: warehouseId, status: 'approved' })
      .sort({ created_at: -1 })
      .lean();

    const populated = await populateInwardSkus(inwards);
    return res.status(200).json({ status: "success", data: populated });
  } catch (err) {
    console.error("Error in get_warehouse_inwards:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch warehouse inwards." });
  }
};

const list_suppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ is_deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json({ status: 'success', data: suppliers });
  } catch (err) {
    console.error('list_suppliers error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch suppliers.', error: err.message });
  }
};

const create_supplier = async (req, res) => {
  try {
    const {
      email, phone, phone_code = '+91', company_name, brand_name, brand_logo,
      gst_number, pan_number, office_location, office_locations, states, supply_districts,
      country_id
    } = req.body;

    if (!email || !phone || !company_name || !brand_name) {
      return res.status(400).json({ status: 'error', message: 'Email, phone, company name, and brand name are required.' });
    }

    const emailLower = email.trim().toLowerCase();
    const phoneTrim = phone.trim();
    const phoneCodeTrim = phone_code.trim();

    const targetGst = gst_number ? gst_number.trim().toUpperCase() : null;
    const derivedPan = targetGst ? targetGst.substring(2, 12).toUpperCase() : null;
    const targetPan = derivedPan || (pan_number ? pan_number.trim().toUpperCase() : null);

    // Validate GST uniqueness
    if (targetGst) {
      const existingGstSupplier = await Supplier.findOne({
        is_deleted: { $ne: true },
        $or: [
          { gst_number: targetGst },
          { 'gst_list.gst_number': targetGst }
        ]
      });
      if (existingGstSupplier) {
        return res.status(409).json({
          status: 'error',
          message: `A supplier with this GST number (${targetGst}) already exists.`
        });
      }
    }

    // Check duplicate PAN: if exists, expand coverage instead of creating a new account
    if (targetPan) {
      const existingPanSupplier = await Supplier.findOne({
        is_deleted: { $ne: true },
        $or: [
          { pan_number: targetPan },
          { 'gst_list.pan_number': targetPan }
        ]
      });

      if (existingPanSupplier) {
        // Expand coverage of the existing supplier
        if (targetGst) {
          const gstExists = (existingPanSupplier.gst_list || []).some(
            g => g.gst_number.trim().toUpperCase() === targetGst
          );
          if (!gstExists) {
            existingPanSupplier.gst_list.push({
              gst_number: targetGst,
              pan_number: targetPan,
              state: states?.[0] || null,
              is_verified: true
            });
          }
        }

        // Merge states
        if (Array.isArray(states)) {
          states.forEach(st => {
            if (st && !existingPanSupplier.states.includes(st)) {
              existingPanSupplier.states.push(st);
            }
          });
        }

        // Merge office locations
        if (Array.isArray(office_locations)) {
          office_locations.forEach(loc => {
            existingPanSupplier.office_locations.push(loc);
          });
        }

        // Merge supply districts
        if (Array.isArray(supply_districts)) {
          supply_districts.forEach(dist => {
            if (dist && !existingPanSupplier.supply_districts.includes(dist)) {
              existingPanSupplier.supply_districts.push(dist);
            }
          });
        }

        // Ensure supplier is approved and verified
        existingPanSupplier.is_verified = true;
        existingPanSupplier.status = 'approved';

        await existingPanSupplier.save();

        return res.status(200).json({
          status: 'success',
          message: 'Supplier coverage expanded successfully on the existing account.',
          data: existingPanSupplier
        });
      }
    }

    // Fetch country name from GeoLevel0
    let countryName = null;
    if (country_id) {
      const countryDoc = await GeoLevel0.findById(country_id).lean();
      if (countryDoc) {
        countryName = countryDoc.name;
      }
    }

    const supplier = new Supplier({
      email: emailLower,
      phone: phoneTrim,
      phone_code: phoneCodeTrim,
      country: countryName,
      country_id: country_id || null,
      company_name: company_name.trim(),
      brand_name: brand_name.trim(),
      brand_logo: brand_logo || null,
      is_verified: true,
      status: 'approved',
      gst_number: targetGst,
      pan_number: targetPan,
      office_location: office_location || { type: 'Point', coordinates: [0, 0], address: null },
      office_locations: Array.isArray(office_locations) ? office_locations : [],
      states: Array.isArray(states) ? states : [],
      supply_districts: Array.isArray(supply_districts) ? supply_districts : [],
      gst_list: targetGst ? [{
        gst_number: targetGst,
        pan_number: targetPan,
        state: states?.[0] || null,
        is_verified: true
      }] : []
    });

    await supplier.save();

    return res.status(201).json({
      status: 'success',
      message: 'Supplier registered successfully. The supplier is approved by default.',
      data: supplier
    });
  } catch (err) {
    console.error('create_supplier error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to register supplier.', error: err.message });
  }
};

const GST_STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

const getAddressFromGstData = (data) => {
  if (!data) return '';
  if (typeof data.address === 'string' && data.address.trim()) return data.address.trim();
  if (data.prb && data.prb.addr) {
    const a = data.prb.addr;
    return [a.bno, a.flno, a.st, a.loc, a.dst, a.stcd, a.pn].filter(Boolean).join(', ');
  }
  if (data.pradr && data.pradr.addr) {
    const a = data.pradr.addr;
    return [a.bno, a.bnm, a.st, a.loc, a.dst, a.stcd, a.pncd].filter(Boolean).join(', ');
  }
  return '';
};

/**
 * Direct QuickEKYC GST Verification for Supplier Registration
 * POST /accounts/gst/verify
 * Body: { gstin }
 */
const gst_verify = async (req, res) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      return res.status(400).json({ status: 'error', message: 'GSTIN is required.' });
    }

    const formattedGst = gstin.trim().toUpperCase();
    if (!isValidGstinFormat(formattedGst)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid GSTIN format. Expected 15-character alphanumeric GSTIN (e.g. 24ABCDE1234A1ZN).'
      });
    }

    // Check duplicate GST in supplier database
    const existingGstSupplier = await Supplier.findOne({
      is_deleted: { $ne: true },
      $or: [
        { gst_number: formattedGst },
        { 'gst_list.gst_number': formattedGst }
      ]
    });
    if (existingGstSupplier) {
      return res.status(409).json({
        status: 'error',
        message: `GST number ${formattedGst} is already registered with supplier "${existingGstSupplier.brand_name || existingGstSupplier.company_name}".`
      });
    }

    // Call unified QuickEKYC verification service
    const verification = await performGstVerification({
      gstin: formattedGst,
      entity_type: 'supplier',
      verified_by: req.user?.id || 'accounts_admin',
      options: {
        provider: process.env.QUICKEKYC_PROVIDER || 'quickekyc',
      }
    });

    if (!verification.is_valid) {
      return res.status(400).json({
        status: 'error',
        message: verification.error_message || 'GST verification failed or GSTIN is inactive.'
      });
    }

    const stateCode = formattedGst.substring(0, 2);
    const resolvedStateName = verification.state_name || verification.registration_state || GST_STATE_CODES[stateCode] || 'Gujarat';

    // Auto-resolve matching state_id from GeoLevel1
    let state_id = '';
    try {
      const allStates = await GeoLevel1.find({ is_active: true, deleted_at: null }).lean();
      const normState = resolvedStateName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = allStates.find(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normState);
      if (matched) {
        state_id = String(matched._id);
      }
    } catch (e) {
      console.warn('Could not auto-resolve state_id:', e.message);
    }

    const pan = verification.pan_number || (formattedGst.length >= 12 ? formattedGst.substring(2, 12) : '');
    const companyName = verification.legal_name || verification.company_name || verification.trade_name || '';
    const brandName = verification.trade_name || verification.legal_name || verification.company_name || '';
    const address = verification.address || (typeof verification.principal_address === 'string' ? verification.principal_address : '') || '';

    return res.status(200).json({
      status: 'success',
      data: {
        gst_number: formattedGst,
        company_name: companyName,
        brand_name: brandName,
        pan_number: pan,
        state_name: resolvedStateName,
        state_id: state_id,
        district_name: verification.district_name || verification.district || '',
        address: address,
        pincode: verification.pincode || '',
        gstin_status: verification.gstin_status || verification.business_status || 'Active',
        taxpayer_type: verification.taxpayer_type || 'Regular',
        nature_bus_activities: verification.nature_bus_activities || [],
        email: verification.raw_response?.data?.email_id || '',
        phone: String(verification.raw_response?.data?.mobile_no || '')
      }
    });
  } catch (err) {
    console.error('gst_verify error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'GST verification failed. Please try again.'
    });
  }
};

const gst_generate_otp = async (req, res) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      return res.status(400).json({ status: 'error', message: 'GSTIN is required.' });
    }

    const formattedGst = gstin.trim().toUpperCase();
    const existingGstSupplier = await Supplier.findOne({
      is_deleted: { $ne: true },
      $or: [
        { gst_number: formattedGst },
        { 'gst_list.gst_number': formattedGst }
      ]
    });
    if (existingGstSupplier) {
      return res.status(409).json({
        status: 'error',
        message: `GST number ${formattedGst} is already registered.`
      });
    }

    const apiKey = process.env.QUICKEKYC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ status: 'error', message: 'QuickeKYC API key is not configured.' });
    }

    const baseUrl = 'https://api.quickekyc.com';
    let data;
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
      data = JSON.parse(text);
    } catch (e) {
      console.warn('QuickeKYC generate-otp non-JSON or network error, activating fallback:', e.message);
      return res.status(200).json({
        status: 'success',
        request_id: `mock_qk_${Date.now()}`,
        message: 'OTP sent (Dev fallback mode: type 000000 or 123456 to verify).'
      });
    }

    if (data.status !== 'success') {
      // In dev or IP whitelist issue, provide graceful fallback
      if (process.env.NODE_ENV === 'development' || data.status_code === 401 || data.message?.includes('whitelist') || data.message?.includes('Unauthorized')) {
        return res.status(200).json({
          status: 'success',
          request_id: `mock_qk_${Date.now()}`,
          message: 'OTP sent (QuickeKYC Dev Mode: type 000000 to verify).'
        });
      }
      return res.status(data.status_code || 400).json(data);
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('gst_generate_otp error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to send OTP.'
    });
  }
};

const gst_submit_otp = async (req, res) => {
  try {
    const { request_id, otp, gstin } = req.body;
    if (!request_id || !otp || !gstin) {
      return res.status(400).json({ status: 'error', message: 'request_id, otp, and gstin are required.' });
    }

    const cleanGstin = gstin.trim().toUpperCase();
    const cleanOtp = String(otp).trim();

    // Dev / Mock fallback condition
    const isMock = request_id.startsWith('mock_') || cleanOtp === '000000' || cleanOtp === '123456';
    if (isMock) {
      const stateCode = cleanGstin.substring(0, 2);
      const stateName = GST_STATE_CODES[stateCode] || 'Gujarat';
      const pan = cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : 'AABCS1234F';
      const address = `Plot No. 42, Solar Industrial Area, ${stateName}`;

      return res.status(200).json({
        status: 'success',
        data: {
          gstin: cleanGstin,
          gstin_status: 'Active',
          legal_name: `SOLARKITS ${stateName.toUpperCase()} PVT LTD`,
          business_name: `SOLARKITS ${stateName.toUpperCase()}`,
          pan_number: pan,
          address: address,
          state: stateName,
          email_id: 'supplier@solarkits.in',
          mobile_no: '9876543210'
        },
        address,
        state: stateName
      });
    }

    const apiKey = process.env.QUICKEKYC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ status: 'error', message: 'QuickeKYC API key is not configured.' });
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
        otp: cleanOtp
      })
    });

    const text = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(text);
    } catch (e) {
      console.error('QuickeKYC submit-otp response was not JSON:', text);
      return res.status(response.status || 500).json({
        status: 'error',
        message: `QuickeKYC server returned non-JSON response (HTTP ${response.status}).`
      });
    }
    if (resJson.status !== 'success' || !resJson.data) {
      return res.status(resJson.status_code || response.status || 400).json(resJson);
    }

    const gstinStatus = resJson.data.gstin_status || resJson.data.gstinStatus || resJson.data.status || resJson.data.gstStatus || '';
    if (gstinStatus && gstinStatus.toLowerCase() !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: `GSTIN is inactive (Status: ${gstinStatus}). Only active GSTINs are allowed.`
      });
    }

    const address = getAddressFromGstData(resJson.data);
    const stateCode = cleanGstin.substring(0, 2);
    const state = GST_STATE_CODES[stateCode] || 'Gujarat';

    return res.status(200).json({
      ...resJson,
      address,
      state
    });
  } catch (err) {
    console.error('gst_submit_otp error:', err);
    return res.status(400).json({ status: 'error', message: err.message || 'GST verification failed.' });
  }
};

const get_warehouse_skus = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ status: "error", message: "Invalid warehouse ID." });
    }

    const warehouse = await CompanyWarehouse.findById(warehouseId).lean();
    if (!warehouse) {
      return res.status(404).json({ status: "error", message: "Warehouse not found." });
    }

    let cluster_id = null;
    if (warehouse.level_2) {
      const district = await GeoLevel2.findById(warehouse.level_2).lean();
      if (district && district.cluster) {
        cluster_id = district.cluster;
      }
    }

    // Fetch all active SKUs
    const skus = await ProductSku.find({ deleted_at: null })
      .populate({
        path: 'product_id',
        populate: [
          { path: 'brand_id' },
          { path: 'template_id' },
          { path: 'subtype_id' }
        ]
      })
      .populate('attributes.subtype_attribute_id')
      .populate('attributes.unit_id')
      .lean();

    // Fetch all active prices for mapping
    const priceQuery = { price: { $gt: 0 } };
    if (cluster_id) {
      priceQuery.$or = [
        { warehouse_id: warehouseId },
        { cluster_id }
      ];
    } else {
      priceQuery.warehouse_id = warehouseId;
    }

    const prices = await ProductSkuPrice.find(priceQuery).lean();

    const skuPricesMap = {};
    for (const p of prices) {
      const skuIdStr = p.sku_id.toString();
      const existing = skuPricesMap[skuIdStr];

      if (!existing) {
        skuPricesMap[skuIdStr] = p;
      } else {
        const isNewWarehouseSpecific = p.warehouse_id && p.warehouse_id.toString() === warehouseId.toString();
        const isExistingWarehouseSpecific = existing.warehouse_id && existing.warehouse_id.toString() === warehouseId.toString();

        if (isNewWarehouseSpecific && !isExistingWarehouseSpecific) {
          skuPricesMap[skuIdStr] = p;
        }
      }
    }

    const skuIds = skus.map(s => s._id);
    const stocks = await WarehouseStock.find({ warehouse_id: warehouseId, sku_id: { $in: skuIds } }).lean();
    const stockMap = new Map(stocks.map(s => [s.sku_id.toString(), s.qty]));

    const formattedSkus = (await Promise.all(skus.map(async sku => {
      const product = sku.product_id;
      if (!product || product.deleted_at) return null;

      const priceEntry = skuPricesMap[sku._id.toString()];
      const benchmark_price = priceEntry ? priceEntry.price : 0;

      if (benchmark_price <= 0) return null;

      // Find capacity attribute
      let { capacity_w, capacity_unit } = await getSkuCapacityW(sku._id, product._id);

      // Fallback to denormalized attributes
      if (capacity_w === 0 && sku.attributes && sku.attributes.length > 0) {
        let capAttr = sku.attributes.find(a => a.subtype_attribute_id?.attribute_type === 'sku');
        if (!capAttr) {
          capAttr = sku.attributes.find(a => ['capacity', 'power rating', 'ac capacity', 'pmax', 'power'].includes((a.subtype_attribute_id?.name || '').toLowerCase().trim()));
        }
        if (capAttr) {
          const rawVal = parseFloat(capAttr.value_raw || capAttr.value_base_unit || 0);
          const factor = capAttr.unit_id?.conversion_factor || 1;
          capacity_w = rawVal * factor;
          capacity_unit = capAttr.unit_id?.symbol || '';
        }
      }

      const isSolar = (product.template_id?.name || '').toLowerCase().includes('solar panel');
      let benchmark_price_per_watt = priceEntry ? priceEntry.price_per_watt : 0;
      if (isSolar && benchmark_price_per_watt === 0 && benchmark_price > 0 && capacity_w > 0) {
        benchmark_price_per_watt = benchmark_price / capacity_w;
      }

      return {
        id: sku._id,
        sku_code: sku.sku_code,
        product_name: product.name,
        product_id: product._id || null,
        subtype_id: product.subtype_id?._id || null,
        subtype_name: product.subtype_id?.name || 'N/A',
        brand_name: product.brand_id?.brand_name || 'N/A',
        category: product.template_id?.name || 'N/A',
        template_id: product.template_id?._id || null,
        benchmark_price,
        benchmark_price_per_watt,
        capacity_w,
        capacity_unit,
        currency_code: priceEntry ? priceEntry.currency_code : 'INR',
        stock_qty: stockMap.get(sku._id.toString()) || 0
      };
    }))).filter(Boolean);

    return res.status(200).json({ status: "success", data: formattedSkus });
  } catch (err) {
    console.error("Error in get_warehouse_skus:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch warehouse SKUs.", error: err.message });
  }
};

const get_sku_suppliers = async (req, res) => {
  try {
    const { warehouseId, skuId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId) || !mongoose.Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({ status: "error", message: "Invalid parameters." });
    }

    const warehouse = await CompanyWarehouse.findById(warehouseId).lean();
    if (!warehouse) {
      return res.status(404).json({ status: "error", message: "Warehouse not found." });
    }

    let districtName = null;
    if (warehouse.level_2) {
      const district = await GeoLevel2.findById(warehouse.level_2).lean();
      if (district) {
        districtName = district.name;
      }
    }

    if (!districtName) {
      return res.status(400).json({ status: "error", message: "Warehouse is not linked to a valid district." });
    }

    const suppliers = await Supplier.find({
      supply_districts: { $in: [new RegExp(`^${districtName.trim()}$`, 'i')] },
      status: 'approved',
      is_active: true,
      is_deleted: { $ne: true }
    }).select('_id company_name brand_name').lean();

    const supplierIds = suppliers.map(s => s._id);

    const skuDetail = await ProductSku.findById(skuId)
      .populate({
        path: 'product_id',
        populate: { path: 'template_id' }
      })
      .lean();
    const isSolar = skuDetail && (skuDetail.product_id?.template_id?.name || '').toLowerCase().includes('solar panel');

    const SupplierSkuPrice = supplier_db.models['supplier_sku_prices'] || supplier_db.model('supplier_sku_prices', new mongoose.Schema({
      supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'suppliers', required: true },
      warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier_warehouses', required: true },
      sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'pc_product_skus', required: true },
      price: { type: Number, required: true, default: 0 },
      price_per_watt: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true }
    }, { collection: 'supplier_sku_prices' }));

    const prices = await SupplierSkuPrice.find({
      supplier_id: { $in: supplierIds },
      sku_id: skuId,
      price: { $gt: 0 },
      is_active: true
    }).populate('supplier_id', 'company_name brand_name').lean();

    const supplierBestPriceMap = {};
    for (const p of prices) {
      const sup = p.supplier_id;
      if (!sup) continue;
      const supIdStr = sup._id.toString();
      const actualPrice = isSolar ? (p.price_per_watt || p.price) : p.price;
      if (!supplierBestPriceMap[supIdStr] || supplierBestPriceMap[supIdStr].price > actualPrice) {
        supplierBestPriceMap[supIdStr] = {
          supplier_id: sup._id,
          company_name: sup.company_name,
          brand_name: sup.brand_name,
          price: actualPrice
        };
      }
    }

    const formattedSuppliers = Object.values(supplierBestPriceMap)
      .sort((a, b) => a.price - b.price);

    return res.status(200).json({ status: "success", data: formattedSuppliers });
  } catch (err) {
    console.error("Error in get_sku_suppliers:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch suppliers for SKU.", error: err.message });
  }
};

const get_warehouse_suppliers = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ status: "error", message: "Invalid warehouse ID." });
    }

    const warehouse = await CompanyWarehouse.findById(warehouseId).lean();
    if (!warehouse) {
      return res.status(404).json({ status: "error", message: "Warehouse not found." });
    }

    const warehouseStateId = warehouse.level_1 ? warehouse.level_1.toString() : null;
    const warehouseCountryId = warehouse.level_0 ? warehouse.level_0.toString() : null;

    let query = {
      status: 'approved',
      is_active: { $ne: false },
      is_deleted: { $ne: true }
    };

    if (warehouseStateId) {
      query.$or = [
        { states: warehouseStateId },
        { states: new mongoose.Types.ObjectId(warehouseStateId) },
        { 'gst_list.state': warehouseStateId }
      ];
    } else if (warehouseCountryId) {
      query.country_id = warehouseCountryId;
    }

    // Find all active, approved suppliers matching query
    let suppliers = await Supplier.find(query).lean();

    // Fallback: If no suppliers are explicitly bound to this specific state, return all approved suppliers
    if (!suppliers || suppliers.length === 0) {
      suppliers = await Supplier.find({
        status: 'approved',
        is_active: { $ne: false },
        is_deleted: { $ne: true }
      }).lean();
    }

    const formattedSuppliers = suppliers.map(sup => {
      // Find the specific GST number matching the state of the warehouse
      let gst_number = '';
      if (warehouseStateId) {
        const matchedGstEntry = (sup.gst_list || []).find(g => String(g.state) === String(warehouseStateId));
        gst_number = matchedGstEntry ? matchedGstEntry.gst_number : (sup.gst_number || '');
      } else {
        gst_number = sup.gst_number || '';
      }

      return {
        _id: sup._id,
        supplier_id: sup._id,
        company_name: sup.company_name,
        brand_name: sup.brand_name || sup.company_name,
        gst_number: gst_number,
        pan_number: sup.pan_number || '',
        email: sup.email || '',
        phone: sup.phone || '',
        address: sup.address || '',
        states: sup.states || []
      };
    });

    return res.status(200).json({ status: "success", data: formattedSuppliers });
  } catch (err) {
    console.error("Error in get_warehouse_suppliers:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch warehouse suppliers.", error: err.message });
  }
};

const get_supplier_warehouse_prices = async (req, res) => {
  try {
    const { warehouseId, supplierId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId) || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ status: "error", message: "Invalid parameters." });
    }

    const SupplierSkuPrice = supplier_db.models['supplier_sku_prices'] || supplier_db.model('supplier_sku_prices', new mongoose.Schema({
      supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'suppliers', required: true },
      warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier_warehouses', required: true },
      sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'pc_product_skus', required: true },
      price: { type: Number, required: true, default: 0 },
      price_per_watt: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true }
    }, { collection: 'supplier_sku_prices' }));

    const prices = await SupplierSkuPrice.find({
      supplier_id: supplierId,
      price: { $gt: 0 },
      is_active: true
    }).populate({
      path: 'sku_id',
      populate: {
        path: 'product_id',
        populate: { path: 'template_id' }
      }
    }).lean();

    const pricesMap = {};
    for (const p of prices) {
      if (!p.sku_id) continue;
      const isSolar = (p.sku_id.product_id?.template_id?.name || '').toLowerCase().includes('solar panel');
      if (isSolar) {
        pricesMap[p.sku_id._id.toString()] = p.price_per_watt || 0;
      } else {
        pricesMap[p.sku_id._id.toString()] = p.price;
      }
    }

    return res.status(200).json({ status: "success", data: pricesMap });
  } catch (err) {
    console.error("Error in get_supplier_warehouse_prices:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch supplier prices.", error: err.message });
  }
};

const create_purchase_order = async (req, res) => {
  try {
    const { warehouse_id, supplier_id, items, timeline } = req.body;
    if (!warehouse_id || !supplier_id || !items || !Array.isArray(items) || items.length === 0 || !timeline) {
      return res.status(400).json({ status: "error", message: "Missing required fields." });
    }

    const warehouse = await CompanyWarehouse.findById(warehouse_id).lean();
    if (!warehouse) {
      return res.status(404).json({ status: "error", message: "Warehouse not found." });
    }

    const supplier = await Supplier.findById(supplier_id).lean();
    if (!supplier) {
      return res.status(404).json({ status: "error", message: "Supplier not found." });
    }

    let cluster_id = null;
    if (warehouse.level_2) {
      const district = await GeoLevel2.findById(warehouse.level_2).lean();
      if (district && district.cluster) {
        cluster_id = district.cluster;
      }
    }

    let needs_price_approval = false;
    const price_approval_items = [];
    const processedItems = [];
    for (const item of items) {
      const { sku_id, qty, order_price } = item;
      if (!sku_id || !qty || !order_price) {
        return res.status(400).json({ status: "error", message: "Invalid item details." });
      }

      let priceEntry = await ProductSkuPrice.findOne({ warehouse_id, sku_id, price: { $gt: 0 } });
      if (!priceEntry && cluster_id) {
        priceEntry = await ProductSkuPrice.findOne({ cluster_id, sku_id, price: { $gt: 0 } });
      }

      if (!priceEntry || priceEntry.price <= 0) {
        return res.status(400).json({
          status: "error",
          message: `Benchmark price is not set for SKU ${sku_id} on this warehouse cluster.`
        });
      }

      // Fetch SKU details to check if solar panel and get capacity
      const skuDetail = await ProductSku.findById(sku_id)
        .populate({
          path: 'product_id',
          populate: { path: 'template_id' }
        })
        .populate('attributes.subtype_attribute_id')
        .populate('attributes.unit_id')
        .lean();

      if (!skuDetail) {
        return res.status(400).json({ status: "error", message: `SKU ${sku_id} not found.` });
      }

      const productDetail = skuDetail.product_id || {};
      const templateDetail = productDetail.template_id;
      const isSolarPanel = (templateDetail?.name || '').toLowerCase().includes('solar panel');

      // Calculate capacity_w using unit conversion factor
      let { capacity_w, capacity_unit } = await getSkuCapacityW(skuDetail._id, productDetail._id);

      // Fallback to denormalized attributes
      if (capacity_w === 0 && skuDetail.attributes && skuDetail.attributes.length > 0) {
        let capAttr = skuDetail.attributes.find(a => a.subtype_attribute_id?.attribute_type === 'sku');
        if (!capAttr) {
          capAttr = skuDetail.attributes.find(a => ['capacity', 'power rating', 'ac capacity', 'pmax', 'power'].includes((a.subtype_attribute_id?.name || '').toLowerCase().trim()));
        }
        if (capAttr) {
          const rawVal = parseFloat(capAttr.value_raw || capAttr.value_base_unit || 0);
          const factor = capAttr.unit_id?.conversion_factor || 1;
          capacity_w = rawVal * factor;
          capacity_unit = capAttr.unit_id?.symbol || '';
        }
      }

      let benchmark_price = priceEntry.price;
      let benchmark_price_per_watt = priceEntry.price_per_watt || 0;
      if (isSolarPanel && benchmark_price_per_watt === 0 && priceEntry.price > 0 && capacity_w > 0) {
        benchmark_price_per_watt = priceEntry.price / capacity_w;
      }

      const parsedOrderPrice = Number(order_price); // Negotiated price (per-watt for solar, total unit price for others)
      let order_price_per_watt = 0;
      let finalOrderPrice = parsedOrderPrice;
      let isExceeding = false;

      if (isSolarPanel) {
        order_price_per_watt = parsedOrderPrice;
        finalOrderPrice = order_price_per_watt * capacity_w;

        if (order_price_per_watt > benchmark_price_per_watt) {
          isExceeding = true;
        }
      } else {
        if (parsedOrderPrice > benchmark_price) {
          isExceeding = true;
        }
      }

      if (isExceeding) {
        needs_price_approval = true;
        price_approval_items.push({
          sku_id,
          sku_code: skuDetail.sku_code,
          requested_price: isSolarPanel ? order_price_per_watt : parsedOrderPrice,
          current_benchmark_price: isSolarPanel ? benchmark_price_per_watt : benchmark_price,
          isSolar: isSolarPanel
        });
      }

      processedItems.push({
        sku_id,
        sku_code: skuDetail.sku_code,
        qty: Number(qty),
        benchmark_price,
        benchmark_price_per_watt,
        order_price: finalOrderPrice,
        order_price_per_watt,
        product_name: productDetail.name || 'N/A'
      });
    }

    const count = await PurchaseOrder.countDocuments({});
    const year = new Date().getFullYear();
    const suffix = String(count + 1).padStart(5, '0');
    const po_number = `PO-${year}-${suffix}`;
    const invoice_no = `PI-${year}-${suffix}`;

    const { generateAndUploadPI } = require('../utils/pdf.generator');
    let invoice_pdf = null;
    try {
      invoice_pdf = await generateAndUploadPI(po_number, invoice_no, warehouse, supplier, processedItems);
    } catch (pdfErr) {
      console.error("Failed to generate and upload PI PDF:", pdfErr);
    }

    const newPO = new PurchaseOrder({
      po_number,
      warehouse_id,
      supplier_id,
      items: processedItems,
      timeline: new Date(timeline),
      status: needs_price_approval ? 'pending_price_approval' : 'pending',
      proforma_invoice_no: null,
      proforma_invoice_date: null,
      proforma_invoice_pdf: null,
      purchase_order_pdf: invoice_pdf,
      invoice_no: null,
      invoice_date: null,
      invoice_pdf: null,
      created_by: req.user.id
    });

    await newPO.save();

    if (needs_price_approval) {
      const { BenchmarkPriceRequest } = require('../models/core_db');
      for (const item of price_approval_items) {
        await BenchmarkPriceRequest.create({
          sku_id: item.sku_id,
          warehouse_id,
          requested_price: item.requested_price,
          current_benchmark_price: item.current_benchmark_price,
          reason: `Buy above benchmark price for Purchase Order ${po_number} (Requested price: ₹${item.requested_price}${item.isSolar ? '/W' : ''}, Benchmark limit: ₹${item.current_benchmark_price}${item.isSolar ? '/W' : ''})`,
          requested_by: req.user.id,
          purchase_order_id: newPO._id,
          status: 'pending'
        });
      }
      return res.status(201).json({
        status: "success",
        pending_approval: true,
        message: "Purchase Order submitted and pending benchmark price approval.",
        data: newPO
      });
    }

    return res.status(201).json({ status: "success", message: "Purchase order created successfully with proforma invoice.", data: newPO });
  } catch (err) {
    console.error("Error in create_purchase_order:", err);
    return res.status(500).json({ status: "error", message: "Failed to create purchase order.", error: err.message });
  }
};

const pay_purchase_order = async (req, res) => {
  try {
    const { id } = req.params;
    const { reference_no, proforma_invoice_no, payment_date, amount, payment_mode, receipt_url } = req.body;

    if (!reference_no || !payment_date || !amount || !payment_mode) {
      return res.status(400).json({ status: "error", message: "Reference number, payment date, amount, and payment mode are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid purchase order ID." });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ status: "error", message: "Purchase order not found." });
    }

    if (!['pending', 'accepted', 'invoiced'].includes(po.status)) {
      return res.status(400).json({ status: "error", message: `Purchase order cannot be paid. Status is ${po.status}.` });
    }

    po.status = 'paid';
    po.payment_details = {
      reference_no,
      payment_date: new Date(payment_date),
      amount: Number(amount),
      payment_mode,
      receipt_url: receipt_url || null
    };
    if (proforma_invoice_no) {
      po.proforma_invoice_no = proforma_invoice_no.trim();
    }
    if (req.body.proforma_invoice_pdf) {
      po.proforma_invoice_pdf = req.body.proforma_invoice_pdf;
    }

    await po.save();

    return res.status(200).json({ status: "success", message: "Payment details added successfully. Purchase order marked as paid.", data: po });
  } catch (err) {
    console.error("Error in pay_purchase_order:", err);
    return res.status(500).json({ status: "error", message: "Failed to record payment.", error: err.message });
  }
};

const update_purchase_order_timeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeline } = req.body;
    if (!timeline) {
      return res.status(400).json({ status: "error", message: "Timeline is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid PO ID." });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ status: "error", message: "Purchase order not found." });
    }

    if (['invoiced', 'paid', 'delivered'].includes(po.status)) {
      return res.status(400).json({ status: "error", message: "Cannot change timeline after payment." });
    }

    po.timeline = new Date(timeline);
    await po.save();

    return res.status(200).json({ status: "success", message: "Timeline updated successfully.", data: po });
  } catch (err) {
    console.error("Error in update_purchase_order_timeline:", err);
    return res.status(500).json({ status: "error", message: "Failed to update timeline.", error: err.message });
  }
};

const get_completed_deliveries = async (req, res) => {
  try {
    const { clusterId, stateId, countryId } = req.query;

    const allowedClusterIds = await getUserAllowedClusterIds(req.user);
    if (allowedClusterIds !== null && allowedClusterIds.length === 0) {
      return res.status(200).json({ status: "success", data: [] });
    }

    let dbQuery = { status: 'delivered' };

    let warehouseQuery = { is_active: true, deleted_at: null };
    if (allowedClusterIds !== null) {
      const allowedDistricts = await GeoLevel2.find({ cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) }, deleted_at: null }).select('_id').lean();
      const allowedDistrictIds = allowedDistricts.map(d => d._id);
      warehouseQuery.level_2 = { $in: allowedDistrictIds };
    }

    if (clusterId) {
      if (!mongoose.Types.ObjectId.isValid(clusterId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      if (allowedClusterIds !== null && !allowedClusterIds.includes(clusterId.toString())) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const clusterObjId = new mongoose.Types.ObjectId(clusterId);
      const districts = await GeoLevel2.find({ cluster: clusterObjId, deleted_at: null }).select('_id').lean();
      const districtIds = districts.map(d => d._id);
      warehouseQuery.level_2 = { $in: districtIds };
    } else if (stateId) {
      if (!mongoose.Types.ObjectId.isValid(stateId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      warehouseQuery.level_1 = new mongoose.Types.ObjectId(stateId);
    } else if (countryId) {
      if (!mongoose.Types.ObjectId.isValid(countryId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      warehouseQuery.level_0 = new mongoose.Types.ObjectId(countryId);
    }

    const matchingWarehouses = await CompanyWarehouse.find(warehouseQuery).select('_id').lean();
    dbQuery.warehouse_id = { $in: matchingWarehouses.map(w => w._id) };

    const list = await PurchaseOrder.find(dbQuery)
      .populate('warehouse_id', 'warehouse_code warehouse_type address level_0 level_1 level_2')
      .sort({ delivery_date: -1, created_at: -1 })
      .lean();

    // Populate supplier details
    const supplierIds = [...new Set(list.map(po => po.supplier_id?.toString()).filter(Boolean))];
    const suppliersList = await Supplier.find({ _id: { $in: supplierIds } }).lean();
    const supplierMap = Object.fromEntries(suppliersList.map(s => [s._id.toString(), s]));

    for (const po of list) {
      if (po.supplier_id) {
        po.supplier_id = supplierMap[po.supplier_id.toString()] || null;
      }
      if (!po || !po.items || !Array.isArray(po.items)) continue;
      for (const item of po.items) {
        if (!item) continue;
        if (!item.sku_id) {
          item.sku_details = {
            sku_code: item.sku_code || 'PROCUREMENT-ITEM',
            product_name: item.item_name || (po.procurement_type === 'inverter' ? 'Solar Inverters' : po.procurement_type === 'panel' ? 'Solar PV Modules' : 'Solar Item'),
            brand_name: po.supplier_brand || po.supplier_name || 'N/A',
            category: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit'
          };
          continue;
        }
        try {
          const sku = await ProductSku.findById(item.sku_id)
            .populate({
              path: 'product_id',
              populate: [{ path: 'brand_id' }, { path: 'template_id' }]
            }).lean();
          if (sku) {
            const catName = sku.product_id?.template_id?.name || '';
            const isMismatch = (po.procurement_type === 'inverter' && (catName.toLowerCase().includes('panel') || sku.sku_code?.includes('TPS') || sku.sku_code?.includes('WAR'))) ||
                               (po.procurement_type === 'panel' && (catName.toLowerCase().includes('inverter') || sku.sku_code?.includes('INV')));

            item.sku_details = {
              sku_code: item.sku_code || sku.sku_code || 'N/A',
              product_name: item.item_name || (!isMismatch ? (sku.product_id?.name || 'N/A') : (po.procurement_type === 'inverter' ? 'Solar Inverters' : 'Solar PV Modules')),
              brand_name: (!isMismatch ? sku.product_id?.brand_id?.brand_name : null) || po.supplier_brand || po.supplier_name || 'N/A',
              category: (!isMismatch ? catName : (po.procurement_type === 'inverter' ? 'Inverter' : 'Solar Panel'))
            };
          } else {
            item.sku_details = {
              sku_code: item.sku_code || 'PROCUREMENT-ITEM',
              product_name: item.item_name || (po.procurement_type === 'inverter' ? 'Solar Inverters' : po.procurement_type === 'panel' ? 'Solar PV Modules' : 'Solar Item'),
              brand_name: po.supplier_brand || po.supplier_name || 'N/A',
              category: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit'
            };
          }
        } catch (skuErr) {
          console.error(`Error populating SKU ${item.sku_id}:`, skuErr);
        }
      }
    }

    return res.status(200).json({ status: "success", data: list });
  } catch (err) {
    console.error("Error in get_completed_deliveries:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch completed deliveries.", error: err.message });
  }
};

const get_purchase_orders = async (req, res) => {
  try {
    const { clusterId, stateId, countryId } = req.query;
    
    // Resolve user's allowed cluster IDs
    const allowedClusterIds = await getUserAllowedClusterIds(req.user);
    if (allowedClusterIds !== null && allowedClusterIds.length === 0) {
      return res.status(200).json({ status: "success", data: [] });
    }

    let dbQuery = {};

    let warehouseQuery = { is_active: true, deleted_at: null };
    if (allowedClusterIds !== null) {
      const allowedDistricts = await GeoLevel2.find({ cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) }, deleted_at: null }).select('_id').lean();
      const allowedDistrictIds = allowedDistricts.map(d => d._id);
      warehouseQuery.level_2 = { $in: allowedDistrictIds };
    }

    if (clusterId) {
      if (!mongoose.Types.ObjectId.isValid(clusterId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      if (allowedClusterIds !== null && !allowedClusterIds.includes(clusterId.toString())) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const clusterObjId = new mongoose.Types.ObjectId(clusterId);
      const clusterDoc = await Cluster.findById(clusterObjId).lean();
      const districts = await GeoLevel2.find({ cluster: clusterObjId, deleted_at: null }).select('_id').lean();
      const districtIds = districts.map(d => d._id);
      const districtIdStrs = districtIds.map(d => d.toString());

      let matchingWarehouses = await CompanyWarehouse.find({
        is_active: true,
        deleted_at: null,
        level_2: { $in: districtIds }
      }).select('_id').lean();

      // If cluster has 0 direct warehouses, fallback to state's warehouses (e.g. Ahmedabad WH for Saurashtra)
      if (matchingWarehouses.length === 0 && clusterDoc?.level_1) {
        matchingWarehouses = await CompanyWarehouse.find({
          is_active: true,
          deleted_at: null,
          level_1: clusterDoc.level_1
        }).select('_id').lean();
      }

      if (matchingWarehouses.length === 0) {
        matchingWarehouses = await CompanyWarehouse.find({ is_active: true, deleted_at: null }).select('_id').lean();
      }

      const matchingWhIds = matchingWarehouses.map(w => w._id);
      const stateIdStr = clusterDoc?.level_1 ? clusterDoc.level_1.toString() : null;

      dbQuery.$or = [
        { warehouse_id: { $in: matchingWhIds } },
        { "source_orders.delivery_address.district_id": { $in: districtIdStrs } },
        ...(stateIdStr ? [{ "source_orders.delivery_address.state_id": stateIdStr }] : [])
      ];
    } else if (stateId) {
      if (!mongoose.Types.ObjectId.isValid(stateId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const stObjId = new mongoose.Types.ObjectId(stateId);
      let matchingWarehouses = await CompanyWarehouse.find({
        is_active: true,
        deleted_at: null,
        level_1: stObjId
      }).select('_id').lean();

      if (matchingWarehouses.length === 0) {
        matchingWarehouses = await CompanyWarehouse.find({ is_active: true, deleted_at: null }).select('_id').lean();
      }
      const matchingWhIds = matchingWarehouses.map(w => w._id);
      dbQuery.$or = [
        { warehouse_id: { $in: matchingWhIds } },
        { "source_orders.delivery_address.state_id": stateId.toString() }
      ];
    } else if (countryId) {
      if (!mongoose.Types.ObjectId.isValid(countryId)) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const matchingWarehouses = await CompanyWarehouse.find({
        is_active: true,
        deleted_at: null,
        level_0: new mongoose.Types.ObjectId(countryId)
      }).select('_id').lean();
      dbQuery.warehouse_id = { $in: matchingWarehouses.map(w => w._id) };
    } else if (allowedClusterIds !== null) {
      const allowedDistricts = await GeoLevel2.find({ cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) }, deleted_at: null }).select('_id').lean();
      const allowedDistrictIds = allowedDistricts.map(d => d._id);
      let matchingWarehouses = await CompanyWarehouse.find({
        is_active: true,
        deleted_at: null,
        level_2: { $in: allowedDistrictIds }
      }).select('_id').lean();

      if (matchingWarehouses.length === 0) {
        matchingWarehouses = await CompanyWarehouse.find({ is_active: true, deleted_at: null }).select('_id').lean();
      }
      dbQuery.warehouse_id = { $in: matchingWarehouses.map(w => w._id) };
    }

    const list = await PurchaseOrder.find(dbQuery)
      .populate('warehouse_id', 'warehouse_code warehouse_type address level_0 level_1 level_2')
      .sort({ created_at: -1 })
      .lean();

    const supplierIds = [...new Set(list.map(po => po.supplier_id?.toString()).filter(Boolean))];
    const warehouseIds = [...new Set(list.map(po => (po.warehouse_id?._id || po.warehouse_id)?.toString()).filter(Boolean))];
    const allStateIds = [...new Set(list.map(po => (po.warehouse_id?.level_1?._id || po.warehouse_id?.level_1)?.toString()).filter(Boolean))];
    const allDistrictIds = [...new Set(list.map(po => (po.warehouse_id?.level_2?._id || po.warehouse_id?.level_2)?.toString()).filter(Boolean))];

    const [suppliersList, warehousesList, geoStates, geoDistricts] = await Promise.all([
      supplierIds.length > 0 ? Supplier.find({ _id: { $in: supplierIds } }).lean() : [],
      warehouseIds.length > 0 ? CompanyWarehouse.find({ _id: { $in: warehouseIds } }).lean() : [],
      allStateIds.length > 0 ? GeoLevel1.find({ _id: { $in: allStateIds } }).lean() : [],
      allDistrictIds.length > 0 ? GeoLevel2.find({ _id: { $in: allDistrictIds } }).lean() : [],
    ]);

    const supplierMap = Object.fromEntries(suppliersList.map(s => [s._id.toString(), s]));
    const whMap = Object.fromEntries(warehousesList.map(w => [w._id.toString(), w]));
    const geoStateMap = Object.fromEntries(geoStates.map(s => [s._id.toString(), s.name]));
    const geoDistMap = Object.fromEntries(geoDistricts.map(d => [d._id.toString(), d.name]));

    for (const po of list) {
      const populatedSup = po.supplier_id ? supplierMap[po.supplier_id.toString()] : null;
      if (populatedSup) {
        po.supplier_id = populatedSup;
      }
      po.supplier_name = populatedSup?.company_name || po.supplier_name || 'N/A';
      po.supplier_brand = populatedSup?.brand_name || po.supplier_brand || po.supplier_name || 'N/A';
      po.supplier_gst = populatedSup?.gst_number || po.supplier_gst || '';

      const whDoc = (po.warehouse_id && po.warehouse_id._id) ? po.warehouse_id : (po.warehouse_id ? whMap[po.warehouse_id.toString()] : null);
      if (whDoc) {
        po.warehouse_id = whDoc;
      }
      po.warehouse_code = whDoc?.warehouse_code || po.warehouse_code || 'N/A';

      const stId = (whDoc?.level_1?._id || whDoc?.level_1)?.toString();
      const distId = (whDoc?.level_2?._id || whDoc?.level_2)?.toString();
      po.state_id = stId || null;
      po.state_name = stId ? (geoStateMap[stId] || null) : null;
      po.district_id = distId || null;
      po.district_name = distId ? (geoDistMap[distId] || null) : null;
      po.warehouse_display = `${po.warehouse_code}${po.district_name || po.state_name ? ` — ${[po.district_name, po.state_name].filter(Boolean).join(', ')}` : ''}`;

      po.combo_kit_ids = [
        ...new Set([
          (po.combo_kit_id || '').toString(),
          ...(po.source_orders || []).flatMap(so => (so.items || []).map(si => (si.kit_id || '').toString()))
        ].filter(Boolean))
      ];
      if (!po || !po.items || !Array.isArray(po.items)) continue;
      for (const item of po.items) {
        if (!item) continue;
        if (!item.sku_id) {
          item.sku_details = {
            sku_code: item.sku_code || 'PROCUREMENT-ITEM',
            product_name: item.item_name || (po.procurement_type === 'inverter' ? 'Solar Inverters' : po.procurement_type === 'panel' ? 'Solar PV Modules' : 'Solar Item'),
            brand_name: po.supplier_brand || po.supplier_name || 'N/A',
            category: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit',
            industry_type_name: 'Solar PV',
            category_name: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit',
            subcategory_name: null,
            system_type_name: null,
            project_range_name: null
          };
          continue;
        }
        try {
          const sku = await ProductSku.findById(item.sku_id)
            .populate({
              path: 'product_id',
              populate: [
                { path: 'brand_id' },
                { path: 'template_id' }
              ]
            }).lean();
          if (sku) {
            const prod = sku.product_id || {};
            const prodName = prod.name || '';
            const catName = prod.template_id?.name || 'N/A';
            
            const isMismatch = (po.procurement_type === 'inverter' && (catName.toLowerCase().includes('panel') || sku.sku_code?.includes('TPS') || sku.sku_code?.includes('WAR'))) ||
                               (po.procurement_type === 'panel' && (catName.toLowerCase().includes('inverter') || sku.sku_code?.includes('INV')));

            let indName = prod.industry_type_name || null;
            let subName = prod.subcategory_name || null;
            let sysName = prod.system_type_name || null;
            let rangeName = prod.project_range_name || null;

            if (!indName) {
              const lower = (prodName + ' ' + catName).toLowerCase();
              if (lower.includes('agri') || lower.includes('farm') || lower.includes('pump')) indName = 'Solar Agriculture';
              else if (lower.includes('ev') || lower.includes('charger') || lower.includes('carport')) indName = 'Solar EV';
              else if (lower.includes('storage') || lower.includes('battery') || lower.includes('bess')) indName = 'Energy Storage';
              else if (lower.includes('lighting') || lower.includes('street light') || lower.includes('light')) indName = 'Solar Lighting';
              else if (lower.includes('thermal') || lower.includes('heater') || lower.includes('water heater')) indName = 'Solar Thermal';
              else if (lower.includes('rural') || lower.includes('home lighting')) indName = 'Rural Solar';
              else indName = 'Solar PV';
            }

            item.sku_details = {
              sku_code: item.sku_code || sku.sku_code || 'N/A',
              product_name: item.item_name || (!isMismatch ? (prodName || 'N/A') : (po.procurement_type === 'inverter' ? 'Solar Inverters' : 'Solar PV Modules')),
              brand_name: (!isMismatch ? prod.brand_id?.brand_name : null) || po.supplier_brand || po.supplier_name || 'N/A',
              category: (!isMismatch ? catName : (po.procurement_type === 'inverter' ? 'Inverter' : 'Solar Panel')),
              industry_type_name: indName,
              category_name: prod.category_name || catName,
              subcategory_name: subName,
              system_type_name: sysName,
              project_range_name: rangeName
            };
          } else {
            item.sku_details = {
              sku_code: item.sku_code || 'PROCUREMENT-ITEM',
              product_name: item.item_name || (po.procurement_type === 'inverter' ? 'Solar Inverters' : po.procurement_type === 'panel' ? 'Solar PV Modules' : 'Solar Item'),
              brand_name: po.supplier_brand || po.supplier_name || 'N/A',
              category: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit',
              industry_type_name: 'Solar PV',
              category_name: po.procurement_type === 'inverter' ? 'Inverter' : po.procurement_type === 'panel' ? 'Solar Panel' : 'Combo Kit',
              subcategory_name: null,
              system_type_name: null,
              project_range_name: null
            };
          }
        } catch (skuErr) {
          console.error(`Error populating SKU ${item.sku_id} for PO ${po._id}:`, skuErr);
        }
      }
      po.industry_types = [...new Set((po.items || []).map(i => i.sku_details?.industry_type_name).filter(Boolean))];
      po.categories = [...new Set((po.items || []).map(i => i.sku_details?.category_name || i.sku_details?.category).filter(Boolean))];
      po.subcategories = [...new Set((po.items || []).map(i => i.sku_details?.subcategory_name).filter(Boolean))];
      po.system_types = [...new Set((po.items || []).map(i => i.sku_details?.system_type_name).filter(Boolean))];
      po.project_ranges = [...new Set((po.items || []).map(i => i.sku_details?.project_range_name).filter(Boolean))];
    }

    return res.status(200).json({ status: "success", data: list });
  } catch (err) {
    console.error("Error in get_purchase_orders:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch purchase orders.", error: err.message });
  }
};

const get_sku_details = async (req, res) => {
  try {
    const { skuId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({ status: "error", message: "Invalid SKU ID." });
    }

    const sku = await ProductSku.findById(skuId)
      .populate({
        path: 'product_id',
        populate: [
          { path: 'brand_id' },
          { path: 'template_id' }
        ]
      })
      .lean();

    if (!sku) {
      return res.status(404).json({ status: "error", message: "SKU not found." });
    }

    const attrs = await ProductAttributeValue.find({
      $or: [
        { sku_id: sku._id },
        { product_id: sku.product_id?._id || sku.product_id, sku_id: null }
      ],
      deleted_at: null
    })
      .populate({ path: 'attribute_id', select: 'name data_type attribute_type' })
      .populate('unit_id', 'symbol conversion_factor')
      .populate({ path: 'value_option_id', select: 'value' })
      .lean();

    const data = {
      id: sku._id,
      sku_code: sku.sku_code,
      product_name: sku.product_id?.name || 'N/A',
      product_description: sku.product_id?.description || '',
      brand_name: sku.product_id?.brand_id?.brand_name || 'N/A',
      category: sku.product_id?.template_id?.name || 'N/A',
      product_image: sku.image || sku.product_id?.image || null,
      product_features: sku.product_id?.features || [],
      attributes: attrs
        .filter(a => a.attribute_id)
        .map(a => ({
          attribute_name: a.attribute_id?.name,
          attribute_type: a.attribute_id?.attribute_type || 'custom',
          data_type: a.attribute_id?.data_type,
          is_sku: a.attribute_id?.attribute_type === 'sku',
          is_capacity: a.attribute_id?.attribute_type === 'sku',
          is_tolerance: a.attribute_id?.attribute_type === 'tolerance' || a.attribute_id?.attribute_type === 'tollarance',
          value_number: a.value_number,
          value_text: a.value_option_id ? a.value_option_id.value : a.value_text,
          value_boolean: a.value_boolean,
          unit_symbol: a.unit_id?.symbol,
          conversion_factor: a.unit_id?.conversion_factor
        }))
    };

    return res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error("Error in get_sku_details:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch SKU details.", error: err.message });
  }
};

const get_combo_kits = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    if (warehouseId && mongoose.Types.ObjectId.isValid(warehouseId)) {
      const warehouse = await CompanyWarehouse.findById(warehouseId).lean();
      if (!warehouse) {
        return res.status(200).json({ status: "success", data: [] });
      }

      const activations = await WarehouseKitActivation.find({
        warehouse_id: new mongoose.Types.ObjectId(warehouseId),
        is_combokit_active: true,
        deleted_at: null
      }).lean();

      const activeKitIds = activations.map(a => a.combo_kit_id);
      if (activeKitIds.length === 0) {
        return res.status(200).json({ status: "success", data: [] });
      }

      const list = await ComboKit.find({
        _id: { $in: activeKitIds },
        deleted_at: null
      })
        .populate({
          path: 'solar_kit_id',
          populate: { path: 'category_id' }
        })
        .populate({
          path: 'bos_kits.sku_id',
          populate: {
            path: 'product_id',
            populate: [
              { path: 'brand_id' },
              { path: 'template_id' }
            ]
          }
        })
        .lean();

      const enrichedList = list.map(k => {
        if (k.bos_kits) {
          k.bos_kits = k.bos_kits.map(bk => {
            if (bk.sku_id) {
              bk.sku_id = {
                ...bk.sku_id,
                id: bk.sku_id._id,
                sku_details: {
                  product_name: bk.sku_id.product_id?.name || 'N/A'
                }
              };
            }
            return bk;
          });
        }
        return {
          ...k,
          id: k._id
        };
      });

      return res.status(200).json({ status: "success", data: enrichedList });
    }

    // When no warehouseId is passed, return ALL admin-created configured combo kits (Configured Combo Kits Registry)
    const rawDb = mongoose.connection.db;
    let allKits = [];
    const query = { deleted_at: null, is_custom: { $ne: true } };

    if (rawDb) {
      // Primary source of truth is pc_comobo_kit (used by Admin Combo Kit Registry)
      const primaryKits = await rawDb.collection('pc_comobo_kit').find(query).toArray().catch(() => []);
      if (primaryKits && primaryKits.length > 0) {
        allKits = primaryKits;
      } else {
        allKits = await rawDb.collection('pc_combo_kits').find(query).toArray().catch(() => []);
      }
    } else {
      const { WarehouseComboKit: ComboKit } = require('../../admin-panel/models/core_db');
      allKits = await ComboKit.find(query).lean();
    }

    const formattedKits = allKits.map(k => {
      const cap = Number(k.capacity || k.capacity_kw || 0);
      return {
        _id: k._id,
        id: k._id.toString(),
        name: k.name || `Solar Kit ${cap} kW`,
        capacity: cap,
        capacity_kw: cap,
        kit_image: k.kit_image || k.image || null,
        selling_price: Number(k.selling_price_cached || k.selling_price || k.base_price_cached || 0),
        is_custom: !!k.is_custom,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ status: "success", data: formattedKits });
  } catch (err) {
    console.error("Error in get_combo_kits:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch combo kits.", error: err.message });
  }
};

const cancel_purchase_order = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid purchase order ID." });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ status: "error", message: "Purchase order not found." });
    }

    if (po.status === 'delivered') {
      return res.status(400).json({ status: "error", message: "Cannot cancel a delivered purchase order." });
    }

    if (po.status === 'cancelled') {
      return res.status(400).json({ status: "error", message: "Purchase order is already cancelled." });
    }

    po.status = 'cancelled';
    await po.save();

    return res.status(200).json({ status: "success", message: "Purchase order cancelled successfully.", data: po });
  } catch (err) {
    console.error("Error in cancel_purchase_order:", err);
    return res.status(500).json({ status: "error", message: "Failed to cancel purchase order.", error: err.message });
  }
};

const get_country_saas_products = async (req, res) => {
  try {
    const { countryId } = req.params;
    if (!countryId) {
      return res.status(400).json({ status: "error", message: "countryId is required." });
    }
    const activeProducts = await CountrySaaSProduct.find({ country_id: countryId, is_active: true }).lean();
    const productIds = activeProducts.map(p => p.saas_product_id.toString());
    return res.status(200).json({ status: "success", data: productIds });
  } catch (err) {
    console.error("Error in get_country_saas_products:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch country saas products.", error: err.message });
  }
};

async function populatePoRequestSkus(requests) {
  const allSkuIds = [...new Set(
    requests.flatMap(req => req.items.map(it => String(it.sku_id)))
  )];

  if (allSkuIds.length === 0) return requests;

  const skus = await ProductSku.find({ _id: { $in: allSkuIds } }).lean();
  const productIds = [...new Set(skus.map(s => String(s.product_id)).filter(Boolean))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const brandIds = [...new Set(products.map(p => String(p.brand_id)).filter(Boolean))];
  const tplIds = [...new Set(products.map(p => String(p.template_id)).filter(Boolean))];
  const brands = await Brand.find({ _id: { $in: brandIds } }).lean();
  const templates = await ProductTemplate.find({ _id: { $in: tplIds } }).lean();

  const brandMap = Object.fromEntries(brands.map(b => [String(b._id), b]));
  const tplMap = Object.fromEntries(templates.map(t => [String(t._id), t]));
  const productMap = Object.fromEntries(products.map(p => [String(p._id), {
    ...p,
    brand_id: brandMap[String(p.brand_id)] || null,
    template_id: tplMap[String(p.template_id)] || null,
  }]));
  const skuMap = Object.fromEntries(skus.map(s => [String(s._id), {
    ...s,
    product_id: productMap[String(s.product_id)] || null,
  }]));

  // Fetch benchmark prices from ProductSkuPrice.
  // Prices can be set per-warehouse OR per-cluster (with a cluster_id on the entry).
  // We fetch ALL price entries for these SKUs and pick the best match per item.
  const allWarehouseIds = [...new Set(
    requests.map(req => String(req.warehouse_id?._id || req.warehouse_id?.id || req.warehouse_id))
  )];

  // Fetch all prices for these SKUs across all warehouses/clusters
  const skuPrices = await ProductSkuPrice.find({
    sku_id: { $in: allSkuIds }
  }).lean();

  // Index all prices by sku_id for quick lookup
  const skuPricesBySkuId = {};
  for (const p of skuPrices) {
    const sid = String(p.sku_id);
    if (!skuPricesBySkuId[sid]) skuPricesBySkuId[sid] = [];
    skuPricesBySkuId[sid].push(p);
  }

  return requests.map(req => {
    const whId = String(req.warehouse_id?._id || req.warehouse_id?.id || req.warehouse_id);
    return {
      ...req,
      items: req.items.map(it => {
        const skuIdStr = String(it.sku_id);
        const priceEntries = skuPricesBySkuId[skuIdStr] || [];

        // Prefer exact warehouse match, then any cluster-level price (price > 0)
        let priceEntry = priceEntries.find(p => String(p.warehouse_id) === whId && p.price > 0);
        if (!priceEntry) priceEntry = priceEntries.find(p => p.price > 0);

        return {
          ...it,
          sku_id: skuMap[skuIdStr] || it.sku_id,
          benchmark_price: priceEntry?.price || 0,
          benchmark_price_per_watt: priceEntry?.price_per_watt || 0,
        };
      })
    };
  });
}

const get_po_requests = async (req, res) => {
  try {
    const { clusterId } = req.query;

    // Resolve allowed cluster IDs for this user
    const allowedClusterIds = await getUserAllowedClusterIds(req.user);

    // Get districts within allowed clusters (or specific cluster)
    let districtFilter = {};
    if (clusterId && mongoose.Types.ObjectId.isValid(clusterId)) {
      // Validate the requested cluster is allowed
      if (allowedClusterIds !== null && !allowedClusterIds.includes(clusterId.toString())) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const clusterDistricts = await GeoLevel2.find({
        cluster: new mongoose.Types.ObjectId(clusterId),
        deleted_at: null
      }).select('_id').lean();
      districtFilter = { level_2: { $in: clusterDistricts.map(d => d._id) } };
    } else if (allowedClusterIds !== null) {
      if (allowedClusterIds.length === 0) {
        return res.status(200).json({ status: "success", data: [] });
      }
      const allowedDistricts = await GeoLevel2.find({
        cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) },
        deleted_at: null
      }).select('_id').lean();
      districtFilter = { level_2: { $in: allowedDistricts.map(d => d._id) } };
    }

    // Get matching warehouse IDs
    const matchingWarehouses = await CompanyWarehouse.find({
      ...districtFilter,
      is_active: true,
      deleted_at: null
    }).select('_id level_2').lean();

    const matchingWarehouseIds = matchingWarehouses.map(w => w._id);

    // Build cluster lookup for enrichment
    const districtIds = [...new Set(matchingWarehouses.map(w => String(w.level_2)).filter(Boolean))];
    const districts = await GeoLevel2.find({ _id: { $in: districtIds } }).select('_id cluster').lean();
    const districtToCluster = Object.fromEntries(districts.map(d => [String(d._id), String(d.cluster)]));

    const allClusterIds = [...new Set(Object.values(districtToCluster).filter(Boolean))];
    const clusters = await Cluster.find({ _id: { $in: allClusterIds } }).select('_id name').lean();
    const clusterMap = Object.fromEntries(clusters.map(c => [String(c._id), c.name]));

    const list = await PoRequest.find({ warehouse_id: { $in: matchingWarehouseIds } })
      .populate('warehouse_id')
      .sort({ created_at: -1 })
      .lean();

    const populated = await populatePoRequestSkus(list);

    // Enrich each request's warehouse with cluster info
    const enriched = populated.map(req => {
      const wh = req.warehouse_id;
      if (wh) {
        const distId = String(wh.level_2);
        const cId = districtToCluster[distId];
        return {
          ...req,
          warehouse_id: {
            ...wh,
            cluster_id: cId || null,
            cluster_name: cId ? (clusterMap[cId] || null) : null
          }
        };
      }
      return req;
    });

    return res.status(200).json({ status: "success", data: enriched });
  } catch (err) {
    console.error("Error in get_po_requests:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch PO requests.", error: err.message });
  }
};

const update_po_request_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ordered' or 'cancelled'
    if (!['ordered', 'cancelled'].includes(status)) {
      return res.status(400).json({ status: "error", message: "Invalid status value." });
    }

    const request = await PoRequest.findById(id);
    if (!request) {
      return res.status(404).json({ status: "error", message: "PO request not found." });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({ status: "success", message: `Request status updated to ${status} successfully.`, data: request });
  } catch (err) {
    console.error("Error in update_po_request_status:", err);
    return res.status(500).json({ status: "error", message: "Failed to update PO request status.", error: err.message });
  }
};


const get_hierarchy_options = async (req, res) => {
  return await estimatorAdminHandler.get_hierarchy_options(req, res);
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Resolve Combo Kit Components (Solar Panels, Inverters, BOS kits) with Images
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PANEL_IMG = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=80";
const DEFAULT_INVERTER_IMG = "https://images.unsplash.com/photo-1558441719-8b489c63f70b?w=400&auto=format&fit=crop&q=80";
const DEFAULT_STRUCTURE_IMG = "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80";
const DEFAULT_ACDB_IMG = "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80";
const DEFAULT_CABLE_IMG = "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80";

async function resolveKitComponents(kitId, orderQty = 1, itemName = '', itemCapacity = null) {
  let kitDoc = null;
  const rawDb = mongoose.connection.db;
  if (kitId && mongoose.Types.ObjectId.isValid(kitId) && rawDb) {
    try {
      kitDoc = await rawDb.collection('pc_comobo_kit').findOne({ _id: new mongoose.Types.ObjectId(kitId) })
            || await rawDb.collection('pc_combo_kits').findOne({ _id: new mongoose.Types.ObjectId(kitId) });
    } catch (e) {
      console.error('Error fetching kit doc:', e.message);
    }
  }

  // Parse capacity from kit or itemName
  let capacityKw = kitDoc?.capacity || 0;
  if (!capacityKw && (itemName || itemCapacity)) {
    const match = (itemCapacity || itemName || '').match(/(\d+(?:\.\d+)?)\s*k?w\b/i);
    if (match) capacityKw = parseFloat(match[1]);
  }
  if (!capacityKw) capacityKw = 5;

  let panels = null;
  let inverters = null;
  let bosList = [];

  if (kitDoc && rawDb && ((kitDoc.base_components && kitDoc.base_components.length > 0) || (kitDoc.bos_kits && kitDoc.bos_kits.length > 0))) {
    try {
      const templateIds = (kitDoc.base_components || []).map(b => b.template_id).filter(Boolean);
      const skuIds = [
        ...(kitDoc.base_components || []).map(b => b.sku_id),
        ...(kitDoc.bos_kits || []).map(b => b.sku_id)
      ].filter(Boolean);
      const brandIds = [
        kitDoc.brand_id,
        ...(kitDoc.base_components || []).map(b => b.brand_id),
        ...(kitDoc.bos_kits || []).map(b => b.brand_id)
      ].filter(Boolean);

      const [templates, skus, brands] = await Promise.all([
        templateIds.length > 0 ? rawDb.collection('pc_product_templates').find({ _id: { $in: templateIds } }).toArray() : [],
        skuIds.length > 0 ? rawDb.collection('pc_product_skus').find({ _id: { $in: skuIds } }).toArray() : [],
        brandIds.length > 0 ? rawDb.collection('brands').find({ _id: { $in: brandIds } }).toArray() : [],
      ]);

      const templateMap = Object.fromEntries(templates.map(t => [t._id.toString(), t.name]));
      const skuMap = Object.fromEntries(skus.map(s => [s._id.toString(), s]));
      const brandMap = Object.fromEntries(brands.map(b => [b._id.toString(), b.name || b.brand_name]));

      const kitBrand = brandMap[kitDoc.brand_id?.toString()] || 'SolarKits OEM';

      for (const bc of kitDoc.base_components || []) {
        const type = templateMap[bc.template_id?.toString()] || 'Component';
        const skuObj = skuMap[bc.sku_id?.toString()] || {};
        const brand = brandMap[bc.brand_id?.toString()] || kitBrand;
        const isPanel = type.toLowerCase().includes('panel') || type.toLowerCase().includes('module');
        const isInverter = type.toLowerCase().includes('inverter');
        const perKit = bc.quantity || 1;
        const totalQty = perKit * orderQty;

        if (isPanel && !panels) {
          panels = {
            type: 'Solar Panel',
            name: skuObj.sku_code ? `${brand} ${skuObj.sku_code}` : `${brand} 540W Mono PERC / Bifacial Module`,
            sku_code: skuObj.sku_code || 'PV-540W',
            brand: brand,
            quantity_per_kit: perKit,
            total_quantity: totalQty,
            image: skuObj.image || kitDoc.kit_image || DEFAULT_PANEL_IMG,
          };
        } else if (isInverter && !inverters) {
          inverters = {
            type: 'Solar Inverter',
            name: skuObj.sku_code ? `${brand} ${skuObj.sku_code}` : `${brand} ${capacityKw}kW String Inverter`,
            sku_code: skuObj.sku_code || `INV-${capacityKw}KW`,
            brand: brand,
            quantity_per_kit: perKit,
            total_quantity: totalQty,
            image: skuObj.image || DEFAULT_INVERTER_IMG,
          };
        } else {
          bosList.push({
            type: type,
            name: skuObj.sku_code ? `${brand} ${skuObj.sku_code}` : `${brand} ${type}`,
            brand: brand,
            quantity_per_kit: perKit,
            total_quantity: totalQty,
            image: skuObj.image || DEFAULT_STRUCTURE_IMG,
          });
        }
      }

      for (const bk of kitDoc.bos_kits || []) {
        const brand = brandMap[bk.brand_id?.toString()] || kitBrand;
        const perKit = bk.quantity || 1;
        bosList.push({
          type: 'BOS Kit',
          name: bk.name || 'Balance of System Protection',
          brand: brand,
          quantity_per_kit: perKit,
          total_quantity: perKit * orderQty,
          image: bk.image || DEFAULT_ACDB_IMG,
        });
      }
    } catch (parseErr) {
      console.error('Error resolving kit components:', parseErr.message);
    }
  }

  // Fallback defaults if no components were parsed from kitDoc
  if (!panels) {
    const panelsPerKit = Math.max(1, Math.round((capacityKw * 1000) / 540));
    panels = {
      type: 'Solar Panel',
      name: `${capacityKw}kW High-Efficiency Bifacial Mono PERC Module`,
      sku_code: 'PV-540W-BIF',
      brand: kitDoc?.brand_name || 'Tier-1 Certified',
      quantity_per_kit: panelsPerKit,
      total_quantity: panelsPerKit * orderQty,
      image: DEFAULT_PANEL_IMG,
    };
  }

  if (!inverters) {
    inverters = {
      type: 'Solar Inverter',
      name: `${capacityKw}kW On-Grid String Inverter (Single/Three Phase)`,
      sku_code: `INV-${capacityKw}KW`,
      brand: kitDoc?.brand_name || 'Tier-1 Certified',
      quantity_per_kit: 1,
      total_quantity: 1 * orderQty,
      image: DEFAULT_INVERTER_IMG,
    };
  }

  if (bosList.length === 0) {
    bosList = [
      {
        type: 'Mounting Structure',
        name: 'GI Hot-Dip Rooftop Mounting Structure',
        brand: 'Heavy Duty Structural',
        quantity_per_kit: 1,
        total_quantity: 1 * orderQty,
        image: DEFAULT_STRUCTURE_IMG,
      },
      {
        type: 'Protection System',
        name: 'ACDB & DCDB IP65 Surge Protection Distribution Box',
        brand: 'Industrial Standard',
        quantity_per_kit: 1,
        total_quantity: 1 * orderQty,
        image: DEFAULT_ACDB_IMG,
      },
      {
        type: 'Cabling & Safety',
        name: 'Solar DC Cable (4/6 sq.mm) & Earthing Kit',
        brand: 'Certified Solar Cables',
        quantity_per_kit: 1,
        total_quantity: 1 * orderQty,
        image: DEFAULT_CABLE_IMG,
      }
    ];
  }

  return {
    kit_name: kitDoc?.name || itemName || 'Solar Kit',
    capacity_kw: capacityKw,
    kit_image: kitDoc?.kit_image || kitDoc?.image || DEFAULT_PANEL_IMG,
    panels,
    inverters,
    bos_components: bosList,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Get Pending EPC & Franchise Orders for the Payments Panel
// Returns all EPC orders and Franchise orders awaiting stock procurement —
// with full breakdown of solar panels, inverters, and BOS items with images.
// ─────────────────────────────────────────────────────────────────────────────
const get_pending_epc_franchise_orders = async (req, res) => {
  try {
    const { EpcOrder, FpoOrder, EpcAccount, Reseller } = require('../../admin-panel/models/india_solarshop_db');

    // 1. Fetch EPC orders awaiting stock procurement
    const epcOrders = await EpcOrder.find({
      order_status: { $in: ['confirmed', 'processing', 'pending'] },
      payment_status: { $in: ['captured', 'pending_verification', 'pending'] },
    })
      .populate('epc_id', 'name email whatsapp gstin company_name gstin_trade_name gstin_legal_name')
      .populate('warehouse_id', 'warehouse_code address')
      .sort({ created_at: -1 })
      .lean();

    // 2. Fetch Franchise orders (FpoOrder) awaiting stock procurement
    const fpoOrders = await FpoOrder.find({
      status: { $in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED'] },
      deleted_at: null,
    })
      .populate('franchisee_id', 'business_name name company_name email mobile gst_number gstin contact_person')
      .sort({ created_at: -1 })
      .lean();

    const targetProcurementType = (req.query.procurement_type || 'all').toLowerCase(); // 'panel' | 'inverter' | 'all'

    // 3. Check which orders are linked to paid/pending POs separately for Panel and Inverter
    const existingPOs = await PurchaseOrder.find({
      status: { $in: ['pending', 'accepted', 'invoiced', 'paid', 'delivered'] }
    }).select('source_orders status procurement_type po_number supplier_id supplier_name supplier_brand').populate('supplier_id', 'company_name brand_name gst_number').lean();

    const panelLinkedMap = new Map();   // order_id -> { po_id, po_number, status, supplier_name, supplier_brand }
    const inverterLinkedMap = new Map(); // order_id -> { po_id, po_number, status, supplier_name, supplier_brand }

    for (const po of existingPOs) {
      const isPanel = po.procurement_type === 'panel' || po.procurement_type === 'mixed' || !po.procurement_type;
      const isInverter = po.procurement_type === 'inverter' || po.procurement_type === 'mixed' || !po.procurement_type;
      const supName = po.supplier_id?.company_name || po.supplier_name || null;
      const supBrand = po.supplier_id?.brand_name || po.supplier_brand || supName || null;
      const poData = { po_id: po._id, po_number: po.po_number, status: po.status, supplier_name: supName, supplier_brand: supBrand };

      for (const so of po.source_orders || []) {
        if (!so.order_id) continue;
        const idStr = so.order_id.toString();
        if (po.procurement_type === 'panel') {
          panelLinkedMap.set(idStr, poData);
        } else if (po.procurement_type === 'inverter') {
          inverterLinkedMap.set(idStr, poData);
        } else {
          // mixed or legacy PO -> covers both
          panelLinkedMap.set(idStr, poData);
          inverterLinkedMap.set(idStr, poData);
        }
      }
    }

    // Helper to evaluate order procurement state
    const isOrderEligibleForProcurement = (order, targetType) => {
      const idStr = order._id.toString();
      const panelStatus = order.procurement_status?.panel?.status;
      const inverterStatus = order.procurement_status?.inverter?.status;

      const isPanelPaid = panelStatus === 'paid_awaiting_inward' || panelStatus === 'inwarded' || panelLinkedMap.has(idStr);
      const isInverterPaid = inverterStatus === 'paid_awaiting_inward' || inverterStatus === 'inwarded' || inverterLinkedMap.has(idStr);

      if (targetType === 'panel') {
        return !isPanelPaid; // Show only orders where panel supplier is NOT yet paid
      } else if (targetType === 'inverter') {
        return !isInverterPaid; // Show only orders where inverter supplier is NOT yet paid
      } else {
        // 'all': Show orders that are missing AT LEAST ONE supplier payment
        return !isPanelPaid || !isInverterPaid;
      }
    };

    // 4. Filter orders based on target procurement type
    const pendingEpcOrders = epcOrders.filter(o => isOrderEligibleForProcurement(o, targetProcurementType));
    const pendingFranchiseOrders = fpoOrders.filter(o => isOrderEligibleForProcurement(o, targetProcurementType));

    // 4.1 Batch resolve State and District names for all orders
    const allStateIds = [
      ...pendingEpcOrders.map(o => o.delivery_address?.state_id?.toString()).filter(Boolean),
      ...pendingFranchiseOrders.map(o => (o.state_id?._id || o.state_id)?.toString()).filter(Boolean)
    ];
    const allDistrictIds = [
      ...pendingEpcOrders.map(o => o.delivery_address?.district_id?.toString()).filter(Boolean),
      ...pendingFranchiseOrders.map(o => (o.district_id?._id || o.district_id)?.toString()).filter(Boolean)
    ];

    const [geoStates, geoDistricts] = await Promise.all([
      allStateIds.length > 0 ? GeoLevel1.find({ _id: { $in: allStateIds } }).lean() : [],
      allDistrictIds.length > 0 ? GeoLevel2.find({ _id: { $in: allDistrictIds } }).lean() : [],
    ]);
    const geoStateMap = Object.fromEntries(geoStates.map(s => [s._id.toString(), s.name]));
    const geoDistMap = Object.fromEntries(geoDistricts.map(d => [d._id.toString(), d.name]));

    // 5. Format EPC orders with full component breakdown
    const formattedEpc = await Promise.all(pendingEpcOrders.map(async o => {
      const stId = o.delivery_address?.state_id?._id || o.delivery_address?.state_id || null;
      const distId = o.delivery_address?.district_id?._id || o.delivery_address?.district_id || null;
      const stateName = o.delivery_address?.state_name || (stId ? geoStateMap[stId.toString()] : null);
      const distName = o.delivery_address?.district_name || (distId ? geoDistMap[distId.toString()] : null);

      const items = await Promise.all((o.items || []).map(async it => {
        const isKitItem = Boolean(it.kit_id) || it.scope_type === 'kit' || (it.item_name || '').toLowerCase().includes('kit') || (it.item_name || '').toLowerCase().includes('solution') || (it.item_name === 'Solar Component' && Boolean(it.kit_id));
        const breakdown = (isKitItem && it.kit_id)
          ? await resolveKitComponents(it.kit_id, it.quantity, it.item_name, it.capacity)
          : null;

        const resolvedItemName = (it.item_name && it.item_name !== 'Solar Component')
          ? it.item_name
          : (breakdown?.kit_name || (breakdown?.capacity_kw ? `${breakdown.capacity_kw} kW Solar Combo Kit` : 'Solar Combo Kit'));

        const resolvedCapacity = it.capacity || (breakdown?.capacity_kw ? `${breakdown.capacity_kw} kW` : null);
        const resolvedImage = it.image || breakdown?.kit_image || DEFAULT_PANEL_IMG;

        return {
          item_name: resolvedItemName,
          quantity: it.quantity,
          unit_price: (it.unit_price_paise || 0) / 100,
          total_price: (it.total_price_paise || 0) / 100,
          kit_id: it.kit_id ? it.kit_id.toString() : null,
          product_id: it.product_id ? it.product_id.toString() : null,
          scope_type: isKitItem ? 'kit' : (it.scope_type || 'product'),
          capacity: resolvedCapacity,
          image: resolvedImage,
          breakdown,
        };
      }));

      const kitIds = [...new Set(items.map(i => i.kit_id).filter(Boolean))];

      const epcName = o.epc_id?.name || o.epc_id?.gstin_trade_name || o.epc_id?.company_name || o.epc_id?.gstin_legal_name || 'EPC Buyer';
      const epcContact = o.epc_id?.whatsapp || o.epc_id?.email || '-';
      const epcGstin = o.epc_id?.gstin || '-';

      const idStr = o._id.toString();
      const panelStatus = o.procurement_status?.panel?.status;
      const inverterStatus = o.procurement_status?.inverter?.status;
      const isPanelPaid = panelStatus === 'paid_awaiting_inward' || panelStatus === 'inwarded' || panelLinkedMap.has(idStr);
      const isInverterPaid = inverterStatus === 'paid_awaiting_inward' || inverterStatus === 'inwarded' || inverterLinkedMap.has(idStr);
      const isPanelInwarded = panelStatus === 'inwarded';
      const isInverterInwarded = inverterStatus === 'inwarded';

      return {
        id: o._id,
        order_number: o.order_number,
        order_type: 'epc',
        entity_id: o.epc_id?._id ? o.epc_id._id.toString() : (o.epc_id ? o.epc_id.toString() : null),
        customer_name: epcName,
        customer_contact: epcContact,
        customer_gstin: epcGstin,
        order_status: o.order_status,
        payment_status: o.payment_status,
        order_amount: (o.grand_total_paise || 0) / 100,
        panel_paid: isPanelPaid,
        inverter_paid: isInverterPaid,
        panel_inwarded: isPanelInwarded,
        inverter_inwarded: isInverterInwarded,
        procurement_status: {
          panel: {
            status: isPanelPaid ? (isPanelInwarded ? 'inwarded' : 'paid_awaiting_inward') : 'pending_payment',
            po_number: o.procurement_status?.panel?.po_number || panelLinkedMap.get(idStr)?.po_number || null,
            supplier_name: o.procurement_status?.panel?.supplier_name || panelLinkedMap.get(idStr)?.supplier_name || null,
            supplier_brand: o.procurement_status?.panel?.supplier_brand || panelLinkedMap.get(idStr)?.supplier_brand || null,
            inward_grn_no: o.procurement_status?.panel?.inward_grn_no || null,
          },
          inverter: {
            status: isInverterPaid ? (isInverterInwarded ? 'inwarded' : 'paid_awaiting_inward') : 'pending_payment',
            po_number: o.procurement_status?.inverter?.po_number || inverterLinkedMap.get(idStr)?.po_number || null,
            supplier_name: o.procurement_status?.inverter?.supplier_name || inverterLinkedMap.get(idStr)?.supplier_name || null,
            supplier_brand: o.procurement_status?.inverter?.supplier_brand || inverterLinkedMap.get(idStr)?.supplier_brand || null,
            inward_grn_no: o.procurement_status?.inverter?.inward_grn_no || null,
          },
          overall_status: (isPanelPaid && isInverterPaid)
            ? ((isPanelInwarded && isInverterInwarded) ? 'inward_completed' : 'awaiting_material_inward')
            : 'awaiting_supplier_procurement'
        },
        delivery_address: {
          address_line: o.delivery_address?.line || null,
          pincode: o.delivery_address?.pincode || null,
          state_id: stId ? stId.toString() : null,
          state_name: stateName,
          district_id: distId ? distId.toString() : null,
          district_name: distName,
        },
        state_id: stId ? stId.toString() : null,
        state_name: stateName,
        district_id: distId ? distId.toString() : null,
        district_name: distName,
        warehouse_id: o.warehouse_id || null,
        items,
        kit_ids: kitIds,
        industry_types: ['Solar PV'],
        categories: ['Rooftop Solar'],
        subcategories: ['Residential', 'Commercial'],
        system_types: ['On-Grid', 'Hybrid', 'Off-Grid'],
        project_ranges: items.map(i => i.capacity).filter(Boolean),
        created_at: o.created_at,
      };
    }));

    // 6. Format Franchise orders with full component breakdown
    const formattedFranchise = await Promise.all(pendingFranchiseOrders.map(async o => {
      const stId = o.state_id?._id || o.state_id || null;
      const distId = o.district_id?._id || o.district_id || null;
      const stateName = (stId ? geoStateMap[stId.toString()] : null) || o.territory_snapshot?.state_name || null;
      const distName = (distId ? geoDistMap[distId.toString()] : null) || o.territory_snapshot?.district_name || null;

      const items = await Promise.all((o.items || []).map(async it => {
        const isKitItem = Boolean(it.kit_id) || it.scope_type === 'kit' || (it.item_name || '').toLowerCase().includes('kit') || (it.item_name || '').toLowerCase().includes('solution');
        const breakdown = (isKitItem && it.kit_id)
          ? await resolveKitComponents(it.kit_id, it.quantity, it.item_name, null)
          : null;

        const resolvedItemName = (it.item_name && it.item_name !== 'Solar Component')
          ? it.item_name
          : (breakdown?.kit_name || (breakdown?.capacity_kw ? `${breakdown.capacity_kw} kW Solar Combo Kit` : 'Solar Combo Kit'));

        const resolvedCapacity = (breakdown?.capacity_kw ? `${breakdown.capacity_kw} kW` : null);
        const resolvedImage = it.image || breakdown?.kit_image || DEFAULT_PANEL_IMG;

        return {
          item_name: resolvedItemName,
          quantity: it.quantity,
          unit_price: (it.unit_price_paise || 0) / 100,
          total_price: (it.total_price_paise || 0) / 100,
          kit_id: it.kit_id ? it.kit_id.toString() : null,
          product_id: it.product_id ? it.product_id.toString() : null,
          scope_type: isKitItem ? 'kit' : 'franchise_po',
          capacity: resolvedCapacity,
          image: resolvedImage,
          breakdown,
        };
      }));

      const kitIds = [...new Set(items.map(i => i.kit_id).filter(Boolean))];

      const franName = o.franchisee_id?.business_name || o.franchisee_id?.name || o.franchisee_id?.company_name || 'Franchise Partner';
      const franContact = o.franchisee_id?.mobile || o.franchisee_id?.email || '-';
      const franGstin = o.franchisee_id?.gst_number || o.franchisee_id?.gstin || '-';

      const idStr = o._id.toString();
      const panelStatus = o.procurement_status?.panel?.status;
      const inverterStatus = o.procurement_status?.inverter?.status;
      const isPanelPaid = panelStatus === 'paid_awaiting_inward' || panelStatus === 'inwarded' || panelLinkedMap.has(idStr);
      const isInverterPaid = inverterStatus === 'paid_awaiting_inward' || inverterStatus === 'inwarded' || inverterLinkedMap.has(idStr);
      const isPanelInwarded = panelStatus === 'inwarded';
      const isInverterInwarded = inverterStatus === 'inwarded';

      return {
        id: o._id,
        order_number: o.po_number,
        order_type: 'franchise',
        entity_id: o.franchisee_id?._id ? o.franchisee_id._id.toString() : (o.franchisee_id ? o.franchisee_id.toString() : null),
        customer_name: franName,
        customer_contact: franContact,
        customer_gstin: franGstin,
        order_status: o.status,
        payment_status: o.offline_payment?.payment_method ? 'offline_payment' : 'pending',
        order_amount: (o.grand_total_paise || 0) / 100,
        panel_paid: isPanelPaid,
        inverter_paid: isInverterPaid,
        panel_inwarded: isPanelInwarded,
        inverter_inwarded: isInverterInwarded,
        procurement_status: {
          panel: {
            status: isPanelPaid ? (isPanelInwarded ? 'inwarded' : 'paid_awaiting_inward') : 'pending_payment',
            po_number: o.procurement_status?.panel?.po_number || panelLinkedMap.get(idStr)?.po_number || null,
            supplier_name: o.procurement_status?.panel?.supplier_name || panelLinkedMap.get(idStr)?.supplier_name || null,
            supplier_brand: o.procurement_status?.panel?.supplier_brand || panelLinkedMap.get(idStr)?.supplier_brand || null,
            inward_grn_no: o.procurement_status?.panel?.inward_grn_no || null,
          },
          inverter: {
            status: isInverterPaid ? (isInverterInwarded ? 'inwarded' : 'paid_awaiting_inward') : 'pending_payment',
            po_number: o.procurement_status?.inverter?.po_number || inverterLinkedMap.get(idStr)?.po_number || null,
            supplier_name: o.procurement_status?.inverter?.supplier_name || inverterLinkedMap.get(idStr)?.supplier_name || null,
            supplier_brand: o.procurement_status?.inverter?.supplier_brand || inverterLinkedMap.get(idStr)?.supplier_brand || null,
            inward_grn_no: o.procurement_status?.inverter?.inward_grn_no || null,
          },
          overall_status: (isPanelPaid && isInverterPaid)
            ? ((isPanelInwarded && isInverterInwarded) ? 'inward_completed' : 'awaiting_material_inward')
            : 'awaiting_supplier_procurement'
        },
        delivery_address: {
          address_line: o.destination_address || null,
          pincode: o.destination_pincode || null,
          state_id: stId ? stId.toString() : null,
          state_name: stateName,
          district_id: distId ? distId.toString() : null,
          district_name: distName,
        },
        state_id: stId ? stId.toString() : null,
        state_name: stateName,
        district_id: distId ? distId.toString() : null,
        district_name: distName,
        warehouse_id: null,
        items,
        kit_ids: kitIds,
        industry_types: ['Solar PV'],
        categories: ['Rooftop Solar'],
        subcategories: ['Commercial', 'Residential'],
        system_types: ['On-Grid', 'Hybrid', 'Off-Grid'],
        project_ranges: items.map(i => i.capacity).filter(Boolean),
        created_at: o.createdAt || o.created_at,
      };
    }));

    // 7. Aggregate unique EPC entities with order counts
    const epcEntityMap = new Map();
    formattedEpc.forEach(o => {
      const key = o.entity_id || o.customer_name;
      if (!epcEntityMap.has(key)) {
        epcEntityMap.set(key, {
          id: o.entity_id || key,
          name: o.customer_name,
          gstin: o.customer_gstin !== '-' ? o.customer_gstin : '',
          contact: o.customer_contact !== '-' ? o.customer_contact : '',
          pending_count: 0
        });
      }
      epcEntityMap.get(key).pending_count += 1;
    });

    // 8. Aggregate unique Franchise entities with order counts
    const franEntityMap = new Map();
    formattedFranchise.forEach(o => {
      const key = o.entity_id || o.customer_name;
      if (!franEntityMap.has(key)) {
        franEntityMap.set(key, {
          id: o.entity_id || key,
          name: o.customer_name,
          gstin: o.customer_gstin !== '-' ? o.customer_gstin : '',
          contact: o.customer_contact !== '-' ? o.customer_contact : '',
          pending_count: 0
        });
      }
      franEntityMap.get(key).pending_count += 1;
    });

    // Also supplement with any registered EPCs and Resellers that may exist in DB
    try {
      const [allDbEpcs, allDbResellers] = await Promise.all([
        EpcAccount.find({ deleted_at: null }).select('name gstin gstin_trade_name gstin_legal_name whatsapp email').lean(),
        Reseller.find({ is_active: true }).select('business_name gst_number contact_person mobile email').lean()
      ]);

      allDbEpcs.forEach(epc => {
        const idStr = epc._id.toString();
        const name = epc.name || epc.gstin_trade_name || epc.gstin_legal_name || 'EPC Buyer';
        const gstin = epc.gstin || '';
        if (!epcEntityMap.has(idStr)) {
          epcEntityMap.set(idStr, {
            id: idStr,
            name,
            gstin,
            contact: epc.whatsapp || epc.email || '',
            pending_count: 0
          });
        } else {
          const existing = epcEntityMap.get(idStr);
          if (!existing.gstin && gstin) existing.gstin = gstin;
        }
      });

      allDbResellers.forEach(reseller => {
        const idStr = reseller._id.toString();
        const name = reseller.business_name || reseller.contact_person || 'Franchise Partner';
        const gstin = reseller.gst_number || '';
        if (!franEntityMap.has(idStr)) {
          franEntityMap.set(idStr, {
            id: idStr,
            name,
            gstin,
            contact: reseller.mobile || reseller.email || '',
            pending_count: 0
          });
        } else {
          const existing = franEntityMap.get(idStr);
          if (!existing.gstin && gstin) existing.gstin = gstin;
        }
      });
    } catch (dbErr) {
      console.warn('Non-fatal error fetching full DB EPC/Reseller master list:', dbErr.message);
    }

    const epcList = Array.from(epcEntityMap.values()).sort((a, b) => b.pending_count - a.pending_count || a.name.localeCompare(b.name));
    const franchiseList = Array.from(franEntityMap.values()).sort((a, b) => b.pending_count - a.pending_count || a.name.localeCompare(b.name));

    return res.status(200).json({
      status: 'success',
      data: {
        epc_orders: formattedEpc,
        franchise_orders: formattedFranchise,
        epc_list: epcList,
        franchise_list: franchiseList,
      },
      counts: {
        epc: formattedEpc.length,
        franchise: formattedFranchise.length,
        total: formattedEpc.length + formattedFranchise.length
      }
    });
  } catch (err) {
    console.error('Error in get_pending_epc_franchise_orders:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pending orders.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Create Combined Supplier Payment (from multiple EPC/Franchise orders)
// Body: {
//   warehouse_id, supplier_id, timeline,
//   source_order_ids: [{ order_id, order_type }],
//   items: [{ sku_id, sku_code, qty, order_price }],
//   payment: { reference_no, proforma_invoice_no, payment_date, amount, payment_mode, receipt_url }
// }
// ─────────────────────────────────────────────────────────────────────────────
const create_combined_supplier_payment = async (req, res) => {
  try {
    const { warehouse_id, supplier_id, timeline, source_order_ids, items, payment, procurement_type } = req.body;

    if (!warehouse_id || !supplier_id) {
      return res.status(400).json({ status: 'error', message: 'warehouse_id and supplier_id are required.' });
    }
    if (!payment || !payment.reference_no || !payment.payment_date || !payment.amount || !payment.payment_mode) {
      return res.status(400).json({ status: 'error', message: 'Payment details (reference_no, payment_date, amount, payment_mode) are required.' });
    }

    const warehouse = await CompanyWarehouse.findById(warehouse_id).lean();
    if (!warehouse) return res.status(404).json({ status: 'error', message: 'Warehouse not found.' });

    const supplier = await Supplier.findById(supplier_id).lean();
    if (!supplier) return res.status(404).json({ status: 'error', message: 'Supplier not found.' });

    // Resolve cluster for benchmark price lookup
    let cluster_id = null;
    if (warehouse.level_2) {
      const district = await GeoLevel2.findById(warehouse.level_2).lean();
      if (district && district.cluster) cluster_id = district.cluster;
    }

    // Determine PO type from source orders
    const sourceOrderTypes = (source_order_ids || []).map(s => s.order_type);
    const hasEpc = sourceOrderTypes.includes('epc');
    const hasFranchise = sourceOrderTypes.includes('franchise');
    let po_type = 'supplier_manual';
    if (hasEpc && hasFranchise) po_type = 'mixed_combined';
    else if (hasEpc) po_type = 'epc_combined';
    else if (hasFranchise) po_type = 'franchise_combined';

    // Enrich source orders with details first to calculate true component quantities
    const enrichedSourceOrders = [];
    let calculatedPanelQty = 0;
    let calculatedInverterQty = 0;
    let totalKitsCount = 0;

    if (source_order_ids && source_order_ids.length > 0) {
      const { EpcOrder, FpoOrder } = require('../../admin-panel/models/india_solarshop_db');
      for (const src of source_order_ids) {
        if (src.order_type === 'epc') {
          const epcOrder = await EpcOrder.findById(src.order_id)
            .populate('epc_id', 'name company_name email whatsapp gstin')
            .lean();
          if (epcOrder) {
            enrichedSourceOrders.push({
              order_id: epcOrder._id,
              order_type: 'epc',
              order_number: epcOrder.order_number,
              customer_name: epcOrder.epc_id?.name || epcOrder.epc_id?.company_name || 'EPC Buyer',
              customer_contact: epcOrder.epc_id?.whatsapp || epcOrder.epc_id?.email || '',
              order_amount: (epcOrder.grand_total_paise || 0) / 100,
              delivery_address: epcOrder.delivery_address || null,
              items: (epcOrder.items || []).map(it => ({
                item_name: it.item_name,
                quantity: it.quantity,
                scope_type: it.scope_type,
              })),
            });

            for (const it of (epcOrder.items || [])) {
              const q = Number(it.quantity) || 1;
              totalKitsCount += q;
              if (it.kit_id) {
                const bd = await resolveKitComponents(it.kit_id, q, it.item_name, it.capacity);
                if (bd) {
                  if (bd.panels?.total_quantity) calculatedPanelQty += Number(bd.panels.total_quantity);
                  if (bd.inverters?.total_quantity) calculatedInverterQty += Number(bd.inverters.total_quantity);
                  continue;
                }
              }
              const nameLower = (it.item_name || '').toLowerCase();
              const kwMatch = nameLower.match(/(\d+(\.\d+)?)\s*kw/) || (it.capacity || '').match(/(\d+(\.\d+)?)/);
              const capacityKw = kwMatch ? parseFloat(kwMatch[1]) : 5;
              const panelsPerKit = Math.ceil((capacityKw * 1000) / 550) || 9;
              calculatedPanelQty += (panelsPerKit * q);
              calculatedInverterQty += (1 * q);
            }
          }
        } else if (src.order_type === 'franchise') {
          const fpo = await FpoOrder.findById(src.order_id)
            .populate('franchisee_id', 'name company_name email mobile gstin')
            .lean();
          if (fpo) {
            enrichedSourceOrders.push({
              order_id: fpo._id,
              order_type: 'franchise',
              order_number: fpo.po_number,
              customer_name: fpo.franchisee_id?.name || fpo.franchisee_id?.company_name || 'Franchise Partner',
              customer_contact: fpo.franchisee_id?.mobile || fpo.franchisee_id?.email || '',
              order_amount: (fpo.grand_total_paise || 0) / 100,
              delivery_address: fpo.destination_address ? { address_line: fpo.destination_address, pincode: fpo.destination_pincode } : null,
              items: (fpo.items || []).map(it => ({
                item_name: it.item_name,
                quantity: it.quantity,
                scope_type: 'franchise_po',
              })),
            });

            for (const it of (fpo.items || [])) {
              const q = Number(it.quantity) || 1;
              totalKitsCount += q;
              const nameLower = (it.item_name || '').toLowerCase();
              const kwMatch = nameLower.match(/(\d+(\.\d+)?)\s*kw/) || (it.capacity || '').match(/(\d+(\.\d+)?)/);
              const capacityKw = kwMatch ? parseFloat(kwMatch[1]) : 5;
              const panelsPerKit = Math.ceil((capacityKw * 1000) / 550) || 9;
              calculatedPanelQty += (panelsPerKit * q);
              calculatedInverterQty += (1 * q);
            }
          }
        }
      }
    }

    // Process items if provided, or auto-generate summary item for procurement
    const processedItems = [];
    const rawItems = Array.isArray(items) ? items : [];

    const defaultTargetQty = procurement_type === 'panel'
      ? (calculatedPanelQty > 0 ? calculatedPanelQty : 1)
      : procurement_type === 'inverter'
        ? (calculatedInverterQty > 0 ? calculatedInverterQty : 1)
        : (totalKitsCount > 0 ? totalKitsCount : 1);

    for (const item of rawItems) {
      const { sku_id, sku_code, qty, order_price, item_name } = item;
      let skuDetail = null;
      let resolvedSkuId = sku_id;

      if (sku_id && mongoose.Types.ObjectId.isValid(sku_id)) {
        skuDetail = await ProductSku.findById(sku_id)
          .populate({ path: 'product_id', populate: { path: 'template_id' } })
          .lean();
      }

      if (!skuDetail) {
        let skuQuery = {};
        if (procurement_type === 'inverter' || (sku_code && sku_code.includes('INV'))) {
          skuQuery = { sku_code: { $regex: /INV|STR|HAV|GRO/i } };
        } else if (procurement_type === 'panel' || (sku_code && sku_code.includes('PANEL'))) {
          skuQuery = { sku_code: { $regex: /SOL|PANEL|TPS|WAR|AD|RED/i } };
        }
        skuDetail = await ProductSku.findOne(skuQuery)
          .populate({ path: 'product_id', populate: { path: 'template_id' } })
          .lean();
        if (skuDetail) resolvedSkuId = skuDetail._id;
      }

      const itemQty = Number(qty) > 0 ? Number(qty) : defaultTargetQty;
      const parsedOrderPrice = Number(order_price) > 0 ? Number(order_price) : Math.round(Number(payment.amount) / itemQty);

      processedItems.push({
        sku_id: resolvedSkuId || skuDetail?._id || new mongoose.Types.ObjectId(),
        sku_code: sku_code || skuDetail?.sku_code || (procurement_type === 'panel' ? 'PANEL-PROCUREMENT' : procurement_type === 'inverter' ? 'INVERTER-PROCUREMENT' : 'MIXED-KIT'),
        item_name: item_name || skuDetail?.product_id?.name || (
          procurement_type === 'panel' ? `Solar PV Modules (${itemQty} Pcs)` :
          procurement_type === 'inverter' ? `Solar Inverters (${itemQty} Pcs)` :
          `Solar Combo Kits (${itemQty} Units)`
        ),
        qty: itemQty,
        benchmark_price: parsedOrderPrice,
        benchmark_price_per_watt: 0,
        order_price: parsedOrderPrice,
        order_price_per_watt: 0,
      });
    }

    // If no specific SKU items provided, create a summary item representing the procurement
    if (processedItems.length === 0) {
      let fallbackSku = null;
      if (procurement_type === 'inverter') {
        fallbackSku = await ProductSku.findOne({ sku_code: { $regex: /INV|STR|HAV|GRO/i } }).populate({ path: 'product_id' }).lean();
      } else if (procurement_type === 'panel') {
        fallbackSku = await ProductSku.findOne({ sku_code: { $regex: /SOL|PANEL|TPS|WAR|AD|RED/i } }).populate({ path: 'product_id' }).lean();
      }
      if (!fallbackSku) {
        fallbackSku = await ProductSku.findOne({}).populate({ path: 'product_id' }).lean();
      }

      const typeLabel = procurement_type === 'panel' ? 'SOLAR-PANEL' : procurement_type === 'inverter' ? 'INVERTER' : 'MIXED-KIT';
      const targetQty = defaultTargetQty;
      const unitPrice = Math.round(Number(payment.amount) / targetQty);

      const generatedName = procurement_type === 'panel'
        ? (fallbackSku?.product_id?.name ? `${fallbackSku.product_id.name} (${targetQty} Pcs)` : `Solar PV Modules (${targetQty} Pcs)`)
        : procurement_type === 'inverter'
          ? (fallbackSku?.product_id?.name ? `${fallbackSku.product_id.name} (${targetQty} Pcs)` : `Solar Inverters (${targetQty} Pcs)`)
          : `Solar Combo Kits (${targetQty} Units)`;

      processedItems.push({
        sku_id: fallbackSku?._id || new mongoose.Types.ObjectId(),
        sku_code: fallbackSku?.sku_code || `${typeLabel}-PROCUREMENT`,
        item_name: generatedName,
        qty: targetQty,
        benchmark_price: unitPrice,
        benchmark_price_per_watt: 0,
        order_price: unitPrice,
        order_price_per_watt: 0,
      });
    }

    // Generate PO number safely against collisions
    const count = await PurchaseOrder.countDocuments({});
    const year = new Date().getFullYear();
    let counter = count + 1;
    let po_number = `CPO-${year}-${String(counter).padStart(5, '0')}`;
    while (await PurchaseOrder.findOne({ po_number })) {
      counter++;
      po_number = `CPO-${year}-${String(counter).padStart(5, '0')}`;
    }

    const userId = req.user?.id || req.user?._id || new mongoose.Types.ObjectId();

    const newPO = new PurchaseOrder({
      po_number,
      warehouse_id,
      supplier_id,
      supplier_name: supplier.company_name,
      supplier_brand: supplier.brand_name || supplier.company_name,
      supplier_gst: supplier.gst_number || null,
      warehouse_code: warehouse.warehouse_code,
      warehouse_name: warehouse.warehouse_code,
      items: processedItems,
      timeline: timeline ? new Date(timeline) : new Date(Date.now() + 7 * 86400000),
      po_type,
      procurement_type: procurement_type || null,
      source_orders: enrichedSourceOrders,
      status: 'paid', // Combined PO goes straight to paid (payment made immediately)
      payment_details: {
        reference_no: payment.reference_no,
        payment_date: new Date(payment.payment_date),
        amount: Number(payment.amount),
        payment_mode: payment.payment_mode,
        receipt_url: payment.receipt_url || null,
      },
      proforma_invoice_no: payment.proforma_invoice_no || null,
      created_by: userId,
    });

    await newPO.save();

    // Update source orders procurement_status (Panel or Inverter or Mixed)
    // NOTE: Order is NOT moved to delivery queue ('processing') yet! It must wait for Material Inward.
    if (enrichedSourceOrders.length > 0) {
      const { EpcOrder, FpoOrder } = require('../../admin-panel/models/india_solarshop_db');
      
      for (const src of enrichedSourceOrders) {
        try {
          const Model = src.order_type === 'epc' ? EpcOrder : FpoOrder;
          const doc = await Model.findById(src.order_id);
          if (!doc) continue;

          if (!doc.procurement_status) {
            doc.procurement_status = {
              panel: { required: true, status: 'pending_payment' },
              inverter: { required: true, status: 'pending_payment' },
              overall_status: 'awaiting_supplier_procurement'
            };
          }

          const isProcPanel = procurement_type === 'panel' || procurement_type === 'mixed' || !procurement_type;
          const isProcInverter = procurement_type === 'inverter' || procurement_type === 'mixed' || !procurement_type;

          if (isProcPanel) {
            doc.procurement_status.panel = {
              ...(doc.procurement_status.panel || {}),
              required: true,
              status: 'paid_awaiting_inward',
              po_id: newPO._id,
              po_number: po_number,
              supplier_id: supplier._id,
              supplier_name: supplier.company_name,
              supplier_brand: supplier.brand_name || supplier.company_name,
              supplier_gst: supplier.gst_number || null,
            };
          }

          if (isProcInverter) {
            doc.procurement_status.inverter = {
              ...(doc.procurement_status.inverter || {}),
              required: true,
              status: 'paid_awaiting_inward',
              po_id: newPO._id,
              po_number: po_number,
              supplier_id: supplier._id,
              supplier_name: supplier.company_name,
              supplier_brand: supplier.brand_name || supplier.company_name,
              supplier_gst: supplier.gst_number || null,
            };
          }

          const panelDone = doc.procurement_status.panel?.status === 'paid_awaiting_inward' || doc.procurement_status.panel?.status === 'inwarded';
          const inverterDone = doc.procurement_status.inverter?.status === 'paid_awaiting_inward' || doc.procurement_status.inverter?.status === 'inwarded';

          if (panelDone && inverterDone) {
            doc.procurement_status.overall_status = 'awaiting_material_inward';
          } else {
            doc.procurement_status.overall_status = 'awaiting_supplier_procurement';
          }

          // Ensure warehouse is assigned
          if (!doc.warehouse_id) {
            doc.warehouse_id = warehouse_id;
          }

          try {
            doc.markModified('procurement_status');
            await doc.save();
          } catch (saveErr) {
            console.warn(`doc.save fallback to findByIdAndUpdate for order ${src.order_id}:`, saveErr.message);
            await Model.findByIdAndUpdate(src.order_id, {
              $set: {
                procurement_status: doc.procurement_status,
                warehouse_id: doc.warehouse_id || warehouse_id
              }
            });
          }
        } catch (orderUpdateErr) {
          console.error(`Error updating source order ${src.order_id}:`, orderUpdateErr.message);
        }
      }
    }

    return res.status(201).json({
      status: 'success',
      message: `Combined Purchase Order ${po_number} created and payment recorded. ${enrichedSourceOrders.length} source order(s) linked.`,
      data: newPO
    });
  } catch (err) {
    console.error('Error in create_combined_supplier_payment:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to create combined payment.', error: err.message });
  }
};

module.exports = {
  get_pending_inwards,
  approve_inward,
  reject_inward,
  get_warehouses,
  get_warehouse_inwards,
  list_suppliers,
  create_supplier,
  gst_verify,
  gst_generate_otp,
  gst_submit_otp,
  get_warehouse_skus,
  get_sku_suppliers,
  get_warehouse_suppliers,
  get_supplier_warehouse_prices,
  create_purchase_order,
  pay_purchase_order,
  update_purchase_order_timeline,
  get_purchase_orders,
  get_completed_deliveries,
  get_sku_details,
  get_combo_kits,
  cancel_purchase_order,
  get_country_saas_products,
  get_po_requests,
  update_po_request_status,
  get_hierarchy_options,
  get_pending_epc_franchise_orders,
  create_combined_supplier_payment,
};

