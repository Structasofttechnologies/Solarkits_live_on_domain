import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../features/alert.slice';
import { FaSlidersH, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaBoxes, FaWarehouse } from 'react-icons/fa';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import CustomInput from '../../../components/CustomInput';
import Drawer from '../../../components/Drawer';
import Loader from '../../../components/Loader';
import { deliveryApi } from '../../../api/deliveryApi';
import axios from 'axios';
import { authHeaderObj } from '../../../app/authHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DeliveryCostSettings() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('benchmarks'); // 'benchmarks' | 'kit_rules'

  // Data states
  const [benchmarks, setBenchmarks] = useState([]);
  const [kitRules, setKitRules] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vehicleMasters, setVehicleMasters] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Benchmark Drawer
  const [benchDrawerOpen, setBenchDrawerOpen] = useState(false);
  const [benchForm, setBenchForm] = useState({
    warehouse_id: '',
    vehicle_master_id: '',
    state_id: '',
    district_id: '',
    benchmark_cost: '',
    gst_applicable: true,
    gst_rate: 18,
    free_delivery_eligible: false,
    effective_date: new Date().toISOString().split('T')[0],
  });

  // Kit Rule Drawer
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    kit_id: '',
    order_type: 'loose_order',
    number_of_kits: 1,
    vehicle_master_id: '',
    total_delivery_cost: '',
    per_kit_delivery_cost: '',
    free_delivery: false,
  });

  const showAlert = (message, type = 'success') => {
    dispatch(setAlert({ type, message }));
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, vRes] = await Promise.all([
        deliveryApi.getBenchmarks(selectedWarehouse || null),
        deliveryApi.getKitRules(),
        deliveryApi.getVehicleMasters(),
      ]);

      if (bRes.status === 'success') setBenchmarks(bRes.data || []);
      if (rRes.status === 'success') setKitRules(rRes.data || []);
      if (vRes.status === 'success') setVehicleMasters(vRes.data || []);

      // Load company warehouses & states from existing APIs
      const [whRes, stRes, fetchedKits] = await Promise.all([
        deliveryApi.getWarehouses().catch(() => ({ data: [] })),
        deliveryApi.getStates().catch(() => ({ data: [] })),
        deliveryApi.getComboKits().catch(() => []),
      ]);

      setWarehouses(whRes.data || []);
      setStates(stRes.data || stRes.states || []);
      setKits(Array.isArray(fetchedKits) ? fetchedKits : (fetchedKits?.data || []));
    } catch (err) {
      console.error(err);
      showAlert('Failed to load delivery settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedWarehouse]);

  // Load districts when state changes in benchmark form
  const handleStateChange = async (stateId) => {
    setBenchForm({ ...benchForm, state_id: stateId, district_id: '' });
    try {
      const res = await deliveryApi.getDistricts(stateId);
      setDistricts(res.data || res.districts || []);
    } catch {
      setDistricts([]);
    }
  };

  const handleCreateBenchmark = async (e) => {
    e.preventDefault();
    if (!benchForm.warehouse_id || !benchForm.vehicle_master_id || !benchForm.state_id || !benchForm.district_id || !benchForm.benchmark_cost) {
      showAlert('Please fill in all benchmark fields.', 'error');
      return;
    }

    try {
      await deliveryApi.createBenchmark(benchForm);
      showAlert('Benchmark transport cost configured successfully.');
      setBenchDrawerOpen(false);
      loadInitialData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to save benchmark', 'error');
    }
  };

  const handleDeleteBenchmark = async (id) => {
    if (!window.confirm('Delete this benchmark cost?')) return;
    try {
      await deliveryApi.deleteBenchmark(id);
      showAlert('Benchmark deleted.');
      loadInitialData();
    } catch (err) {
      showAlert('Failed to delete benchmark', 'error');
    }
  };

  const handleCreateKitRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.kit_id || !ruleForm.vehicle_master_id || !ruleForm.total_delivery_cost) {
      showAlert('Please select Kit, Vehicle, and Total Cost.', 'error');
      return;
    }

    const perKitCost = Number(ruleForm.number_of_kits) > 0
      ? Math.round(Number(ruleForm.total_delivery_cost) / Number(ruleForm.number_of_kits))
      : Number(ruleForm.total_delivery_cost);

    try {
      await deliveryApi.createKitRule({
        ...ruleForm,
        per_kit_delivery_cost: perKitCost,
      });
      showAlert('Kit delivery rule created successfully.');
      setRuleDrawerOpen(false);
      loadInitialData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to save rule', 'error');
    }
  };

  const handleDeleteKitRule = async (id) => {
    if (!window.confirm('Delete this kit rule?')) return;
    try {
      await deliveryApi.deleteKitRule(id);
      showAlert('Rule deleted.');
      loadInitialData();
    } catch (err) {
      showAlert('Failed to delete rule', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Delivery Cost Settings"
        subtitle="Configure Warehouse-wise + Vehicle-wise + Geography-wise transport cost benchmarks & Kit purchase rules."
        icon={FaSlidersH}
        actions={
          activeTab === 'benchmarks' ? (
            <Button
              onClick={() => setBenchDrawerOpen(true)}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-white/90 font-semibold shadow-md px-4 py-2.5 rounded-xl text-sm transition-all"
            >
              <FaPlus /> Set Transport Benchmark
            </Button>
          ) : (
            <Button
              onClick={() => setRuleDrawerOpen(true)}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-white/90 font-semibold shadow-md px-4 py-2.5 rounded-xl text-sm transition-all"
            >
              <FaPlus /> Add Kit Delivery Policy
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'benchmarks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Warehouse & Route Benchmarks ({benchmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('kit_rules')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'kit_rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kit-Wise Purchase Policies ({kitRules.length})
        </button>
      </div>

      {loading ? (
        <Loader text="Loading delivery cost settings..." />
      ) : activeTab === 'benchmarks' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 uppercase">Filter Warehouse:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.warehouse_code} ({wh.address ? wh.address.slice(0, 30) + '...' : 'Main'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Vehicle Type</th>
                  <th className="py-3 px-4">State & District</th>
                  <th className="py-3 px-4">Benchmark Transport Cost</th>
                  <th className="py-3 px-4">GST Applicable</th>
                  <th className="py-3 px-4">Free Delivery</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {benchmarks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">
                      No delivery cost benchmarks configured yet.
                    </td>
                  </tr>
                ) : (
                  benchmarks.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {b.warehouse_id?.warehouse_code || 'WH-01'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {b.vehicle_master_id?.name || 'Custom'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {b.district_id?.name || 'District'}, {b.state_id?.name || 'State'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        ₹{b.benchmark_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {b.gst_applicable ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                            Yes ({b.gst_rate}%)
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {b.free_delivery_eligible ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {b.effective_date ? new Date(b.effective_date).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteBenchmark(b._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kit-Wise Rules Tab */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-xs">
              <tr>
                <th className="py-3 px-4">Kit</th>
                <th className="py-3 px-4">Order Type</th>
                <th className="py-3 px-4">Min Qty</th>
                <th className="py-3 px-4">Vehicle Requirement</th>
                <th className="py-3 px-4">Total Delivery Cost</th>
                <th className="py-3 px-4">Per-Kit Cost</th>
                <th className="py-3 px-4">Free Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kitRules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No kit-wise delivery rules configured yet.
                  </td>
                </tr>
              ) : (
                kitRules.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.kit_id?.name || 'Solar Kit'}</td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-700">
                      {r.order_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono">{r.number_of_kits} kits</td>
                    <td className="py-3 px-4 text-slate-600">{r.vehicle_master_id?.name || 'Any'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{r.total_delivery_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                      ₹{r.per_kit_delivery_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {r.free_delivery ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">Yes</span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKitRule(r._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Benchmark Drawer */}
      <Drawer
        isOpen={benchDrawerOpen}
        onClose={() => setBenchDrawerOpen(false)}
        title="Set Delivery Cost Benchmark"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateBenchmark} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Warehouse *</label>
            <select
              value={benchForm.warehouse_id}
              onChange={(e) => setBenchForm({ ...benchForm, warehouse_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.warehouse_code} - {wh.address || 'Company WH'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type from Vehicle Master *</label>
            <select
              value={benchForm.vehicle_master_id}
              onChange={(e) => setBenchForm({ ...benchForm, vehicle_master_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicleMasters.map((vm) => (
                <option key={vm._id} value={vm._id}>
                  {vm.name} ({vm.brand_make} • {vm.max_load_kg.toLocaleString()} KG)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
              <select
                value={benchForm.state_id}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Choose State --</option>
                {states.map((st) => (
                  <option key={st._id} value={st._id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
              <select
                value={benchForm.district_id}
                onChange={(e) => setBenchForm({ ...benchForm, district_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Choose District --</option>
                {districts.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <CustomInput
            label="Benchmark Transport Cost (₹) *"
            type="number"
            placeholder="e.g. 5000"
            value={benchForm.benchmark_cost}
            onChange={(e) => setBenchForm({ ...benchForm, benchmark_cost: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="gst_app"
                checked={benchForm.gst_applicable}
                onChange={(e) => setBenchForm({ ...benchForm, gst_applicable: e.target.checked })}
                className="rounded text-blue-600"
              />
              <label htmlFor="gst_app" className="text-sm font-medium text-slate-700">GST Applicable (18%)</label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="free_del"
                checked={benchForm.free_delivery_eligible}
                onChange={(e) => setBenchForm({ ...benchForm, free_delivery_eligible: e.target.checked })}
                className="rounded text-blue-600"
              />
              <label htmlFor="free_del" className="text-sm font-medium text-slate-700">Free Delivery Eligible</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" onClick={() => setBenchDrawerOpen(false)} className="bg-slate-100 text-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white">
              Save Benchmark
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Kit Rule Drawer */}
      <Drawer
        isOpen={ruleDrawerOpen}
        onClose={() => setRuleDrawerOpen(false)}
        title="Configure Kit Delivery Policy"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateKitRule} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ComboKit *</label>
            <select
              value={ruleForm.kit_id}
              onChange={(e) => setRuleForm({ ...ruleForm, kit_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              <option value="">-- Choose ComboKit --</option>
              {kits.map((k) => (
                <option key={k._id} value={k._id}>{k.name} ({k.capacity} kW)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order Type *</label>
              <select
                value={ruleForm.order_type}
                onChange={(e) => setRuleForm({ ...ruleForm, order_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="loose_order">Loose Order</option>
                <option value="trial_order">Trial Order</option>
                <option value="bulk_buy">Bulk Buy</option>
                <option value="po_order">PO Order</option>
              </select>
            </div>

            <CustomInput
              label="Number of Kits / Tier Qty *"
              type="number"
              placeholder="e.g. 10"
              value={ruleForm.number_of_kits}
              onChange={(e) => setRuleForm({ ...ruleForm, number_of_kits: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Requirement *</label>
            <select
              value={ruleForm.vehicle_master_id}
              onChange={(e) => setRuleForm({ ...ruleForm, vehicle_master_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicleMasters.map((vm) => (
                <option key={vm._id} value={vm._id}>{vm.name} ({vm.max_load_kg} KG)</option>
              ))}
            </select>
          </div>

          <CustomInput
            label="Total Delivery Cost (₹) *"
            type="number"
            placeholder="e.g. 8000"
            value={ruleForm.total_delivery_cost}
            onChange={(e) => setRuleForm({ ...ruleForm, total_delivery_cost: e.target.value })}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="rule_free"
              checked={ruleForm.free_delivery}
              onChange={(e) => setRuleForm({ ...ruleForm, free_delivery: e.target.checked })}
              className="rounded text-blue-600"
            />
            <label htmlFor="rule_free" className="text-sm font-medium text-slate-700">Free Delivery (Yes/No)</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" onClick={() => setRuleDrawerOpen(false)} className="bg-slate-100 text-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white">
              Save Policy Rule
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
