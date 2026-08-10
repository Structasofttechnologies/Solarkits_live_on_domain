import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HiBriefcase, HiArrowRight, HiSparkles, HiArrowLeft } from 'react-icons/hi2';
import { FaExclamationTriangle } from 'react-icons/fa';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/Button';
import { auth_api } from '../../features/supplier.api';
import { loginSuccess, loginFailure } from '../../features/auth.slice';
import { addAlert } from '../../features/alert.slice';
import { motion } from 'framer-motion';

export default function ChooseAccount() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { accounts = [], passcode, email, phone, phone_code } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!accounts || accounts.length === 0) {
            navigate('/login', { replace: true });
        }
    }, [accounts, navigate]);

    if (!accounts || accounts.length === 0) {
        return null;
    }

    const handleSelectAccount = async (supplierId) => {
        setLoading(true);
        setError(null);

        try {
            const payload = email
                ? { email: email.trim().toLowerCase(), passcode, supplier_id: supplierId }
                : { phone: phone.trim(), phone_code: phone_code.trim(), passcode, supplier_id: supplierId };

            const { data } = await auth_api.login(payload);
            
            dispatch(loginSuccess({ token: data.token, supplier: data.supplier }));
            dispatch(addAlert({ type: 'success', message: 'Logged in successfully.' }));
            
            navigate('/dashboard/home', { replace: true });
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errMsg);
            dispatch(loginFailure(errMsg));
            dispatch(addAlert({ type: 'error', message: errMsg }));
        } finally {
            setLoading(false);
        }
    };

    // Helper avatar url
    const getAvatarUrl = (name, size = 48) => {
        return `https://ui-avatars.com/api/?background=263880&color=fff&name=${encodeURIComponent(name || 'Supplier')}&bold=true&size=${size}`;
    };

    return (
        <AuthLayout
            title="Switch Workspace"
            subtitle="Multiple businesses detected under this credential."
            footerText="Use different account?"
            footerLink="/login"
            footerLinkText="Sign In"
        >
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-xs font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer"
                >
                    <HiArrowLeft /> Back to Login
                </button>

                <div className="text-center mb-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                        <HiSparkles className="w-3.5 h-3.5" />
                        <span>Select Business</span>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-danger/5 border border-danger/30 text-danger text-xs font-semibold flex gap-2.5 items-center">
                        <FaExclamationTriangle className="shrink-0 text-base" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {accounts.map((acc) => (
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            key={acc.id}
                            onClick={() => !loading && handleSelectAccount(acc.id)}
                            disabled={loading}
                            className="w-full text-left p-4 rounded-2xl border border-border/80 bg-surface hover:border-primary/50 hover:bg-surface-hover/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border shrink-0">
                                    <img
                                        src={acc.brand_logo || getAvatarUrl(acc.brand_name || acc.company_name, 48)}
                                        alt={acc.brand_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-text-primary group-hover:text-primary transition-colors truncate">
                                        {acc.brand_name || acc.company_name}
                                    </h4>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5 truncate">
                                        {acc.company_name}
                                    </p>
                                    <p className="text-[9px] text-text-muted font-semibold mt-0.5 truncate uppercase">
                                        GSTIN: {acc.gst_number || 'N/A'} • PAN: {acc.pan_number || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <span className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                <HiArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </AuthLayout>
    );
}
