import { lazy, Suspense, useEffect, useState } from "react";
import { FaHome, FaUserCheck, FaLayerGroup, FaFileInvoiceDollar, FaCoins, FaToggleOn, FaWallet, FaBoxes, FaStore } from "react-icons/fa";
import { HiCube } from "react-icons/hi";
import { useSelector, useDispatch } from "react-redux";
import { setAlert } from "../features/alert.slice";
import { selectAllowedUniqueIds } from "../features/modules.slice";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Drawer from "../components/Drawer";
import { PermissionGuard } from "../components/PermissionGuard";
import Loader from "../components/Loader";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
const ComboKitConfigurations = lazy(() => import("../pages/solar-shop/combokit-configurations/ComboKitConfigurations"));
import { FiSliders, FiUsers, FiTag, FiSettings, FiMapPin, FiPackage, FiFileText, FiDollarSign, FiTarget, FiBarChart2, FiLayers } from "react-icons/fi";

// Phase 1: Reseller Management
const ResellerManagement = lazy(() => import("../pages/solar-shop/reseller-management/ResellerManagement"));
const ResellerSettings = lazy(() => import("../pages/solar-shop/reseller-management/ResellerSettings"));

const Home = lazy(() => import("../pages/solar-shop/Home"));
const ApproveNewEPC = lazy(() => import("../pages/solar-shop/approve-new-epc/ApproveNewEPC"));
const PoOrders = lazy(() => import("../pages/solar-shop/po-orders/PoOrders"));
const WarehousePoConfig = lazy(() => import("../pages/solar-shop/po-orders/WarehousePoConfig"));
const LooseOrders = lazy(() => import("../pages/solar-shop/loose-orders/LooseOrders"));
const WarehouseLooseOrders = lazy(() => import("../pages/solar-shop/loose-orders/WarehouseLooseOrders"));
const OrderManagementSettings = lazy(() => import("../pages/solar-shop/order-management-settings/OrderManagementSettings"));
const OffersManagement = lazy(() => import("../pages/solar-shop/order-management-settings/OffersManagement"));
const CheckoutCartSettings = lazy(() => import("../pages/solar-shop/order-management-settings/CheckoutCartSettings"));

const CompanyMargin = lazy(() => import("../pages/solar-shop/company-margin/CompanyMargin"));
const WarehouseMarginConfig = lazy(() => import("../pages/solar-shop/company-margin/WarehouseMarginConfig"));
const WarehouseKitActivations = lazy(() => import("../pages/solar-shop/warehouse-kit-activations/WarehouseKitActivations"));
const WarehouseKitConfig = lazy(() => import("../pages/solar-shop/warehouse-kit-activations/WarehouseKitConfig"));

