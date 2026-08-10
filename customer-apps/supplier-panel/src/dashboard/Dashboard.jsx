import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout_user } from "../features/auth.slice";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";

// Core Layout Components
import Header from "../components/Header";
import Drawer from "../components/Drawer";
import Loader from "../components/Loader";

import { FaHome, FaBoxOpen, FaClipboardList, FaWarehouse, FaUsersCog, FaChartLine, FaCloudUploadAlt, FaTags, FaRocket, FaTerminal, FaLayerGroup, FaProjectDiagram, FaHandshake, FaTicketAlt, FaCalculator } from "react-icons/fa";
import { MdSettings, MdInventory, MdDashboardCustomize } from "react-icons/md";

/* ===================== Lazy Pages ===================== */

const Home = lazy(() => import("../pages/Home"));
const Products = lazy(() => import("../pages/Products"));
const Orders = lazy(() => import("../pages/Orders"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Analytics = lazy(() => import("../pages/Analytics"));
const BulkUpload = lazy(() => import("../pages/BulkUpload"));
const Warehouses = lazy(() => import("../pages/WarehouseControl"));
const PricingTiers = lazy(() => import("../pages/PricingTiers"));
const Webhooks = lazy(() => import("../pages/Webhooks"));
const TeamAccess = lazy(() => import("../pages/TeamAccess"));
const ApiIntegration = lazy(() => import("../pages/ApiIntegration"));
const Matchmaking = lazy(() => import("../pages/Matchmaking"));
const SupportTickets = lazy(() => import("../pages/SupportTickets"));
const ProjectEstimator = lazy(() => import("../pages/ProjectEstimator"));
const ProductTypes = lazy(() => import("../pages/ProductTypes"));
const ProjectTypes = lazy(() => import("../pages/ProjectTypes"));
const CreateUser = lazy(() => import("../pages/CreateUser"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Profile = lazy(() => import("../pages/Profile"));
const AccountSettings = lazy(() => import("../pages/AccountSettings"));
const SetupWarehouses = lazy(() => import("../pages/SetupWarehouses"));
const SelectWarehouse = lazy(() => import("../pages/SelectWarehouse"));
const VerifyGst = lazy(() => import("../pages/VerifyGst"));
const CoverageSettings = lazy(() => import("../pages/CoverageSettings"));
const ProductSupplySetup = lazy(() => import("../pages/ProductSupplySetup"));
const ActiveSkuPricing = lazy(() => import("../pages/ActiveSkuPricing"));

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dispatch = useDispatch();
  
  // Mode switcher is removed

  const authState = useSelector(state => state.auth_slice);
  const userState = useSelector(state => state.user_slice);
  
  // Mock a user in development to bypass redirection
  const user = authState?.user || userState?.user || {
    name: 'Demo Cluster Supplier',
    email: 'supplier@emergesun.com',
    role: 'Cluster Supplier'
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout_user());
    navigate('/login');
  };

  /* ===================== MENU CONFIG ===================== */

  const menus = [
    [{ name: "Supplier Dashboard", icon: <FaHome />, path: "/dashboard/home" }],
    [
      {
        name: "Assigned Orders",
        icon: <FaClipboardList />,
        path: "/dashboard/orders",
        is_locked: false
      },
      {
        name: "Inventory & Catalog",
        icon: <MdInventory />,
        path: "/dashboard/inventory-management",
        subMenu: [
          {
            name: "Product Supply Setup",
            icon: <FaLayerGroup />,
            path: "/dashboard/supply-setup",
            is_locked: false
          },
          {
            name: "Active SKU & Pricing",
            icon: <FaTags />,
            path: "/dashboard/sku-pricing",
            is_locked: false
          },
          {
            name: "Manage Stock",
            icon: <FaClipboardList />,
            path: "/dashboard/stock",
            is_locked: false
          },
          {
            name: "Bulk Upload",
            icon: <FaCloudUploadAlt />,
            path: "/dashboard/bulk-upload",
            is_locked: false
          }
        ]
      },
      {
        name: "Reports & Analytics",
        icon: <FaChartLine />,
        path: "/dashboard/analytics",
        subMenu: [
          {
            name: "Performance Overview",
            icon: <MdDashboardCustomize />,
            path: "/dashboard/analytics/basic",
            is_locked: false
          },
          {
            name: "Cluster Analytics",
            icon: <FaChartLine />,
            path: "/dashboard/analytics/advanced",
            is_locked: false
          }
        ]
      },
      {
        name: "Settings",
        icon: <MdSettings />,
        path: "/dashboard/settings",
        subMenu: [
          {
            name: "Profile",
            icon: <FaUsersCog />,
            path: "/dashboard/settings/profile",
            is_locked: false
          },
          {
            name: "Coverage States",
            icon: <FaLayerGroup />,
            path: "/dashboard/settings/coverage",
            is_locked: false
          },
          {
            name: "Warehouses",
            icon: <FaWarehouse />,
            path: "/dashboard/settings/warehouses",
            is_locked: false
          },
          {
            name: "Account Settings",
            icon: <MdSettings />,
            path: "/dashboard/settings/account-settings",
            is_locked: false
          }
        ]
      }
    ]
  ];

  useEffect(() => {
    if (location.pathname === "/dashboard/" || location.pathname === "/dashboard") {
      navigate("/dashboard/home", { replace: true });
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/home')) return 'Supplier Dashboard';
    if (path.includes('/products')) return 'Product Catalog';
    if (path.includes('/stock')) return 'Manage Stock';
    if (path.includes('/bulk-upload')) return 'Bulk Product Upload';
    if (path.includes('/supply-setup')) return 'Product Supply Setup';
    if (path.includes('/sku-pricing')) return 'Active SKU & Pricing';
    if (path.includes('/warehouses')) return 'Warehouses';
    if (path.includes('/orders')) return 'Assigned Orders';
    if (path.includes('/analytics')) return 'Performance Analytics';
    return 'Supplier Panel';
  };

  const isWarehouseSetupOrSelection = 
    location.pathname.includes('/setup-warehouses') || 
    location.pathname.includes('/select-warehouse') || 
    location.pathname.includes('/verify-gst');

  return (
    <div className="flex h-screen bg-bg w-screen theme-transition">
      {!isWarehouseSetupOrSelection && (
        <Drawer
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          menuItems={menus}
        />
      )}

      <div className="flex flex-col flex-1 max-w-full">
        <Header
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile && !isWarehouseSetupOrSelection}
          title={getPageTitle()}
        />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route path="/home" element={<Suspense fallback={<Loader />}><Home /></Suspense>} />
                  <Route path="/products" element={<Suspense fallback={<Loader />}><Products /></Suspense>} />
                  <Route path="/stock" element={<Suspense fallback={<Loader />}><Inventory /></Suspense>} />
                  <Route path="/bulk-upload" element={<Suspense fallback={<Loader />}><BulkUpload /></Suspense>} />
                  <Route path="/supply-setup" element={<Suspense fallback={<Loader />}><ProductSupplySetup /></Suspense>} />
                  <Route path="/sku-pricing" element={<Suspense fallback={<Loader />}><ActiveSkuPricing /></Suspense>} />
                  <Route path="/settings/warehouses" element={<Suspense fallback={<Loader />}><Warehouses /></Suspense>} />
                  <Route path="/setup-warehouses" element={<Suspense fallback={<Loader />}><SetupWarehouses /></Suspense>} />
                  <Route path="/select-warehouse" element={<Suspense fallback={<Loader />}><SelectWarehouse /></Suspense>} />
                  <Route path="/product-types" element={<Suspense fallback={<Loader />}><ProductTypes /></Suspense>} />
                  <Route path="/project-types" element={<Suspense fallback={<Loader />}><ProjectTypes /></Suspense>} />
                  <Route path="/orders" element={<Suspense fallback={<Loader />}><Orders /></Suspense>} />
                  <Route path="/analytics/basic" element={<Suspense fallback={<Loader />}><Analytics /></Suspense>} />
                  <Route path="/analytics/advanced" element={<Suspense fallback={<Loader />}><Analytics /></Suspense>} />
                  <Route path="/pricing-tiers" element={<Suspense fallback={<Loader />}><PricingTiers /></Suspense>} />
                  <Route path="/developer/api" element={<Suspense fallback={<Loader />}><ApiIntegration /></Suspense>} />
                  <Route path="/developer/webhooks" element={<Suspense fallback={<Loader />}><Webhooks /></Suspense>} />
                  <Route path="/matchmaking" element={<Suspense fallback={<Loader />}><Matchmaking /></Suspense>} />
                  <Route path="/support" element={<Suspense fallback={<Loader />}><SupportTickets /></Suspense>} />
                  <Route path="/project-estimator" element={<Suspense fallback={<Loader />}><ProjectEstimator /></Suspense>} />
                  <Route path="/verify-gst" element={<Suspense fallback={<Loader />}><VerifyGst /></Suspense>} />
                  <Route path="/settings/profile" element={<Suspense fallback={<Loader />}><Profile /></Suspense>} />
                  <Route path="/settings/coverage" element={<Suspense fallback={<Loader />}><CoverageSettings /></Suspense>} />
                  <Route path="/settings/account-settings" element={<Suspense fallback={<Loader />}><AccountSettings /></Suspense>} />
                  <Route path="/settings/team" element={<Suspense fallback={<Loader />}><TeamAccess /></Suspense>} />
                  <Route path="/settings/create-user" element={<Suspense fallback={<Loader />}><CreateUser /></Suspense>} />
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
