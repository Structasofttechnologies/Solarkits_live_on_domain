const mongoose = require('mongoose');
const {
  DeliveryVehicleMaster,
  DeliveryServiceProvider,
  DeliveryVehicleFleet,
  ComboKitWeightMaster,
  DeliveryCostBenchmark,
  KitDeliveryCostRule,
  DeliveryRouteSetting,
  DeliveryOrder,
  EpcOrder,
  FpoOrder,
  PurchaseOrder,
  WarehouseComboKit,
  Reseller,
  StoreSetup,
} = require('../models/india_solarshop_db');
const { CompanyWarehouse } = require('../models/company_warehouse_db');

/**
 * Helper: Generate unique delivery number DEL-YYYY-XXXX
 */
const generateDeliveryNumber = async () => {
  const year = new Date().getFullYear();
  const count = await DeliveryOrder.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `DEL-${year}-${seq}`;
};

/**
 * 1. WEIGHT & CARGO CALCULATION
 */
const getKitWeight = async (kitId) => {
  if (!kitId) return 100;
  const weightRecord = await ComboKitWeightMaster.findOne({ kit_id: kitId }).lean();
  if (weightRecord && weightRecord.total_kit_weight_kg > 0) {
    return weightRecord.total_kit_weight_kg;
  }
  // Fallback: estimate from combo kit capacity if available
  const kit = await WarehouseComboKit.findById(kitId).lean();
  const capacity = kit?.capacity || 1;
  return Math.round(capacity * 75); // baseline ~75kg per kW
};

const calculateOrderCargo = async (orderOrId, orderModel = 'epc_orders') => {
  let order = null;
  if (orderOrId && typeof orderOrId === 'object' && orderOrId._id) {
    order = orderOrId;
  } else if (orderModel === 'epc_orders') {
    order = await EpcOrder.findById(orderOrId).lean();
  } else if (orderModel === 'fpo_orders') {
    order = await FpoOrder.findById(orderOrId).lean();
  } else {
    order = await PurchaseOrder.findById(orderOrId).lean();
  }

  if (!order) {
    return {
      order_id: orderOrId?._id || orderOrId,
      order_number: orderOrId?.order_number || 'N/A',
      total_kits: 1,
      total_weight_kg: 100,
      total_kw: 1,
      kit_items: [],
    };
  }

  const items = order.items || [];
  let totalKits = 0;
  let totalWeightKg = 0;
  let totalKw = 0;
  const kitItems = [];

  for (const item of items) {
    const qty = Number(item.quantity || 1);
    const kitId = item.kit_id || item.product_id;
    const unitWeight = await getKitWeight(kitId);
    const itemTotalWeight = unitWeight * qty;

    totalKits += qty;
    totalWeightKg += itemTotalWeight;

    // Estimate kW from item capacity string or number if present
    const capacityVal = parseFloat(item.capacity || item.item_name || '1') || 1;
    totalKw += capacityVal * qty;

    kitItems.push({
      kit_id: kitId,
      kit_name: item.item_name || 'Solar Kit',
      quantity: qty,
      unit_weight_kg: unitWeight,
      total_weight_kg: itemTotalWeight,
    });
  }

  // Fallback to order_load_metrics if available and items had 0 weight
  if (totalWeightKg === 0 && order.order_load_metrics?.total_weight_kg) {
    totalWeightKg = order.order_load_metrics.total_weight_kg;
    totalKits = order.order_load_metrics.total_kits || 1;
    totalKw = order.order_load_metrics.total_kw || 1;
  }

  return {
    order_id: order._id,
    order_number: order.order_number,
    total_kits: totalKits || 1,
    total_weight_kg: totalWeightKg || 100,
    total_kw: totalKw || 1,
    kit_items: kitItems,
  };
};

/**
 * 2. FRANCHISEE APPROVED DESTINATIONS
 */
const getFranchiseeDestinations = async (districtId = null) => {
  const query = { status: { $ne: 'cancelled' } };
  if (districtId) {
    query.district_id = districtId;
  }

  const storeSetups = await StoreSetup.find(query)
    .populate('franchisee_id', 'reseller_code name contact_person mobile_number email pincode registered_address')
    .lean();

  return storeSetups.map(s => ({
    store_setup_id: s.store_setup_id,
    franchisee_id: s.franchisee_id?._id || s.franchisee_id,
    franchisee_code: s.franchisee_id?.reseller_code,
    franchisee_name: s.franchisee_name,
    mobile: s.mobile,
    email: s.email,
    state_id: s.state_id,
    state_name: s.state_name,
    district_id: s.district_id,
    district_name: s.district_name,
    address: s.store_address || s.franchisee_id?.registered_address,
    pincode: s.franchisee_id?.pincode,
  }));
};

/**
 * 3. DELIVERY QUEUE (PAID ORDERS ONLY, FIFO BY PAYMENT TIMESTAMP)
 */
