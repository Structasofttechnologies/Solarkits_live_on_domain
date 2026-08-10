import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Header from "../components/Header"
import Drawer from "../components/Drawer";
import { FaHome, FaFileInvoice, FaCreditCard, FaCheckCircle, FaHandshake } from "react-icons/fa"
import { lazy, Suspense, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { PermissionGuard } from "../components/PermissionGuard";
import { useSelector } from "react-redux";
import Loader from "../components/Loader";
import { selectAllowedUniqueIds, selectNoModulesForTier } from "../features/modules.slice";

const Home = lazy(() => import("../pages/Home"));
const Profile = lazy(() => import("../pages/Profile"));
const AccountSettings = lazy(() => import("../pages/AccountSettings"));
const EWayBillManagement = lazy(() => import("../pages/accounts-management/EWayBillManagement"));
const CustomerInvoiceManagement = lazy(() => import("../pages/accounts-management/CustomerInvoiceManagement"));
const InventoryInwardInvoices = lazy(() => import("../pages/accounts-management/InventoryInwardInvoices"));

const SupplierRegistry = lazy(() => import("../pages/accounts-management/SupplierRegistry"));
const PurchaseOrders = lazy(() => import("../pages/accounts-management/PurchaseOrders"));
const Payments = lazy(() => import("../pages/accounts-management/Payments"));

const menus = [
  [
    {
      name: "Accounts Dashboard",
      icon: <FaHome />,
      path: "/account-panel/home",
      unique_id: "ACC_HOME"
    },
    {
      name: "Supplier Registry",
      icon: <FaHandshake />,
      path: "/account-panel/suppliers",
      unique_id: "ACC_SUPPLIERS"
    },
    {
      name: "Purchase Orders",
      icon: <FaFileInvoice />,
      path: "/account-panel/purchase-orders",
      unique_id: "ACC_PO"
    },
    {
      name: "Supplier Payments",
      icon: <FaCreditCard />,
      path: "/account-panel/payments",
      unique_id: "ACC_PAYMENTS"
    },
    {
      name: "Inventory Inward Invoices",
      icon: <FaFileInvoice />,
      path: "/account-panel/inward-invoices",
      unique_id: "ACC_INWARD_INV"
    },
    {
      name: "E-Way Bill Management",
      icon: <FaFileInvoice />,
      path: "/account-panel/eway-bills",
      unique_id: "ACC_EWAY"
    },
    {
      name: "Customer Invoice Management",
      icon: <FaCreditCard />,
      path: "/account-panel/invoices",
      unique_id: "ACC_INVOICES"
    },
  ],
];

const isModuleAllowed = (menu, allowedUniqueIds) => {
  if (!menu.unique_id) return false;
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

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const allowedUniqueIds = useSelector((state) => selectAllowedUniqueIds(state, location.pathname));
  const noModulesForTier = useSelector((state) => selectNoModulesForTier(state, location.pathname));
  const { user, selectedScope } = useSelector((state) => state.user_slice);


  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/$/, "");
    if (normalizedPath === "/account-panel") {
      navigate("/account-panel/home", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredMenus = filterMenusByPermission(menus, allowedUniqueIds);
  return (
    <div className="flex h-screen bg-bg w-screen theme-transition">
      <Drawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        menuItems={filteredMenus}
      />

      <div className="flex flex-col flex-1 max-w-full">
        <Header
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          title="Account Panel"
        />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">

            {/* Tier mismatch banner — shown when the panel has level-specific modules
                but none of them match the user's currently selected active level. */}
            {noModulesForTier && (
              <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-amber-400/40 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-500/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    No Modules Available for Your Account Tier
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                    This panel has no modules configured for the{" "}
                    <span className="font-semibold capitalize px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-700/40">
                      {(selectedScope?.level || user?.level || 'current').toUpperCase()}
                    </span>{" "}
                    level. Use the level selector in the header to switch to a tier that has available modules
                    (e.g. <strong>STATE</strong> or <strong>CLUSTER</strong>).
                  </p>
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
                    path="/home/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_HOME">
                        <Suspense fallback={<Loader text="Loading home..." />}>
                          <Home />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/eway-bills/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_EWAY">
                        <Suspense fallback={<Loader text="Loading E-Way Bills..." />}>
                          <EWayBillManagement />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/invoices/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_INVOICES">
                        <Suspense fallback={<Loader text="Loading Invoices..." />}>
                          <CustomerInvoiceManagement />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/inward-invoices/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_INWARD_INV">
                        <Suspense fallback={<Loader text="Loading Inventory Inward Invoices..." />}>
                          <InventoryInwardInvoices />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />

                  <Route
                    path="/purchase-orders/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_PO">
                        <Suspense fallback={<Loader text="Loading Purchase Orders..." />}>
                          <PurchaseOrders />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/payments/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_PAYMENTS">
                        <Suspense fallback={<Loader text="Loading Payments..." />}>
                          <Payments />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/suppliers/*"
                    element={
                      <PermissionGuard requiredUniqueId="ACC_SUPPLIERS">
                        <Suspense fallback={<Loader text="Loading Supplier Registry..." />}>
                          <SupplierRegistry />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <Suspense fallback={<Loader text="Loading profile..." />}>
                        <Profile />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/account-settings"
                    element={
                      <Suspense fallback={<Loader text="Loading settings..." />}>
                        <AccountSettings />
                      </Suspense>
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
