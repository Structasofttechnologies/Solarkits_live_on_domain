import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BdeAuthProvider } from './context/BdeAuthContext';
import BdeProtectedRoute from './components/BdeProtectedRoute';
import BdeLayout from './components/BdeLayout';
import BdeLogin from './pages/BdeLogin';
import BdeDashboard from './pages/BdeDashboard';
import BdeLeads from './pages/BdeLeads';
import BdeFranchisees from './pages/BdeFranchisees';
import BdeGoals from './pages/BdeGoals';
import BdeStoreSetup from './pages/BdeStoreSetup';
import BdeNotifications from './pages/BdeNotifications';
import BdeProfile from './pages/BdeProfile';

export default function App() {
  return (
    <BrowserRouter>
      <BdeAuthProvider>
        <Routes>
          <Route path="/login" element={<BdeLogin />} />

          <Route element={<BdeProtectedRoute />}>
            <Route element={<BdeLayout />}>
              <Route path="/" element={<BdeDashboard />} />
              <Route path="/leads" element={<BdeLeads />} />
              <Route path="/franchisees" element={<BdeFranchisees />} />
              <Route path="/goals" element={<BdeGoals />} />
              <Route path="/store-setup" element={<BdeStoreSetup />} />
              <Route path="/notifications" element={<BdeNotifications />} />
              <Route path="/profile" element={<BdeProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BdeAuthProvider>
    </BrowserRouter>
  );
}