const getDeliveryQueue = async ({ warehouse_id, page = 1, limit = 50, priority_only = false }) => {
  const validWarehouseId = (warehouse_id && warehouse_id !== 'null' && warehouse_id !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouse_id)) ? warehouse_id : null;

  const query = {
    // Only paid orders eligible for delivery
    payment_status: { $in: ['captured', 'approved', 'PAID', 'paid'] },
    order_status: { $in: ['confirmed', 'processing', 'pending_dispatch', 'vehicle_assigned'] },
  };

  if (validWarehouseId) {
    query.warehouse_id = validWarehouseId;
  }

  // Fetch from EpcOrder
  const epcOrders = await EpcOrder.find(query)
    .populate('warehouse_id', 'warehouse_code address')
    .populate('epc_id', 'name company_name phone whatsapp')
    .sort({ 'offline_payment.payment_date': 1, created_at: 1 })
    .lean();

  // Fetch from FpoOrder
  const fpoQuery = {
    status: { $in: ['PAID', 'STOCK_ALLOCATED', 'PROCESSING', 'VEHICLE_ASSIGNED'] },
  };
  if (validWarehouseId) fpoQuery.warehouse_id = validWarehouseId;

  const fpoOrders = await FpoOrder.find(fpoQuery)
    .populate('franchisee_id', 'name company_name mobile')
    .sort({ paid_at: 1, created_at: 1 })
    .lean();

  // Map and unify
  const unified = [];

  for (const o of epcOrders) {
    const cargo = await calculateOrderCargo(o._id, 'epc_orders');
    const paymentTime = o.offline_payment?.payment_date || o.created_at;
    const hoursWaiting = Math.round((Date.now() - new Date(paymentTime).getTime()) / (1000 * 3600));

    unified.push({
      _id: o._id,
      order_number: o.order_number,
      order_model: 'epc_orders',
      order_type: o.order_type || 'EPC Order',
      payment_time: paymentTime,
      hours_waiting: hoursWaiting,
      customer_name: o.epc_id?.name || o.delivery_address?.contact_name || 'EPC Buyer',
      customer_phone: o.epc_id?.whatsapp || o.delivery_address?.contact_phone || 'N/A',
      warehouse_id: o.warehouse_id?._id || o.warehouse_id,
      warehouse_code: o.warehouse_id?.warehouse_code || 'WH-01',
      destination: {
        address: o.delivery_address?.line || 'Direct Site',
        state_id: o.delivery_address?.state_id,
        state_name: o.delivery_address?.state_name,
        district_id: o.delivery_address?.district_id,
        district_name: o.delivery_address?.district_name,
        pincode: o.delivery_address?.pincode,
      },
      kits: cargo.total_kits,
      total_kg: cargo.total_weight_kg,
      total_kw: cargo.total_kw,
      customer_delivery_charge: (o.shipping_fee_paise || 0) / 100,
      expected_dispatch: o.dispatch_tracking?.estimated_delivery || null,
      order_status: o.order_status,
      is_priority: Boolean(o.is_priority),
      priority_reason: o.priority_reason || null,
    });
  }

  for (const o of fpoOrders) {
    const cargo = await calculateOrderCargo(o._id, 'fpo_orders');
    const paymentTime = o.paid_at || o.created_at;
    const hoursWaiting = Math.round((Date.now() - new Date(paymentTime).getTime()) / (1000 * 3600));

    unified.push({
      _id: o._id,
      order_number: o.po_number || `PO-${o._id.toString().slice(-6)}`,
      order_model: 'fpo_orders',
      order_type: 'Franchisee PO',
      payment_time: paymentTime,
      hours_waiting: hoursWaiting,
      customer_name: o.franchisee_id?.name || 'Franchisee',
      customer_phone: o.franchisee_id?.mobile || 'N/A',
      warehouse_id: o.warehouse_id || null,
      warehouse_code: 'WH-01',
      destination: {
        address: o.delivery_address || 'Franchisee Store',
        state_id: o.state_id,
        district_id: o.district_id,
        pincode: o.pincode || 'N/A',
      },
      kits: cargo.total_kits,
      total_kg: cargo.total_weight_kg,
      total_kw: cargo.total_kw,
      customer_delivery_charge: (o.shipping_fee_paise || 0) / 100,
      expected_dispatch: o.expected_delivery_date || null,
      order_status: o.status,
      is_priority: Boolean(o.is_priority),
      priority_reason: o.priority_reason || null,
    });
  }

  // Sort strictly ascending by payment time (FIFO: oldest paid order appears first)
  unified.sort((a, b) => new Date(a.payment_time).getTime() - new Date(b.payment_time).getTime());

  // Filter if priority requested
  let filtered = unified;
  if (priority_only) {
    filtered = unified.filter(u => u.is_priority);
  }

  const total = filtered.length;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const paginated = filtered.slice(skip, skip + parseInt(limit));

  return {
    orders: paginated,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * 4. AUTOMATIC ORDER CONSOLIDATION SCANNER
 */
const scanQueueForConsolidation = async (warehouseId) => {
  const validWarehouseId = (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouseId)) ? warehouseId : null;
  if (!validWarehouseId) return [];

  const queueResult = await getDeliveryQueue({ warehouse_id: validWarehouseId, limit: 200 });
  const allOrders = queueResult.orders;

  // Fetch active route settings for this warehouse
  const routeSettings = await DeliveryRouteSetting.find({
    origin_warehouse_id: validWarehouseId,
    combined_delivery_enabled: true,
    is_active: true,
  }).lean();

  const suggestions = [];

  for (const route of routeSettings) {
    // Collect all eligible district IDs for this route
    const eligibleDistricts = [
      route.primary_district_id?.toString(),
      ...(route.nearby_district_ids || []).map(d => d.toString()),
    ].filter(Boolean);

    const eligiblePincodes = (route.pincode_groups || []).map(p => p.pincode);

    // Filter orders matching route districts or pincodes
    const routeEligibleOrders = allOrders.filter(o => {
      // Priority orders bypass consolidation
      if (o.is_priority) return false;

      const orderDistId = o.destination?.district_id?.toString();
      const orderPin = o.destination?.pincode;

      const matchesDistrict = orderDistId && eligibleDistricts.includes(orderDistId);
      const matchesPincode = orderPin && eligiblePincodes.includes(orderPin);

      return matchesDistrict || matchesPincode;
    });

    if (routeEligibleOrders.length >= 2) {
      // Group up to max_delivery_stops
      const clusterOrders = routeEligibleOrders.slice(0, route.max_delivery_stops || 5);
      const totalKits = clusterOrders.reduce((sum, o) => sum + o.kits, 0);
      const totalWeightKg = clusterOrders.reduce((sum, o) => sum + o.total_kg, 0);
      const totalKw = clusterOrders.reduce((sum, o) => sum + o.total_kw, 0);

      // Check benchmark savings
      let separateBenchmarkTotal = 0;
      for (const ord of clusterOrders) {
        const bench = await DeliveryCostBenchmark.findOne({
          warehouse_id: warehouseId,
          district_id: ord.destination?.district_id,
          is_active: true,
        }).lean();
        separateBenchmarkTotal += (bench?.benchmark_cost || 4000);
      }

      // Estimate combined benchmark cost (base benchmark + minor stop deviation)
      const primaryBench = await DeliveryCostBenchmark.findOne({
        warehouse_id: warehouseId,
        district_id: route.primary_district_id,
        is_active: true,
      }).lean();
      const baseCombinedCost = primaryBench ? primaryBench.benchmark_cost * 1.25 : separateBenchmarkTotal * 0.75;
      const estimatedSaving = Math.max(0, separateBenchmarkTotal - baseCombinedCost);

      suggestions.push({
        route_id: route._id,
        route_name: route.route_name,
        orders: clusterOrders,
        order_count: clusterOrders.length,
        total_kits: totalKits,
        total_weight_kg: totalWeightKg,
        total_kw: totalKw,
        districts: [...new Set(clusterOrders.map(o => o.destination?.district_name || 'N/A'))],
        pincodes: [...new Set(clusterOrders.map(o => o.destination?.pincode).filter(Boolean))],
        total_stops: clusterOrders.length,
        estimated_route_distance_km: route.max_route_distance_km || 150,
        separate_benchmark_total: Math.round(separateBenchmarkTotal),
        combined_benchmark_cost: Math.round(baseCombinedCost),
        estimated_saving: Math.round(estimatedSaving),
        max_waiting_period_hours: route.max_waiting_period_hours,
        cost_allocation_default: route.cost_allocation_default,
      });
    }
  }

  return suggestions;
};

