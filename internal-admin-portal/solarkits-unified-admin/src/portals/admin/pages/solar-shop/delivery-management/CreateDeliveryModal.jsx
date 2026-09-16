import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../features/alert.slice';
import { FaTruck, FaMapMarkerAlt, FaBoxes, FaExclamationTriangle, FaCheckCircle, FaUser, FaPhone, FaShieldAlt } from 'react-icons/fa';
import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import CustomInput from '../../../components/CustomInput';
import Loader from '../../../components/Loader';
import { deliveryApi } from '../../../api/deliveryApi';

export default function CreateDeliveryModal({
  isOpen,
  onClose,
  orders = [], // 1 order for single, 2+ for combined
  onSuccess,
}) {
  const dispatch = useDispatch();
  const isCombined = orders.length > 1;

  // Step 1: Fleet & Destination matching
  const [loading, setLoading] = useState(false);
  const [fleetList, setFleetList] = useState([]);
  const [splitRecommendation, setSplitRecommendation] = useState(null);
  const [franchiseeDestinations, setFranchiseeDestinations] = useState([]);

  // Selected Fleet & Allocation
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Commercials & 3-Tier Pricing
  const [vendorCost, setVendorCost] = useState('');
  const [costAllocationMethod, setCostAllocationMethod] = useState('by_kit_qty');
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverridden, setIsOverridden] = useState(false);

  // Logistics dates
  const [expectedPickup, setExpectedPickup] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');

  const showAlert = (message, type = 'success') => {
    dispatch(setAlert({ type, message }));
  };

  // Aggregates
  const totalKits = orders.reduce((sum, o) => sum + (o.kits || 1), 0);
  const totalKg = orders.reduce((sum, o) => sum + (o.total_kg || 100), 0);
  const totalCustomerCharge = orders.reduce((sum, o) => sum + (o.customer_delivery_charge || 0), 0);
  const primaryWarehouseId = orders[0]?.warehouse_id;
  const primaryDistrictId = orders[0]?.destination?.district_id;

  const loadEligibilityData = async () => {
    if (!orders.length) return;
    setLoading(true);
    try {
      const [fleetRes, destRes] = await Promise.all([
        deliveryApi.getEligibleFleet({
          warehouse_id: primaryWarehouseId,
          destination_district_id: primaryDistrictId,
          total_weight_kg: totalKg,
          route_distance_km: 120,
        }),
        deliveryApi.getFranchiseeDestinations(primaryDistrictId),
      ]);

      if (fleetRes.status === 'success') {
        const list = fleetRes.data.eligible_fleet || [];
        setFleetList(list);
        setSplitRecommendation(fleetRes.data.split_recommendation || null);

        if (list.length > 0) {
          const first = list[0];
          setSelectedVehicleId(first._id);
          setSelectedProviderId(first.service_provider_id?._id || first.service_provider_id);
          setDriverName(first.assigned_driver?.name || '');
          setDriverMobile(first.assigned_driver?.mobile || '');
          setDriverLicense(first.assigned_driver?.license_number || '');
        }
      }

      if (destRes.status === 'success') {
        setFranchiseeDestinations(destRes.data || []);
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to load eligible vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVendorCost(isCombined ? '18000' : '5000');
      loadEligibilityData();
    }
  }, [isOpen]);

  const handleVehicleSelect = (vId) => {
    setSelectedVehicleId(vId);
    const vehicle = fleetList.find((v) => v._id === vId);
    if (vehicle) {
      setSelectedProviderId(vehicle.service_provider_id?._id || vehicle.service_provider_id);
      setDriverName(vehicle.assigned_driver?.name || '');
      setDriverMobile(vehicle.assigned_driver?.mobile || '');
      setDriverLicense(vehicle.assigned_driver?.license_number || '');
    }
  };

  const handleCostBlur = async () => {
    if (!vendorCost || !primaryDistrictId) return;
    try {
      const selectedVehicle = fleetList.find((v) => v._id === selectedVehicleId);
      const res = await deliveryApi.validateBenchmark({
        warehouse_id: primaryWarehouseId,
        vehicle_master_id: selectedVehicle?.vehicle_master_id?._id,
        district_id: primaryDistrictId,
        proposed_cost: Number(vendorCost),
      });

      if (res.status === 'success') {
        setBenchmarkResult(res.data);
        if (!res.data.meets_benchmark) {
          setIsOverridden(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedProviderId || !vendorCost) {
      showAlert('Please select Vehicle, Provider, and enter Delivery Cost.', 'error');
      return;
    }

    // If cost exceeds benchmark and not overridden yet -> open override prompt
    if (benchmarkResult && !benchmarkResult.meets_benchmark && !isOverridden) {
      setOverrideModalOpen(true);
      return;
    }

    const selectedVehicle = fleetList.find((v) => v._id === selectedVehicleId);

    // Build Stops
    const stopsPayload = orders.map((o, idx) => ({
      stop_number: idx + 1,
      order_id: o._id,
      order_number: o.order_number,
      order_model: o.order_model || 'epc_orders',
      recipient_type: o.order_model === 'fpo_orders' ? 'franchisee_store' : 'epc_buyer',
      recipient_name: o.customer_name,
      destination: o.destination,
      cargo: {
        total_kits: o.kits,
        total_weight_kg: o.total_kg,
        total_kw: o.total_kw,
      },
      customer_delivery_charge: o.customer_delivery_charge || 0,
    }));

    // Vehicles Allocated (supports multi-vehicle split if present)
    const vehiclesAllocated = [
      {
        vehicle_id: selectedVehicleId,
        registration_number: selectedVehicle ? selectedVehicle.registration_number : 'MH-12-AB-1234',
        vehicle_master_id: selectedVehicle?.vehicle_master_id?._id,
        driver_name: driverName,
        driver_mobile: driverMobile,
        driver_license: driverLicense,
        allocated_weight_kg: totalKg,
        allocated_kits: totalKits,
        assigned_stops: orders.map((_, i) => i + 1),
        vehicle_cost: Number(vendorCost),
      },
    ];

    const payload = {
      delivery_type: isCombined ? 'consolidated_master_trip' : 'single_order',
      warehouse_id: primaryWarehouseId,
      service_provider_id: selectedProviderId,
      booking_source: 'manual',
      stops: stopsPayload,
      vehicles_allocated: vehiclesAllocated,
      actual_vendor_cost: Number(vendorCost),
      cost_allocation_method: costAllocationMethod,
      pickup_scheduled_at: expectedPickup ? new Date(expectedPickup) : new Date(),
      expected_delivery_date: expectedDelivery ? new Date(expectedDelivery) : null,
      override_details: isOverridden
        ? {
            is_overridden: true,
            original_benchmark: benchmarkResult?.benchmark_cost,
            actual_rate: Number(vendorCost),
            difference: benchmarkResult?.difference,
            override_reason: overrideReason,
            overridden_at: new Date(),
          }
        : null,
    };

    try {
      const res = await deliveryApi.createDeliveryOrder(payload);
      showAlert(`Delivery Trip ${res.data.delivery_number} created successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create delivery trip', 'error');
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={isCombined ? `Create Consolidated Multi-Stop Delivery (${orders.length} Orders)` : `Create Delivery for Order ${orders[0]?.order_number}`}
        width="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Cargo Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Shipment Load</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {totalKg.toLocaleString()} KG • {totalKits} Kits
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Customer Fees Total</div>
              <div className="text-xl font-bold text-blue-700 font-mono">
                ₹{totalCustomerCharge.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Dispatch Warehouse</div>
              <div className="text-sm font-semibold text-slate-800 font-mono">
                {orders[0]?.warehouse_code || 'Company WH'}
              </div>
            </div>
          </div>

          {/* Multi-Stop Sequence Display (Combined Mode) */}
          {isCombined ? (
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-blue-600" /> Sequential Stops Route
              </h4>
              <div className="space-y-2">
                {orders.map((o, idx) => (
                  <div key={o._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">{o.order_number}</span>
                      <span className="text-slate-600">({o.customer_name})</span>
                    </div>
                    <div className="text-slate-600 text-right">
                      <div>{o.destination?.district_name || 'District'} • {o.destination?.pincode}</div>
                      <div className="text-[11px] font-semibold text-slate-800">{o.kits} kits ({o.total_kg} KG)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Vehicle Selection & Previous Vehicle Preference */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FaTruck className="text-blue-600" /> Select Transport Provider & Physical Vehicle
            </h4>

            {loading ? (
              <Loader text="Matching eligible vehicles..." />
            ) : fleetList.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {splitRecommendation ? (
                  <div>
                    <span className="font-semibold">{splitRecommendation.message}</span>
                  </div>
                ) : (
                  'No active vehicles currently Available for this load. Please check Physical Vehicles database.'
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {fleetList.map((v) => (
                  <div
                    key={v._id}
                    onClick={() => handleVehicleSelect(v._id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedVehicleId === v._id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{v.registration_number}</div>
                        <div className="text-xs text-slate-600">{v.vehicle_master_id?.name} ({v.load_capacity_kg.toLocaleString()} KG)</div>
                        <div className="text-xs text-slate-500 font-medium">{v.service_provider_id?.name}</div>
                      </div>
                      {v.is_previous_vehicle_preference ? (
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                          ★ Previous Vehicle
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Utilization: {v.utilization_pct}%</span>
                      <span className="text-emerald-700 font-medium">Available</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Driver Attribution */}
          <div className="grid grid-cols-3 gap-3">
            <CustomInput
              label="Driver Name *"
              placeholder="e.g. Ramesh Kumar"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
            />
            <CustomInput
              label="Driver Mobile *"
              placeholder="e.g. 9876543210"
              value={driverMobile}
              onChange={(e) => setDriverMobile(e.target.value)}
              required
            />
            <CustomInput
              label="Driver License"
              placeholder="License Number"
              value={driverLicense}
              onChange={(e) => setDriverLicense(e.target.value)}
            />
          </div>

          {/* Commercials: Actual Vendor Cost, Benchmark Validation, Cost Allocation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Transport Cost & 3-Tier Financial Reconciliation
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <CustomInput
                  label="Actual Delivery Cost ₹ (Payable to Transporter) *"
                  type="number"
                  placeholder="e.g. 8000"
                  value={vendorCost}
                  onChange={(e) => setVendorCost(e.target.value)}
                  onBlur={handleCostBlur}
                  required
                />
                <span className="text-[11px] text-slate-500">Total payable with 18% GST: ₹{Math.round(Number(vendorCost || 0) * 1.18).toLocaleString()}</span>
              </div>

              {isCombined ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Allocation Method *</label>
                  <select
                    value={costAllocationMethod}
                    onChange={(e) => setCostAllocationMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="by_kit_qty">By Kit Quantity</option>
                    <option value="by_weight_kg">By Shipment Weight (KG)</option>
                    <option value="by_distance">By Delivery Distance</option>
                    <option value="manual">Manual Allocation</option>
                  </select>
                </div>
              ) : null}
            </div>

            {/* Benchmark Validation Notice */}
            {benchmarkResult ? (
              <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
                benchmarkResult.meets_benchmark
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-300'
              }`}>
                <div>
                  <span className="font-semibold">Company Benchmark: ₹{benchmarkResult.benchmark_cost.toLocaleString()}</span>
                  <span className="ml-2">
                    {benchmarkResult.meets_benchmark
                      ? '✅ Within active cost benchmark'
                      : `⚠️ Exceeds benchmark by ₹${benchmarkResult.difference.toLocaleString()} (Requires Admin Override)`}
                  </span>
                </div>
                {isOverridden ? (
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Override Approved
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Financial Ledger Preview */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Customer Charge:</span>
                <span className="ml-1 font-bold text-slate-900">₹{totalCustomerCharge.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Transporter Cost:</span>
                <span className="ml-1 font-bold text-slate-900">₹{Number(vendorCost || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Net Delivery Margin:</span>
                <span className={`ml-1 font-bold ${
                  totalCustomerCharge - Number(vendorCost || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  ₹{(totalCustomerCharge - Number(vendorCost || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <CustomInput
              label="Expected Pickup Date & Time"
              type="datetime-local"
              value={expectedPickup}
              onChange={(e) => setExpectedPickup(e.target.value)}
            />
            <CustomInput
              label="Expected Delivery Date"
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" onClick={onClose} className="bg-slate-100 text-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <FaCheckCircle /> Place Delivery Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Admin Override Modal (Section 11) */}
      <Dialog
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Admin Delivery Cost Override"
        width="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-amber-900">
              <FaShieldAlt /> Benchmark Validation Notice
            </div>
            <div>The proposed vehicle rate of <span className="font-bold">₹{Number(vendorCost).toLocaleString()}</span> exceeds the active benchmark of <span className="font-bold">₹{benchmarkResult?.benchmark_cost.toLocaleString()}</span> by <span className="font-bold text-red-600">₹{benchmarkResult?.difference.toLocaleString()}</span>.</div>
          </div>

          <CustomInput
            label="Mandatory Override Reason *"
            placeholder="e.g. Urgent customer dispatch / No standard vehicle available"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" onClick={() => setOverrideModalOpen(false)} className="bg-slate-100 text-slate-700">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!overrideReason.trim()) {
                  showAlert('Please enter an override reason.', 'error');
                  return;
                }
                setIsOverridden(true);
                setOverrideModalOpen(false);
                showAlert('Admin override approved. You may now place the delivery order.');
              }}
              className="bg-amber-600 text-white"
            >
              Confirm Admin Override
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
