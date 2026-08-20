import { useEffect, useState, useMemo } from "react";
import Drawer from "../Components/Drawer";
import Header from "../Components/Header";
import ProtectedRoute from "../Components/ProtectedRoute";
import LocationChangeCartWarning from "../Components/LocationChangeCartWarning";
import { Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import PreconfiguredComboKit from "./dashboard/PreconfiguredComboKit";
import CustomComboKit from "./dashboard/CustomComboKit";
import SolarBosKit from "./dashboard/SolarBosKit";
import Cart from "./cart/Cart";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableKitData, fetchLiveInventory, getBulkKitBuyData, fetchShopHierarchy } from "../features/slice";
import BulkBuy from "./bulk-buy/BulkBuy";
import BulkOrderCart from "./cart/BulkOrderCart";
import CheckOut from "./CheckOut";
import ProjectOrderStatus from "./dashboard/ProjectOrderStatus";
import EpcCatalogue from "./dashboard/EpcCatalogue";
import StoreLocatorPage from "./store-locator/StoreLocatorPage";
import {
  MdDashboard,
  MdShoppingCart,
  MdListAlt,
  MdSettings,
} from "react-icons/md";
import { FaBoxes, FaSolarPanel, FaShoppingBag, FaMapMarkerAlt } from "react-icons/fa";

const INVENTORY_POLL_INTERVAL_MS = 30000; // 30 seconds

export default function Board() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dispatch = useDispatch();
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const { user, isAuthenticated } = useSelector((state) => state.auth_slice);

  // Determine if logged-in EPC user was onboarded via a Franchisee Partner
  const isFranchiseeEpc = Boolean(
    isAuthenticated && (
      user?.reseller?.business_name ||
      user?.reseller ||
      user?.onboarding_source === 'reseller' ||
      user?.onboarding_source === 'franchisee' ||
      user?.onboarded_by_reseller_id ||
      user?.primary_reseller_id
    )
  );

  // Dynamic menu items based on whether user is Franchisee-onboarded EPC or direct customer/EPC
  const menuItems = useMemo(() => {
    if (isFranchiseeEpc) {
      // ── Franchisee Partner Onboarded EPC Menu ──
      // Solar Combo Kit, Custom Combo Kit, and Solar BOS Kit are HIDDEN (these are for normal direct EPCs)
      // Only Franchisee Product Catalogue, Bulk Buy, Request Order, Cart, Store Finder, Track Status & Settings are shown
      return [
        [
          {
            name: "Product Catalogue",
            icon: <FaShoppingBag />,
            path: "/epc-catalogue",
            requiresAuth: true,
          },
        ],
        [
          { name: "Bulk Buy", icon: <FaBoxes />, path: "/bulk-buy", requiresAuth: true },
          { name: "Request Order", icon: <MdListAlt />, path: "/request-order", requiresAuth: true },
          { name: "Cart", icon: <MdShoppingCart />, path: "/cart", requiresAuth: true },
        ],
        [
          { name: "Find Nearby Store", icon: <FaMapMarkerAlt />, path: "/store-locator" },
          { name: "Track Order Status", icon: <MdListAlt />, path: "/track-status", requiresAuth: true },
        ],
        [{ name: "Settings", icon: <MdSettings />, path: "/settings", requiresAuth: true }]
      ];
    } else {
      // ── Normal Direct EPC / Guest Customer Menu ──
      return [
        [
          { name: "Solar Combo Kit", icon: <FaSolarPanel />, path: "/preconfigured-combo-kit" },
          { name: "Custom Combo Kit", icon: <MdSettings />, path: "/custom-combo-kit", requiresAuth: true },
          { name: "Solar BOS Kit", icon: <MdSettings />, path: "/solar-bos-kit", requiresAuth: true },
          { name: "Bulk Buy", icon: <FaBoxes />, path: "/bulk-buy", requiresAuth: true },
          { name: "Request Order", icon: <MdListAlt />, path: "/request-order", requiresAuth: true },
          { name: "Cart", icon: <MdShoppingCart />, path: "/cart", requiresAuth: true },
        ],
        [
          { name: "Find Nearby Store", icon: <FaMapMarkerAlt />, path: "/store-locator" },
          { name: "Track Order Status", icon: <MdListAlt />, path: "/track-status", requiresAuth: true },
        ],
        [{ name: "Settings", icon: <MdSettings />, path: "/settings", requiresAuth: true }]
      ];
    }
  }, [isFranchiseeEpc]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  // Load hierarchy and kits when district changes
  useEffect(() => {
    dispatch(fetchShopHierarchy());
    if (selectedDistrict?.id) {
      dispatch(getAvailableKitData({ districtId: selectedDistrict.id }));
      dispatch(getBulkKitBuyData({ districtId: selectedDistrict.id }));
    } else {
      dispatch(getAvailableKitData());
      dispatch(getBulkKitBuyData());
    }
  }, [selectedDistrict?.id, dispatch]);

  // Live inventory polling every 30 seconds
  useEffect(() => {
    const poll = () => {
      if (selectedDistrict?.id) {
        dispatch(fetchLiveInventory({ districtId: selectedDistrict.id }));
      } else {
        dispatch(fetchLiveInventory({}));
      }
    };

    // Initial poll
    poll();

    const intervalId = setInterval(poll, INVENTORY_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [selectedDistrict?.id, dispatch]);

  return (
    <div className="flex h-screen bg-bg text-text-primary transition-colors duration-200">
      {/* Sidebar */}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} menuItems={menuItems} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />

        <main className="flex-1 p-4 overflow-y-auto scrollbar-hover">
          <Routes>
            <Route
              path="/dashboard/*"
              element={
                isFranchiseeEpc ? (
                  <ProtectedRoute><EpcCatalogue /></ProtectedRoute>
                ) : (
                  <PreconfiguredComboKit />
                )
              }
            />

            {/* Franchisee Product Catalogue */}
            <Route
              path="/epc-catalogue"
              element={<ProtectedRoute><EpcCatalogue /></ProtectedRoute>}
            />

            {/* Normal EPC Kit Routes (Redirect if Franchisee EPC) */}
            <Route
              path="/preconfigured-combo-kit"
              element={
                isFranchiseeEpc ? (
                  <Navigate to="/epc-catalogue" replace />
                ) : (
                  <PreconfiguredComboKit />
                )
              }
            />
            <Route
              path="/custom-combo-kit"
              element={
                isFranchiseeEpc ? (
                  <Navigate to="/epc-catalogue" replace />
                ) : (
                  <ProtectedRoute><CustomComboKit /></ProtectedRoute>
                )
              }
            />
            <Route
              path="/solar-bos-kit"
              element={
                isFranchiseeEpc ? (
                  <Navigate to="/epc-catalogue" replace />
                ) : (
                  <ProtectedRoute><SolarBosKit /></ProtectedRoute>
                )
              }
            />

            <Route path="/bulk-buy" element={<ProtectedRoute><BulkBuy /></ProtectedRoute>} />
            <Route path="/request-order" element={<ProtectedRoute><BulkOrderCart /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/store-locator" element={<StoreLocatorPage />} />
            <Route path="/find-store" element={<StoreLocatorPage />} />
            <Route path="/stores" element={<StoreLocatorPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckOut /></ProtectedRoute>} />
            <Route path="/track-status" element={<ProtectedRoute><ProjectOrderStatus /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>

      {/* Location change warning dialog — rendered at root level */}
      <LocationChangeCartWarning />
    </div>
  );
}
