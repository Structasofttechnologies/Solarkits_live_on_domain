import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBuilding, FaUser, FaShieldAlt, FaRocket, FaCheck, FaChevronRight,
    FaChevronLeft, FaExclamationTriangle,
    FaTimesCircle, FaClock, FaEnvelope, FaPhoneAlt, FaPlus, FaTrashAlt, FaCheckCircle,
    FaEye, FaEyeSlash
} from 'react-icons/fa';
import { HiSun, HiMoon } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/alert.slice';
import { auth_api } from '../../features/supplier.api';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import OTPInput from '../../components/OTPInput';
import CustomInput from '../../components/CustomInput';
import DropdownWithSearchInput from '../../components/DropdownWithSearchInput';
import useTheme from '../../hooks/useTheme';
import logo from '@/assets/images/logo.png';

const STEPS = [
    { id: 1, name: 'Verification & Profile', icon: <FaShieldAlt />,    title: 'Business Identity & Profile', subtitle: 'Verify GST and brand details' },
    { id: 2, name: 'Review',             icon: <FaRocket />,       title: 'Final Review',              subtitle: 'Apply for approval' },
];

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

const formatPhoneCode = (code) => {
    if (!code) return '';
    const trimmed = code.trim();
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
};

export default function Register() {
    const dispatch = useDispatch();
    const { theme, toggleTheme } = useTheme();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [banner, setBanner] = useState(null); // { type, message, reason }

    // GST verification state
    const [gstVerifications, setGstVerifications] = useState([
        { id: Date.now(), gst_number: '', pan_number: '', legal_name: '', state: '', is_verified: false, is_verifying: false, request_id: '', otp_sent: false, otp_value: '', error: null }
    ]);

    // Registration tokens stored after GST OTP verification
    const [emailVerificationToken, setEmailVerificationToken] = useState('');
    const [phoneVerificationToken, setPhoneVerificationToken] = useState('');

    const [isSubmitted, setIsSubmitted] = useState(false);

    const [form, setForm] = useState({
        email: '', phone: '', phone_code: '+91',
        country_id: '',
        company_name: '', 
        brand_name: '',
        brand_logo: '',
        office_locations: [],
        states: [],
        supply_districts: [],
        accept_terms: false,
    });

    const navigate = useNavigate();
    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Load countries on mount
    useEffect(() => {
        auth_api.get_countries()
            .then(r => {
                const list = r.data.data || [];
                setCountries(list);
                // Default to India if found
                const india = list.find(c => c.name.toLowerCase() === 'india' || c.iso2?.toLowerCase() === 'in');
                if (india) {
                    handleCountryChange(india.id, list);
                } else if (list.length > 0) {
                    handleCountryChange(list[0].id, list);
                }
            })
            .catch(() => {});
    }, []);

    const handleCountryChange = (countryId, countriesList = countries) => {
        const selectedCountry = countriesList.find(c => c.id === countryId);
        setForm(f => ({
            ...f,
            country_id: countryId,
            phone_code: selectedCountry ? formatPhoneCode(selectedCountry.phone_code) : '+91',
            states: [],
            supply_districts: [],
            office_locations: []
        }));
        setStatesList([]);
        if (countryId) {
            auth_api.get_states(countryId)
                .then(r => setStatesList(r.data.data || []))
                .catch(() => {});
        }
    };

    // GST row actions
    const handleGstGenerateOtp = async (idx) => {
        const item = gstVerifications[idx];
        if (!item.gst_number || item.gst_number.length !== 15) {
            updateGstItem(idx, { error: 'Please enter a valid 15-digit GSTIN.' });
            return;
        }

        updateGstItem(idx, { is_verifying: true, error: null });

        try {
            const { data } = await auth_api.gst_generate_otp(item.gst_number.trim().toUpperCase());
            updateGstItem(idx, {
                otp_sent: true,
                request_id: data.request_id || (data.data && data.data.request_id) || `mock_${Date.now()}`,
                is_verifying: false
            });
        } catch (err) {
            updateGstItem(idx, {
                is_verifying: false,
                error: err.response?.data?.message || 'Failed to send OTP.'
            });
        }
    };

    const handleGstSubmitOtp = async (idx) => {
        const item = gstVerifications[idx];
        if (!item.otp_value || item.otp_value.length < 4) {
            updateGstItem(idx, { error: 'Please enter the OTP.' });
            return;
        }

        updateGstItem(idx, { is_verifying: true, error: null });

        try {
            const { data } = await auth_api.gst_submit_otp(
                item.request_id,
                item.otp_value,
                item.gst_number.trim().toUpperCase()
            );

            const verifiedGst = data.data;
            const emailVal = verifiedGst.email_id || 'test110@gmail.com';
            const phoneVal = String(verifiedGst.mobile_no || '1234567890');
            const addressVal = data.address || verifiedGst.address || 'Ahmedabad, Gujarat';
            const stateVal = data.state || verifiedGst.state || 'Gujarat';

            // Find matching state ID from statesList
            const matchedState = statesList.find(s => 
                s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === stateVal.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            const stateId = matchedState ? matchedState.id : '';

            // Handle phone number and phone code separation
            let phoneCodeVal = form.phone_code || '+91';
            let phoneNumVal = phoneVal.trim();
            if (phoneNumVal.startsWith('+91') && phoneNumVal.length > 3) {
                phoneCodeVal = '+91';
                phoneNumVal = phoneNumVal.substring(3);
            } else if (phoneNumVal.startsWith('91') && phoneNumVal.length > 10) {
                phoneCodeVal = '+91';
                phoneNumVal = phoneNumVal.substring(2);
            }

            updateGstItem(idx, {
                is_verified: true,
                otp_sent: false,
                is_verifying: false,
                pan_number: verifiedGst.pan_number,
                legal_name: verifiedGst.legal_name || verifiedGst.business_name || '',
                state: stateId || stateVal,
                error: null
            });

            // Auto-fill all registry values
            setForm(f => ({
                ...f,
                company_name: verifiedGst.legal_name || verifiedGst.business_name || '',
                email: emailVal,
                phone: phoneNumVal,
                phone_code: phoneCodeVal,
                states: stateId ? [stateId] : [],
                office_locations: [{
                    address: addressVal,
                    lat: 0,
                    lng: 0,
                    state: stateId || stateVal
                }]
            }));

            // Store signature tokens from backend
            if (data.email_verification_token) {
                setEmailVerificationToken(data.email_verification_token);
            }
            if (data.phone_verification_token) {
                setPhoneVerificationToken(data.phone_verification_token);
            }
        } catch (err) {
            updateGstItem(idx, {
                is_verifying: false,
                error: err.response?.data?.message || 'OTP verification failed.'
            });
        }
    };

    const updateGstItem = (idx, fields) => {
        setGstVerifications(prev => prev.map((item, i) => i === idx ? { ...item, ...fields } : item));
    };

    const validate_step = () => {
        setBanner(null);
        if (currentStep === 1) {
            // Country Selection check
            if (!form.country_id) {
                setBanner({ type: 'error', message: 'Please select your country.' });
                return false;
            }

            const selectedCountry = countries.find(c => c.id === form.country_id);
            const isIndia = selectedCountry?.name?.toLowerCase() === 'india' || selectedCountry?.iso2?.toLowerCase() === 'in';

            if (!isIndia) {
                setBanner({ type: 'error', message: 'Self-registration is currently only available for suppliers in India. Please contact support at info@emergesun.com for other countries.' });
                return false;
            }

            // GSTIN verification check
            if (!gstVerifications[0]?.is_verified) {
                setBanner({ type: 'error', message: 'Please verify the GST number.' });
                return false;
            }

            // Brand details verification
            if (!form.brand_name) {
                setBanner({ type: 'error', message: 'Brand name is required.' });
                return false;
            }
            if (!form.brand_logo) {
                setBanner({ type: 'error', message: 'Brand logo is required.' });
                return false;
            }

            // No password check required at registration anymore
        }
        if (currentStep === 2 && !form.accept_terms) {
            setBanner({ type: 'error', message: 'Please accept the Terms & Conditions to proceed.' });
            return false;
        }
        return true;
    };

    const next_step = () => {
        if (!validate_step()) return;
        setCurrentStep(p => Math.min(p + 1, STEPS.length));
    };
    const prev_step = () => {
        setBanner(null);
        setCurrentStep(p => Math.max(p - 1, 1));
    };

    const handle_submit = async () => {
        if (!validate_step()) return;
        setLoading(true);
        setBanner(null);

        const verifiedGsts = gstVerifications.map(g => ({
            gst_number: g.gst_number.trim().toUpperCase(),
            pan_number: g.pan_number,
            state: g.state,
            is_verified: true
        }));

        try {
            await auth_api.register({
                email:                     form.email.trim().toLowerCase(),
                phone:                     form.phone.trim(),
                phone_code:                form.phone_code,
                country_id:                form.country_id,
                company_name:              form.company_name.trim(),
                brand_name:                form.brand_name.trim(),
                brand_logo:                form.brand_logo,
                office_location:           form.office_locations[0] ? {
                    type: 'Point',
                    coordinates: [form.office_locations[0].lng, form.office_locations[0].lat],
                    address: form.office_locations[0].address
                } : { type: 'Point', coordinates: [0, 0], address: '' },
                office_locations:          form.office_locations,
                states:                    form.states,
                supply_districts:          form.supply_districts,
                gst_list:                  verifiedGsts,
                email_verification_token:  emailVerificationToken,
                phone_verification_token:  phoneVerificationToken
            });
            setIsSubmitted(true);
        } catch (err) {
            const res_data = err.response?.data;
            const status   = res_data?.status;
            const msg = res_data?.message || 'Registration failed. Please try again.';
            dispatch(addAlert({ type: 'error', message: msg }));
            if (status === 'duplicate_pending') {
                setBanner({ type: 'pending', message: res_data.message });
            } else if (status === 'duplicate_rejected') {
                setBanner({ type: 'rejected', message: res_data.message, reason: res_data.reason });
            } else if (status === 'duplicate') {
                setBanner({ type: 'exists', message: res_data.message });
            } else {
                setBanner({ type: 'error', message: msg });
            }
        } finally {
            setLoading(false);
        }
    };

    const render_banner = () => {
        if (!banner) return null;
        const cfg = {
            error:   { icon: <FaExclamationTriangle />, cls: 'bg-danger/5 border-danger/30 text-danger' },
            pending: { icon: <FaClock />,                cls: 'bg-warning/5 border-warning/30 text-warning' },
            rejected:{ icon: <FaTimesCircle />,          cls: 'bg-danger/5 border-danger/30 text-danger' },
            exists:  { icon: <FaExclamationTriangle />,  cls: 'bg-primary/5 border-primary/30 text-primary' },
        };
        const c = cfg[banner.type] || cfg.error;
        return (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 p-4 rounded-2xl border text-sm font-semibold ${c.cls} mb-4`}>
                <span className="shrink-0 mt-0.5">{c.icon}</span>
                <div>
                    <p>{banner.message}</p>
                    {banner.reason && <p className="mt-1 text-xs opacity-80">Reason: {banner.reason}</p>}
                    {banner.type === 'exists' && (
                        <button onClick={() => navigate('/login')} className="mt-1 text-xs underline font-black bg-transparent border-none p-0 cursor-pointer block text-left">Go to Login →</button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 md:p-10 mesh-grid">
            <div className="w-full max-w-5xl bg-surface border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[800px] max-h-[90vh] relative">

                {/* Sidebar */}
                <div className="w-full md:w-80 gradient-primary p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }} />
                    <div className="relative z-10">
                        <img src={logo} alt="EmergeSun" className="w-28 mb-10 invert brightness-0" />
                        <div className="space-y-7">
                            {STEPS.map((step) => (
                                <div key={step.id} className={`flex items-center gap-4 transition-all duration-500 ${currentStep === step.id ? 'translate-x-2' : 'opacity-50 scale-95'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-lg ${currentStep > step.id ? 'bg-white text-primary' : currentStep === step.id ? 'bg-white text-primary' : 'bg-white/20 text-white border border-white/30'}`}>
                                        {currentStep > step.id ? <FaCheck /> : step.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Step 0{step.id}</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{step.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative z-10 pt-10">
                        <p className="text-xs font-bold opacity-60 leading-relaxed italic">
                            "Scale your reach from Residential to Mega-Industrial projects."
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 md:p-12 flex flex-col relative overflow-y-auto">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="absolute top-4 right-4 z-20 p-2.5 rounded-2xl bg-surface-hover/80 backdrop-blur-sm border border-border/50 text-primary hover:text-primary-hover hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group shadow-sm flex items-center justify-center cursor-pointer"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <HiSun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <HiMoon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {isSubmitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-success/10 text-success flex items-center justify-center text-4xl shadow-inner animate-pulse">
                                <FaCheckCircle />
                            </div>
                            <div className="space-y-3 max-w-md">
                                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Application Submitted!</h3>
                                <p className="text-text-secondary text-sm font-semibold leading-relaxed">
                                    Thank you for applying. Your location, verified GST details, email, and phone have been registered successfully. 
                                    Your profile is now under manual administrator review.
                                </p>
                                <p className="text-text-muted text-xs font-medium">
                                    An email notification will be sent to <span className="text-primary font-bold">{form.email}</span> once approval is complete.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => navigate('/login')}
                                variant="primary"
                                className="h-12 px-10 rounded-xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs"
                            >
                                Go to Sign In
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="mb-8 pr-12">
                                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">{STEPS[currentStep - 1].title}</h2>
                                <p className="text-text-muted font-bold text-sm uppercase tracking-wide mt-1">{STEPS[currentStep - 1].subtitle}</p>
                            </div>

                            <div className="flex-1">
                                {render_banner()}

                                <AnimatePresence mode="wait">
                                    {/* Step 1 — Verification & Profile */}
                                    {currentStep === 1 && (
                                        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                            {/* Country Field */}
                                            <div className="flex flex-col w-full">
                                                <label className="text-text-secondary mb-2 font-bold uppercase tracking-widest text-[10px]">Select Country *</label>
                                                <DropdownWithSearchInput
                                                    options={countries.map(c => ({ value: c.id, text: c.name }))}
                                                    value={form.country_id}
                                                    onChange={val => handleCountryChange(val)}
                                                    placeholder="Select country..."
                                                    className="w-full"
                                                />
                                            </div>

                                            {/* Conditional Render based on Country */}
                                            {(() => {
                                                const selectedCountry = countries.find(c => c.id === form.country_id);
                                                const isIndia = selectedCountry?.name?.toLowerCase() === 'india' || selectedCountry?.iso2?.toLowerCase() === 'in';

                                                if (form.country_id && !isIndia) {
                                                    return (
                                                        <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl text-warning text-xs font-semibold">
                                                            ⚠️ Self-registration is currently only available for suppliers in India. Please contact support at info@emergesun.com for other countries.
                                                        </div>
                                                    );
                                                }

                                                if (isIndia) {
                                                    return (
                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-linear-120 from-primary/5 to-primary/10 rounded-xl border border-primary/20 space-y-1">
                                                                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                                                                    💡 GSTIN Verification Required
                                                                </h4>
                                                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                                                    Enter your GST number. This will auto-fill your registered company details, state, and address.
                                                                </p>
                                                            </div>

                                                            {gstVerifications.map((item, idx) => (
                                                                <div key={item.id} className="p-4 bg-surface-hover/50 border border-border rounded-2xl space-y-3 relative">
                                                                    <div className="flex flex-col gap-3">
                                                                        <CustomInput
                                                                            label="GST Number"
                                                                            placeholder="24ABCDE1234A1ZN"
                                                                            value={item.gst_number}
                                                                            onChange={e => updateGstItem(idx, { gst_number: e.target.value.toUpperCase(), error: null })}
                                                                            disabled={item.is_verified || item.otp_sent || item.is_verifying}
                                                                        />
                                                                    </div>

                                                                    {item.error && (
                                                                        <p className="text-xs font-bold text-danger bg-danger/5 border border-danger/25 rounded-xl p-2 flex gap-1 items-center animate-fade-in">
                                                                            <FaExclamationTriangle className="shrink-0" />
                                                                            {item.error}
                                                                        </p>
                                                                    )}

                                                                    {item.otp_sent && (
                                                                        <div className="flex flex-col gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-fade-in">
                                                                            <label className="text-text-secondary font-bold uppercase tracking-widest text-[10px] ml-1">
                                                                                Enter OTP sent to registered mobile/email (Enter 000000)
                                                                            </label>
                                                                            <div className="flex flex-wrap gap-4 items-center">
                                                                                <OTPInput
                                                                                    length={6}
                                                                                    onChange={val => updateGstItem(idx, { otp_value: val, error: null })}
                                                                                />
                                                                                <Button
                                                                                    type="button"
                                                                                    onClick={() => handleGstSubmitOtp(idx)}
                                                                                    loading={item.is_verifying}
                                                                                    className="h-10 px-5"
                                                                                >
                                                                                    Verify OTP
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-between items-center pt-2">
                                                                        {item.is_verified ? (
                                                                            <span className="flex items-center gap-1.5 text-xs text-success font-black uppercase">
                                                                                 <FaCheckCircle size={14} /> 
                                                                                 GSTIN Verified (PAN: {item.pan_number})
                                                                            </span>
                                                                        ) : !item.otp_sent ? (
                                                                            <Button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const stateCode = item.gst_number.substring(0, 2);
                                                                                    const stateName = GST_STATE_CODES[stateCode] || 'Delhi';
                                                                                    updateGstItem(idx, { state: stateName });
                                                                                    handleGstGenerateOtp(idx);
                                                                                }}
                                                                                loading={item.is_verifying}
                                                                                variant="primary"
                                                                                size="sm"
                                                                                disabled={!item.gst_number || item.gst_number.length !== 15}
                                                                                className="font-black uppercase text-xs h-11 px-6 shadow-md"
                                                                            >
                                                                                Verify GSTIN
                                                                            </Button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleGstGenerateOtp(idx)}
                                                                                className="text-xs font-black uppercase text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                                                                            >
                                                                                Resend OTP
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {gstVerifications[0]?.is_verified && (
                                                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-2 border-t border-border/50">
                                                                    
                                                                    <div className="bg-surface-hover/30 rounded-2xl border border-border p-5 space-y-4">
                                                                        <h4 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border pb-2 mb-2">Verified GST registry information</h4>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <CustomInput
                                                                                label="Company Legal Name"
                                                                                value={form.company_name}
                                                                                disabled
                                                                            />
                                                                            <CustomInput
                                                                                label="PAN Number"
                                                                                value={gstVerifications[0].pan_number}
                                                                                disabled
                                                                            />
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <CustomInput
                                                                                label="Registered Email"
                                                                                value={form.email}
                                                                                disabled
                                                                                icon={<FaEnvelope className="text-text-muted" />}
                                                                            />
                                                                            <CustomInput
                                                                                label="Registered Phone"
                                                                                value={`${form.phone_code} ${form.phone}`}
                                                                                disabled
                                                                                icon={<FaPhoneAlt className="text-text-muted" />}
                                                                            />
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <CustomInput
                                                                                label="Registered State"
                                                                                value={statesList.find(s => s.id === form.states[0])?.name || ''}
                                                                                disabled
                                                                            />
                                                                            <CustomInput
                                                                                label="Registered Office Address"
                                                                                value={form.office_locations[0]?.address || ''}
                                                                                disabled
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                                                                        <h4 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border pb-2 mb-2">Brand Profile & Security</h4>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <CustomInput
                                                                                name="brand_name"
                                                                                type="text"
                                                                                label="Brand Name *"
                                                                                placeholder="e.g. EmergeSun Solar"
                                                                                value={form.brand_name}
                                                                                onChange={e => set('brand_name', e.target.value)}
                                                                                icon={<FaBuilding className="text-text-secondary group-focus-within/input:text-primary" />}
                                                                                required
                                                                            />

                                                                            <div className="flex flex-col">
                                                                                <label className="text-text-secondary mb-2 font-bold uppercase tracking-widest text-[10px]">Brand Logo *</label>
                                                                                <div className="flex items-center gap-3">
                                                                                    {form.brand_logo ? (
                                                                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center group/logo">
                                                                                            <img src={form.brand_logo} alt="Logo Preview" className="w-full h-full object-contain" />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => set('brand_logo', '')}
                                                                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer border-none"
                                                                                            >
                                                                                                <FaTrashAlt size={12} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <label className="w-12 h-12 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer bg-surface-hover/20">
                                                                                            <FaPlus className="text-text-muted hover:text-primary" size={14} />
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                className="hidden"
                                                                                                onChange={(e) => {
                                                                                                    const file = e.target.files?.[0];
                                                                                                    if (file) {
                                                                                                        const reader = new FileReader();
                                                                                                        reader.onloadend = () => {
                                                                                                            set('brand_logo', reader.result);
                                                                                                        };
                                                                                                        reader.readAsDataURL(file);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </label>
                                                                                    )}
                                                                                    <div className="flex-1 text-xs text-text-muted font-medium">
                                                                                        {form.brand_logo ? "Logo uploaded" : "Upload brand logo (PNG, JPG)"}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </motion.div>
                                    )}

                                    {/* Step 2 — Review & Apply */}
                                    {currentStep === 2 && (
                                        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                            <div className="bg-surface-hover/50 rounded-2xl border border-border p-6 space-y-3 animate-fade-in">
                                                <h4 className="text-xs font-black text-text-muted uppercase tracking-widest animate-pulse">Application Summary</h4>
                                                <div className="flex items-center gap-3 border-b border-border pb-3 mb-2">
                                                    {form.brand_logo ? (
                                                        <img src={form.brand_logo} alt="Brand Logo" className="w-12 h-12 object-contain rounded-lg border border-border bg-white" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center text-text-muted bg-surface text-xs font-black">LOGO</div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{form.brand_name || 'No Brand Name'}</p>
                                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Brand Name</p>
                                                    </div>
                                                </div>
                                                {[
                                                    ['Company Legal Name', form.company_name || 'Not verified'],
                                                    ['Email (GST Linked)', form.email],
                                                    ['Phone (GST Linked)', `${form.phone_code} ${form.phone}`],
                                                    ['Country', countries.find(c => c.id === form.country_id)?.name || 'Not selected'],
                                                    ['Coverage State', statesList.find(s => s.id === form.states[0])?.name || 'N/A'],
                                                    ['Office Address', form.office_locations[0]?.address || 'Not added'],
                                                    ['GSTIN Verified', `${gstVerifications[0]?.gst_number || 'N/A'} (PAN: ${gstVerifications[0]?.pan_number || 'N/A'})`],
                                                ].map(([label, value]) => (
                                                    <div key={label} className="flex justify-between items-start gap-4">
                                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</span>
                                                        <span className="text-xs font-black text-text-primary text-right max-w-[60%]">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={form.accept_terms}
                                                    onChange={e => set('accept_terms', e.target.checked)}
                                                    className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">
                                                    I confirm that all information provided is accurate and I agree to the{' '}
                                                    <a href="#" className="text-primary underline">EmergeSun Supplier Terms of Service</a> and Code of Conduct.
                                                </span>
                                            </label>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
                                <Button
                                    type="button" onClick={prev_step} variant="ghost"
                                    className={`font-black uppercase tracking-widest text-xs h-12 px-8 ${currentStep === 1 ? 'invisible' : ''}`}
                                    leftIcon={<FaChevronLeft />}
                                >
                                    Back
                                </Button>
                                {currentStep < 2 ? (
                                    <Button
                                        type="button" onClick={next_step} variant="primary"
                                        className="font-black uppercase tracking-widest text-xs h-12 px-10 rounded-xl shadow-xl shadow-primary/20"
                                        rightIcon={<FaChevronRight />}
                                        disabled={!gstVerifications[0]?.is_verified}
                                    >
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button
                                        type="button" onClick={handle_submit} variant="primary" loading={loading}
                                        className="font-black uppercase tracking-widest text-xs h-12 px-10 rounded-xl shadow-xl shadow-primary/20"
                                        rightIcon={<FaCheck />}
                                    >
                                        {loading ? 'Submitting...' : 'Complete Application'}
                                    </Button>
                                )}
                            </div>

                            <p className="text-center text-xs font-bold text-text-secondary mt-4">
                                Already registered?{' '}
                                <button onClick={() => navigate('/login')} className="text-primary hover:underline font-black uppercase tracking-tighter bg-transparent border-none p-0 cursor-pointer">
                                    Sign In
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