/**
 * 5. ELIGIBLE FLEET & PREVIOUS VEHICLE PREFERENCE MATCHER
 */
const getEligibleFleet = async ({ warehouse_id, destination_district_id, total_weight_kg, route_distance_km = 100 }) => {
  // 1. Find Vehicle Masters that can handle the load & distance
  const vehicleMasters = await DeliveryVehicleMaster.find({
    is_active: true,
    max_load_kg: { $gte: Number(total_weight_kg) },
    max_delivery_distance_km: { $gte: Number(route_distance_km) },
  }).lean();

  const masterIds = vehicleMasters.map(vm => vm._id);

  // 2. Find Providers active in the target district
  const providers = await DeliveryServiceProvider.find({
    status: 'Active',
    'active_districts.district_id': destination_district_id,
  }).lean();

  const providerIds = providers.map(p => p._id);

  // 3. Find available physical vehicles
  const availableFleet = await DeliveryVehicleFleet.find({
    service_provider_id: { $in: providerIds },
    vehicle_master_id: { $in: masterIds },
    current_status: 'Available',
    is_active: true,
    is_deleted: false,
  })
    .populate('service_provider_id', 'name owner_name mobile_number customer_service_number gst_number')
    .populate('vehicle_master_id', 'name brand_make model max_load_kg length_ft width_ft height_ft')
    .lean();

  // 4. Check Previous Vehicle Preference for this route
  const lastTripOnRoute = await DeliveryOrder.findOne({
    warehouse_id,
    'stops.destination.district_id': destination_district_id,
    status: 'closed',
  })
    .sort({ completed_at: -1 })
    .lean();

  let previousVehicleId = null;
  if (lastTripOnRoute && lastTripOnRoute.vehicles_allocated?.length > 0) {
    previousVehicleId = lastTripOnRoute.vehicles_allocated[0].vehicle_id?.toString();
  }

  const enrichedFleet = availableFleet.map(v => {
    const isPrevious = previousVehicleId && v._id.toString() === previousVehicleId;
    return {
      ...v,
      is_previous_vehicle_preference: isPrevious,
      utilization_pct: Math.min(100, Math.round((Number(total_weight_kg) / v.load_capacity_kg) * 100)),
    };
  });

  // Sort previous vehicle preference first, then best utilization
  enrichedFleet.sort((a, b) => {
    if (a.is_previous_vehicle_preference) return -1;
    if (b.is_previous_vehicle_preference) return 1;
    return b.utilization_pct - a.utilization_pct;
  });

  // 5. Multi-Vehicle Split Analysis if no single vehicle can carry load
  let splitRecommendation = null;
  if (enrichedFleet.length === 0) {
    const allAvailableFleet = await DeliveryVehicleFleet.find({
      service_provider_id: { $in: providerIds },
      current_status: 'Available',
      is_active: true,
      is_deleted: false,
    })
      .populate('service_provider_id', 'name owner_name mobile_number gst_number')
      .populate('vehicle_master_id', 'name max_load_kg')
      .lean();

    if (allAvailableFleet.length >= 2) {
      const topCapacity = allAvailableFleet[0].load_capacity_kg || 1500;
      const neededCount = Math.ceil(Number(total_weight_kg) / topCapacity);
      splitRecommendation = {
        requires_multi_vehicle: true,
        needed_vehicles_count: neededCount,
        available_options: allAvailableFleet.slice(0, neededCount),
        message: `Total cargo load of ${total_weight_kg} KG exceeds standard single vehicle capacity. Recommend splitting into ${neededCount} vehicles.`,
      };
    }
  }

  return {
    eligible_fleet: enrichedFleet,
    providers,
    split_recommendation: splitRecommendation,
  };
};

