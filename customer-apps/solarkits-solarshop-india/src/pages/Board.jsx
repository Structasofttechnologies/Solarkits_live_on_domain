import { useEffect, useState } from "react";
import Drawer from "../components/Drawer";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import LocationChangeCartWarning from "../components/LocationChangeCartWarning";
import { Route, Routes } from "react-router-dom";
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
import {
  MdDashboard,
  MdShoppingCart,
  MdListAlt,
  MdSettings,
} from "react-icons/md";
import { FaBoxes, FaSolarPanel, FaShoppingBag } from "react-icons/fa";

const menuItems = [
  [
    {
      name: "Dashboard",
      icon: <MdDashboard />,
      path: "/dashboard",
    },
  ],
  [
    // ── EPC Catalogue (reseller-onboarded products) ──
    { name: "Product Catalogue", icon: <FaShoppingBag />, path: "/epc-catalogue", requiresAuth: true },
  ],
  [
    { name: "Solar Combo Kit", icon: <FaSolarPanel />, path: "/preconfigured-combo-kit" },
    { name: "Custom Combo Kit", icon: <MdSettings />, path: "/custom-combo-kit", requiresAuth: true },
    { name: "Solar BOS Kit", icon: <MdSettings />, path: "/solar-bos-kit", requiresAuth: true },
    { name: "Bulk Buy", icon: <FaBoxes />, path: "/bulk-buy", requiresAuth: true },
    { name: "Request Order", icon: <MdListAlt />, path: "/request-order", requiresAuth: true },
    { name: "Cart", icon: <MdShoppingCart />, path: "/cart", requiresAuth: true },
  ],
  [
    { name: "Track Order Status", icon: <MdListAlt />, path: "/track-status", requiresAuth: true },
  ],
  [{ name: "Settings", icon: <MdSettings />, path: "/settings", requiresAuth: true }]
];

const INVENTORY_POLL_INTERVAL_MS = 30000; // 30 seconds

export default function Board() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dispatch = useDispatch();
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);

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
    <div className="flex h-screen bg-bg text-text-primary transition-colors duration-200">
      {/* Sidebar */}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} menuItems={menuItems} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />

        <main className="flex-1 p-4 overflow-y-auto scrollbar-hover">
          <Routes>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/epc-catalogue" element={<ProtectedRoute><EpcCatalogue /></ProtectedRoute>} />
            <Route path="/preconfigured-combo-kit" element={<PreconfiguredComboKit />} />
            <Route path="/custom-combo-kit" element={<ProtectedRoute><CustomComboKit /></ProtectedRoute>} />
            <Route path="/bulk-buy" element={<ProtectedRoute><BulkBuy /></ProtectedRoute>} />
            <Route path="/request-order" element={<ProtectedRoute><BulkOrderCart /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/solar-bos-kit" element={<ProtectedRoute><SolarBosKit /></ProtectedRoute>} />
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
