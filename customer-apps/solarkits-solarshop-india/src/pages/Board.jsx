import { useEffect, useState } from "react";
import { Route, Routes, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiGrid,
  FiSun,
  FiZap,
  FiBatteryCharging,
  FiHome,
  FiBriefcase,
  FiSliders,
  FiLayers,
  FiTruck,
  FiHelpCircle,
  FiMapPin
} from "react-icons/fi";

import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import StoreHeader from "@/components/storefront/StoreHeader";
import CategoryNav from "@/components/storefront/CategoryNav";
import StoreFooter from "@/components/storefront/StoreFooter";
import KitComparisonDrawer from "@/components/storefront/KitComparisonDrawer";
import ExpertHelpModal from "@/components/storefront/ExpertHelpModal";
import LocationChangeCartWarning from "@/components/LocationChangeCartWarning";
import Drawer from "@/components/Drawer";

import PreconfiguredComboKit from "./dashboard/PreconfiguredComboKit";
import CustomComboKit from "./dashboard/CustomComboKit";
import Cart from "./cart/Cart";
import CheckOut from "./CheckOut";
import ProjectOrderStatus from "./dashboard/ProjectOrderStatus";
import BulkBuy from "./bulk-buy/BulkBuy";
import BulkOrderCart from "./cart/BulkOrderCart";
import ProtectedRoute from "@/components/ProtectedRoute";
import KitFinderWizard from "@/components/storefront/KitFinderWizard";
import StoreLocatorPage from "./store-locator/StoreLocatorPage";

import { getAvailableKitData, fetchLiveInventory, getBulkKitBuyData } from "@/features/slice";

export const SHOP_NAV = [
  { name: "All Solar Kits", path: "/shop", icon: FiGrid },
  { name: "Find Nearby Store", path: "/store-locator", icon: FiMapPin },
  { name: "On-Grid Kits", path: "/shop?type=on-grid", icon: FiSun },
  { name: "Off-Grid Kits", path: "/shop?type=off-grid", icon: FiBatteryCharging },
  { name: "Hybrid Kits", path: "/shop?type=hybrid", icon: FiZap },
  { name: "Residential Kits", path: "/shop?application=residential", icon: FiHome },
  { name: "Commercial Kits", path: "/shop?application=commercial", icon: FiBriefcase },
  { name: "Find Your Kit", path: "/kit-finder", icon: FiSliders },
  { name: "Track Orders", path: "/track-status", icon: FiTruck },
];

const INVENTORY_POLL_INTERVAL_MS = 30000; // 30 seconds

export default function Board() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comparedKits, setComparedKits] = useState([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [expertPreselectedKit, setExpertPreselectedKit] = useState(null);

  const dispatch = useDispatch();
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
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

    poll();
    const intervalId = setInterval(poll, INVENTORY_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [selectedDistrict?.id, dispatch]);

  const handleOpenExpertHelp = (kit = null) => {
    setExpertPreselectedKit(kit);
    setShowExpertModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary transition-colors duration-200">
      
      {/* Top Announcement Bar */}
      <AnnouncementBar onOpenExpertHelp={() => handleOpenExpertHelp()} />

      {/* Main Storefront Header */}
      <StoreHeader
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        compareCount={comparedKits.length}
        onOpenCompare={() => setShowCompareDrawer(true)}
        onOpenExpertHelp={() => handleOpenExpertHelp()}
      />

      {/* Category Navigation Bar */}
      <CategoryNav />

      {/* Mobile-only Slide-out Navigation Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          isMobile={isMobile}
          menuItems={SHOP_NAV}
        />
      )}

      {/* Full-width main content area */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          {/* Shop / Product Listing */}
          <Route path="/shop" element={<PreconfiguredComboKit />} />
          <Route path="/preconfigured-combo-kit" element={<PreconfiguredComboKit />} />

          {/* Store Locator Routes */}
          <Route path="/store-locator" element={<StoreLocatorPage />} />
          <Route path="/find-store" element={<StoreLocatorPage />} />
          <Route path="/stores" element={<StoreLocatorPage />} />

          {/* Interactive Guided Sizing Assistant */}
          <Route
            path="/kit-finder"
            element={
              <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6">
                <KitFinderWizard onSelectKit={(k) => handleOpenExpertHelp(k)} />
              </div>
            }
          />

          {/* Dedicated Compare Kits route */}
          <Route
            path="/compare"
            element={
              <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6">
                <KitComparisonDrawer
                  comparedKits={comparedKits}
                  isOpen={true}
                  onClose={() => {}}
                  onRemoveKit={(id) => setComparedKits((p) => p.filter((k) => k.id !== id))}
                  onClearAll={() => setComparedKits([])}
                />
              </div>
            }
          />

          {/* Custom solar kit configuration */}
          <Route
            path="/custom-combo-kit"
            element={
              <ProtectedRoute>
                <CustomComboKit />
              </ProtectedRoute>
            }
          />

          {/* Bulk commercial solar orders */}
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

          {/* Shopping Cart */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckOut />
              </ProtectedRoute>
            }
          />

          {/* Order Tracking & My Orders */}
          <Route
            path="/track-status"
            element={
              <ProtectedRoute>
                <ProjectOrderStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <ProjectOrderStatus />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Shop */}
          <Route path="*" element={<PreconfiguredComboKit />} />
        </Routes>
      </main>

      {/* Global Storefront Footer */}
      <StoreFooter />

      {/* Side-by-side comparison modal */}
      <KitComparisonDrawer
        comparedKits={comparedKits}
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        onRemoveKit={(id) => setComparedKits((p) => p.filter((k) => k.id !== id))}
        onClearAll={() => setComparedKits([])}
      />

      {/* Expert Consultation Modal */}
      <ExpertHelpModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        preselectedKit={expertPreselectedKit}
      />

      {/* Location change warning dialog */}
      <LocationChangeCartWarning />
    </div>
  );
}