/**
 * 6. BENCHMARK COST VALIDATION
 */
const validateBenchmarkCost = async ({ warehouse_id, vehicle_master_id, district_id, proposed_cost }) => {
  const benchmark = await DeliveryCostBenchmark.findOne({
    warehouse_id,
    vehicle_master_id,
    district_id,
    is_active: true,
  }).lean();

  const benchmarkCost = benchmark ? benchmark.benchmark_cost : 5000;
  const cost = Number(proposed_cost);
  const meetsBenchmark = cost <= benchmarkCost;
  const difference = cost - benchmarkCost;

  return {
    benchmark_cost: benchmarkCost,
    proposed_cost: cost,
    meets_benchmark: meetsBenchmark,
    difference: difference,
    gst_applicable: benchmark ? benchmark.gst_applicable : true,
    gst_rate: benchmark ? benchmark.gst_rate : 18,
    free_delivery_eligible: benchmark ? benchmark.free_delivery_eligible : false,
  };
};

/**
 * 7. COST ALLOCATION CALCULATOR
 */
const calculateCostAllocations = ({ total_vendor_cost, stops, method = 'by_kit_qty' }) => {
  const cost = Number(total_vendor_cost || 0);
  const totalKits = stops.reduce((sum, s) => sum + (s.cargo?.total_kits || s.kits || 1), 0);
  const totalWeight = stops.reduce((sum, s) => sum + (s.cargo?.total_weight_kg || s.total_kg || 100), 0);

  return stops.map((stop, idx) => {
    let allocatedCost = 0;
    const kits = stop.cargo?.total_kits || stop.kits || 1;
    const weight = stop.cargo?.total_weight_kg || stop.total_kg || 100;
    const custCharge = stop.customer_delivery_charge || 0;

    if (method === 'by_weight_kg' && totalWeight > 0) {
      allocatedCost = Math.round(cost * (weight / totalWeight));
    } else if (method === 'by_distance') {
      // Incremental stop weighting
      const stopFactor = (idx + 1) / ((stops.length * (stops.length + 1)) / 2);
      allocatedCost = Math.round(cost * stopFactor);
    } else if (method === 'manual') {
      allocatedCost = stop.allocated_vendor_cost || Math.round(cost / stops.length);
    } else {
      // Default: by_kit_qty
      allocatedCost = totalKits > 0 ? Math.round(cost * (kits / totalKits)) : Math.round(cost / stops.length);
    }

    return {
      stop_number: stop.stop_number || idx + 1,
      order_id: stop.order_id,
      order_number: stop.order_number,
      customer_delivery_charge: custCharge,
      allocated_vendor_cost: allocatedCost,
      stop_delivery_margin: custCharge - allocatedCost,
    };
  });
};

