// src/routes/AppRouter.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import { useAuthStore } from '../store/authStore';

// Public Landing Page & Auth pages (eager load)
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import OnboardingPage from '../pages/auth/OnboardingPage';
import NotFoundPage from '../pages/NotFoundPage';

// Lazy load all other pages
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const CustomerListPage = lazy(() => import('../pages/customers/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('../pages/customers/CustomerDetailPage'));
const SiteListPage = lazy(() => import('../pages/sites/SiteListPage'));
const SiteDetailPage = lazy(() => import('../pages/sites/SiteDetailPage'));
const AMCPlanListPage = lazy(() => import('../pages/amc-plans/AMCPlanListPage'));
const ContractListPage = lazy(() => import('../pages/contracts/ContractListPage'));
const ContractDetailPage = lazy(() => import('../pages/contracts/ContractDetailPage'));
const SchedulePage = lazy(() => import('../pages/schedule/SchedulePage'));
const TechnicianListPage = lazy(() => import('../pages/technicians/TechnicianListPage'));
const TechnicianDetailPage = lazy(() => import('../pages/technicians/TechnicianDetailPage'));
const CleaningPage = lazy(() => import('../pages/cleaning/CleaningPage'));
const MaintenancePage = lazy(() => import('../pages/maintenance/MaintenancePage'));
const TicketListPage = lazy(() => import('../pages/tickets/TicketListPage'));
const TicketDetailPage = lazy(() => import('../pages/tickets/TicketDetailPage'));
const MonitoringDashboardPage = lazy(() => import('../pages/monitoring/MonitoringDashboardPage'));
const SiteMonitoringPage = lazy(() => import('../pages/monitoring/SiteMonitoringPage'));
const AIAnalyticsPage = lazy(() => import('../pages/ai-analytics/AIAnalyticsPage'));
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage'));
const FinancePage = lazy(() => import('../pages/finance/FinancePage'));
const InvoiceListPage = lazy(() => import('../pages/finance/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('../pages/finance/InvoiceDetailPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const IntegrationsPage = lazy(() => import('../pages/integrations/IntegrationsPage'));
const TeamPage = lazy(() => import('../pages/team/TeamPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const SubscriptionPage = lazy(() => import('../pages/subscription/SubscriptionPage'));
const CustomerPortalPage = lazy(() => import('../pages/customer-portal/CustomerPortalPage'));
const TechnicianAppPage = lazy(() => import('../pages/technician-app/TechnicianAppPage'));

const PageLoader = () => (
  <div className="p-6">
    <SkeletonLoader type="page" />
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Public Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/sites" element={<SiteListPage />} />
          <Route path="/sites/:id" element={<SiteDetailPage />} />
          <Route path="/amc-plans" element={<AMCPlanListPage />} />
          <Route path="/amc-plans/:id" element={<AMCPlanListPage />} />
          <Route path="/contracts" element={<ContractListPage />} />
          <Route path="/contracts/new" element={<ContractListPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/technicians" element={<TechnicianListPage />} />
          <Route path="/technicians/:id" element={<TechnicianDetailPage />} />
          <Route path="/cleaning" element={<CleaningPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/monitoring" element={<MonitoringDashboardPage />} />
          <Route path="/monitoring/:siteId" element={<SiteMonitoringPage />} />
          <Route path="/ai-analytics" element={<AIAnalyticsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/warranties" element={<InventoryPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/roles" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Standalone portals */}
        <Route path="/customer-portal/*" element={
          <Suspense fallback={<PageLoader />}>
            <CustomerPortalPage />
          </Suspense>
        } />
        <Route path="/technician-app/*" element={
          <Suspense fallback={<PageLoader />}>
            <TechnicianAppPage />
          </Suspense>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

