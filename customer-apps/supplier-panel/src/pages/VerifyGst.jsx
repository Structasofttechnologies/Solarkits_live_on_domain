import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaLock, FaSync } from 'react-icons/fa';
import CustomInput from '../components/CustomInput';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { auth_api, supplier_api } from '../features/supplier.api';
import { fetch_me } from '../features/auth.slice';

export default function VerifyGst() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { supplier } = useSelector(state => state.auth_slice);

    // State ID → name map
    const [stateNameMap, setStateNameMap] = useState({});

    useEffect(() => {
        const fetchStateNames = async () => {
            try {
                const countryId = supplier?.country_id || '';
                const { data } = await auth_api.get_states(countryId);
                const states = data?.data || data?.states || [];
                const map = {};
                states.forEach(s => { map[s._id?.toString() || s.id?.toString()] = s.name; });
                setStateNameMap(map);
            } catch (_) {
                // ignore — IDs will display as fallback
            }
        };
        if (supplier) fetchStateNames();
    }, [supplier?.country_id]);

    const getStateName = (id) => stateNameMap[id?.toString()] || id || '';

    // Identify which coverage states are missing a verified GST in gst_list
    const getMissingGstStates = () => {
        if (!supplier) return [];
        return (supplier.states || []).filter(stateId => {
            return !(supplier.gst_list || []).some(g => 
                g.is_verified && 
                g.state && 
                g.state.toString() === stateId.toString()
            );
        });
    };

    const missingStates = getMissingGstStates();
    const [selectedState, setSelectedState] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [otpValue, setOtpValue] = useState('');
    
    const [requestId, setRequestId] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Automatically select the first missing state if nothing is selected yet
    useEffect(() => {
        if (missingStates.length > 0 && !selectedState) {
            setSelectedState(missingStates[0]);
        }
    }, [missingStates, selectedState]);

    const handleReset = () => {
        setGstNumber('');
        setOtpValue('');
        setRequestId('');
        setOtpSent(false);
        setError(null);
        setSuccessMessage(null);
    };

    const handleStateChange = (e) => {
        setSelectedState(e.target.value);
        handleReset();
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

        if (existingPan && existingPan !== newPan) {
            setError("Not able to add. Please register a new business for a different PAN.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await auth_api.gst_generate_otp(gstin);
            setRequestId(data.request_id || `mock_${Date.now()}`);
            setOtpSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP to the registered GST phone/email.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(null);

        if (!otpValue || otpValue.length < 4) {
            setError('Please enter a valid OTP.');
            return;
        }

        setLoading(true);
        try {
            const gstin = gstNumber.trim().toUpperCase();
            
            // 1. Submit GST OTP
            const { data: verifyRes } = await auth_api.gst_submit_otp(requestId, otpValue, gstin);

            const gstDetails = verifyRes.data;
            const gstinStatus = gstDetails?.gstin_status || gstDetails?.gstinStatus || gstDetails?.status || gstDetails?.gstStatus;
            if (gstinStatus && gstinStatus.toLowerCase() !== 'active') {
                setError(`GSTIN is inactive (Status: ${gstinStatus}). Only active GSTINs are allowed.`);
                setLoading(false);
                return;
            }

            // 2. Add GST to supplier profile
            await supplier_api.add_gst({ gstin, state: selectedState });

            setSuccessMessage(`GSTIN ${gstin} verified and registered successfully for ${getStateName(selectedState)}!`);
            
            // 3. Refresh user profile in Redux
            await dispatch(fetch_me()).unwrap();
            
            // Clean up states
            handleReset();
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification or GST registration failed.');
        } finally {
            setLoading(false);
        }
    };

    if (missingStates.length === 0) {
        return (
            <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                    <FaCheckCircle />
                </div>
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">All GSTINs Verified</h2>
                <p className="text-sm font-semibold text-text-secondary">
                    All of your active coverage states have verified GSTIN configurations.
                </p>
                <Button 
                    variant="primary" 
                    onClick={() => navigate('/dashboard/home')}
                    className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md"
                >
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
            <PageHeader 
                title="GST Verification Required" 
                subtitle="To begin operations, you must verify a valid GSTIN for each of your active coverage states. GSTs must match your company's registered PAN." 
                icon={FaShieldAlt}
            />

            <div className="card p-8 bg-surface border-border space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-5 -mr-16 -mt-16 rounded-full" />
                
                <div className="border-b border-border/50 pb-4">
                    <span className="px-3 py-1.5 rounded-xl bg-warning/10 text-warning text-[10px] font-black uppercase tracking-wider">
                        Pending Verification
                    </span>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mt-3">
                        Tax compliance & setup
                    </h3>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-danger/5 border border-danger/30 text-danger text-xs font-semibold flex gap-2.5 items-center">
                        <FaExclamationTriangle className="shrink-0 text-base" />
                        <span>{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 rounded-xl bg-success/5 border border-success/30 text-success text-xs font-semibold flex gap-2.5 items-center">
                        <FaCheckCircle className="shrink-0 text-base" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="space-y-5">
                    {/* State Selector */}
                    <div className="flex flex-col">
                        <label className="text-text-secondary mb-2 font-bold uppercase tracking-widest text-[10px]">
                            Select State to Configure *
                        </label>
                        <select
                            value={selectedState}
                            onChange={handleStateChange}
                            disabled={otpSent || loading}
                            className="w-full border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-text-primary disabled:opacity-50"
                        >
                            {missingStates.map(st => (
                                <option key={st} value={st}>{getStateName(st)}</option>
                            ))}
                        </select>
                    </div>

                    <AnimatePresence mode="wait">
                        {!otpSent ? (
                            <motion.form
                                key="request-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleSendOtp}
                                className="space-y-5"
                            >
                                <CustomInput
                                    name="gstNumber"
                                    label={`GSTIN for ${getStateName(selectedState)} *`}
                                    placeholder="e.g. 24AAAEE1234A1Z5"
                                    value={gstNumber}
                                    onChange={e => setGstNumber(e.target.value.toUpperCase())}
                                    icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                                    maxLength={15}
                                    required
                                />

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={loading}
                                        className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                    >
                                        Generate OTP
                                    </Button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="otp-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-5"
                            >
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs font-semibold space-y-1">
                                    <p className="text-text-primary">OTP has been sent to the mobile/email registered with GSTIN <strong className="text-primary">{gstNumber}</strong>.</p>
                                    <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Use OTP bypass code <strong>000000</strong> for local validation testing.</p>
                                </div>

                                <CustomInput
                                    name="otpValue"
                                    label="Enter GST Verification OTP *"
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
                                        onClick={handleReset}
                                        disabled={loading}
                                        className="w-1/3 h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
                                        leftIcon={<FaSync />}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={loading}
                                        className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                    >
                                        Verify & Register GST
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