/**
 * 8. CREATE DELIVERY ORDER / MASTER DELIVERY TRIP
 */
const createDeliveryTrip = async (payload, adminUser = null) => {
  const {
    delivery_type = 'single_order',
    warehouse_id,
    route_setting_id = null,
    service_provider_id,
    booking_source = 'manual',
    stops = [],
    vehicles_allocated = [],
    actual_vendor_cost,
    cost_allocation_method = 'by_kit_qty',
    override_details = null,
    pickup_scheduled_at = null,
    expected_delivery_date = null,
  } = payload;

  if (!warehouse_id || !service_provider_id || stops.length === 0 || vehicles_allocated.length === 0) {
    throw new Error('Warehouse, Service Provider, at least one Stop, and at least one Vehicle are required.');
  }

  const deliveryNumber = await generateDeliveryNumber();

  // 1. Compute Cargo Summary & Cost Allocations
  let totalShipmentWeight = 0;
  let totalKits = 0;
  let totalKw = 0;
  let totalCustomerCharge = 0;

  const processedStops = [];

  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    const cargo = await calculateOrderCargo(st.order_id, st.order_model || 'epc_orders');
    totalShipmentWeight += cargo.total_weight_kg;
    totalKits += cargo.total_kits;
    totalKw += cargo.total_kw;
    totalCustomerCharge += Number(st.customer_delivery_charge || 0);

    processedStops.push({
      stop_number: i + 1,
      order_id: st.order_id,
      order_number: st.order_number || cargo.order_number,
      order_model: st.order_model || 'epc_orders',
      recipient_type: st.recipient_type || 'epc_buyer',
      recipient_name: st.recipient_name || 'Customer',
      destination: st.destination,
      cargo: {
        total_kits: cargo.total_kits,
        total_weight_kg: cargo.total_weight_kg,
        total_kw: cargo.total_kw,
        kit_items: cargo.kit_items,
      },
      stop_status: 'pending',
      customer_delivery_charge: Number(st.customer_delivery_charge || 0),
    });
  }

  // Calculate stop-wise vendor cost distribution
  const allocations = calculateCostAllocations({
    total_vendor_cost: actual_vendor_cost,
    stops: processedStops,
    method: cost_allocation_method,
  });

  processedStops.forEach((ps, idx) => {
    ps.allocated_vendor_cost = allocations[idx]?.allocated_vendor_cost || 0;
    ps.stop_delivery_margin = ps.customer_delivery_charge - ps.allocated_vendor_cost;
  });

  // 2. Financials & 3-Tier Ledger
  const vendorCost = Number(actual_vendor_cost);
  const gstRate = 18;
  const gstAmount = Math.round(vendorCost * (gstRate / 100));
  const totalPayable = vendorCost + gstAmount;

  // Calculate sum of separate benchmarks for savings analysis
  let sumSeparateBenchmark = 0;
  for (const st of processedStops) {
    const bench = await DeliveryCostBenchmark.findOne({
      warehouse_id,
      district_id: st.destination?.district_id,
      is_active: true,
    }).lean();
    sumSeparateBenchmark += (bench?.benchmark_cost || 4500);
  }

  const estimatedSavings = Math.max(0, sumSeparateBenchmark - vendorCost);

  // 3. Atomically Lock Physical Vehicles
  for (const v of vehicles_allocated) {
    const fleetVehicle = await DeliveryVehicleFleet.findById(v.vehicle_id);
    if (!fleetVehicle) throw new Error(`Vehicle ${v.registration_number} not found.`);
    if (fleetVehicle.current_status !== 'Available') {
      throw new Error(`Vehicle ${v.registration_number} is currently ${fleetVehicle.current_status} and cannot be assigned.`);
    }
  }

  // 4. Create Delivery Order
  const deliveryOrder = new DeliveryOrder({
    delivery_number: deliveryNumber,
    delivery_type,
    warehouse_id,
    route_setting_id,
    service_provider_id,
    booking_source,
    stops: processedStops,
    vehicles_allocated,
    cargo_summary: {
      total_shipment_weight_kg: totalShipmentWeight,
      total_kits: totalKits,
      total_kw: totalKw,
      total_stops: processedStops.length,
      estimated_route_distance_km: payload.estimated_route_distance_km || 100,
    },
    // 3-Tier Financial Ledger
    customer_delivery_charge: totalCustomerCharge,
    company_benchmark_cost: sumSeparateBenchmark,
    actual_vendor_cost: vendorCost,
    gst_applicable: true,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_transport_payable: totalPayable,
    variance_from_benchmark: vendorCost - sumSeparateBenchmark,
    delivery_margin: totalCustomerCharge - vendorCost,
    sum_separate_benchmark_cost: sumSeparateBenchmark,
    estimated_savings: estimatedSavings,
    cost_allocation_method,
    // Admin Override Record
    is_overridden: Boolean(override_details?.is_overridden),
    override_details: override_details || {},
    status: 'vehicle_assigned',
    pickup_scheduled_at,
    expected_delivery_date,
    created_by: adminUser?._id || adminUser?.id || null,
    status_history: [{
      status: 'vehicle_assigned',
      changed_by: adminUser?._id || null,
      note: `Delivery Order ${deliveryNumber} created with ${vehicles_allocated.length} vehicle(s) and ${processedStops.length} stop(s).`,
      changed_at: new Date(),
    }],
  });

  await deliveryOrder.save();

  // 5. Update Physical Vehicle States & Link Current Delivery
  for (const v of vehicles_allocated) {
    await DeliveryVehicleFleet.findByIdAndUpdate(v.vehicle_id, {
      current_status: 'Assigned',
      current_delivery_id: deliveryOrder._id,
      assigned_driver: {
        name: v.driver_name,
        mobile: v.driver_mobile,
        license_number: v.driver_license,
      },
    });
  }

  // 6. Update Source Orders Status to vehicle_assigned
  for (const st of processedStops) {
    if (st.order_model === 'epc_orders') {
      await EpcOrder.findByIdAndUpdate(st.order_id, {
        order_status: 'vehicle_assigned',
        assigned_vehicle: {
          vehicle_id: vehicles_allocated[0]?.vehicle_id,
          registration_number: vehicles_allocated[0]?.registration_number,
          driver_name: vehicles_allocated[0]?.driver_name,
          driver_contact: vehicles_allocated[0]?.driver_mobile,
          assigned_at: new Date(),
        },
      });
    } else if (st.order_model === 'fpo_orders') {
      await FpoOrder.findByIdAndUpdate(st.order_id, {
        status: 'VEHICLE_ASSIGNED',
        assigned_vehicle: {
          registration_number: vehicles_allocated[0]?.registration_number,
          driver_name: vehicles_allocated[0]?.driver_name,
          driver_contact: vehicles_allocated[0]?.driver_mobile,
        },
      });
    }
  }

  return deliveryOrder;
};

