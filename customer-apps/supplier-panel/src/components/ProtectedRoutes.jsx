import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { fetch_me, refresh_token, logout_user, check_warehouse_coverage } from '@/features/auth.slice';
import Loader from '@/components/Loader';
import { FaWifi } from 'react-icons/fa';

export default function ProtectedRoutes() {
    const dispatch  = useDispatch();
    const location  = useLocation();

    const { supplier, loading, token, warehouseCoverage, activeWarehouse } = useSelector((state) => state.auth_slice);

    const retryTimer   = useRef(null);

    const [fetchDone,    setFetchDone]    = useState(false);
    const [serverError,  setServerError]  = useState(false);
    const [checkingCoverage, setCheckingCoverage] = useState(false);

    useEffect(() => {
        let mounted = true;

        const doFetch = async () => {
            try {
                setServerError(false);
                if (token) {
                    try {
                        await dispatch(fetch_me()).unwrap();
                    } catch (fetchErr) {
                        if (fetchErr && (fetchErr.status === 401 || fetchErr.status === 403)) {
                            const newToken = await dispatch(refresh_token()).unwrap();
                            if (newToken) {
                                await dispatch(fetch_me()).unwrap();
                            } else {
                                throw fetchErr;
                            }
                        } else {
                            throw fetchErr;
                        }
                    }
                } else {
                    // Try refresh cookie before giving up
                    const newToken = await dispatch(refresh_token()).unwrap();
                    if (newToken) {
                        await dispatch(fetch_me()).unwrap();
                    } else {
                        if (mounted) setFetchDone(true);
                        return;
                    }
                }
                if (mounted) setFetchDone(true);
                if (retryTimer.current) { clearInterval(retryTimer.current); retryTimer.current = null; }
            } catch (err) {
                const isServerDown = !err || !err.status || err.message === 'Network Error' || (typeof err.message === 'string' && err.message.includes('Network'));
                if (!mounted) return;
                if (isServerDown) {
                    setServerError(true);
                    if (!retryTimer.current) {
                        retryTimer.current = setInterval(async () => {
                            try {
                                await dispatch(fetch_me()).unwrap();
                                if (!mounted) return;
                                setServerError(false);
                                setFetchDone(true);
                                clearInterval(retryTimer.current);
                                retryTimer.current = null;
                            } catch (_) { /* keep retrying */ }
                        }, 5000);
                    }
                } else {
                    // Auth failed — redirect to login
                    dispatch(logout_user());
                    if (mounted) setFetchDone(true);
                }
            }
        };

        doFetch();
        return () => {
            mounted = false;
            if (retryTimer.current) { clearInterval(retryTimer.current); retryTimer.current = null; }
        };
    }, [dispatch]);

    useEffect(() => {
        if (supplier?.status === 'approved' && !warehouseCoverage && !checkingCoverage && token) {
            setCheckingCoverage(true);
            dispatch(check_warehouse_coverage())
                .unwrap()
                .finally(() => setCheckingCoverage(false));
        }
    }, [supplier, warehouseCoverage, checkingCoverage, token, dispatch]);

    if (serverError) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center p-6">
                <FaWifi className="text-4xl text-text-muted" />
                <h2 className="text-xl font-black text-text-primary">Server Not Reachable</h2>
                <p className="text-text-secondary font-semibold text-sm">Retrying connection every 5 seconds...</p>
            </div>
        );
    }

    if (!fetchDone || loading) return <Loader />;

    if (!supplier) {
        return <Navigate to="/login" replace />;
    }

    const status = supplier.status;
    if (status === 'pending') {
        if (location.pathname !== '/dashboard/pending') {
            return <Navigate to="/dashboard/pending" replace />;
        }
    } else if (status === 'rejected') {
        if (location.pathname !== '/dashboard/rejected') {
            return <Navigate to="/dashboard/rejected" replace />;
        }
    } else if (status === 'approved') {
        if (['/dashboard/pending', '/dashboard/rejected'].includes(location.pathname)) {
            return <Navigate to="/dashboard/home" replace />;
        }

        // Guard 0: Check if any active coverage states lack a verified GST
        const hasVerifiedGstForAllStates = (supplier.states || []).every(stateName => {
            return (supplier.gst_list || []).some(g => 
                g.is_verified && 
                g.state && 
                g.state.toLowerCase().trim() === stateName.toLowerCase().trim()
            );
        });

        if (!hasVerifiedGstForAllStates) {
            if (location.pathname !== '/dashboard/verify-gst') {
                return <Navigate to="/dashboard/verify-gst" replace />;
            }
        } else {
            if (location.pathname === '/dashboard/verify-gst') {
                return <Navigate to="/dashboard/home" replace />;
            }
        }

        // Check if warehouseCoverage is loaded
        if (!warehouseCoverage) {
            return <Loader />;
        }

        // Guard 1: Must have one warehouse per coverage state
        if (!warehouseCoverage.has_warehouses_for_all_states) {
            if (location.pathname !== '/dashboard/setup-warehouses') {
                return <Navigate to="/dashboard/setup-warehouses" replace />;
            }
        } else {
            // Guard 2: Must have an active warehouse selected
            if (!activeWarehouse) {
                if (location.pathname !== '/dashboard/select-warehouse') {
                    return <Navigate to="/dashboard/select-warehouse" replace />;
                }
            } else {
                // If they are on setup-warehouses but already set up, redirect to dashboard home
                if (location.pathname === '/dashboard/setup-warehouses') {
                    return <Navigate to="/dashboard/home" replace />;
                }
            }
        }
    }

    return <Outlet />;
}
