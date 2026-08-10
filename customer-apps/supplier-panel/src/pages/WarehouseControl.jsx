import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/PageHeader";
import { FaWarehouse, FaMapMarkerAlt, FaBoxes, FaPlus, FaEllipsisV, FaArrowRight, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Button from "../components/Button";
import CustomInput from "../components/CustomInput";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";
import MapLocationPicker from "../components/MapLocationPicker";
import { motion, AnimatePresence } from "framer-motion";
import { warehouse_api } from "../features/supplier.api";
import { check_warehouse_coverage } from "../features/auth.slice";

export default function Warehouses() {
  const dispatch = useDispatch();
  const { warehouseCoverage } = useSelector(state => state.auth_slice);
  const warehouses = warehouseCoverage?.existing_warehouses || [];
  const coverageStates = warehouseCoverage?.coverage_states || [];

  const getInitialStateId = () => {
    const first = coverageStates[0];
    if (!first) return '';
    return typeof first === 'object' ? (first._id || first.id || '') : first;
  };

  const getStateName = (stateId) => {
    if (!stateId) return '';
    const idStr = stateId.toString();
    const match = coverageStates.find(
      (st) => (typeof st === 'object' ? (st._id?.toString() === idStr || st.id?.toString() === idStr) : st.toString() === idStr)
    );
    return match && typeof match === 'object' ? match.name : stateId;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    state: getInitialStateId(),
    lat: '',
    lng: ''
  });

  const handleOpenAdd = () => {
    setEditingWarehouseId(null);
    setForm({
      name: '',
      address: '',
      state: getInitialStateId(),
      lat: '',
      lng: ''
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (wh) => {
    setEditingWarehouseId(wh._id);
    setForm({
      name: wh.name || '',
      address: wh.address || '',
      state: (typeof wh.state === 'object' ? (wh.state._id || wh.state.id) : wh.state) || getInitialStateId(),
      lat: wh.lat || '',
      lng: wh.lng || ''
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingWarehouseId(null);
    setForm({
      name: '',
      address: '',
      state: getInitialStateId(),
      lat: '',
      lng: ''
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.state) {
      setError("Name, address, and state are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingWarehouseId) {
        await warehouse_api.update(editingWarehouseId, {
          name: form.name.trim(),
          address: form.address.trim(),
          state: form.state,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null
        });
      } else {
        await warehouse_api.create({
          name: form.name.trim(),
          address: form.address.trim(),
          state: form.state,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null
        });
      }

      // Refresh coverage and warehouses list
      await dispatch(check_warehouse_coverage()).unwrap();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save warehouse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Warehouses" 
        subtitle="Manage distributed inventory across multiple geographic locations and fulfillment centers." 
        icon={FaWarehouse}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest h-12 shadow-lg shadow-primary/20 px-8"
            leftIcon={<FaPlus />}
            onClick={handleOpenAdd}
          >
            Add Warehouse
          </Button>
        }
      />

      {/* Warehouse Grid */}
      {warehouses.length === 0 ? (
        <div className="card p-12 bg-surface border-border flex flex-col items-center text-center space-y-4">
          <FaWarehouse className="text-4xl text-text-muted/30" />
          <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">No Warehouses Registered</h3>
          <p className="text-sm font-semibold text-text-secondary">
            Click "Add Warehouse" to register a new fulfillment location.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {warehouses.map((wh, idx) => (
            <motion.div 
              key={wh._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-8 bg-surface border-border hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform" />
              
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-2xl shadow-inner">
                    <FaWarehouse />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight truncate max-w-[200px]" title={wh.name}>{wh.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">
                      <FaMapMarkerAlt className="text-primary" />
                      {getStateName(wh.state)}
                    </div>
                    <div className="mt-2.5">
                      {wh.approval_status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-success/10 text-success border border-success/20 text-[9px] font-black uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {wh.approval_status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-warning/10 text-warning border border-warning/20 text-[9px] font-black uppercase tracking-wider animate-pulse">
                          Pending Approval
                        </span>
                      )}
                      {wh.approval_status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-[9px] font-black uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant={wh.approval_status === 'rejected' ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => handleOpenEdit(wh)}
                  className="rounded-xl font-black uppercase tracking-wider text-[10px]"
                >
                  {wh.approval_status === 'rejected' ? 'Edit & Re-submit' : 'Edit'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-text-muted">Utilization</span>
                    <span className={parseInt(wh.capacity) > 90 ? 'text-danger' : 'text-primary'}>{wh.capacity || '0%'}</span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${parseInt(wh.capacity) > 90 ? 'bg-danger' : 'bg-primary'}`} 
                      style={{ width: wh.capacity || '0%' }}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active SKUs</p>
                  <p className="text-xl font-black text-text-primary tracking-tight">{(wh.skus || 0).toLocaleString()}</p>
                </div>
              </div>

              {wh.approval_status === 'rejected' && wh.rejection_reason && (
                <div className="p-4 mb-6 bg-danger/5 border border-danger/20 text-danger text-[11px] font-bold rounded-2xl space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-danger/80">Rejection Reason</p>
                  <p className="leading-relaxed font-semibold">{wh.rejection_reason}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${wh.status === 'Operational' ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{wh.status || 'Operational'}</span>
                </div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Code: {wh.unique_code}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Warehouse Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-3xl p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">
                  {editingWarehouseId ? "Edit Fulfillment Warehouse" : "Add Fulfillment Warehouse"}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-text-muted"
                >
                  <FaTimes />
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-danger/5 border border-danger/30 text-danger text-xs font-bold flex gap-2 items-center">
                  <FaExclamationTriangle className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <CustomInput
                  name="name"
                  label="Warehouse Name *"
                  placeholder="e.g. Maharashtra Logistics Hub"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />

                <div className="flex flex-col w-full">
                  <label className="text-text-secondary mb-2 font-bold uppercase tracking-widest text-[10px]">Coverage State *</label>
                  <DropdownWithSearchInput
                    options={coverageStates.map(s => {
                      const id = typeof s === 'object' ? (s._id || s.id) : s;
                      const name = typeof s === 'object' ? s.name : s;
                      return { value: id, text: name };
                    })}
                    value={form.state}
                    onChange={val => {
                      setForm(f => ({ ...f, state: val }));
                      setError(null);
                    }}
                    placeholder="Select coverage state..."
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">
                    Warehouse Location (Select on Map) *
                  </label>
                  <MapLocationPicker
                    lat={form.lat}
                    lng={form.lng}
                    visible={true}
                    onSelect={(details) => {
                      setForm(f => ({
                        ...f,
                        address: details.address || '',
                        lat: details.lat || '',
                        lng: details.lng || '',
                      }));

                      if (details.state && form.state) {
                        const isStateMatch = (stateName, locState, locAddress) => {
                          if (!stateName) return false;
                          const a = stateName.toLowerCase().replace(/[^a-z0-9]/g, '');
                          if (locState && String(locState) !== 'undefined') {
                            const b = String(locState).toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (a.includes(b) || b.includes(a)) return true;
                          }
                          if (locAddress) {
                            const addr = String(locAddress).toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (addr.includes(a)) return true;
                          }
                          return false;
                        };

                        const selectedStateName = getStateName(form.state);
                        if (!isStateMatch(selectedStateName, details.state, details.address)) {
                          setError(`⚠️ Warning: Selected location appears to be in "${details.state}", but your warehouse is set to "${selectedStateName}". Please verify.`);
                        } else {
                          setError(null);
                        }
                      }
                    }}
                  />
                  {form.address && (
                    <div className="p-3 bg-surface-hover rounded-xl border border-border mt-2">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Picked Address</p>
                      <p className="text-xs font-semibold text-text-primary mt-1.5 leading-relaxed">{form.address}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseModal}
                    className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs border border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    leftIcon={<FaPlus />}
                  >
                    {editingWarehouseId ? "Save Changes" : "Register"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
