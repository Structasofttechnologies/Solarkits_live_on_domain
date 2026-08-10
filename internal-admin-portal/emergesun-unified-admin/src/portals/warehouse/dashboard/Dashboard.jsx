import { Route, Routes, useLocation, useNavigate, Link } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

import Header from "../components/Header";
import Drawer from "../components/Drawer";
import Loader from "../components/Loader";
import { PermissionGuard } from "../components/PermissionGuard";
import { selectAllowedUniqueIds } from "../features/modules.slice";

import { FaHome, FaExchangeAlt, FaBoxes, FaTruck, FaSyncAlt, FaTools, FaCheckCircle, FaFileInvoice, FaUser, FaMapMarkerAlt } from "react-icons/fa";
import { HiCube } from "react-icons/hi";
import { FiAlertCircle, FiX, FiArrowRight } from "react-icons/fi";

/* ===================== Lazy Pages ===================== */

const Profile = lazy(() => import("../pages/Profile"));
const AccountSettings = lazy(() => import("../pages/AccountSettings"));
const NotFound = lazy(() => import("../pages/NotFound"));

/* ===================== Warehouse Management Pages ===================== */
const MaterialInward = lazy(() => import("../pages/warehouse-management/MaterialInward"));
const MaterialOutward = lazy(() => import("../pages/warehouse-management/MaterialOutward"));
const InventoryTransfer = lazy(() => import("../pages/warehouse-management/InventoryTransfer"));
const StockAdjustment = lazy(() => import("../pages/warehouse-management/StockAdjustment"));
const DeliveryManagement = lazy(() => import("../pages/warehouse-management/DeliveryManagement"));
const ProductReplacement = lazy(() => import("../pages/warehouse-management/ProductReplacement"));
const RepairTickets = lazy(() => import("../pages/warehouse-management/RepairTickets"));
const VehicleDriverManagement = lazy(() => import("../pages/warehouse-management/VehicleDriverManagement"));
const Home = lazy(() => import("../pages/dashboard/Home"));

/* ===================== MENU CONFIG ===================== */

const getMenusForMode = (mode) => {
  const isInwardSub = mode === "sub";
  
  return [
    [{ name: "Dashboard", icon: <FaHome />, path: "/home", unique_id: "00000000" }],
    [
      {
        name: "Material Inward",
        icon: <HiCube />,
        path: "/material-inward",
        unique_id: "WH_MAT_INWARD"
      },
      {
        name: isInwardSub ? "Sub-Warehouse Outward" : "Master-Warehouse Outward",
        icon: <FaTruck />,
        unique_id: "00000003",
        subMenu: [
          {
            name: isInwardSub ? "Order-wise Dispatch" : "Stock Transfer Outward",
            icon: isInwardSub ? <FaBoxes /> : <FaExchangeAlt />,
            path: "/material-outward",
            unique_id: "WH_MAT_OUTWARD"
          },
          {
            name: "Customer Outward (Delivery)",
            icon: <FaTruck />,
            path: "/delivery-management",
            unique_id: "WH_DELIVERY_MGMT"
          },
          {
            name: "Vehicles & Drivers",
            icon: <FaTruck />,
            path: "/vehicles-drivers",
            unique_id: "WH_DELIVERY_MGMT"
          },
          {
            name: "Product Replacement",
            icon: <FaSyncAlt />,
            path: "/product-replacement",
            unique_id: "WH_PROD_REPLACE"
          },
          {
            name: "Repair Tickets",
            icon: <FaTools />,
            path: "/repair-tickets",
            unique_id: "WH_REPAIR_TICKETS"
          }
        ]
      },
      ...(!isInwardSub ? [{
        name: "Inventory Transfer",
        icon: <FaExchangeAlt />,
        path: "/inventory-transfer",
        unique_id: "WH_INV_TRANSFER"
      }] : []),
      {
        name: "Stock Adjustment",
        icon: <FaSyncAlt />,
        path: "/stock-adjustment",
        unique_id: "WH_STOCK_ADJ"
      }
    ]
  ];
};

const isModuleAllowed = (menu, allowedUniqueIds) => {
  if (!menu.unique_id) return false;
  return allowedUniqueIds.includes(menu.unique_id);
};