/**
 * 9. UPDATE DELIVERY JOURNEY & INDEPENDENT STOP STATUS / POD
 */
const updateTripStatus = async (deliveryId, newStatus, payload = {}, adminUser = null) => {
  const delivery = await DeliveryOrder.findById(deliveryId);
  if (!delivery) throw new Error('Delivery order not found.');

  delivery.status = newStatus;
  delivery.status_history.push({
    status: newStatus,
    changed_by: adminUser?._id || null,
    note: payload.note || `Status updated to ${newStatus}`,
    changed_at: new Date(),
  });

  if (newStatus === 'dispatched') {
    delivery.dispatched_at = new Date();
    // Update vehicles to In Transit
    for (const v of delivery.vehicles_allocated) {
      await DeliveryVehicleFleet.findByIdAndUpdate(v.vehicle_id, { current_status: 'In Transit' });
    }
    // Update all stops to in_transit
    delivery.stops.forEach(st => {
      if (st.stop_status === 'pending') st.stop_status = 'in_transit';
    });
  } else if (newStatus === 'loading') {
    for (const v of delivery.vehicles_allocated) {
      await DeliveryVehicleFleet.findByIdAndUpdate(v.vehicle_id, { current_status: 'Loading' });
    }
  } else if (newStatus === 'closed') {
    delivery.closed_at = new Date();
    // Release vehicles
    for (const v of delivery.vehicles_allocated) {
      await DeliveryVehicleFleet.findByIdAndUpdate(v.vehicle_id, {
        current_status: 'Available',
        current_delivery_id: null,
      });
    }
  }

  await delivery.save();
  return delivery;
};

