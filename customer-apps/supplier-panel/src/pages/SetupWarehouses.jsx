import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWarehouse, FaPlus, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import CustomInput from '../components/CustomInput';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import MapLocationPicker from '../components/MapLocationPicker';
import { warehouse_api } from '../features/supplier.api';
import { check_warehouse_coverage } from '../features/auth.slice';

export default function SetupWarehouses() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { warehouseCoverage } = useSelector(state => state.auth_slice);

    const missingStates = warehouseCoverage?.missing_states || [];
    const rawCurrentState = missingStates[0] || null;

    // Handle both old format (plain string ID) and new format ({_id, name} object)
    const currentStateId   = rawCurrentState
        ? (typeof rawCurrentState === 'object' ? rawCurrentState._id : rawCurrentState)
        : '';
    const currentStateName = rawCurrentState
        ? (typeof rawCurrentState === 'object' ? (rawCurrentState.name || rawCurrentState._id) : rawCurrentState)
        : '';
    const currentState = !!currentStateId;  // truthy flag used for rendering guards

    const existingWhs = warehouseCoverage?.existing_warehouses || [];
    const stateWarehouse = existingWhs.find(w => w.state && w.state.toString() === currentStateId);

    const [isEditing, setIsEditing] = useState(false);

    const [form, setForm] = useState({
        name: '',
        address: '',
        lat: '',
        lng: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleStartEdit = () => {
        if (stateWarehouse) {
            setForm({
                name: stateWarehouse.name || '',
                address: stateWarehouse.address || '',
                lat: stateWarehouse.lat || '',
                lng: stateWarehouse.lng || ''
            });
            setIsEditing(true);
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.address) {
            setError('Warehouse name and location selected on map are required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (stateWarehouse) {
                await warehouse_api.update(stateWarehouse._id, {
                    name: form.name.trim(),
                    address: form.address.trim(),
                    state: currentStateId,
                    lat: form.lat ? parseFloat(form.lat) : null,
                    lng: form.lng ? parseFloat(form.lng) : null
                });
            } else {
                await warehouse_api.create({
                    name: form.name.trim(),
                    address: form.address.trim(),
                    state: currentStateId,
                    lat: form.lat ? parseFloat(form.lat) : null,
                    lng: form.lng ? parseFloat(form.lng) : null
                });
            }

            // Reset form
            setForm({ name: '', address: '', lat: '', lng: '' });
            setIsEditing(false);

            // Re-fetch coverage
            await dispatch(check_warehouse_coverage()).unwrap();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register warehouse. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
            <PageHeader 
                title="Fulfillment Warehouses Setup" 
                subtitle="To begin operations, you must register at least one warehouse location for each coverage state." 
                icon={FaWarehouse}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* States Status Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="card p-6 bg-surface border-border">
                        <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Coverage Progress</h4>
                        <div className="space-y-3">
                            {warehouseCoverage?.coverage_states?.map((st) => {
                                // Handle both old (plain string ID) and new ({_id, name}) formats
                                const stId   = typeof st === 'object' ? st._id : st;
                                const stName = typeof st === 'object' ? (st.name || st._id) : st;
                                const wh = existingWhs.find(w => w.state && w.state.toString() === stId?.toString());
                                const isCurrent = stId?.toString() === currentStateId;

                                let bgClass = 'bg-surface-hover/20 border-border text-text-muted/60';
                                let statusText = 'Missing Warehouse';
                                let statusIcon = '⚠️';

                                if (wh) {
                                    if (wh.approval_status === 'approved') {
                                        bgClass = 'bg-success/5 border-success/20 text-success font-bold';
                                        statusText = 'Configured (Approved)';
                                        statusIcon = '✓';
                                    } else if (wh.approval_status === 'pending') {
                                        bgClass = isCurrent 
                                            ? 'bg-warning/10 border-warning text-warning font-bold' 
                                            : 'bg-warning/5 border-warning/20 text-warning';
                                        statusText = 'Pending Approval';
                                        statusIcon = '⏳';
                                    } else if (wh.approval_status === 'rejected') {
                                        bgClass = isCurrent 
                                            ? 'bg-danger/10 border-danger text-danger font-bold' 
                                            : 'bg-danger/5 border-danger/20 text-danger';
                                        statusText = 'Rejected (Needs Edit)';
                                        statusIcon = '❌';
                                    }
                                } else if (isCurrent) {
                                    bgClass = 'bg-primary/5 border-primary text-text-primary font-bold';
                                }

                                return (
                                    <div 
                                        key={stId} 
                                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${bgClass}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm truncate max-w-[120px]">{stName}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 mt-0.5">
                                                {statusText}
                                            </span>
                                        </div>
                                        <span className="text-sm">
                                            {statusIcon}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Setup Form */}
                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        {currentState ? (
                            <motion.div
                            key={currentStateId + (isEditing ? '_edit' : '_view')}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3 }}
                                className="card p-8 bg-surface border-border space-y-6"
                            >
                                {stateWarehouse && stateWarehouse.approval_status === 'pending' ? (
                                    <div className="space-y-6 py-4 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center text-3xl animate-pulse">
                                            ⏳
                                        </div>
                                        <div className="space-y-2 max-w-md">
                                            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Awaiting Admin Approval</h3>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                Your warehouse registration for <strong>{currentStateName}</strong> is pending review by our administrator. Once approved, your coverage in this state will be fully operational.
                                            </p>
                                        </div>
                                        <div className="w-full p-4 bg-surface-hover rounded-xl border border-border text-left space-y-2">
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Registered Details</p>
                                            <p className="text-sm font-black text-text-primary">{stateWarehouse.name}</p>
                                            <p className="text-xs font-semibold text-text-secondary leading-relaxed">{stateWarehouse.address}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={handleStartEdit}
                                            className="rounded-xl px-6 h-11 border border-border font-bold text-xs uppercase tracking-widest text-text-secondary"
                                        >
                                            Edit Details
                                        </Button>
                                    </div>
                                ) : stateWarehouse && stateWarehouse.approval_status === 'rejected' && !isEditing ? (
                                    <div className="space-y-6 py-4 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center text-3xl">
                                            ❌
                                        </div>
                                        <div className="space-y-2 max-w-md">
                                            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight text-danger">Registration Rejected</h3>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                Your warehouse registration for <strong>{currentStateName}</strong> was rejected. Please review the reason below and submit updated details.
                                            </p>
                                        </div>
                                        <div className="w-full p-4 bg-danger/5 border border-danger/25 text-danger rounded-xl text-left space-y-1.5">
                                            <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Rejection Reason</p>
                                            <p className="text-xs font-semibold leading-relaxed">{stateWarehouse.rejection_reason || 'No reason provided.'}</p>
                                        </div>
                                        <div className="w-full p-4 bg-surface-hover rounded-xl border border-border text-left space-y-2">
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Submitted Details</p>
                                            <p className="text-sm font-black text-text-primary">{stateWarehouse.name}</p>
                                            <p className="text-xs font-semibold text-text-secondary leading-relaxed">{stateWarehouse.address}</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            onClick={handleStartEdit}
                                            className="rounded-xl px-8 h-12 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 w-full"
                                        >
                                            Edit & Re-submit
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border-b border-border/50 pb-4">
                                            <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                                {stateWarehouse ? 'Re-submit Warehouse' : 'Configure Warehouse'}
                                            </span>
                                            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight mt-3">
                                                Fulfillment for {currentStateName}
                                            </h3>
                                            <p className="text-xs font-semibold text-text-muted uppercase mt-1">
                                                Please locate and pick the warehouse address inside {currentStateName} on the map.
                                            </p>
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
                                                placeholder={`e.g. ${currentStateName} Distribution Hub`}
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                icon={<FaBuilding className="text-text-secondary group-focus-within/input:text-primary" />}
                                                required
                                            />

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

                                                        if (details.state) {
                                                            // Compare map's returned state name against our state name
                                                            const normalize = str => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
                                                            const mapState = normalize(details.state);
                                                            const reqState = normalize(currentStateName);
                                                            const isMatch = mapState.includes(reqState) || reqState.includes(mapState);
                                                            
                                                            if (!isMatch) {
                                                                setError(`Selected location is in "${details.state}", but this warehouse must be in "${currentStateName}".`);
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

                                            <div className="pt-4 flex gap-3">
                                                {stateWarehouse && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setIsEditing(false)}
                                                        className="w-1/3 h-12 rounded-xl font-bold uppercase tracking-widest text-xs border border-border"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    loading={loading}
                                                    className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                                    leftIcon={<FaPlus />}
                                                    disabled={!!error}
                                                >
                                                    {stateWarehouse ? 'Re-submit' : 'Register Warehouse'}
                                                </Button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <div className="card p-8 bg-surface border-border flex flex-col items-center text-center space-y-4 py-16">
                                <span className="text-4xl">🎉</span>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">All States Configured!</h3>
                                <p className="text-sm font-semibold text-text-secondary">
                                    You have registered at least one warehouse for all coverage states.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
