import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';
import { fetch_me, logout_user, refresh_token } from '@/features/auth.slice';
import Loader from '@/components/Loader';

export default function PublicRoutes() {
    const dispatch  = useDispatch();

    const { supplier, loading, token } = useSelector((state) => state.auth_slice);

    const [checkDone, setCheckDone] = useState(false);

    useEffect(() => {
        if (!token) {
            setCheckDone(true);
            return;
        }

        let mounted = true;

        const checkAuth = async () => {
            try {
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
            } catch (err) {
                // If checking auth fails (and it's not a server down error), logout user
                const isServerDown = !err || !err.status || err.message === 'Network Error' || (typeof err.message === 'string' && err.message.includes('Network'));
                if (!isServerDown) {
                    dispatch(logout_user());
                }
            } finally {
                if (mounted) {
                    setCheckDone(true);
                }
            }
        };

        checkAuth();
        return () => {
            mounted = false;
        };
    }, [dispatch]);

    // While checking authentication status, show a loader
    if (!checkDone || loading) {
        return <Loader />;
    }

    if (supplier) {
        return <Navigate to="/dashboard/home" replace />;
    }

    return <Outlet />;
}