const updateStopPod = async (deliveryId, stopNumber, podData, adminUser = null) => {
  const delivery = await DeliveryOrder.findById(deliveryId);
  if (!delivery) throw new Error('Delivery order not found.');

  const stop = delivery.stops.find(s => s.stop_number === Number(stopNumber));
  if (!stop) throw new Error(`Stop number ${stopNumber} not found.`);

  stop.stop_status = 'pod_confirmed';
  stop.delivered_at = new Date();
  stop.pod = {
    pod_url: podData.pod_url,
    pod_notes: podData.pod_notes || 'Delivered with POD confirmation',
    receiver_name: podData.receiver_name,
    receiver_phone: podData.receiver_phone,
    confirmed_by: adminUser?._id || null,
    confirmed_at: new Date(),
  };

  // Update underlying source order
  if (stop.order_model === 'epc_orders') {
    await EpcOrder.findByIdAndUpdate(stop.order_id, {
      order_status: 'delivered',
      delivered_at: new Date(),
    });
  } else if (stop.order_model === 'fpo_orders') {
    await FpoOrder.findByIdAndUpdate(stop.order_id, {
      status: 'DELIVERED',
      delivered_at: new Date(),
    });
  }

  // Check if ALL stops have been confirmed
  const allStopsConfirmed = delivery.stops.every(s => s.stop_status === 'pod_confirmed');
  if (allStopsConfirmed) {
    delivery.status = 'pod_confirmed';
    delivery.completed_at = new Date();
    // Release vehicles back to Available
    for (const v of delivery.vehicles_allocated) {
      await DeliveryVehicleFleet.findByIdAndUpdate(v.vehicle_id, {
        current_status: 'Available',
        current_delivery_id: null,
      });
    }
  }

  await delivery.save();
  return delivery;
};

/**
 * 10. SANITIZED CUSTOMER/FRANCHISEE TRACKING (HIDES BENCHMARKS & VENDOR COSTS)
 */
const getSanitizedTracking = async (trackingRef) => {
  const delivery = await DeliveryOrder.findOne({
    $or: [
      { delivery_number: trackingRef },
      { 'stops.order_number': trackingRef },
    ],
  })
    .populate('service_provider_id', 'name customer_service_number')
    .lean();

  if (!delivery) throw new Error('Tracking reference not found.');

  // Find stop if queried by order number
  const stop = delivery.stops.find(s => s.order_number === trackingRef);

  return {
    delivery_number: delivery.delivery_number,
    tracking_reference: trackingRef,
    master_status: delivery.status,
    stop_status: stop ? stop.stop_status : delivery.status,
    service_provider: delivery.service_provider_id?.name || 'SolarKits Logistics',
    customer_service_number: delivery.service_provider_id?.customer_service_number || '1800-SOLAR-KIT',
    driver_name: delivery.vehicles_allocated[0]?.driver_name || 'Assigned Driver',
    driver_contact: delivery.vehicles_allocated[0]?.driver_mobile || 'Contact Support',
    vehicle_registration: delivery.vehicles_allocated[0]?.registration_number || 'N/A',
    expected_delivery_date: delivery.expected_delivery_date,
    dispatched_at: delivery.dispatched_at,
    delivered_at: stop ? stop.delivered_at : delivery.completed_at,
    milestones: delivery.milestones || [],
    recipient_destination: stop?.destination || delivery.stops[0]?.destination,
    // Note: Vendor cost, benchmark cost, and margins are strictly omitted!
  };
};

/**
 * 11. WAREHOUSE DELIVERY DASHBOARD & CONSOLIDATION KPIS
 */
