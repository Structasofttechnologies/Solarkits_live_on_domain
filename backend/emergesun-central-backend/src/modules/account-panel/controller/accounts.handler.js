const mongoose = require('mongoose');
const { WarehouseInward, WarehouseStock, CompanyWarehouse, PurchaseOrder, PoRequest } = require('../models/company_warehouse_db');
const { ProductSku, Product, Brand, ProductTemplate, ProductSkuPrice, ProductAttributeValue, SubtypeAttribute, Unit, AttributeOption, ComboKit, SolarKit, WarehouseKitActivation, ProductSubtype } = require('../models/core_db');
const { company_warehouse_db, supplier_db } = require('../config/databases');
const { Cluster, GeoLevel2, GeoLevel0, GeoLevel1 } = require('../models/geolocation_db');
const { Supplier } = require('../models/supplier_db');
const { CountrySaaSProduct, CmsRole, CmsUserScope } = require('../models/user_db');

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
    let query = { is_active: true, deleted_at: null };

    // Resolve user's allowed cluster IDs
    const allowedClusterIds = await getUserAllowedClusterIds(req.user);

    if (allowedClusterIds !== null) {
      if (allowedClusterIds.length === 0) {
        return res.status(200).json({ status: "success", data: [] });
      }
      
      const allowedDistricts = await GeoLevel2.find({ cluster: { $in: allowedClusterIds.map(id => new mongoose.Types.ObjectId(id)) }, deleted_at: null }).select('_id').lean();
      const allowedDistrictIds = allowedDistricts.map(d => d._id);
      query.level_2 = { $in: allowedDistrictIds };
    }

    if (clusterId) {
      const isValid = mongoose.Types.ObjectId.isValid(clusterId);
      if (!isValid) {
        return res.status(200).json({ status: "success", data: [] });
      }

      // Validate selected cluster is allowed
      if (allowedClusterIds !== null && !allowedClusterIds.includes(clusterId.toString())) {
        return res.status(200).json({ status: "success", data: [] });
      }

      const clusterObjId = new mongoose.Types.ObjectId(clusterId);
      const districts = await GeoLevel2.find({ cluster: clusterObjId, deleted_at: null }).select('_id').lean();
      const districtIds = districts.map(d => d._id);
      query.level_2 = { $in: districtIds };
    } else if (stateId) {
      const isValid = mongoose.Types.ObjectId.isValid(stateId);
      if (!isValid) {
        return res.status(200).json({ status: "success", data: [] });
      }
      query.level_1 = new mongoose.Types.ObjectId(stateId);
    } else if (countryId) {
      const isValid = mongoose.Types.ObjectId.isValid(countryId);
      if (!isValid) {
        return res.status(200).json({ status: "success", data: [] });
      }
      query.level_0 = new mongoose.Types.ObjectId(countryId);
    }

    const warehouses = await CompanyWarehouse.find(query).lean();
    return res.status(200).json({ status: "success", data: warehouses });
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

    const isDev = process.env.NODE_ENV !== 'production';
    const apiKey = isDev
      ? (process.env.QUICKEKYC_SANDBOX_API_KEY || process.env.QUICKEKYC_API_KEY)
      : process.env.QUICKEKYC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ status: 'error', message: 'QuickeKYC API key is not configured.' });
    }

    const baseUrl = isDev ? 'https://sandbox.quickekyc.com' : 'https://api.quickekyc.com';
    const response = await fetch(`${baseUrl}/api/v1/corporate/gst-verification-v2/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKey,
        id_number: gstin,
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
      return res.status(response.status || 500).json({
        status: 'error',
        message: `QuickeKYC server returned non-JSON response (HTTP ${response.status}).`
      });
    }
    if (data.status !== 'success') {
      return res.status(data.status_code || response.status || 400).json(data);
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
  if (data.address) return data.address;
  if (data.prb && data.prb.addr) {
    const a = data.prb.addr;
    return [
      a.bno, a.flno, a.st, a.loc, a.dst, a.stcd, a.pn
    ].filter(Boolean).join(', ');
  }
  return '';
};

const gst_submit_otp = async (req, res) => {
  try {
    const { request_id, otp, gstin } = req.body;
    if (!request_id || !otp || !gstin) {
      return res.status(400).json({ status: 'error', message: 'request_id, otp, and gstin are required.' });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const apiKey = isDev
      ? (process.env.QUICKEKYC_SANDBOX_API_KEY || process.env.QUICKEKYC_API_KEY)
      : process.env.QUICKEKYC_API_KEY;
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
    const stateCode = gstin.substring(0, 2);
    const state = GST_STATE_CODES[stateCode] || 'Delhi';

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
      is_active: true,
      is_deleted: { $ne: true }
    };

    if (warehouseStateId) {
      query.$or = [
        { states: warehouseStateId },
        { 'gst_list.state': warehouseStateId }
      ];
    } else if (warehouseCountryId) {
      query.country_id = warehouseCountryId;
    }

    // Find all active, approved suppliers matching query
    const suppliers = await Supplier.find(query).lean();

    const formattedSuppliers = suppliers.map(sup => {
      // Find the specific GST number matching the state of the warehouse
      let gst_number = '';
      if (warehouseStateId) {
        const matchedGstEntry = (sup.gst_list || []).find(g => g.state === warehouseStateId);
        gst_number = matchedGstEntry ? matchedGstEntry.gst_number : (sup.gst_number || '');
      } else {
        gst_number = sup.gst_number || '';
      }

      return {
        supplier_id: sup._id,
        company_name: sup.company_name,
        brand_name: sup.brand_name,
        gst_number: gst_number
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
        if (!item || !item.sku_id) continue;
        try {
          const sku = await ProductSku.findById(item.sku_id)
            .populate({
              path: 'product_id',
              populate: [{ path: 'brand_id' }, { path: 'template_id' }]
            }).lean();
          if (sku) {
            item.sku_details = {
              sku_code: sku.sku_code || 'N/A',
              product_name: sku.product_id?.name || 'N/A',
              brand_name: sku.product_id?.brand_id?.brand_name || 'N/A',
              category: sku.product_id?.template_id?.name || 'N/A'
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
    const matchingWhIds = matchingWarehouses.map(w => w._id);
    dbQuery.warehouse_id = { $in: matchingWhIds };

    const list = await PurchaseOrder.find(dbQuery)
      .populate('warehouse_id', 'warehouse_code warehouse_type address level_0 level_1 level_2')
      .sort({ created_at: -1 })
      .lean();

    const supplierIds = [...new Set(list.map(po => po.supplier_id?.toString()).filter(Boolean))];
    const suppliersList = await Supplier.find({ _id: { $in: supplierIds } }).lean();
    const supplierMap = Object.fromEntries(suppliersList.map(s => [s._id.toString(), s]));

    for (const po of list) {
      if (po.supplier_id) {
        po.supplier_id = supplierMap[po.supplier_id.toString()] || null;
      }
      if (!po || !po.items || !Array.isArray(po.items)) continue;
      for (const item of po.items) {
        if (!item || !item.sku_id) continue;
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
            item.sku_details = {
              sku_code: sku.sku_code || 'N/A',
              product_name: sku.product_id?.name || 'N/A',
              brand_name: sku.product_id?.brand_id?.brand_name || 'N/A',
              category: sku.product_id?.template_id?.name || 'N/A'
            };
          }
        } catch (skuErr) {
          console.error(`Error populating SKU ${item.sku_id} for PO ${po._id}:`, skuErr);
        }
      }
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

    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(200).json({ status: "success", data: [] });
    }

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

module.exports = {
  get_pending_inwards,
  approve_inward,
  reject_inward,
  get_warehouses,
  get_warehouse_inwards,
  list_suppliers,
  create_supplier,
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
  update_po_request_status
};
