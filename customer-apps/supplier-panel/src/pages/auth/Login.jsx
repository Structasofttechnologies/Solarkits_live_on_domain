import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginStart, loginFailure } from '../../features/auth.slice';
import { addAlert } from '../../features/alert.slice';
import { auth_api } from '../../features/supplier.api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaExclamationTriangle, FaClock, FaTimesCircle, FaGlobe, FaPhone } from 'react-icons/fa';
import Button from '../../components/Button';
import CustomInput from '../../components/CustomInput';
import DropdownWithSearchInput from '../../components/DropdownWithSearchInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [authType, setAuthType] = useState('email');
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // { type, message, reason }
    
    // Phone auth states
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [minPhoneLength, setMinPhoneLength] = useState(null);
    const [maxPhoneLength, setMaxPhoneLength] = useState(null);

    const navigate  = useNavigate();
    const dispatch  = useDispatch();

    const testCredentials = (() => {
        try {
            const creds = import.meta.env.VITE_LOGIN_CREDENTIALS;
            return creds ? JSON.parse(creds.replace(/'/g, '"')) : [];
        } catch (e) {
            console.error("Failed to parse VITE_LOGIN_CREDENTIALS", e);
            return [];
        }
    })();

    const handleDirectLogin = async (cred) => {
        setEmail(cred.email);
        setPasscode(cred.password);
        setAuthType('email');
        setError(null);
        setLoading(true);
        dispatch(loginStart());

        try {
            const payload = { email: cred.email, passcode: cred.password };
            const { data } = await auth_api.login(payload);
            dispatch(loginSuccess({ token: data.token, supplier: data.supplier }));
            navigate('/dashboard/home', { replace: true });
        } catch (err) {
            const res_data = err.response?.data;
            dispatch(loginFailure(res_data?.message || 'Login failed'));
            setError({ type: 'error', message: res_data?.message || 'Direct Login failed.' });
        } finally {
            setLoading(false);
        }
    };

    const DirectLoginCard = () => {
        if (!testCredentials || testCredentials.length === 0) return null;

        return (
            <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3 text-center">
                    Developer Testing Access
                </p>
                <div className="grid grid-cols-1 gap-2">
                    {testCredentials.map((cred, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleDirectLogin(cred)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-hover/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span className="text-[10px] font-black uppercase text-primary">DEV</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h6 className="font-semibold text-text-primary text-xs truncate">{cred.role}</h6>
                                <p className="text-[10px] font-bold text-text-secondary truncate mt-0.5">{cred.email}</p>
                                <p className="text-[9px] text-text-muted mt-0.5">Click for instant login access</p>
                            </div>
                            <FaArrowRight className="w-3 h-3 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Fetch countries list for phone login
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

    const handle_login = async (e) => {
        e.preventDefault();
        setError(null);

        if (authType === 'email') {
            if (!email || !passcode) {
                setError({ type: 'error', message: 'Email and passcode are required.' });
                return;
            }
        } else {
            if (!phone || !passcode || !selectedCountry) {
                setError({ type: 'error', message: 'Phone, country, and passcode are required.' });
                return;
            }
            if (minPhoneLength && phone.length < minPhoneLength) {
                setError({ type: 'error', message: `Phone number must be at least ${minPhoneLength} digits.` });
                return;
            }
            if (maxPhoneLength && phone.length > maxPhoneLength) {
                setError({ type: 'error', message: `Phone number cannot exceed ${maxPhoneLength} digits.` });
                return;
            }
        }

        setLoading(true);
        dispatch(loginStart());

        try {
            const payload = authType === 'email'
                ? { email: email.trim().toLowerCase(), passcode }
                : { phone: phone.trim(), phone_code: phoneCode, passcode };

            const { data } = await auth_api.login(payload);
            
            if (data.status === 'multiple_accounts') {
                dispatch(loginFailure('Multiple accounts found. Please select one.'));
                navigate('/auth/choose-account', {
                    state: {
                        accounts: data.accounts,
                        passcode,
                        email: authType === 'email' ? email.trim().toLowerCase() : null,
                        phone: authType === 'phone' ? phone.trim() : null,
                        phone_code: authType === 'phone' ? phoneCode : null
                    }
                });
                return;
            }

            dispatch(loginSuccess({ token: data.token, supplier: data.supplier }));
            dispatch(addAlert({ type: 'success', message: 'Logged in successfully.' }));
            navigate('/dashboard/home', { replace: true });
        } catch (err) {
            const res_data = err.response?.data;
            const status   = res_data?.status;
            const errMsg   = res_data?.message || 'Login failed. Please try again.';

            dispatch(loginFailure(errMsg));
            dispatch(addAlert({ type: 'error', message: errMsg }));

            if (status === 'unverified') {
                setError({
                    type: 'unverified',
                    message: authType === 'email'
                        ? 'Please verify your email before logging in.'
                        : 'Please verify your phone number before logging in.'
                });
            } else if (status === 'rejected') {
                setError({ type: 'rejected', message: res_data?.message, reason: res_data?.reason });
            } else if (status === 'pending') {
                setError({ type: 'pending', message: 'Your account is still under review.' });
            } else {
                setError({ type: 'error', message: errMsg });
            }
        } finally {
            setLoading(false);
        }
    };

    const render_error_banner = () => {
        if (!error) return null;
        const icons = {
            pending:   <FaClock className="text-warning shrink-0 mt-0.5" />,
            rejected:  <FaTimesCircle className="text-danger shrink-0 mt-0.5" />,
            unverified:<FaExclamationTriangle className="text-warning shrink-0 mt-0.5" />,
            error:     <FaExclamationTriangle className="text-danger shrink-0 mt-0.5" />,
        };
        const colors = {
            pending:   'bg-warning/5 border-warning/30 text-warning',
            rejected:  'bg-danger/5 border-danger/30 text-danger',
            unverified:'bg-warning/5 border-warning/30 text-warning',
            error:     'bg-danger/5 border-danger/30 text-danger',
        };
        return (
            <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 p-4 rounded-2xl border text-sm font-semibold ${colors[error.type] || colors.error} mb-5`}
            >
                {icons[error.type] || icons.error}
                <div>
                    <p>{error.message}</p>
                    {error.type === 'rejected' && error.reason && (
                        <p className="mt-1 text-xs opacity-80">Reason: {error.reason}</p>
                    )}
                    {error.type === 'unverified' && authType === 'email' && (
                        <button
                            type="button"
                            onClick={() => navigate('/auth/otp-verify', { state: { token: 'pending_verification', email, purpose: 'verify' } })}
                            className="mt-1 text-xs underline font-black bg-transparent border-none p-0 cursor-pointer text-left block"
                        >
                            Verify email now →
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <AuthLayout
            title="EmergeSun Ecosystem"
            subtitle="Secure access to your supplier panel with state-of-the-art management tools."
            footerText="New to EmergeSun?"
            footerLink="/auth/register"
            footerLinkText="Apply for onboarding"
        >
            <form onSubmit={handle_login} className="space-y-5">
                <AnimatePresence>{render_error_banner()}</AnimatePresence>

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

                {authType === 'email' ? (
                    <CustomInput
                        name="email"
                        type="email"
                        label="Corporate Email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                {minPhoneLength === maxPhoneLength
                                    ? `Must be exactly ${minPhoneLength} digits`
                                    : `Must be between ${minPhoneLength} and ${maxPhoneLength} digits`}
                            </p>
                        )}
                    </div>
                )}

                <CustomInput
                    name="passcode"
                    type={showPassword ? 'text' : 'password'}
                    label="Passcode"
                    placeholder="••••••••"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                    required
                    disabled={loading}
                    suffix={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-muted hover:text-primary transition-colors focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                        >
                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                    }
                />

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => navigate('/auth/activate-account')}
                        className="text-xs font-black text-primary hover:underline uppercase tracking-tighter bg-transparent border-none p-0 cursor-pointer"
                    >
                        Activate Account
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/auth/forgot-password')}
                        className="text-xs font-black text-primary hover:underline uppercase tracking-tighter bg-transparent border-none p-0 cursor-pointer"
                    >
                        Forgot Passcode?
                    </button>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    className="h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                    rightIcon={<FaArrowRight />}
                >
                    {loading ? 'Signing In...' : 'Launch Dashboard'}
                </Button>
                <DirectLoginCard />
            </form>
        </AuthLayout>
    );
}
