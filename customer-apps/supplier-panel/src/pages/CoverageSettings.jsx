import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaLayerGroup, FaPlus, FaMapMarkerAlt, FaShieldAlt, FaClock, 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaLock, FaBuilding 
} from 'react-icons/fa';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import CustomInput from '../components/CustomInput';
import MapLocationPicker from '../components/MapLocationPicker';
import { auth_api, supplier_api } from '../features/supplier.api';
import { fetch_me } from '../features/auth.slice';

export default function CoverageSettings() {
    const dispatch = useDispatch();
    const { supplier } = useSelector(state => state.auth_slice);

    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: Enter GSTIN, 2: OTP Verification
    const [stateNameMap, setStateNameMap] = useState({});

    // Form inputs
    const [officeForm, setOfficeForm] = useState({
        address: '',
        lat: '',
        lng: '',
        state: ''
    });
    const [gstNumber, setGstNumber] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [requestId, setRequestId] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Status / feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Office edit modal states
    const [isEditOfficeOpen, setIsEditOfficeOpen] = useState(false);
    const [editingOfficeId, setEditingOfficeId] = useState(null);
    const [officeEditForm, setOfficeEditForm] = useState({
        address: '',
        lat: '',
        lng: '',
        state: ''
    });
    const [officeEditError, setOfficeEditError] = useState(null);
    const [officeEditLoading, setOfficeEditLoading] = useState(false);

    const handleOpenEditOffice = (office) => {
        setEditingOfficeId(office._id);
        setOfficeEditForm({
            address: office.address || '',
            lat: office.lat || '',
            lng: office.lng || '',
            state: office.state || ''
        });
        setOfficeEditError(null);
        setIsEditOfficeOpen(true);
    };

    const handleCloseEditOffice = () => {
        setIsEditOfficeOpen(false);
        setEditingOfficeId(null);
        setOfficeEditForm({ address: '', lat: '', lng: '', state: '' });
        setOfficeEditError(null);
    };

    const handleUpdateOffice = async (e) => {
        e.preventDefault();
        setOfficeEditError(null);

        if (!officeEditForm.address || !officeEditForm.lat) {
            setOfficeEditError('Please select a location on the map.');
            return;
        }

        // Validate state match (remains in the same state)
        const targetState = officeEditForm.state || '';
        const supplierOffice = supplier.office_locations.find(o => o._id === editingOfficeId);
        const originalState = supplierOffice?.state;

        const originalStateName = getStateName(originalState);

        if (originalState && !isStateMatch(originalState, officeEditForm.state, officeEditForm.address) && !isStateMatch(originalStateName, officeEditForm.state, officeEditForm.address)) {
            setOfficeEditError(`The office location must remain in "${originalStateName}". You cannot change the office state.`);
            return;
        }

        setOfficeEditLoading(true);
        try {
            await supplier_api.update_office_location(editingOfficeId, {
                address: officeEditForm.address,
                lat: parseFloat(officeEditForm.lat),
                lng: parseFloat(officeEditForm.lng),
                state: officeEditForm.state || originalState
            });

            // Refresh supplier profile
            await dispatch(fetch_me()).unwrap();
            handleCloseEditOffice();
        } catch (err) {
            setOfficeEditError(err.response?.data?.message || 'Failed to update office location.');
        } finally {
            setOfficeEditLoading(false);
        }
    };

    // Flexible state match helper to count offices in each active state
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

    // Load requests history on mount
    const fetchRequests = async () => {
        setRequestsLoading(true);
        try {
            const { data } = await supplier_api.get_state_requests();
            setRequests(data.data || []);
        } catch (err) {
            console.error('Failed to load state requests:', err);
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        const fetchStateNames = async () => {
            try {
                let countryId = supplier?.country_id;
                if (!countryId) {
                    const { data: cRes } = await auth_api.get_countries();
                    const list = cRes.data || [];
                    const india = list.find(c => c.name.toLowerCase() === 'india' || c.iso2?.toLowerCase() === 'in');
                    countryId = india ? india.id : (list[0]?.id || '');
                }
                if (countryId) {
                    const { data: sRes } = await auth_api.get_states(countryId);
                    const states = sRes.data || sRes.states || [];
                    const map = {};
                    states.forEach(s => {
                        map[s._id?.toString() || s.id?.toString()] = s.name;
                    });
                    setStateNameMap(map);
                }
            } catch (_) {
                // ignore
            }
        };
        if (supplier) fetchStateNames();
    }, [supplier]);

    const getStateName = (id) => stateNameMap[id?.toString()] || id || '';

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setModalStep(1);
        setOfficeForm({ address: '', lat: '', lng: '', state: '' });
        setGstNumber('');
        setOtpValue('');
        setRequestId('');
        setOtpSent(false);
        setError(null);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError(null);

        const gstin = gstNumber.trim().toUpperCase();
        if (gstin.length !== 15) {
            setError('Please enter a valid 15-digit GSTIN.');
            return;
        }

        // Validate PAN matching
        const existingGst = (supplier?.gst_list || []).find(g => g.is_verified && g.pan_number);
        const existingPan = existingGst?.pan_number || supplier?.pan_number;
        const newPan = gstin.substring(2, 12);

        const isDev = import.meta.env.MODE !== 'production';
        if (existingPan && existingPan !== newPan && !isDev && existingPan !== 'AAAAA1111A') {
            setError(`GSTIN PAN (${newPan}) does not match your registered PAN (${existingPan}).`);
            return;
        }

        setLoading(true);
        try {
            const { data } = await auth_api.gst_generate_otp(gstin);
            setRequestId(data.request_id || `mock_${Date.now()}`);
            setOtpSent(true);
            setModalStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate OTP for GSTIN.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setError(null);

        if (!otpValue || otpValue.length < 4) {
            setError('Please enter the verification OTP.');
            return;
        }

        setLoading(true);
        try {
            const gstin = gstNumber.trim().toUpperCase();
            
            // 1. Submit/Verify GST OTP
            const { data: verifyRes } = await auth_api.gst_submit_otp(requestId, otpValue, gstin);

            const gstDetails = verifyRes.data;
            const gstinStatus = gstDetails?.gstin_status || gstDetails?.gstinStatus || gstDetails?.status || gstDetails?.gstStatus;
            if (gstinStatus && gstinStatus.toLowerCase() !== 'active') {
                setError(`GSTIN is inactive (Status: ${gstinStatus}). Only active GSTINs are allowed.`);
                setLoading(false);
                return;
            }

            // Verify PAN matching on the retrieved details
            const newPan = gstDetails?.pan_number || gstin.substring(2, 12);
            const existingGst = (supplier?.gst_list || []).find(g => g.is_verified && g.pan_number);
            const existingPan = existingGst?.pan_number || supplier?.pan_number;
            const isDev = import.meta.env.MODE !== 'production';
            if (existingPan && existingPan !== newPan && !isDev && existingPan !== 'AAAAA1111A') {
                setError(`GSTIN PAN (${newPan}) does not match your registered PAN (${existingPan}).`);
                setLoading(false);
                return;
            }

            const stateVal = verifyRes.state || gstDetails?.state;
            const addressVal = verifyRes.address || gstDetails?.address;

            if (!stateVal) {
                setError('Could not retrieve state for this GSTIN.');
                setLoading(false);
                return;
            }
            if (!addressVal) {
                setError('Could not retrieve registered address for this GSTIN.');
                setLoading(false);
                return;
            }

            // Verify duplicate state coverage
            const alreadyCovers = (supplier?.states || []).some(
                activeState => activeState.toLowerCase().trim() === stateVal.toLowerCase().trim()
            );
            if (alreadyCovers) {
                setError(`You already cover state "${stateVal}".`);
                setLoading(false);
                return;
            }

            // Verify duplicate state requests
            const pending = (requests || []).find(r => r.state.toLowerCase() === stateVal.toLowerCase() && r.status === 'pending');
            if (pending) {
                setError(`A state request for "${stateVal}" is already pending approval.`);
                setLoading(false);
                return;
            }

            // 2. Submit state request
            const payload = {
                state: stateVal,
                office_location: {
                    address: addressVal,
                    lat: 0,
                    lng: 0,
                    state: stateVal
                },
                gst: {
                    gst_number: gstin,
                    pan_number: newPan,
                    state: stateVal,
                    is_verified: true
                }
            };

            await supplier_api.create_state_request(payload);

            // 3. Refresh lists
            await fetchRequests();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Request submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
            <PageHeader 
                title="Coverage States & Expansion" 
                subtitle="Manage your active operating coverage states, configure state office locations, and submit expansion requests." 
                icon={FaLayerGroup}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active States list */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6 bg-surface border-border h-full">
                        <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Active States</h3>
                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">Approved Coverage</p>
                            </div>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="rounded-xl px-3 text-[10px] uppercase font-black tracking-wider"
                                onClick={handleOpenModal}
                                leftIcon={<FaPlus />}
                            >
                                Add GST
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {supplier?.states && supplier.states.length > 0 ? (
                                supplier.states.map(stateName => {
                                    const mappedStateName = getStateName(stateName);
                                    const gst = (supplier.gst_list || []).find(
                                        g => g.is_verified && (
                                            g.state?.toLowerCase().trim() === stateName.toLowerCase().trim() ||
                                            g.state?.toLowerCase().trim() === mappedStateName.toLowerCase().trim()
                                        )
                                    );
                                    
                                    const officeCount = (supplier.office_locations || []).filter(
                                        loc => isStateMatch(stateName, loc.state, loc.address) || isStateMatch(mappedStateName, loc.state, loc.address)
                                    ).length;

                                    return (
                                        <div key={stateName} className="p-4 rounded-xl border border-border bg-surface-hover/30 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-text-primary">{mappedStateName}</span>
                                                <span className="text-[10px] font-black uppercase bg-success/10 text-success px-2 py-0.5 rounded-lg border border-success/10">
                                                    Active
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider space-y-1">
                                                <p className="flex justify-between">
                                                    <span>Office Locations:</span>
                                                    <span className="text-text-primary font-black">{officeCount} office(s)</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span>GSTIN:</span>
                                                    <span className="text-text-primary font-black">{gst?.gst_number || 'N/A'}</span>
                                                </p>
                                            </div>

                                            {/* List individual offices for this state */}
                                            <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                                                {(supplier?.office_locations || [])
                                                    .filter(loc => isStateMatch(stateName, loc.state, loc.address) || isStateMatch(mappedStateName, loc.state, loc.address))
                                                    .map((loc, idx) => (
                                                        <div key={loc._id || idx} className="p-2 rounded-lg bg-surface border border-border flex items-start justify-between gap-2">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[8px] text-text-muted font-black uppercase tracking-wider">Office #{idx + 1}</p>
                                                                <p className="text-[11px] font-semibold text-text-primary leading-normal">{loc.address}</p>
                                                            </div>
                                                            <Button 
                                                                variant="link" 
                                                                onClick={() => handleOpenEditOffice(loc)}
                                                                className="text-[9px] font-black uppercase text-primary shrink-0 p-0 hover:underline"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-text-secondary text-center py-6 font-semibold">No active states registered.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expansion Requests queue */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6 bg-surface border-border">
                        <div className="border-b border-border/50 pb-4 mb-6">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Expansion Request Queue</h3>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">Admin approvals & history</p>
                        </div>

                        {requestsLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <span className="animate-spin text-primary text-xl">⏳</span>
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req._id} className="p-5 rounded-xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2 max-w-md">
                                            <div className="flex items-center gap-3">
                                                <span className="text-base font-black text-text-primary">{getStateName(req.state)}</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                                    req.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                                                    req.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' :
                                                    'bg-warning/10 text-warning border-warning/20'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-text-secondary font-semibold">
                                                    <strong className="text-text-primary font-bold">Office Address:</strong> {req.office_location?.address}
                                                </p>
                                                <p className="text-[10px] text-text-secondary font-semibold">
                                                    <strong className="text-text-primary font-bold">GSTIN:</strong> {req.gst?.gst_number}
                                                </p>
                                                {req.status === 'rejected' && req.rejection_reason && (
                                                    <p className="text-[10px] text-danger font-semibold bg-danger/5 border border-danger/20 p-2 rounded-lg mt-2">
                                                        <strong className="font-bold uppercase tracking-wider block text-[9px] mb-0.5">Rejection Reason:</strong>
                                                        {req.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                                Submitted On:
                                            </span>
                                            <span className="text-xs text-text-secondary font-semibold">
                                                {new Date(req.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-2 text-text-muted">
                                <FaClock className="text-3xl mx-auto opacity-40" />
                                <h4 className="text-sm font-black uppercase tracking-tight">No Requests Found</h4>
                                <p className="text-xs font-semibold">You haven't requested any coverage state expansions yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal dialog for New State Addition */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-surface border-border p-6 md:p-8 space-y-6 relative"
                        >
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-5 right-5 text-text-secondary hover:text-text-primary text-lg"
                            >
                                ✕
                            </button>

                            <div className="border-b border-border/50 pb-4">
                                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                                    Step {modalStep} of 2
                                </span>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mt-2">
                                    Request Coverage Expansion
                                </h3>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    Enter GSTIN and verify matching OTP to apply.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3.5 rounded-xl bg-danger/5 border border-danger/30 text-danger text-xs font-semibold flex gap-2 items-center">
                                    <FaExclamationTriangle className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {modalStep === 1 ? (
                                <form onSubmit={handleSendOtp} className="space-y-5">
                                    <CustomInput
                                        name="gstNumber"
                                        label="GSTIN for Coverage Expansion *"
                                        placeholder="e.g. 24AAAEE1234A1Z5"
                                        value={gstNumber}
                                        onChange={e => setGstNumber(e.target.value.toUpperCase())}
                                        icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                                        maxLength={15}
                                        required
                                    />

                                    <div className="pt-2 flex gap-4">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-1/3 h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={loading}
                                            className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                        >
                                            Send OTP
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-5">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
                                        <p className="text-text-primary font-bold uppercase tracking-wider text-[10px] text-primary">GSTIN Entered: {gstNumber}</p>
                                        <p className="text-text-secondary">Please enter the verification OTP sent to your GST contacts. Once verified, the state and office address will be automatically populated.</p>
                                    </div>

                                    <form onSubmit={handleSubmitRequest} className="space-y-5">
                                        <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-xs font-semibold">
                                            <p className="text-text-primary">OTP has been sent to the GST-registered contacts for <strong className="text-primary">{gstNumber}</strong>.</p>
                                            <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider mt-1">Mock bypass code is <strong>000000</strong>.</p>
                                        </div>

                                        <CustomInput
                                            name="otpValue"
                                            label="Enter OTP Code *"
                                            placeholder="e.g. 000000"
                                            value={otpValue}
                                            onChange={e => setOtpValue(e.target.value)}
                                            icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                                            maxLength={6}
                                            required
                                        />

                                        <div className="flex gap-4 pt-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    setModalStep(1);
                                                    setOtpSent(false);
                                                    setOtpValue('');
                                                    setError(null);
                                                }}
                                                disabled={loading}
                                                className="w-1/3 h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                            >
                                                Edit GSTIN
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                loading={loading}
                                                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                            >
                                                Verify & Submit Request
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal dialog for Edit Office Location */}
            <AnimatePresence>
                {isEditOfficeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="card max-w-xl w-full max-h-[90vh] overflow-y-auto bg-surface border-border p-6 md:p-8 space-y-6 relative"
                        >
                            <button 
                                onClick={handleCloseEditOffice}
                                className="absolute top-5 right-5 text-text-secondary hover:text-text-primary text-lg"
                            >
                                ✕
                            </button>

                            <div className="border-b border-border/50 pb-4">
                                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                                    Configure Location
                                </span>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mt-2">
                                    Edit Office Location
                                </h3>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    Select the updated physical location of this office on the map.
                                </p>
                            </div>

                            {officeEditError && (
                                <div className="p-3.5 rounded-xl bg-danger/5 border border-danger/30 text-danger text-xs font-semibold flex gap-2 items-center">
                                    <FaExclamationTriangle className="shrink-0" />
                                    <span>{officeEditError}</span>
                                </div>
                            )}

                            <form onSubmit={handleUpdateOffice} className="space-y-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">
                                        Office Location (Select on Map) *
                                    </label>
                                    <MapLocationPicker
                                        lat={officeEditForm.lat}
                                        lng={officeEditForm.lng}
                                        visible={true}
                                        onSelect={(details) => {
                                            setOfficeEditForm({
                                                address: details.address || '',
                                                lat: details.lat || '',
                                                lng: details.lng || '',
                                                state: details.state || ''
                                            });
                                            
                                            const supplierOffice = supplier?.office_locations?.find(o => o._id === editingOfficeId);
                                            const originalState = supplierOffice?.state;
                                            const originalStateName = getStateName(originalState);

                                            if (originalState && details.state) {
                                                if (!isStateMatch(originalState, details.state, details.address) && !isStateMatch(originalStateName, details.state, details.address)) {
                                                    setOfficeEditError(`Picked location is in "${details.state}", but it must be within "${originalStateName}".`);
                                                } else {
                                                    setOfficeEditError(null);
                                                }
                                            }
                                        }}
                                    />
                                    {officeEditForm.address && (
                                        <div className="p-3 bg-surface-hover rounded-xl border border-border mt-2">
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Office Address</p>
                                            <p className="text-xs font-semibold text-text-primary mt-1.5 leading-relaxed">{officeEditForm.address}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 flex gap-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCloseEditOffice}
                                        className="w-1/3 h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={officeEditLoading}
                                        className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                        disabled={!!officeEditError}
                                    >
                                        Save Changes
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