// Filter menu tree recursively
const filterMenusByPermission = (menus, allowedUniqueIds = []) => {
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

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [warehouseMode, setWarehouseMode] = useState(localStorage.getItem('warehouseMode') || 'master');

  const handleWarehouseModeChange = (mode) => {
    localStorage.setItem('warehouseMode', mode);
    setWarehouseMode(mode);
    window.dispatchEvent(new Event('warehouseModeChanged'));
  };

  useEffect(() => {
    const handleModeChanged = () => {
      setWarehouseMode(localStorage.getItem('warehouseMode') || 'master');
    };
    window.addEventListener('warehouseModeChanged', handleModeChanged);
    return () => window.removeEventListener('warehouseModeChanged', handleModeChanged);
  }, []);

  const allowedUniqueIds = useSelector((state) => selectAllowedUniqueIds(state, location.pathname));

  const { user } = useSelector((state) => state.user_slice || {});
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const token = useSelector((state) => state.auth?.token);
  const API = import.meta.env.VITE_API_URL;

  const getRemainingTime = (dueDateStr) => {
    if (!dueDateStr) return "";
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due - now;
    if (diffMs <= 0) return "Overdue";
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays}d remaining`;
    }
    if (diffHours > 0) {
      return `${diffHours}h remaining`;
    }
    return `${diffMins}m remaining`;
  };

  useEffect(() => {
    if (!user || !user.is_warehouse_user || user.role !== 'manager') return;
    if (user.warehouse_status !== 2 && user.warehouse_status !== 5) return;

    const fetchCompletion = async () => {
      try {
        const res = await axios.get(`${API}/warehouse/profile-completion`, {
          headers: token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}
        });
        if (res.data && res.data.status === "success") {
          setProfileCompletion(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile completion:", err);
      }
    };

    fetchCompletion();
  }, [user, token, API]);

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/$/, "");
    if (normalizedPath === "") {
      navigate("/home", { replace: true });
    }
  }, [location.pathname, navigate]);

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

  useEffect(() => {
    if (user && user.warehouse_type) {
      setWarehouseMode(user.warehouse_type);
      localStorage.setItem('warehouseMode', user.warehouse_type);
    }
  }, [user]);

  const filteredMenus = filterMenusByPermission(getMenusForMode(warehouseMode), allowedUniqueIds);

  // Dynamic Title detection
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/home')) return 'Warehouse Dashboard';
    if (path.includes('/material-inward')) return 'Material Inward Entry';
    if (path.includes('/material-outward')) return 'Material Outward Dispatch';
    if (path.includes('/inventory-transfer')) return 'Inventory Transfer';
    if (path.includes('/stock-adjustment')) return 'Stock Adjustment';
    if (path.includes('/delivery-management')) return 'Delivery Routing & Dispatch';
    if (path.includes('/product-replacement')) return 'Product Replacement Claims';
    if (path.includes('/repair-tickets')) return 'Repair Ticket Center';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/account-settings')) return 'Account Settings';
    return 'Warehouse Management';
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="flex h-screen bg-bg w-screen theme-transition">
      <Drawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        menuItems={filteredMenus}
      />

      <div className="flex flex-col flex-1 max-w-full min-w-0 overflow-hidden">
         <Header
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          title={getPageTitle()}
          warehouseMode={warehouseMode}
          setWarehouseMode={handleWarehouseModeChange}
        />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300 min-w-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative h-full overflow-y-auto overflow-x-hidden scrollbar-hover p-4 md:p-6">
            {user && 
             user.is_warehouse_user && 
             user.role === 'manager' && 
             (user.warehouse_status === 2 || user.warehouse_status === 5) && 
             profileCompletion && 
             !isBannerDismissed && (
              <div className="mb-6 relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-warning/5 to-amber-600/10 border border-warning/20 rounded-2xl p-4 shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-warning" />
                <div className="flex items-start gap-3 pl-2">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 animate-pulse">
                    <FiAlertCircle className="text-warning w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                      <span>Warehouse Profile Incomplete</span>
                      <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-extrabold uppercase tracking-wide">
                        {profileCompletion.percentage}% Complete
                      </span>
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {user.warehouse_status === 5 ? (
                        <span className="text-danger font-medium">Your profile was rejected by admin. Please update required fields.</span>
                      ) : (
                        <span>Please fill out your warehouse profile details to submit for review.</span>
                      )}
                      {profileCompletion.due_date && (
                        <span className="ml-1.5 font-semibold text-warning/90">
                          • Deadline: {new Date(profileCompletion.due_date).toLocaleString()} ({getRemainingTime(profileCompletion.due_date)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pl-12 sm:pl-0">
                  <Link
                    to="/warehouse-profile"
                    className="flex items-center gap-1.5 px-4 py-2 bg-warning text-white rounded-xl text-xs font-black hover:bg-warning-hover active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    <span>Complete Profile</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setIsBannerDismissed(true)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-text-muted hover:text-text-primary transition-colors duration-200"
                    title="Dismiss banner"
                  >
                    <FiX className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}

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
                    path="home"
                    element={
                      <PermissionGuard requiredUniqueId="00000000">
                        <Suspense fallback={<Loader text="Loading home..." />}>
                          <Home />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="material-inward/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_MAT_INWARD">
                        <Suspense fallback={<Loader text="Loading material inward..." />}>
                          <MaterialInward />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="material-outward/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_MAT_OUTWARD">
                        <Suspense fallback={<Loader text="Loading material outward..." />}>
                          <MaterialOutward />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="inventory-transfer/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_INV_TRANSFER">
                        <Suspense fallback={<Loader text="Loading transfers..." />}>
                          <InventoryTransfer />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="stock-adjustment/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_STOCK_ADJ">
                        <Suspense fallback={<Loader text="Loading adjustments..." />}>
                          <StockAdjustment />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="delivery-management/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_DELIVERY_MGMT">
                        <Suspense fallback={<Loader text="Loading delivery management..." />}>
                          <DeliveryManagement />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="vehicles-drivers/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_DELIVERY_MGMT">
                        <Suspense fallback={<Loader text="Loading vehicles & drivers..." />}>
                          <VehicleDriverManagement />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="product-replacement/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_PROD_REPLACE">
                        <Suspense fallback={<Loader text="Loading replacement claims..." />}>
                          <ProductReplacement />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="repair-tickets/*"
                    element={
                      <PermissionGuard requiredUniqueId="WH_REPAIR_TICKETS">
                        <Suspense fallback={<Loader text="Loading repair tickets..." />}>
                          <RepairTickets />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <Suspense fallback={<Loader text="Loading profile..." />}>
                        <Profile />
                      </Suspense>
                    }
                  />
                  <Route
                    path="account-settings"
                    element={
                      <Suspense fallback={<Loader text="Loading settings..." />}>
                        <AccountSettings />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<Suspense fallback={<Loader />}><NotFound /></Suspense>} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
