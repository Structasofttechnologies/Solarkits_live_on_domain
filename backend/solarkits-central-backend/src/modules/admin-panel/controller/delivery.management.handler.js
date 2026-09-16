const {
  DeliveryVehicleMaster,
  DeliveryServiceProvider,
  DeliveryVehicleFleet,
  ComboKitWeightMaster,
  DeliveryCostBenchmark,
  KitDeliveryCostRule,
  DeliveryRouteSetting,
  DeliveryOrder,
  WarehouseComboKit,
  EpcOrder,
  FpoOrder,
} = require('../models/india_solarshop_db');
const { CompanyWarehouse } = require('../models/company_warehouse_db');
const deliveryService = require('../services/delivery.management.service');

// ─── 1. VEHICLE MASTER CRUD ───────────────────────────────────────────────────
exports.get_vehicle_masters = async (req, res) => {
  try {
    const list = await DeliveryVehicleMaster.find({ deleted_at: null }).sort({ created_at: -1 });
    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_vehicle_masters error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_vehicle_master = async (req, res) => {
  try {
    const { name, brand_make, model, length_ft, width_ft, height_ft, max_load_kg, max_delivery_distance_km } = req.body;
    if (!name || !brand_make || !model || !length_ft || !width_ft || !height_ft || !max_load_kg || !max_delivery_distance_km) {
      return res.status(400).json({ status: 'error', message: 'All vehicle master fields are required.' });
    }

    const count = await DeliveryVehicleMaster.countDocuments();
    const vehicle_code = `VEH-${String(count + 1).padStart(3, '0')}`;

    const newMaster = new DeliveryVehicleMaster({
      vehicle_code,
      name: name.trim(),
      brand_make: brand_make.trim(),
      model: model.trim(),
      length_ft: Number(length_ft),
      width_ft: Number(width_ft),
      height_ft: Number(height_ft),
      max_load_kg: Number(max_load_kg),
      max_delivery_distance_km: Number(max_delivery_distance_km),
      status: req.body.status || 'Active',
      created_by: req.user?._id || null,
    });

    await newMaster.save();
    return res.status(201).json({ status: 'success', data: newMaster, message: 'Vehicle Master created successfully.' });
  } catch (err) {
    console.error('create_vehicle_master error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_vehicle_master = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DeliveryVehicleMaster.findByIdAndUpdate(id, { ...req.body, updated_by: req.user?._id }, { new: true });
    if (!updated) return res.status(404).json({ status: 'error', message: 'Vehicle Master not found.' });
    return res.status(200).json({ status: 'success', data: updated, message: 'Vehicle Master updated successfully.' });
  } catch (err) {
    console.error('update_vehicle_master error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.delete_vehicle_master = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryVehicleMaster.findByIdAndUpdate(id, { deleted_at: new Date(), is_active: false });
    return res.status(200).json({ status: 'success', message: 'Vehicle Master deleted successfully.' });
  } catch (err) {
    console.error('delete_vehicle_master error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 2. SERVICE PROVIDER CRUD ─────────────────────────────────────────────────
exports.get_service_providers = async (req, res) => {
  try {
    const list = await DeliveryServiceProvider.find({ deleted_at: null }).sort({ created_at: -1 });
    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_service_providers error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_service_provider = async (req, res) => {
  try {
    const { name, owner_name, mobile_number } = req.body;
    if (!name || !owner_name || !mobile_number) {
      return res.status(400).json({ status: 'error', message: 'Name, Owner Contact, and Mobile Number are required.' });
    }

    const count = await DeliveryServiceProvider.countDocuments();
    const provider_code = `TSP-${String(count + 1).padStart(3, '0')}`;

    const newProvider = new DeliveryServiceProvider({
      provider_code,
      ...req.body,
      created_by: req.user?._id || null,
    });

    await newProvider.save();
    return res.status(201).json({ status: 'success', data: newProvider, message: 'Service Provider onboarded successfully.' });
  } catch (err) {
    console.error('create_service_provider error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_service_provider = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DeliveryServiceProvider.findByIdAndUpdate(id, { ...req.body, updated_by: req.user?._id }, { new: true });
    if (!updated) return res.status(404).json({ status: 'error', message: 'Service Provider not found.' });
    return res.status(200).json({ status: 'success', data: updated, message: 'Service Provider updated successfully.' });
  } catch (err) {
    console.error('update_service_provider error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.delete_service_provider = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryServiceProvider.findByIdAndUpdate(id, { deleted_at: new Date(), status: 'Inactive' });
    return res.status(200).json({ status: 'success', message: 'Service Provider deactivated.' });
  } catch (err) {
    console.error('delete_service_provider error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 3. PHYSICAL VEHICLE FLEET CRUD ───────────────────────────────────────────
exports.get_fleet_vehicles = async (req, res) => {
  try {
    const { provider_id, status } = req.query;
    const query = { is_deleted: false };
    if (provider_id) query.service_provider_id = provider_id;
    if (status) query.current_status = status;

    const list = await DeliveryVehicleFleet.find(query)
      .populate('service_provider_id', 'name owner_name mobile_number customer_service_number')
      .populate('vehicle_master_id', 'name brand_make model max_load_kg max_delivery_distance_km length_ft width_ft height_ft')
      .sort({ created_at: -1 });

    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_fleet_vehicles error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_fleet_vehicle = async (req, res) => {
  try {
    const { service_provider_id, vehicle_master_id, registration_number, load_capacity_kg } = req.body;
    if (!service_provider_id || !vehicle_master_id || !registration_number || !load_capacity_kg) {
      return res.status(400).json({ status: 'error', message: 'Provider, Vehicle Master, Registration #, and Capacity are required.' });
    }

    const regUpper = registration_number.trim().toUpperCase();
    const existing = await DeliveryVehicleFleet.findOne({ registration_number: regUpper, is_deleted: false });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Vehicle ${regUpper} already registered.` });
    }

    const newVehicle = new DeliveryVehicleFleet({
      ...req.body,
      registration_number: regUpper,
      load_capacity_kg: Number(load_capacity_kg),
      current_status: req.body.current_status || 'Available',
    });

    await newVehicle.save();
    return res.status(201).json({ status: 'success', data: newVehicle, message: 'Physical vehicle registered successfully.' });
  } catch (err) {
    console.error('create_fleet_vehicle error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_fleet_vehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DeliveryVehicleFleet.findByIdAndUpdate(id, req.body, { new: true })
      .populate('service_provider_id', 'name')
      .populate('vehicle_master_id', 'name');

    if (!updated) return res.status(404).json({ status: 'error', message: 'Vehicle not found.' });
    return res.status(200).json({ status: 'success', data: updated, message: 'Vehicle updated successfully.' });
  } catch (err) {
    console.error('update_fleet_vehicle error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 4. COMBOKIT WEIGHT MASTER CRUD & CAPACITY CHART ──────────────────────────
exports.get_combokit_weights = async (req, res) => {
  try {
    const weights = await ComboKitWeightMaster.find({ deleted_at: null })
      .populate({
        path: 'kit_id',
        match: { deleted_at: null },
        select: 'name capacity base_price_cached is_active deleted_at'
      })
      .sort({ created_at: -1 });

    // Filter to only include weights whose corresponding kit is still active (not soft-deleted)
    const activeWeights = weights.filter(w => w.kit_id);

    // Also get active kits that don't have weight records yet
    const existingKitIds = activeWeights.map(w => w.kit_id?._id?.toString() || w.kit_id?.toString()).filter(Boolean);
    const unconfiguredKits = await WarehouseComboKit.find({
      _id: { $nin: existingKitIds },
      is_active: true,
      deleted_at: null,
    }).select('name capacity base_price_cached kit_image').lean();

    return res.status(200).json({
      status: 'success',
      data: activeWeights,
      unconfigured_kits: unconfiguredKits,
    });
  } catch (err) {
    console.error('get_combokit_weights error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.upsert_combokit_weight = async (req, res) => {
  try {
    const { kit_id, solar_modules_weight_kg, inverter_weight_kg, boskit_weight_kg, structure_material_weight_kg, packaging_weight_kg, notes } = req.body;
    if (!kit_id) return res.status(400).json({ status: 'error', message: 'ComboKit ID is required.' });

    const totalWeight = Number(solar_modules_weight_kg || 0) +
      Number(inverter_weight_kg || 0) +
      Number(boskit_weight_kg || 0) +
      Number(structure_material_weight_kg || 0) +
      Number(packaging_weight_kg || 0);

    const kit = await WarehouseComboKit.findById(kit_id).lean();

    const record = await ComboKitWeightMaster.findOneAndUpdate(
      { kit_id },
      {
        kit_id,
        kit_name: kit ? kit.name : 'Solar Kit',
        capacity_kw: kit ? kit.capacity : 1,
        solar_modules_weight_kg: Number(solar_modules_weight_kg || 0),
        inverter_weight_kg: Number(inverter_weight_kg || 0),
        boskit_weight_kg: Number(boskit_weight_kg || 0),
        structure_material_weight_kg: Number(structure_material_weight_kg || 0),
        packaging_weight_kg: Number(packaging_weight_kg || 0),
        total_kit_weight_kg: totalWeight,
        notes: notes || null,
        updated_by: req.user?._id || null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ status: 'success', data: record, message: 'Kit weight master saved successfully.' });
  } catch (err) {
    console.error('upsert_combokit_weight error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.get_vehicle_capacity_chart = async (req, res) => {
  try {
    const [vehicles, weights] = await Promise.all([
      DeliveryVehicleMaster.find({ is_active: true, deleted_at: null }).lean(),
      ComboKitWeightMaster.find({ deleted_at: null })
        .populate({
          path: 'kit_id',
          match: { deleted_at: null },
          select: 'name capacity deleted_at'
        })
        .lean(),
    ]);

    // Only include kits that are actively configured in the registry
    const activeWeights = weights.filter(w => w.kit_id);

    const chart = vehicles.map(v => {
      const kitCapacities = activeWeights.map(w => {
        const weight = w.total_kit_weight_kg || 100;
        const maxKits = Math.floor(v.max_load_kg / weight);
        return {
          kit_id: w.kit_id?._id || w.kit_id,
          kit_name: w.kit_name,
          capacity_kw: w.capacity_kw,
          unit_weight_kg: weight,
          max_kits_allowed: maxKits,
        };
      });

      return {
        vehicle_master_id: v._id,
        vehicle_name: v.name,
        brand_make: v.brand_make,
        model: v.model,
        max_load_kg: v.max_load_kg,
        kit_capacities: kitCapacities,
      };
    });

    return res.status(200).json({ status: 'success', data: chart });
  } catch (err) {
    console.error('get_vehicle_capacity_chart error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 5. DELIVERY COST BENCHMARK CRUD ──────────────────────────────────────────
exports.get_benchmarks = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const cleanWarehouseId = (warehouse_id && warehouse_id !== 'null' && warehouse_id !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouse_id)) ? warehouse_id : null;
    const query = { deleted_at: null };
    if (cleanWarehouseId) query.warehouse_id = cleanWarehouseId;

    const list = await DeliveryCostBenchmark.find(query)
      .populate('warehouse_id', 'warehouse_code address')
      .populate('vehicle_master_id', 'name brand_make max_load_kg')
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .sort({ created_at: -1 });

    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_benchmarks error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_benchmark = async (req, res) => {
  try {
    const { warehouse_id, vehicle_master_id, state_id, district_id, benchmark_cost } = req.body;
    if (!warehouse_id || !vehicle_master_id || !state_id || !district_id || benchmark_cost === undefined) {
      return res.status(400).json({ status: 'error', message: 'Warehouse, Vehicle, State, District, and Benchmark Cost are required.' });
    }

    const record = await DeliveryCostBenchmark.findOneAndUpdate(
      { warehouse_id, vehicle_master_id, district_id },
      { ...req.body, updated_by: req.user?._id },
      { upsert: true, new: true }
    );

    return res.status(201).json({ status: 'success', data: record, message: 'Benchmark cost configured successfully.' });
  } catch (err) {
    console.error('create_benchmark error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.delete_benchmark = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryCostBenchmark.findByIdAndUpdate(id, { deleted_at: new Date(), is_active: false });
    return res.status(200).json({ status: 'success', message: 'Benchmark cost deleted.' });
  } catch (err) {
    console.error('delete_benchmark error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 6. KIT-WISE DELIVERY COST RULES CRUD ─────────────────────────────────────
exports.get_kit_rules = async (req, res) => {
  try {
    const list = await KitDeliveryCostRule.find({ deleted_at: null })
      .populate('kit_id', 'name capacity')
      .populate('vehicle_master_id', 'name max_load_kg')
      .sort({ created_at: -1 });

    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_kit_rules error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_kit_rule = async (req, res) => {
  try {
    const { kit_id, order_type, number_of_kits, vehicle_master_id, total_delivery_cost, per_kit_delivery_cost } = req.body;
    if (!kit_id || !order_type || !number_of_kits || !vehicle_master_id || total_delivery_cost === undefined || per_kit_delivery_cost === undefined) {
      return res.status(400).json({ status: 'error', message: 'Kit, Order Type, Qty, Vehicle, Total Delivery Cost, and Per-Kit Cost are required.' });
    }

    const newRule = new KitDeliveryCostRule({
      ...req.body,
      created_by: req.user?._id || null,
    });

    await newRule.save();
    return res.status(201).json({ status: 'success', data: newRule, message: 'Kit Delivery Rule created successfully.' });
  } catch (err) {
    console.error('create_kit_rule error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.delete_kit_rule = async (req, res) => {
  try {
    const { id } = req.params;
    await KitDeliveryCostRule.findByIdAndUpdate(id, { deleted_at: new Date(), is_active: false });
    return res.status(200).json({ status: 'success', message: 'Kit Delivery Rule deleted.' });
  } catch (err) {
    console.error('delete_kit_rule error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 7. DELIVERY ROUTE & CONSOLIDATION SETTINGS CRUD ─────────────────────────
exports.get_routes = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const cleanWarehouseId = (warehouse_id && warehouse_id !== 'null' && warehouse_id !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouse_id)) ? warehouse_id : null;
    const query = { deleted_at: null };
    if (cleanWarehouseId) query.origin_warehouse_id = cleanWarehouseId;

    const routes = await DeliveryRouteSetting.find(query)
      .populate('origin_warehouse_id', 'warehouse_code address')
      .populate('state_id', 'name')
      .populate('primary_district_id', 'name')
      .populate('nearby_district_ids', 'name')
      .sort({ created_at: -1 });

    return res.status(200).json({ status: 'success', data: routes });
  } catch (err) {
    console.error('get_routes error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.create_route = async (req, res) => {
  try {
    const { route_name, origin_warehouse_id, state_id, primary_district_id, max_route_distance_km } = req.body;
    if (!route_name || !origin_warehouse_id || !state_id || !primary_district_id || !max_route_distance_km) {
      return res.status(400).json({ status: 'error', message: 'Route Name, Warehouse, State, Primary District, and Max Distance are required.' });
    }

    const newRoute = new DeliveryRouteSetting({
      ...req.body,
      created_by: req.user?._id || null,
    });

    await newRoute.save();
    return res.status(201).json({ status: 'success', data: newRoute, message: 'Delivery Route configured successfully.' });
  } catch (err) {
    console.error('create_route error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_route = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DeliveryRouteSetting.findByIdAndUpdate(id, { ...req.body, updated_by: req.user?._id }, { new: true });
    if (!updated) return res.status(404).json({ status: 'error', message: 'Route not found.' });
    return res.status(200).json({ status: 'success', data: updated, message: 'Delivery Route updated successfully.' });
  } catch (err) {
    console.error('update_route error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.delete_route = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryRouteSetting.findByIdAndUpdate(id, { deleted_at: new Date(), is_active: false });
    return res.status(200).json({ status: 'success', message: 'Delivery Route deleted.' });
  } catch (err) {
    console.error('delete_route error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 8. QUEUE & CONSOLIDATION SUGGESTIONS ─────────────────────────────────────
exports.get_delivery_queue = async (req, res) => {
  try {
    const { warehouse_id, page = 1, limit = 50, priority_only = false } = req.query;
    const cleanWarehouseId = (warehouse_id && warehouse_id !== 'null' && warehouse_id !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouse_id)) ? warehouse_id : null;

    const result = await deliveryService.getDeliveryQueue({
      warehouse_id: cleanWarehouseId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      priority_only: priority_only === 'true',
    });

    // Also scan for suggestions if warehouse provided
    let consolidationSuggestions = [];
    if (cleanWarehouseId) {
      consolidationSuggestions = await deliveryService.scanQueueForConsolidation(cleanWarehouseId);
    }

    return res.status(200).json({
      status: 'success',
      data: result.orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      consolidation_suggestions: consolidationSuggestions,
    });
  } catch (err) {
    console.error('get_delivery_queue error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_order_priority = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { is_priority, priority_reason, order_model = 'epc_orders' } = req.body;

    if (is_priority && !priority_reason) {
      return res.status(400).json({ status: 'error', message: 'An audit reason is required when changing priority.' });
    }

    if (order_model === 'epc_orders') {
      await EpcOrder.findByIdAndUpdate(orderId, {
        is_priority: Boolean(is_priority),
        priority_reason: priority_reason || null,
        priority_updated_by: req.user?._id,
        priority_updated_at: new Date(),
      });
    } else {
      await FpoOrder.findByIdAndUpdate(orderId, {
        is_priority: Boolean(is_priority),
        priority_reason: priority_reason || null,
      });
    }

    return res.status(200).json({ status: 'success', message: 'Order priority updated successfully.' });
  } catch (err) {
    console.error('update_order_priority error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 9. ELIGIBLE FLEET & BENCHMARK VALIDATION ────────────────────────────────
exports.get_eligible_fleet = async (req, res) => {
  try {
    const { warehouse_id, destination_district_id, total_weight_kg, route_distance_km } = req.query;
    if (!destination_district_id || !total_weight_kg) {
      return res.status(400).json({ status: 'error', message: 'District ID and Total Weight are required.' });
    }

    const result = await deliveryService.getEligibleFleet({
      warehouse_id,
      destination_district_id,
      total_weight_kg: Number(total_weight_kg),
      route_distance_km: Number(route_distance_km || 100),
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('get_eligible_fleet error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.validate_benchmark = async (req, res) => {
  try {
    const { warehouse_id, vehicle_master_id, district_id, proposed_cost } = req.body;
    const result = await deliveryService.validateBenchmarkCost({
      warehouse_id,
      vehicle_master_id,
      district_id,
      proposed_cost,
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('validate_benchmark error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.get_franchisee_destinations = async (req, res) => {
  try {
    const { district_id } = req.query;
    const list = await deliveryService.getFranchiseeDestinations(district_id);
    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_franchisee_destinations error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 10. CREATE DELIVERY ORDER / MASTER TRIP ──────────────────────────────────
exports.create_delivery_order = async (req, res) => {
  try {
    const result = await deliveryService.createDeliveryTrip(req.body, req.user);
    return res.status(201).json({
      status: 'success',
      data: result,
      message: `Delivery Trip ${result.delivery_number} created successfully.`,
    });
  } catch (err) {
    console.error('create_delivery_order error:', err);
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

// ─── 11. TRACKING & POD MANAGEMENT ───────────────────────────────────────────
exports.get_tracking_list = async (req, res) => {
  try {
    const { status, vehicle_reg, state_id, district_id, warehouse_id, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (warehouse_id) query.warehouse_id = warehouse_id;
    if (vehicle_reg) query['vehicles_allocated.registration_number'] = vehicle_reg.trim().toUpperCase();
    if (district_id) query['stops.destination.district_id'] = district_id;
    if (search) {
      query.$or = [
        { delivery_number: { $regex: search, $options: 'i' } },
        { 'stops.order_number': { $regex: search, $options: 'i' } },
      ];
    }

    const list = await DeliveryOrder.find(query)
      .populate('warehouse_id', 'warehouse_code address')
      .populate('service_provider_id', 'name mobile_number customer_service_number')
      .populate('stops.destination.state_id', 'name')
      .populate('stops.destination.district_id', 'name')
      .sort({ created_at: -1 });

    return res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    console.error('get_tracking_list error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.get_trip_details = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await DeliveryOrder.findById(id)
      .populate('warehouse_id', 'warehouse_code address lat lng')
      .populate('service_provider_id', 'name owner_name mobile_number customer_service_number gst_number')
      .populate('vehicles_allocated.vehicle_master_id', 'name brand_make max_load_kg')
      .populate('stops.destination.state_id', 'name')
      .populate('stops.destination.district_id', 'name');

    if (!delivery) return res.status(404).json({ status: 'error', message: 'Delivery Trip not found.' });
    return res.status(200).json({ status: 'success', data: delivery });
  } catch (err) {
    console.error('get_trip_details error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.update_trip_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const updated = await deliveryService.updateTripStatus(id, status, { note }, req.user);
    return res.status(200).json({ status: 'success', data: updated, message: `Trip updated to ${status}` });
  } catch (err) {
    console.error('update_trip_status error:', err);
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.confirm_stop_pod = async (req, res) => {
  try {
    const { id, stopNumber } = req.params;
    const { pod_url, pod_notes, receiver_name, receiver_phone } = req.body;

    if (!pod_url) {
      return res.status(400).json({ status: 'error', message: 'Proof of Delivery (POD) document/image is required.' });
    }

    const updated = await deliveryService.updateStopPod(id, stopNumber, {
      pod_url,
      pod_notes,
      receiver_name,
      receiver_phone,
    }, req.user);

    return res.status(200).json({
      status: 'success',
      data: updated,
      message: `Stop ${stopNumber} POD confirmed and marked delivered.`,
    });
  } catch (err) {
    console.error('confirm_stop_pod error:', err);
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

// ─── 12. SANITIZED PUBLIC/CUSTOMER TRACKING ───────────────────────────────────
exports.get_public_tracking = async (req, res) => {
  try {
    const { trackingRef } = req.params;
    const sanitized = await deliveryService.getSanitizedTracking(trackingRef);
    return res.status(200).json({ status: 'success', data: sanitized });
  } catch (err) {
    console.error('get_public_tracking error:', err);
    return res.status(404).json({ status: 'error', message: err.message });
  }
};

// ─── 13. DASHBOARD & KPIS ─────────────────────────────────────────────────────
exports.get_dashboard_analytics = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const cleanWarehouseId = (warehouse_id && warehouse_id !== 'null' && warehouse_id !== 'undefined' && mongoose.Types.ObjectId.isValid(warehouse_id)) ? warehouse_id : null;
    const result = await deliveryService.getWarehouseDashboardAnalytics(cleanWarehouseId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('get_dashboard_analytics error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── 14. COMPANY WAREHOUSES LIST FOR DELIVERY MODULE ──────────────────────────
exports.get_warehouses_list = async (req, res) => {
  try {
    const list = await CompanyWarehouse.find({ deleted_at: null })
      .populate('level_1', 'name')
      .populate('level_2', 'name')
      .select('_id warehouse_code address pincode level_1 level_2 warehouse_type')
      .lean();

    const formatted = list.map((w) => ({
      _id: w._id,
      id: w._id,
      warehouse_name: w.warehouse_code,
      name: w.warehouse_code,
      address: w.address,
      pincode: w.pincode,
      state: w.level_1?.name || '',
      district: w.level_2?.name || '',
      city: w.level_2?.name || '',
    }));

    return res.status(200).json({ status: 'success', data: formatted });
  } catch (err) {
    console.error('get_warehouses_list error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