const menus = [
    [{ name: "Dashboard", icon: <FaHome />, path: "/admin-panel/solar-shop/home", unique_id: "00000000" }],
    [
        { name: "Approve New EPC", icon: <FaUserCheck />, path: "/admin-panel/solar-shop/approve-new-epc", unique_id: "ADM_APPROVE_EPC" },
        {
            name: "Solar Kit Configurations",
            icon: <FaLayerGroup />,
            path: "/admin-panel/solar-shop/combokit-configurations",
            unique_id: "ADM_COMBO_CFG",
            subMenu: [
                {
                    name: "Combo Kits",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/combokit-configurations/combo-kits",
                    unique_id: "ADM_COMBO_KITS"
                },
                {
                    name: "Customize Kits",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/combokit-configurations/customize-kits",
                    unique_id: "ADM_CUSTOMIZE_KITS"
                },
                {
                    name: "Bulk Combo Kits",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/combokit-configurations/bulk-combo-kits",
                    unique_id: "ADM_BULK_COMBO"
                },
                {
                    name: "Combo Kit Variants",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/combokit-configurations/combo-kit-variants",
                    unique_id: "ADM_COMBO_KIT_VARIANTS"
                }
            ]
        },
        { name: "PO Orders", icon: <FaFileInvoiceDollar />, path: "/admin-panel/solar-shop/po-orders", unique_id: "ADM_PO_ORDERS" },
        { name: "Loose Orders", icon: <FaBoxes />, path: "/admin-panel/solar-shop/loose-orders", unique_id: "ADM_PO_ORDERS" },
        { name: "Company Margin", icon: <FaCoins />, path: "/admin-panel/solar-shop/company-margin", unique_id: "ADM_CO_MARGIN" },
        { name: "Warehouse Kit Activations", icon: <FaToggleOn />, path: "/admin-panel/solar-shop/warehouse-kit-activations", unique_id: "ADM_WH_KIT_ACT" },
        {
            name: "Order Management Settings",
            icon: <FiSliders />,
            path: "/admin-panel/solar-shop/order-management-settings",
            unique_id: "ADM_ORDER_SETTINGS",
            subMenu: [
                {
                    name: "Order Settings",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/order-management-settings",
                    unique_id: "ADM_ORDER_SETTINGS"
                },
                {
                    name: "Offers Management",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/order-management-settings/offers",
                    unique_id: "ADM_ORDER_SETTINGS"
                },
                {
                    name: "Checkout Cart Settings",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/order-management-settings/checkout-cart",
                    unique_id: "ADM_ORDER_SETTINGS"
                }
            ]
        },
    ],
    [
        // ── Phase 1: Franchisee Management ─────────────────────────────
        {
            name: "Franchisee Management",
            icon: <FiUsers />,
            path: "/admin-panel/solar-shop/reseller-management",
            unique_id: "RSL_MGMT",
            subMenu: [
                {
                    name: "Franchisee Leads",
                    icon: <FiFileText />,
                    path: "/admin-panel/solar-shop/reseller-management/leads",
                    unique_id: "RSL_MGMT"
                },
                {
                    name: "Franchisee Accounts",
                    icon: <FiUsers />,
                    path: "/admin-panel/solar-shop/reseller-management/resellers",
                    unique_id: "RSL_MGMT"
                },
                // {
                //     name: "Franchisee Types",
                //     icon: <FiTag />,
                //     path: "/admin-panel/solar-shop/reseller-management/types",
                //     unique_id: "RSL_TYPES"
                // },
                {
                    name: "Franchisee Plans",
                    icon: <HiCube />,
                    path: "/admin-panel/solar-shop/reseller-management/plans",
                    unique_id: "RSL_PLAN"
                },
                {
                    name: "PO Settings",
                    icon: <FiSettings />,
                    path: "/admin-panel/solar-shop/reseller-management/fpo/po-settings",
                    unique_id: "FPO_SETTINGS"
                },
                {
                    name: "MOQ & Increments",
                    icon: <FiLayers />,
                    path: "/admin-panel/solar-shop/reseller-management/fpo/moq-rules",
                    unique_id: "FPO_MOQ"
                },
                {
                    name: "Kit Targets & Goals",
                    icon: <FiTarget />,
                    path: "/admin-panel/solar-shop/reseller-management/fpo/kit-targets",
                    unique_id: "FPO_TARGET"
                },
                {
                    name: "Performance Tracker",
                    icon: <FiBarChart2 />,
                    path: "/admin-panel/solar-shop/reseller-management/fpo/performance",
                    unique_id: "FPO_ANALYTICS"
                },
                {
                    name: "Store Setup & Operations",
                    icon: <FaStore />,
                    path: "/admin-panel/solar-shop/reseller-management/store-setup",
                    unique_id: "RSL_MGMT"
                },
                {
                    name: "Territories",
                    icon: <FiMapPin />,
                    path: "/admin-panel/solar-shop/reseller-management/territories",
                    unique_id: "RSL_TERRITORY"
                },
                {
                    name: "Product Authorization",
                    icon: <FiPackage />,
                    path: "/admin-panel/solar-shop/reseller-management/product-auth",
                    unique_id: "RSL_PROD_AUTH"
                },
                {
                    name: "Franchisee EPC Buyers",
                    icon: <FaUserCheck />,
                    path: "/admin-panel/solar-shop/reseller-management/epc-buyers",
                    unique_id: "RSL_EPC_BUYERS"
                },
                {
                    name: "Franchisee Orders",
                    icon: <FaFileInvoiceDollar />,
                    path: "/admin-panel/solar-shop/reseller-management/orders",
                    unique_id: "RSL_MGMT"
                },
                {
                    name: "Wallet & Ledger",
                    icon: <FaWallet />,
                    path: "/admin-panel/solar-shop/reseller-management/wallet",
                    unique_id: "RSL_WALLET"
                },
                {
                    name: "Agreement Settings",
                    icon: <FiFileText />,
                    path: "/admin-panel/solar-shop/reseller-management/settings",
                    unique_id: "RSL_SETTINGS"
                },
            ]
        },
    ],
];

