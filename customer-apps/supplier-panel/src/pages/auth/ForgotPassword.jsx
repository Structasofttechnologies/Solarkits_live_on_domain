import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaEnvelope, FaArrowLeft, FaExclamationTriangle, FaPhone } from 'react-icons/fa';
import { addAlert } from '../../features/alert.slice';
import Button from '../../components/Button';
import CustomInput from '../../components/CustomInput';
import DropdownWithSearchInput from '../../components/DropdownWithSearchInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { auth_api } from '../../features/supplier.api';

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const [authType, setAuthType] = useState('email');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Phone auth states
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [minPhoneLength, setMinPhoneLength] = useState(null);
    const [maxPhoneLength, setMaxPhoneLength] = useState(null);

    // Fetch countries list for phone forgot passcode
    useEffect(() => {
        if (authType === 'phone' && countries.length === 0) {
            auth_api.get_countries()
                .then(res => {
                    const list = res.data.data || [];
                    setCountries(list);
                    const india = list.find(c => c.name.toLowerCase() === 'india' || c.iso2?.toLowerCase() === 'in');
                    if (india) {
                        handleCountryChange(india);
                    } else if (list.length > 0) {
                        handleCountryChange(list[0]);
                    }
                })
                .catch(() => {});
        }
    }, [authType, countries.length]);

    const handleCountryChange = (country) => {
        setSelectedCountry(country.id);
        const code = country.phone_code.startsWith('+') ? country.phone_code : `+${country.phone_code}`;
        setPhoneCode(code);
        setMinPhoneLength(country.min_phone_length);
        setMaxPhoneLength(country.max_phone_length);
        setPhone('');
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (!maxPhoneLength || value.length <= maxPhoneLength) {
            setPhone(value);
        }
    };

    const onCountrySelectChange = (countryId) => {
        const country = countries.find(c => c.id === countryId);
        if (country) {
            handleCountryChange(country);
        }
    };

    const handle_submit = async (e) => {
        e.preventDefault();
        setError(null);

        if (authType === 'email') {
            if (!email) { 
                setError('Please enter your email address.'); 
                return; 
            }
        } else {
            if (!phone || !selectedCountry) {
                setError('Phone number and country are required.');
                return;
            }
            if (minPhoneLength && phone.length < minPhoneLength) {
                setError(`Phone number must be at least ${minPhoneLength} digits.`);
                return;
            }
            if (maxPhoneLength && phone.length > maxPhoneLength) {
                setError(`Phone number cannot exceed ${maxPhoneLength} digits.`);
                return;
            }
        }

        setLoading(true);
        try {
            const payload = authType === 'email'
                ? { email: email.trim().toLowerCase() }
                : { phone: phone.trim(), phone_code: phoneCode };

            const { data } = await auth_api.request_forgot_password_otp(payload);
            
            // Navigate to OTP verify with the token and details
            navigate('/auth/otp-verify', {
                state: { 
                    token: data.token, 
                    email: authType === 'email' ? email.trim().toLowerCase() : null, 
                    phone: authType === 'phone' ? phone.trim() : null,
                    phone_code: authType === 'phone' ? phoneCode : null,
                    purpose: 'forgot_password' 
                }
            });
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
            setError(errMsg);
            dispatch(addAlert({ type: 'error', message: errMsg }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Passcode"
            subtitle="Get back into your account securely."
            footerText="Remembered passcode?"
            footerLink="/login"
            footerLinkText="Sign In"
        >
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-xs font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer"
                >
                    <FaArrowLeft /> Back to Login
                </button>

                <div className="flex gap-2 p-1 bg-surface-hover rounded-xl mb-4 border border-border/50">
                    <button
                        type="button"
                        onClick={() => { setAuthType('email'); setError(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${authType === 'email' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/80'}`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthType('phone'); setError(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${authType === 'phone' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover/80'}`}
                    >
                        Phone
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -8 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0 }}
                            className="p-4 rounded-2xl border bg-danger/5 border-danger/30 text-danger text-sm font-semibold flex gap-2 items-center"
                        >
                            <FaExclamationTriangle className="shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handle_submit} className="space-y-4">
                    {authType === 'email' ? (
                        <CustomInput
                            name="email"
                            type="email"
                            label="Corporate Email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            icon={<FaEnvelope className="text-text-secondary group-focus-within/input:text-primary" />}
                            required
                            disabled={loading}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col w-full animate-fade-in">
                                <label className="text-text-secondary mb-2 font-bold uppercase tracking-widest text-[10px]">Select Country *</label>
                                <DropdownWithSearchInput
                                    options={countries.map(c => ({
                                        value: c.id,
                                        text: `${c.phone_code ? `(+${c.phone_code.replace('+', '')})` : ''} ${c.name}`
                                    }))}
                                    value={selectedCountry}
                                    onChange={onCountrySelectChange}
                                    placeholder="Select country..."
                                    disabled={loading}
                                    className="w-full"
                                />
                            </div>

                            <CustomInput
                                name="phone"
                                type="tel"
                                label="Phone Number *"
                                placeholder={minPhoneLength ? `Phone number (${minPhoneLength}-${maxPhoneLength} digits)` : 'Enter phone number'}
                                value={phone}
                                onChange={handlePhoneChange}
                                prefix={phoneCode || null}
                                icon={<FaPhone className="text-text-secondary group-focus-within/input:text-primary" />}
                                required
                                disabled={loading || !selectedCountry}
                            />

                            {minPhoneLength && (
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider animate-fade-in">
                                    {minPhoneLength === maxPhoneLength
                                        ? `Must be exactly ${minPhoneLength} digits`
                                        : `Must be between ${minPhoneLength} and ${maxPhoneLength} digits`}
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit" 
                        variant="primary" 
                        fullWidth 
                        loading={loading}
                        className="h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
