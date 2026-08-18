import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import BoskitAdminLayout from "./layout/BoskitAdminLayout";

const BoskitOverviewDashboard = lazy(() => import("./pages/BoskitOverviewDashboard"));
const DistributorApplicationsPage = lazy(() => import("./pages/DistributorApplicationsPage"));
const DistributorDetailPage = lazy(() => import("./pages/DistributorDetailPage"));
const DistributorsListPage = lazy(() => import("./pages/DistributorsListPage"));
const DistributorPlansAdminPage = lazy(() => import("./pages/DistributorPlansAdminPage"));
const DealersAdminPage = lazy(() => import("./pages/DealersAdminPage"));
const ContentManagementPage = lazy(() => import("./pages/ContentManagementPage"));
const CrossPlatformReportsPage = lazy(() => import("./pages/CrossPlatformReportsPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));

function SubLoader() {
  return (
    <div className="p-12 text-center text-slate-400 text-xs">
      Loading BOSKIT module...
    </div>
  );
}

export default function BoskitAdminPortalApp() {
  return (
    <Routes>
      <Route element={<BoskitAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<SubLoader />}>
              <BoskitOverviewDashboard />
            </Suspense>
          }
        />
        <Route
          path="applications"
          element={
            <Suspense fallback={<SubLoader />}>
              <DistributorApplicationsPage />
            </Suspense>
          }
        />
        <Route
          path="applications/:id"
          element={
            <Suspense fallback={<SubLoader />}>
              <DistributorDetailPage />
            </Suspense>
          }
        />
        <Route
          path="distributors"
          element={
            <Suspense fallback={<SubLoader />}>
              <DistributorsListPage />
            </Suspense>
          }
        />
        <Route
          path="plans"
          element={
            <Suspense fallback={<SubLoader />}>
              <DistributorPlansAdminPage />
            </Suspense>
          }
        />
        <Route
          path="dealers"
          element={
            <Suspense fallback={<SubLoader />}>
              <DealersAdminPage />
            </Suspense>
          }
        />
        <Route
          path="content"
          element={
            <Suspense fallback={<SubLoader />}>
              <ContentManagementPage />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<SubLoader />}>
              <CrossPlatformReportsPage />
            </Suspense>
          }
        />
        <Route
          path="audit-logs"
          element={
            <Suspense fallback={<SubLoader />}>
              <AuditLogsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