const isModuleAllowed = (menu, allowedUniqueIds) => {
    if (!menu.unique_id || menu.unique_id === "00000000") return true;
    if (menu.name === "Loose Orders" || menu.unique_id === "ADM_LOOSE_ORDERS") {
        return allowedUniqueIds.includes("ADM_PO_ORDERS") || allowedUniqueIds.includes("ADM_LOOSE_ORDERS");
    }
    if (menu.unique_id.startsWith("FPO_")) {
        return allowedUniqueIds.includes(menu.unique_id) || allowedUniqueIds.includes("RSL_MGMT") || allowedUniqueIds.includes("00000000");
    }
    if (menu.unique_id.startsWith("ADM_BDE") || menu.unique_id.startsWith("BDE_")) {
        return true;
    }
    return allowedUniqueIds.includes(menu.unique_id);
};

// Filter menu tree recursively
const filterMenusByPermission = (menus, allowedUniqueIds) => {
    return menus
        .map((group) =>
            group
                .map((menu) => {
                    if (menu.subMenu) {
                        const filteredSubMenu =
                            filterMenusByPermission([menu.subMenu], allowedUniqueIds)[0];

                        if (filteredSubMenu?.length > 0 || isModuleAllowed(menu, allowedUniqueIds)) {
                            return { ...menu, subMenu: filteredSubMenu };
                        }
                        return null;
                    }

                    return isModuleAllowed(menu, allowedUniqueIds) ? menu : null;
                })
                .filter(Boolean)
        )
        .filter((group) => group.length > 0);
};

