import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaEnvelope, FaArrowLeft, FaExclamationTriangle, FaClock, FaTimesCircle } from 'react-icons/fa';
import Button from '../../components/Button';
import CustomInput from '../../components/CustomInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { auth_api } from '../../features/supplier.api';
import { addAlert } from '../../features/alert.slice';

export default function ActivateAccount() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Read initial email/gst from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const queryEmail = searchParams.get('email') || '';
    const queryGst = searchParams.get('gst') || '';

    const [email, setEmail] = useState(queryEmail);
    const [gstNumber, setGstNumber] = useState(queryGst);
    const [loading, setLoading] = useState(false);
    const [statusError, setStatusError] = useState(null); // For pending/rejected states
    const [error, setError] = useState(null);

    const handle_submit = async (e) => {
        e.preventDefault();
        setError(null);
        setStatusError(null);

        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await auth_api.request_verify_otp(email.trim().toLowerCase(), gstNumber.trim().toUpperCase());
            
            dispatch(addAlert({ type: 'success', message: 'Verification OTP sent to your email.' }));
            
            // Navigate to OTP verify
            navigate('/auth/otp-verify', {
                state: {
                    token: data.token,
                    email: email.trim().toLowerCase(),
                    gst_number: gstNumber.trim().toUpperCase(),
                    purpose: 'verify'
                }
            });
        } catch (err) {
            const res_data = err.response?.data;
            const status = res_data?.status;

            if (status === 'pending') {
                setStatusError({ type: 'pending', message: 'Your supplier registration application is still under review.' });
            } else if (status === 'rejected') {
                setStatusError({ type: 'rejected', message: 'Your application has been rejected.', reason: res_data.reason });
            } else {
                const errMsg = res_data?.message || 'Failed to request activation. Please contact support.';
                setError(errMsg);
                dispatch(addAlert({ type: 'error', message: errMsg }));
            }
        } finally {
            setLoading(false);
        }
    };

    const render_status_banner = () => {
        if (!statusError) return null;
        const isPending = statusError.type === 'pending';
        return (
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 p-4 rounded-2xl border text-sm font-semibold mb-5 ${
                    isPending ? 'bg-warning/5 border-warning/30 text-warning' : 'bg-danger/5 border-danger/30 text-danger'
                }`}
            >
                {isPending ? <FaClock className="shrink-0 mt-0.5" /> : <FaTimesCircle className="shrink-0 mt-0.5" />}
                <div>
                    <p>{statusError.message}</p>
                    {!isPending && statusError.reason && (
                        <p className="mt-1 text-xs opacity-80">Reason: {statusError.reason}</p>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <AuthLayout
            title="Activate Account"
            subtitle="Verify and set up passcode after application approval."
            footerText="Already activated?"
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

                {render_status_banner()}

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
                    <CustomInput
                        name="email"
                        type="email"
                        label="Registered Corporate Email *"
                        placeholder="name@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        icon={<FaEnvelope className="text-text-secondary group-focus-within/input:text-primary" />}
                        required
                        disabled={loading}
                    />

                    <CustomInput
                        name="gstNumber"
                        type="text"
                        label="GSTIN Number (Optional)"
                        placeholder="15-digit GSTIN (if multiple businesses)"
                        value={gstNumber}
                        onChange={e => setGstNumber(e.target.value.toUpperCase())}
                        disabled={loading}
                        maxLength={15}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                        className="h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                    >
                        {loading ? 'Requesting...' : 'Request Verification Code'}
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
