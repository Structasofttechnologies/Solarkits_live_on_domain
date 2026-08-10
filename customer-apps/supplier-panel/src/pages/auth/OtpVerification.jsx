import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/alert.slice';
import { FaShieldAlt, FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../../components/Button';
import AuthLayout from '../../components/auth/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { auth_api } from '../../features/supplier.api';

const OTP_LENGTH = 6;

export default function OtpVerification() {
    const dispatch  = useDispatch();
    const navigate  = useNavigate();
    const location  = useLocation();

    // State passed from Register or Login page
    const { token, email, phone, phone_code, gst_number, purpose = 'verify' } = location.state || {};

    const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(''));
    const [timer, setTimer]     = useState(180); // 3 minutes
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [success, setSuccess] = useState(false);
    const inputs                = useRef([]);

    // Countdown
    useEffect(() => {
        const iv = setInterval(() => setTimer(p => Math.max(p - 1, 0)), 1000);
        return () => clearInterval(iv);
    }, []);

    // Redirect if no token or identifier passed
    useEffect(() => {
        if (!token || (!email && !phone)) {
            navigate('/auth/register', { replace: true });
        }
    }, [token, email, phone, navigate]);

    const handleChange = (idx, val) => {
        if (!/^\d*$/.test(val)) return;
        const n = [...otp];
        n[idx] = val.slice(-1);
        setOtp(n);
        if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!paste) return;
        const n = [...otp];
        paste.split('').forEach((d, i) => { if (i < OTP_LENGTH) n[i] = d; });
        setOtp(n);
        inputs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
        e.preventDefault();
    };

    const handle_verify = async () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            setError('Please enter the complete 6-digit code.');
            return;
        }
        if (token === 'pending_verification') {
            setError('Please request a new code first.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await auth_api.verify_otp(token, code);
            setSuccess(true);
            // Navigate to set-passcode with the passcode_token
            setTimeout(() => {
                navigate('/auth/set-passcode', {
                    state: { passcode_token: data.passcode_token, purpose: data.purpose, email, phone, phone_code }
                });
            }, 1000);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'OTP verification failed. Please try again.';
            setError(errMsg);
            dispatch(addAlert({ type: 'error', message: errMsg }));
        } finally {
            setLoading(false);
        }
    };

    const handle_resend = async () => {
        if (timer > 0 && token !== 'pending_verification') return;
        setLoading(true);
        setError(null);
        try {
            let data;
            if (purpose === 'verify') {
                const res = await auth_api.request_verify_otp(email, gst_number);
                data = res.data;
            } else {
                const payload = email
                    ? { email: email.trim().toLowerCase() }
                    : { phone: phone.trim(), phone_code: phone_code.trim() };
                const res = await auth_api.request_forgot_password_otp(payload);
                data = res.data;
            }
            // Update location state token via navigate
            navigate('/auth/otp-verify', { state: { token: data.token, email, phone, phone_code, purpose }, replace: true });
            setOtp(Array(OTP_LENGTH).fill(''));
            setTimer(180);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to resend OTP.';
            setError(errMsg);
            dispatch(addAlert({ type: 'error', message: errMsg }));
        } finally {
            setLoading(false);
        }
    };

    const fmt_time = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <AuthLayout
            title={success ? 'Verified!' : 'Security Verification'}
            subtitle={success ? 'Redirecting to passcode step...' : email ? 'Verify your email address to continue.' : 'Verify your phone number to continue.'}
            footerText="Need help onboarding?"
            footerLink="mailto:support@emergesun.com"
            footerLinkText="Contact Support"
        >
            <div className="text-center space-y-6">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner transition-colors duration-300 ${success ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {success ? <FaCheckCircle /> : <FaShieldAlt />}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                        {success 
                            ? (email ? 'Email Verified' : 'Phone Verified') 
                            : (email ? 'Verify Email' : 'Verify Phone')}
                    </h2>
                    <p className="text-text-secondary font-medium text-sm">
                        {success
                            ? email 
                                ? 'Your email has been verified successfully.'
                                : 'Your phone number has been verified successfully.'
                            : email
                                ? <>We've sent a 6-digit code to <span className="text-primary font-black">{email}</span>.</>
                                : <>We've sent a 6-digit code to <span className="text-primary font-black">{phone_code} {phone}</span>.</>
                        }
                    </p>
                </div>

                {!success && (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputs.current[idx] = el}
                                    id={`otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(idx, e.target.value)}
                                    onKeyDown={e => handleKeyDown(idx, e)}
                                    disabled={loading}
                                    className={`w-11 h-13 bg-surface-hover border-2 rounded-xl text-center text-lg font-black text-text-primary outline-none transition-all ${digit ? 'border-primary/40 bg-primary/5' : 'border-border focus:border-primary'}`}
                                />
                            ))}
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -8 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0 }}
                                    className="text-xs font-bold text-danger bg-danger/5 border border-danger/20 rounded-xl p-3 flex gap-2 items-center justify-center"
                                >
                                    <FaExclamationTriangle className="shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            variant="primary" 
                            fullWidth 
                            loading={loading}
                            onClick={handle_verify}
                            disabled={token === 'pending_verification'}
                            className="h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </Button>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-text-muted">
                                {token === 'pending_verification'
                                    ? 'A verification code is required. Click below to request one.'
                                    : timer > 0
                                        ? <>Code expires in <span className="text-primary font-black">{fmt_time(timer)}</span></>
                                        : 'Code has expired.'}
                             </p>
                             <button
                                onClick={handle_resend}
                                type="button"
                                disabled={(timer > 0 && token !== 'pending_verification') || loading}
                                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest mx-auto transition-colors bg-transparent border-none p-0 cursor-pointer ${
                                    (timer > 0 && token !== 'pending_verification') || loading 
                                        ? 'text-text-muted cursor-not-allowed' 
                                        : 'text-primary hover:underline'
                                }`}
                             >
                                <FaSync className={loading ? 'animate-spin' : ''} /> 
                                {token === 'pending_verification' ? 'Request Code' : 'Resend Code'}
                             </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