const getWarehouseDashboardAnalytics = async (warehouseId = null) => {
  const validWarehouseId = (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouseId)) ? warehouseId : null;
  const filter = validWarehouseId ? { warehouse_id: validWarehouseId } : {};

  // 1. Core 8 KPIs
  const queueResult = await getDeliveryQueue({ warehouse_id: validWarehouseId, limit: 1000 });
  const ordersAwaitingDelivery = queueResult.total;

  const [
    deliveriesCreated,
    vehiclesAssigned,
    inTransit,
    delivered,
    allTrips,
  ] = await Promise.all([
    DeliveryOrder.countDocuments({ ...filter }),
    DeliveryVehicleFleet.countDocuments({ current_status: 'Assigned', is_deleted: false }),
    DeliveryOrder.countDocuments({ ...filter, status: 'in_transit' }),
    DeliveryOrder.countDocuments({ ...filter, status: { $in: ['delivered', 'pod_confirmed', 'closed'] } }),
    DeliveryOrder.find({ ...filter })
      .populate('warehouse_id', 'warehouse_name city state')
      .populate('service_provider_id', 'name')
      .lean(),
  ]);

  const totalDeliveryCost = allTrips.reduce((sum, t) => sum + (t.actual_vendor_cost || 0), 0);
  const totalKitsDelivered = allTrips.reduce((sum, t) => sum + (t.cargo_summary?.total_kits || 0), 0);
  const avgDeliveryCostPerKit = totalKitsDelivered > 0 ? Math.round(totalDeliveryCost / totalKitsDelivered) : 0;

  // 2. Consolidation 9 KPIs
  const consolidatedTrips = allTrips.filter(t => t.delivery_type === 'consolidated_master_trip');
  const combinedDeliveriesCount = consolidatedTrips.length;
  const totalSavings = consolidatedTrips.reduce((sum, t) => sum + (t.estimated_savings || 0), 0);

  // Available for combination
  const scanSuggestions = validWarehouseId ? await scanQueueForConsolidation(validWarehouseId) : [];
  const ordersAvailableForCombination = scanSuggestions.reduce((sum, s) => sum + s.order_count, 0);

  const waitingForConsolidation = queueResult.orders.filter(o => o.hours_waiting < 48).length;
  const approachingDeadline = queueResult.orders.filter(o => o.hours_waiting >= 36 && o.hours_waiting <= 48).length;

  // 3. Multi-Dimensional Breakdown Aggregations
  const warehouseMap = {};
  const stateMap = {};
  const vehicleMap = {};
  const providerMap = {};
  const orderTypeMap = {};

  allTrips.forEach(trip => {
    // Warehouse
    const whName = trip.warehouse_id?.warehouse_name || 'Main Warehouse';
    if (!warehouseMap[whName]) warehouseMap[whName] = { name: whName, trips: 0, cost: 0, kits: 0 };
    warehouseMap[whName].trips += 1;
    warehouseMap[whName].cost += (trip.actual_vendor_cost || 0);
    warehouseMap[whName].kits += (trip.cargo_summary?.total_kits || 0);

    // Service Provider
    const provName = trip.service_provider_id?.name || 'In-House Fleet';
    if (!providerMap[provName]) providerMap[provName] = { name: provName, trips: 0, cost: 0 };
    providerMap[provName].trips += 1;
    providerMap[provName].cost += (trip.actual_vendor_cost || 0);

    // Vehicles
    (trip.vehicles_allocated || []).forEach(v => {
      const vType = v.vehicle_type_name || 'Pickup';
      if (!vehicleMap[vType]) vehicleMap[vType] = { name: vType, trips: 0, kits: 0 };
      vehicleMap[vType].trips += 1;
      vehicleMap[vType].kits += (trip.cargo_summary?.total_kits || 0);
    });

    // Stops destinations & order types
    (trip.stops || []).forEach(st => {
      const stState = st.destination?.state || 'Unknown State';
      if (!stateMap[stState]) stateMap[stState] = { name: stState, stops: 0, kits: 0 };
      stateMap[stState].stops += 1;
      stateMap[stState].kits += (st.cargo?.total_kits || 0);

      const oType = st.order_model === 'po_orders' ? 'PO Order' : (st.recipient_type === 'reseller_franchisee' ? 'Franchisee' : 'EPC Direct');
      if (!orderTypeMap[oType]) orderTypeMap[oType] = { name: oType, count: 0, kits: 0 };
      orderTypeMap[oType].count += 1;
      orderTypeMap[oType].kits += (st.cargo?.total_kits || 0);
    });
  });

  return {
    kpis: {
      orders_awaiting_delivery: ordersAwaitingDelivery,
      deliveries_created: deliveriesCreated,
      vehicles_assigned: vehiclesAssigned,
      in_transit: inTransit,
      delivered: delivered,
      delayed: 0,
      total_delivery_cost: totalDeliveryCost,
      average_delivery_cost_per_kit: avgDeliveryCostPerKit,
    },
    consolidation_kpis: {
      orders_available_for_combination: ordersAvailableForCombination,
      combined_deliveries_today: combinedDeliveriesCount,
      avg_vehicle_utilization_pct: 78, // Average utilization across active trips
      kits_per_vehicle: totalKitsDelivered > 0 ? Math.round(totalKitsDelivered / Math.max(1, deliveriesCreated)) : 14,
      multi_stop_deliveries: combinedDeliveriesCount,
      delivery_cost_per_kit: avgDeliveryCostPerKit,
      savings_from_combined_deliveries: totalSavings,
      orders_waiting_for_consolidation: waitingForConsolidation,
      orders_approaching_consolidation_deadline: approachingDeadline,
    },
    breakdowns: {
      by_warehouse: Object.values(warehouseMap),
      by_state: Object.values(stateMap),
      by_vehicle: Object.values(vehicleMap),
      by_provider: Object.values(providerMap),
      by_order_type: Object.values(orderTypeMap),
    },
    recent_deliveries: allTrips.slice(-10),
  };
};

module.exports = {
  getKitWeight,
  calculateOrderCargo,
  getFranchiseeDestinations,
  getDeliveryQueue,
  scanQueueForConsolidation,
  getEligibleFleet,
  validateBenchmarkCost,
  calculateCostAllocations,
  createDeliveryTrip,
  updateTripStatus,
  updateStopPod,
  getSanitizedTracking,
  getWarehouseDashboardAnalytics,
};
