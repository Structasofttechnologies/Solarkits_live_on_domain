import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/auth.slice';
import { addAlert } from '../../features/alert.slice';
import { auth_api } from '../../features/supplier.api';
import { FaLock, FaCheckCircle, FaEye, FaEyeSlash, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../../components/Button';
import CustomInput from '../../components/CustomInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function SetPasscode() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const dispatch  = useDispatch();

    const { passcode_token, purpose, email } = location.state || {};

    const [passcode,         setPasscode]         = useState('');
    const [confirm_passcode, setConfirmPasscode]  = useState('');
    const [showPass,         setShowPass]          = useState(false);
    const [loading,          setLoading]           = useState(false);
    const [error,            setError]             = useState(null);
    const [success,          setSuccess]           = useState(false);

    useEffect(() => {
        if (!passcode_token) {
            navigate('/auth/register', { replace: true });
        }
    }, [passcode_token, navigate]);

    if (!passcode_token) {
        return null;
    }

    const handle_submit = async (e) => {
        e.preventDefault();
        if (!passcode || !confirm_passcode) {
            setError('Please enter and confirm your passcode.');
            return;
        }
        if (passcode !== confirm_passcode) {
            setError('Passcodes do not match.');
            return;
        }
        if (passcode.length < 4) {
            setError('Passcode must be at least 4 characters.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await auth_api.set_passcode(passcode_token, passcode, confirm_passcode);
            dispatch(loginSuccess({ token: data.token, supplier: data.supplier }));
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/home', { replace: true }), 1200);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to set passcode. Please try again.';
            setError(errMsg);
            dispatch(addAlert({ type: 'error', message: errMsg }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={success ? 'Saved!' : purpose === 'forgot_password' ? 'Reset Passcode' : 'Secure Account'}
            subtitle={success ? 'Setting up your session...' : 'Configure a secure 4-digit or longer passcode.'}
            footerText="Need help onboarding?"
            footerLink="mailto:support@emergesun.com"
            footerLinkText="Contact Support"
        >
            <div className="space-y-6">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner transition-colors duration-300 ${success ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {success ? <FaCheckCircle /> : <FaLock />}
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                        {purpose === 'forgot_password' ? 'Reset Passcode' : 'Set Your Passcode'}
                    </h2>
                    <p className="text-text-secondary font-medium text-sm mt-2">
                        {success
                            ? 'Passcode set! Launching your workspace...'
                            : purpose === 'forgot_password'
                                ? 'Choose a new passcode for your account.'
                                : 'Create a secure passcode to access your supplier portal.'
                        }
                    </p>
                </div>

                {!success && (
                    <form onSubmit={handle_submit} className="space-y-5">
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

                        <CustomInput
                            name="passcode"
                            type={showPass ? 'text' : 'password'}
                            label="New Passcode"
                            placeholder="Minimum 4 characters"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value)}
                            icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                            required
                            disabled={loading}
                            minLength={4}
                            suffix={
                                <button 
                                    type="button" 
                                    onClick={() => setShowPass(!showPass)}
                                    className="text-text-muted hover:text-primary transition-colors focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                                >
                                    {showPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            }
                        />

                        <CustomInput
                            name="confirm_passcode"
                            type={showPass ? 'text' : 'password'}
                            label="Confirm Passcode"
                            placeholder="Repeat your passcode"
                            value={confirm_passcode}
                            onChange={e => setConfirmPasscode(e.target.value)}
                            icon={<FaLock className="text-text-secondary group-focus-within/input:text-primary" />}
                            required
                            disabled={loading}
                        />

                        <Button
                            type="submit" 
                            variant="primary" 
                            fullWidth 
                            loading={loading}
                            className="h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                            rightIcon={<FaArrowRight />}
                        >
                            {loading ? 'Saving...' : 'Set Passcode & Launch'}
                        </Button>
                    </form>
                )}
            </div>
        </AuthLayout>
    );
}
