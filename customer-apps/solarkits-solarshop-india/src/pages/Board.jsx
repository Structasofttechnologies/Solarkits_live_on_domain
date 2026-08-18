import { useEffect, useState } from "react";
import Header from "../components/Header";
import Drawer from "../components/Drawer";
import LocationChangeCartWarning from "../components/LocationChangeCartWarning";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import PreconfiguredComboKit from "./dashboard/PreconfiguredComboKit";
import CustomComboKit from "./dashboard/CustomComboKit";
import SolarBosKit from "./dashboard/SolarBosKit";
import Cart from "./cart/Cart";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableKitData, fetchLiveInventory, getBulkKitBuyData } from "../features/slice";
import BulkBuy from "./bulk-buy/BulkBuy";
import BulkOrderCart from "./cart/BulkOrderCart";
import CheckOut from "./CheckOut";
import ProjectOrderStatus from "./dashboard/ProjectOrderStatus";
import EpcCatalogue from "./dashboard/EpcCatalogue";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  FiGrid, FiLayers, FiPackage, FiShoppingCart, FiList, FiChevronRight,
} from "react-icons/fi";

// ─── Category navigation for e-commerce header ───────────────────────────────
// These are displayed in the Header's top navigation, not a sidebar.
// Kept here as a reference for the Header component to consume if needed.
export const SHOP_NAV = [
  { name: "Combo Kits", path: "/preconfigured-combo-kit", icon: FiGrid },
  { name: "BOS Kits", path: "/solar-bos-kit", icon: FiLayers },
  { name: "Product Catalogue", path: "/epc-catalogue", icon: FiPackage },
  { name: "Custom Kit", path: "/custom-combo-kit", icon: FiList },
  { name: "Bulk Orders", path: "/bulk-buy", icon: FiShoppingCart },
  { name: "Track Order", path: "/track-status", icon: FiChevronRight },
];

const INVENTORY_POLL_INTERVAL_MS = 30000; // 30 seconds

export default function Board() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // isOpen is kept for mobile nav drawer compatibility with Header component
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      // Always close mobile drawer on resize to desktop
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load kits when district changes
  useEffect(() => {
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
    // Full-width storefront layout — NO sidebar. Header sits at top.
    <div className="flex flex-col min-h-screen bg-bg text-text-primary transition-colors duration-200">
      {/* E-commerce Header — includes location picker, cart, account, and category nav */}
      <Header
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        shopNav={SHOP_NAV}
      />

      {/* Mobile-only Slide-out Navigation Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          menuItems={SHOP_NAV}
        />
      )}

      {/* Full-width main content area — no left sidebar */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route
            path="/epc-catalogue"
            element={
              <ProtectedRoute>
                <EpcCatalogue />
              </ProtectedRoute>
            }
          />
          <Route path="/preconfigured-combo-kit" element={<PreconfiguredComboKit />} />
          <Route
            path="/custom-combo-kit"
            element={
              <ProtectedRoute>
                <CustomComboKit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-buy"
            element={
              <ProtectedRoute>
                <BulkBuy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-order"
            element={
              <ProtectedRoute>
                <BulkOrderCart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solar-bos-kit"
            element={
              <ProtectedRoute>
                <SolarBosKit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-status"
            element={
              <ProtectedRoute>
                <ProjectOrderStatus />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Location change warning dialog — rendered at root level */}
      <LocationChangeCartWarning />
    </div>
  );
}
