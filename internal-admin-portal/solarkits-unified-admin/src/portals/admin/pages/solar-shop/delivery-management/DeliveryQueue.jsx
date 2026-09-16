import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../features/alert.slice';
import {
  FaBoxes,
  FaClock,
  FaTruck,
  FaArrowUp,
  FaFilter,
  FaExclamationCircle,
  FaCheckCircle,
  FaBolt,
  FaPiggyBank,
  FaRoute,
} from 'react-icons/fa';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import CustomInput from '../../../components/CustomInput';
import Dialog from '../../../components/Dialog';
import Loader from '../../../components/Loader';
import CreateDeliveryModal from './CreateDeliveryModal';
import { deliveryApi } from '../../../api/deliveryApi';
import axios from 'axios';
import { authHeaderObj } from '../../../app/authHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DeliveryQueue() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [consolidationSuggestions, setConsolidationSuggestions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(false);

  // Delivery Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [ordersToDeliver, setOrdersToDeliver] = useState([]);

  // Priority Reorder Modal
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [selectedOrderForPriority, setSelectedOrderForPriority] = useState(null);
  const [priorityReason, setPriorityReason] = useState('');

  const showAlert = (message, type = 'success') => {
    dispatch(setAlert({ type, message }));
  };

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveryQueue({
        warehouse_id: selectedWarehouse || undefined,
        limit: 100,
      });

      if (res.status === 'success') {
        setOrders(res.data || []);
        setConsolidationSuggestions(res.consolidation_suggestions || []);
      }

      // Load warehouses
      const whRes = await deliveryApi.getWarehouses().catch(() => ({ data: [] }));
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load delivery queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedWarehouse]);

  const handleCreateIndividualDelivery = (order) => {
    setOrdersToDeliver([order]);
    setModalOpen(true);
  };

  const handleCombineSuggestion = (suggestion) => {
    setOrdersToDeliver(suggestion.orders);
    setModalOpen(true);
  };

  const handleOpenPriorityModal = (order) => {
    setSelectedOrderForPriority(order);
    setPriorityReason(order.priority_reason || '');
    setPriorityModalOpen(true);
  };

  const handleSavePriority = async (e) => {
    e.preventDefault();
    if (!priorityReason.trim()) {
      showAlert('Please enter a mandatory audit reason.', 'error');
      return;
    }

    try {
      await deliveryApi.updateOrderPriority(selectedOrderForPriority._id, {
        is_priority: !selectedOrderForPriority.is_priority,
        priority_reason: priorityReason,
        order_model: selectedOrderForPriority.order_model,
      });
      showAlert('Order priority updated successfully.');
      setPriorityModalOpen(false);
      loadQueue();
    } catch (err) {
      showAlert('Failed to update priority', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Delivery Management Queue"
        subtitle="Paid orders queued strictly by Payment Received Date & Time (FIFO oldest first), with automatic route consolidation suggestions."
        icon={FaBoxes}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xs border border-white/25 px-3 py-1.5 rounded-xl">
              <label className="text-xs font-semibold text-white/80 uppercase">Warehouse:</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer [&>option]:text-slate-800"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.warehouse_code}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={loadQueue}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs font-semibold px-4 py-2 rounded-xl text-xs transition-all"
            >
              Refresh Queue
            </Button>
          </div>
        }
      />

      {/* ─── SECTION 5: COMBINE DELIVERY AVAILABLE BANNER ─── */}
      {consolidationSuggestions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaRoute className="text-indigo-600" /> Combine Delivery Available ({consolidationSuggestions.length} Routes Identified)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consolidationSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 rounded-xl p-5 border border-indigo-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded">
                      Route Clubbing Match
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{sug.route_name}</h4>
                    <div className="text-xs text-slate-500">
                      {sug.order_count} Orders • {sug.districts.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium">Estimated Saving</span>
                    <div className="text-base font-extrabold text-emerald-700 font-mono">
                      +₹{sug.estimated_saving.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-xs text-slate-700">
                  <div>
                    <div className="text-slate-400 text-[10px]">Total Cargo Load</div>
                    <div className="font-bold">{sug.total_weight_kg.toLocaleString()} KG</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Total Kits</div>
                    <div className="font-bold">{sug.total_kits} kits</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Stops & Range</div>
                    <div className="font-bold">{sug.total_stops} stops • {sug.estimated_route_distance_km} KM</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-slate-500 text-[11px]">
                    Separate: ₹{sug.separate_benchmark_total.toLocaleString()} → Combined: ₹{sug.combined_benchmark_cost.toLocaleString()}
                  </div>
                  <Button
                    onClick={() => handleCombineSuggestion(sug)}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <FaTruck className="text-xs" /> Combine Orders ({sug.order_count})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── QUEUE TABLE (FIFO OLDEST PAID FIRST) ─── */}
      {loading ? (
        <Loader text="Loading paid order queue..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Payment Time (FIFO)</th>
                  <th className="py-3 px-4">EPC / Franchisee</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Destination & Pincode</th>
                  <th className="py-3 px-4">Kits / Total KG</th>
                  <th className="py-3 px-4">Waiting / Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-slate-500">
                      No paid orders awaiting delivery in queue.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const isApproachingDeadline = o.hours_waiting >= 36 && o.hours_waiting <= 48;
                    const isPastDeadline = o.hours_waiting > 48;
                    return (
                      <tr key={o._id} className={`hover:bg-slate-50/80 transition-colors ${o.is_priority ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-blue-700">
                            <span>{o.order_number}</span>
                            {o.is_priority ? (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                Priority
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-slate-400 capitalize">{o.order_type}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {new Date(o.payment_time).toLocaleDateString()}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {new Date(o.payment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{o.customer_name}</div>
                          <div className="text-xs text-slate-500">{o.customer_phone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {o.warehouse_code}
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs">
                          <div>{o.destination?.district_name || 'District'}, {o.destination?.state_name || 'State'}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{o.destination?.pincode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{o.kits} kits</div>
                          <div className="text-xs text-slate-500 font-mono">{o.total_kg.toLocaleString()} KG • {o.total_kw} kW</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              isPastDeadline
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isApproachingDeadline
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {o.hours_waiting}h in Queue
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize mt-0.5">{o.order_status?.replace('_', ' ')}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPriorityModal(o)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 text-xs"
                              title="Change Priority (with Audit Reason)"
                            >
                              <FaArrowUp />
                            </button>
                            <Button
                              onClick={() => handleCreateIndividualDelivery(o)}
                              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                            >
                              <FaTruck className="text-xs" /> Deliver
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      <CreateDeliveryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={ordersToDeliver}
        onSuccess={() => {
          loadQueue();
        }}
      />

      {/* Priority Change Modal (Section 8) */}
      <Dialog
        isOpen={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title={`Change Queue Priority: ${selectedOrderForPriority?.order_number}`}
        width="max-w-md"
      >
        <form onSubmit={handleSavePriority} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Authorized users can change order priority where required. An audit reason is mandatory. Priority orders can bypass consolidation.
          </p>

          <CustomInput
            label="Mandatory Audit Reason *"
            placeholder="e.g. VIP Client request / Site civil work ready"
            value={priorityReason}
            onChange={(e) => setPriorityReason(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prio_chk"
              checked={Boolean(selectedOrderForPriority?.is_priority)}
              onChange={() =>
                setSelectedOrderForPriority({
                  ...selectedOrderForPriority,
                  is_priority: !selectedOrderForPriority.is_priority,
                })
              }
              className="rounded text-amber-600"
            />
            <label htmlFor="prio_chk" className="text-sm font-semibold text-slate-800">
              Set as Priority Order (Bypass Consolidation)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" onClick={() => setPriorityModalOpen(false)} className="bg-slate-100 text-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 text-white">
              Save Priority & Audit
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
