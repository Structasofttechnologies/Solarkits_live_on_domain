import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import KycWorkspace from "./pages/KycWorkspace";
import PlansPortal from "./pages/PlansPortal";
import MyTerritories from "./pages/MyTerritories";
import AuthorizedCatalog from "./pages/AuthorizedCatalog";
import MyEpcBuyers from "./pages/MyEpcBuyers";
import MyOrders from "./pages/MyOrders";
import WalletPortal from "./pages/WalletPortal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Layout & Protected Pages */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/kyc" element={<KycWorkspace />} />
          <Route path="/plans" element={<PlansPortal />} />
          <Route path="/territories" element={<MyTerritories />} />
          <Route path="/catalog" element={<AuthorizedCatalog />} />
          <Route path="/epc-buyers" element={<MyEpcBuyers />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/wallet" element={<WalletPortal />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
