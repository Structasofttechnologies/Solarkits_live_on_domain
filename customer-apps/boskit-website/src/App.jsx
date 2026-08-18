import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Public Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import DistributorProgramPage from './pages/DistributorProgramPage';
import DealerProgramPage from './pages/DealerProgramPage';
import PlansPage from './pages/PlansPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DistributorOnboardingPage from './pages/DistributorOnboardingPage';
import DealerRegisterPage from './pages/dealer/DealerRegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

// Distributor Portal
import DistributorLayout from './components/distributor/DistributorLayout';
import DistributorDashboardPage from './pages/distributor/DistributorDashboardPage';
import DistributorDealersPage from './pages/distributor/DistributorDealersPage';
import DistributorDealerApplicationsPage from './pages/distributor/DistributorDealerApplicationsPage';
import DistributorTerritoryPage from './pages/distributor/DistributorTerritoryPage';
import DistributorPlanPage from './pages/distributor/DistributorPlanPage';

// Dealer Portal
import DealerLayout from './components/dealer/DealerLayout';
import DealerDashboardPage from './pages/dealer/DealerDashboardPage';
import DealerCataloguePage from './pages/dealer/DealerCataloguePage';
import DealerOrdersPage from './pages/dealer/DealerOrdersPage';
import DealerDistributorHubPage from './pages/dealer/DealerDistributorHubPage';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#17211B]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Distributor Authenticated Portal */}
            <Route path="/distributor/portal" element={<DistributorLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DistributorDashboardPage />} />
              <Route path="dealers" element={<DistributorDealersPage />} />
              <Route path="dealer-applications" element={<DistributorDealerApplicationsPage />} />
              <Route path="territory" element={<DistributorTerritoryPage />} />
              <Route path="plan" element={<DistributorPlanPage />} />
            </Route>

            {/* Dealer Authenticated Portal */}
            <Route path="/dealer/portal" element={<DealerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DealerDashboardPage />} />
              <Route path="catalogue" element={<DealerCataloguePage />} />
              <Route path="orders" element={<DealerOrdersPage />} />
              <Route path="hub" element={<DealerDistributorHubPage />} />
            </Route>

            {/* Dashboard Redirect Aliases */}
            <Route path="/distributor/dashboard" element={<Navigate to="/distributor/portal/dashboard" replace />} />
            <Route path="/dealer/dashboard" element={<Navigate to="/dealer/portal/dashboard" replace />} />

            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/success/:id" element={<OrderSuccessPage />} />
              <Route path="/distributor" element={<DistributorProgramPage />} />
              <Route path="/dealer" element={<DealerProgramPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/application/status" element={<ApplicationStatusPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/distributor/onboarding" element={<DistributorOnboardingPage />} />
              <Route path="/dealer/register" element={<DealerRegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
