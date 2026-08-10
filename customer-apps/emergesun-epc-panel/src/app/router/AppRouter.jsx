import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/permissions/ProtectedRoute';
import { getSession } from '../../mocks/auth';

// Auth & Landing pages
import LandingPage from '../../features/landing/LandingPage';
import LoginPage from '../../features/auth/LoginPage';
import ForgotPasswordPage from '../../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../features/auth/ResetPasswordPage';

// Main pages
import DashboardPage from '../../features/dashboard/DashboardPage';

// Companies
import CompaniesPage from '../../features/companies/CompaniesPage';
import CompanyDetailPage from '../../features/companies/CompanyDetailPage';
import CompanyFormPage from '../../features/companies/CompanyFormPage';

// Countries
import CountriesPage from '../../features/countries/CountriesPage';

// Users
import UsersPage from '../../features/users/UsersPage';
import UserFormPage from '../../features/users/UserFormPage';
import UserDetailPage from '../../features/users/UserDetailPage';

// Roles
import RolesPage from '../../features/roles/RolesPage';

// Product Access
import ProductAccessPage from '../../features/product-access/ProductAccessPage';

// Reports
import ReportsPage from '../../features/reports/ReportsPage';

// Audit Logs
import AuditLogsPage from '../../features/audit-logs/AuditLogsPage';

// Notifications
import NotificationsPage from '../../features/notifications/NotificationsPage';

// Settings
import SettingsPage from '../../features/settings/SettingsPage';

// Subscriptions
import SubscriptionsPage from '../../features/subscriptions/SubscriptionsPage';

// Product modules
import ResidentialSolarPage from '../../modules/residential-solar/ResidentialSolarPage';
import CommercialSolarPage from '../../modules/commercial-solar/CommercialSolarPage';
import SolarShopPage from '../../modules/solar-shop/SolarShopPage';
import ProcurementPage from '../../modules/procurement/ProcurementPage';
import CrmPage from '../../modules/crm/CrmPage';
import OrdersPage from '../../modules/orders/OrdersPage';
import SupportPage from '../../modules/support/SupportPage';

// Misc pages
import AccessDeniedPage from '../../pages/AccessDeniedPage';
import NotFoundPage from '../../pages/NotFoundPage';

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-solar-slate text-sm">Loading...</span>
    </div>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter basename="/epc-panel">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={getSession() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/landing" element={getSession() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Companies */}
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/create" element={<CompanyFormPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/companies/:id/edit" element={<CompanyFormPage />} />

            {/* Countries */}
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/countries/create" element={<div className="p-8 text-center text-solar-slate">Country Form — Coming Soon</div>} />
            <Route path="/countries/:id" element={<CountriesPage />} />
            <Route path="/countries/:id/edit" element={<div className="p-8 text-center text-solar-slate">Country Edit — Coming Soon</div>} />

            {/* Users */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/create" element={<UserFormPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />

            {/* Roles */}
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/roles/create" element={<div className="p-8 text-center text-solar-slate">Role Builder — Coming Soon</div>} />
            <Route path="/roles/:id" element={<RolesPage />} />
            <Route path="/roles/:id/edit" element={<RolesPage />} />

            {/* Product Access */}
            <Route path="/product-access" element={<ProductAccessPage />} />
            <Route path="/product-access/:productId" element={<ProductAccessPage />} />

            {/* Product Modules */}
            <Route path="/residential-solar" element={<ResidentialSolarPage />} />
            <Route path="/commercial-solar" element={<CommercialSolarPage />} />
            <Route path="/solar-shop" element={<SolarShopPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/support" element={<SupportPage />} />

            {/* Management */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Error */}
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
