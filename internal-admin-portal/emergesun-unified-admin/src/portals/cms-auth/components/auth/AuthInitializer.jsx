import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { identifyUserPanel } from "../../features/auth.slice";

export default function AuthInitializer() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            // If already on the choose-panel page, don't perform automatic redirect loops
            if (window.location.pathname === '/choose-panel') {
                return;
            }
            try {
                const result = await dispatch(identifyUserPanel());
                if (identifyUserPanel.fulfilled.match(result)) {
                    const allowedPanels = result.payload?.allowed_panels || [];
                    const getRedirectUrl = (url_prefix) => {
                        const isVercel = window.location.hostname.includes("vercel.app");
                        if (isVercel) {
                            if (url_prefix.startsWith("/admin-panel")) {
                                return `https://emergesun-admin-panel-frontend.vercel.app${url_prefix}/`;
                            }
                            if (url_prefix.startsWith("/developer-panel")) {
                                return `https://emergesun-developer-panel-frontend.vercel.app${url_prefix}/`;
                            }
                            if (url_prefix.startsWith("/operation-management-panel")) {
                                return `https://emergesun-operation-management-panel-frontend.vercel.app${url_prefix}/`;
                            }
                            if (url_prefix.startsWith("/warehouse-management-panel")) {
                                return `https://emergesun-warehouse-panel-frontend.vercel.app${url_prefix}/`;
                            }
                        }
                        return `${url_prefix}/`;
                    };

                    if (allowedPanels.length > 1) {
                        navigate('/choose-panel', { replace: true });
                    } else if (allowedPanels.length === 1) {
                        window.location.replace(getRedirectUrl(allowedPanels[0].url_prefix));
                    } else {
                        const panel = result.payload?.url_prefix || null;
                        if (panel) {
                            window.location.replace(getRedirectUrl(panel));
                        }
                    }
                }
            } catch (err) {
                console.error('Error during auth initialization:', err);
                navigate('/login', { replace: true });
            }
        })();
    }, [dispatch, navigate]);

    return null;
}