export default function SolarShopDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const allowedUniqueIds = useSelector((state) => selectAllowedUniqueIds(state, location.pathname));
    const token = useSelector((state) => state.auth.token);

    // Instant non-blocking route normalization
    useEffect(() => {
        const path = location.pathname;
        const parts = path.split('/').filter(Boolean);
        // If path is exactly /admin-panel/solar-shop or /admin-panel/solar-shop-solarkits
        if (parts.length === 2 && (parts[1] === 'solar-shop' || parts[1] === 'solar-shop-solarkits')) {
            const storedCountry = localStorage.getItem('selected_country_admin') || 'india';
            navigate(`/admin-panel/${parts[1]}/${storedCountry}/home`, { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        if (!token) return;

        const checkProductMarket = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/saas-products/company-products?unique_id=ADM_SAAS_PRODS&req_for=view`,
                    { headers: authHeaderObj() }
                );
                if (res.data?.status === "success") {
                    const allProducts = res.data.data.products || [];
                    const foundProduct = allProducts.find(p => p.slug === "solar-shop" || p.slug === "solar-shop-solarkits");
                    const activeOnes = (foundProduct?.countries || []).filter(c => c.is_active);

                    if (foundProduct && activeOnes.length === 0) {
                        dispatch(setAlert({ type: "warning", message: "This product is not active in any country" }));
                        navigate('/admin-panel/home', { replace: true });
                        return;
                    }

                    const parts = window.location.pathname.split('/');
                    const slugIndex = parts.findIndex(p => p === "solar-shop" || p === "solar-shop-solarkits");
                    if (slugIndex !== -1 && activeOnes.length > 0) {
                        const nextSegment = parts[slugIndex + 1];
                        const activeCountriesNames = activeOnes.map(c => c.name.toLowerCase());
                        const hasCountry = nextSegment && activeCountriesNames.includes(nextSegment.toLowerCase());

                        if (hasCountry) {
                            localStorage.setItem('selected_country_admin', nextSegment.toLowerCase());
                        } else {
                            const storedCountry = localStorage.getItem('selected_country_admin');
                            const defaultCountry = (storedCountry && activeCountriesNames.includes(storedCountry.toLowerCase()))
                                ? storedCountry.toLowerCase()
                                : activeOnes[0].name.toLowerCase();

                            const subPathParts = parts.slice(slugIndex + 1);
                            let subPath = subPathParts.filter(Boolean).join('/');
                            if (!subPath || subPath === 'home') {
                                subPath = 'home';
                            }
                            navigate(`/admin-panel/${parts[slugIndex]}/${defaultCountry}/${subPath}`, { replace: true });
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking product markets in SolarshopDashboard:", error);
            }
        };
        checkProductMarket();
    }, [token, dispatch, navigate]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setIsOpen(!mobile);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const filteredMenus = filterMenusByPermission(menus, allowedUniqueIds);

    /* ===================== RENDER ===================== */

    return (
        <div className="flex h-screen bg-bg w-screen theme-transition">
            <Drawer
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                isMobile={isMobile}
                menuItems={filteredMenus}
            />

            <div className="flex flex-col flex-1 min-w-0 max-w-full">
                <Header
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    isMobile={isMobile}
                    title="Dashboard"
                />

                <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                    <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                className="min-h-full"
                            >
                                <Routes location={location}>
                                    <Route
                                        path="/home"
                                        element={
                                            <PermissionGuard requiredUniqueId="00000000">
                                                <Suspense fallback={<Loader text="Loading home..." />}>
                                                    <Home />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/approve-new-epc"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_APPROVE_EPC">
                                                <Suspense fallback={<Loader text="Loading content..." />}>
                                                    <ApproveNewEPC moduleUniqueId="ADM_APPROVE_EPC" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/po-orders"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading PO Orders..." />}>
                                                    <PoOrders moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/loose-orders"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading Loose Orders..." />}>
                                                    <LooseOrders moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/company-margin"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_CO_MARGIN">
                                                <Suspense fallback={<Loader text="Loading Company Margin..." />}>
                                                    <CompanyMargin moduleUniqueId="ADM_CO_MARGIN" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName"
                                        element={
                                            <PermissionGuard requiredUniqueId="00000000">
                                                <Suspense fallback={<Loader text="Loading home..." />}>
                                                    <Home />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/home"
                                        element={
                                            <PermissionGuard requiredUniqueId="00000000">
                                                <Suspense fallback={<Loader text="Loading home..." />}>
                                                    <Home />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/approve-new-epc"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_APPROVE_EPC">
                                                <Suspense fallback={<Loader text="Loading content..." />}>
                                                    <ApproveNewEPC moduleUniqueId="ADM_APPROVE_EPC" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/po-orders"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading PO Orders..." />}>
                                                    <PoOrders moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/po-orders/:warehouseId"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading Warehouse PO Configuration..." />}>
                                                    <WarehousePoConfig moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/loose-orders"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading Loose Orders..." />}>
                                                    <LooseOrders moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/loose-orders/:warehouseId"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_PO_ORDERS">
                                                <Suspense fallback={<Loader text="Loading Warehouse Loose Order Configuration..." />}>
                                                    <WarehouseLooseOrders moduleUniqueId="ADM_PO_ORDERS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />

                                    <Route
                                        path="/:countryName/company-margin"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_CO_MARGIN">
                                                <Suspense fallback={<Loader text="Loading Company Margin..." />}>
                                                    <CompanyMargin moduleUniqueId="ADM_CO_MARGIN" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/company-margin/:warehouseId"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_CO_MARGIN">
                                                <Suspense fallback={<Loader text="Loading Warehouse Margin Configuration..." />}>
                                                    <WarehouseMarginConfig moduleUniqueId="ADM_CO_MARGIN" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/combokit-configurations/*"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_COMBO_CFG">
                                                <Suspense fallback={<Loader text="Loading content..." />}>
                                                    <ComboKitConfigurations />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/combokit-configurations/*"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_COMBO_CFG">
                                                <Suspense fallback={<Loader text="Loading content..." />}>
                                                    <ComboKitConfigurations />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/warehouse-kit-activations"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_WH_KIT_ACT">
                                                <Suspense fallback={<Loader text="Loading Warehouse Kit Activations..." />}>
                                                    <WarehouseKitActivations moduleUniqueId="ADM_WH_KIT_ACT" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/warehouse-kit-activations"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_WH_KIT_ACT">
                                                <Suspense fallback={<Loader text="Loading Warehouse Kit Activations..." />}>
                                                    <WarehouseKitActivations moduleUniqueId="ADM_WH_KIT_ACT" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/order-management-settings"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Order Settings..." />}>
                                                    <OrderManagementSettings moduleUniqueId="ADM_ORDER_SETTINGS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/order-management-settings/offers"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Offers..." />}>
                                                    <OffersManagement />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/order-management-settings/checkout-cart"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Checkout Settings..." />}>
                                                    <CheckoutCartSettings />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/order-management-settings"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Order Settings..." />}>
                                                    <OrderManagementSettings moduleUniqueId="ADM_ORDER_SETTINGS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/order-management-settings/offers"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Offers..." />}>
                                                    <OffersManagement />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/order-management-settings/checkout-cart"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_ORDER_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Checkout Settings..." />}>
                                                    <CheckoutCartSettings />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/warehouse-kit-activations/:warehouseId"
                                        element={
                                            <PermissionGuard requiredUniqueId="ADM_WH_KIT_ACT">
                                                <Suspense fallback={<Loader text="Loading Warehouse Kit Configuration..." />}>
                                                    <WarehouseKitConfig moduleUniqueId="ADM_WH_KIT_ACT" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />

                                    {/* ── Phase 1: Franchisee Management ─────────────────────── */}
                                    <Route
                                        path="/reseller-management/*"
                                        element={
                                            <PermissionGuard requiredUniqueId="RSL_MGMT">
                                                <Suspense fallback={<Loader text="Loading Franchisee Management..." />}>
                                                    <ResellerManagement />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/reseller-management/*"
                                        element={
                                            <PermissionGuard requiredUniqueId="RSL_MGMT">
                                                <Suspense fallback={<Loader text="Loading Franchisee Management..." />}>
                                                    <ResellerManagement />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/reseller-management/settings"
                                        element={
                                            <PermissionGuard requiredUniqueId="RSL_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Franchisee Settings..." />}>
                                                    <ResellerSettings moduleUniqueId="RSL_SETTINGS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />
                                    <Route
                                        path="/:countryName/reseller-management/settings"
                                        element={
                                            <PermissionGuard requiredUniqueId="RSL_SETTINGS">
                                                <Suspense fallback={<Loader text="Loading Franchisee Settings..." />}>
                                                    <ResellerSettings moduleUniqueId="RSL_SETTINGS" />
                                                </Suspense>
                                            </PermissionGuard>
                                        }
                                    />


                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
