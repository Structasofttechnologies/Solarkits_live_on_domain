import { lazy, Suspense, useEffect, useState } from "react";
import { FaHome, FaHandshake, FaBolt, FaCoins, FaUserCheck } from "react-icons/fa";
import { MdDashboard, MdPayments, MdShoppingCart, MdReceipt } from "react-icons/md";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Drawer from "../components/Drawer";
import Loader from "../components/Loader";

const SolarShopAccountsHome = lazy(() => import("../pages/solar-shop/SolarShopAccountsHome"));
const FranchisePlanPurchases = lazy(() => import("../pages/solar-shop/FranchisePlanPurchases"));
const DirectEpcTransactions = lazy(() => import("../pages/solar-shop/DirectEpcTransactions"));
const FranchiseCommissionTracking = lazy(() => import("../pages/solar-shop/FranchiseCommissionTracking"));
const OnboardedEpcPurchases = lazy(() => import("../pages/solar-shop/OnboardedEpcPurchases"));
const Profile = lazy(() => import("../pages/Profile"));
const AccountSettings = lazy(() => import("../pages/AccountSettings"));

const solarShopMenus = [
  [
    {
      name: "Accounts Dashboard",
      icon: <FaHome />,
      path: "/account-panel/solar-shop/home",
    },
    {
      name: "Franchise Plan Purchases",
      icon: <FaHandshake />,
      path: "/account-panel/solar-shop/franchise-plans",
    },
    {
      name: "Direct EPC Transactions",
      icon: <FaBolt />,
      path: "/account-panel/solar-shop/direct-epc-transactions",
    },
    {
      name: "Franchise Commission Tracking",
      icon: <FaCoins />,
      path: "/account-panel/solar-shop/franchise-commissions",
    },
    {
      name: "Onboarded EPC Purchases",
      icon: <FaUserCheck />,
      path: "/account-panel/solar-shop/onboarded-epc-purchases",
    },
  ],
];

export default function SolarShopAccountsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Normalize initial route: /account-panel/solar-shop or /account-panel/solar-shop/ -> /account-panel/solar-shop/home
  useEffect(() => {
    const clean = location.pathname.replace(/\/$/, "");
    if (clean === "/account-panel/solar-shop" || clean === "/account-panel/solar-shop-solarkits") {
      navigate("/account-panel/solar-shop/home", { replace: true });
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

  return (
    <div className="flex h-screen bg-bg w-screen theme-transition">
      <Drawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        menuItems={solarShopMenus}
      />

      <div className="flex flex-col flex-1 max-w-full">
        <Header
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          title="Solar Shop - SolarKits Accounts"
        />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route
                    path="/home/*"
                    element={
                      <Suspense fallback={<Loader text="Loading solar shop accounts dashboard..." />}>
                        <SolarShopAccountsHome />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/franchise-plans/*"
                    element={
                      <Suspense fallback={<Loader text="Loading franchise plan purchases..." />}>
                        <FranchisePlanPurchases />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/direct-epc-transactions/*"
                    element={
                      <Suspense fallback={<Loader text="Loading direct EPC transactions..." />}>
                        <DirectEpcTransactions />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/franchise-commissions/*"
                    element={
                      <Suspense fallback={<Loader text="Loading commission tracking..." />}>
                        <FranchiseCommissionTracking />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/onboarded-epc-purchases/*"
                    element={
                      <Suspense fallback={<Loader text="Loading onboarded EPC purchases..." />}>
                        <OnboardedEpcPurchases />
                      </Suspense>
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
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<Loader text="Loading..." />}>
                        <SolarShopAccountsHome />
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
