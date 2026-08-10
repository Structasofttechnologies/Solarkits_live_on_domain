// src/layouts/AppLayout.jsx
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useUIStore } from '../store/uiStore';
import { useIsMobile } from '../hooks';
import ToastContainer from '../components/common/Toast';

export default function AppLayout() {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const isMobile = useIsMobile();

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  const sidebarWidth = sidebarCollapsed ? '4rem' : '16rem';

  return (
    <div className="min-h-screen bg-bg flex overflow-x-hidden">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/50 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={isMobile ? (sidebarOpen ? 'fixed inset-y-0 left-0 z-40 animate-slide-right' : 'hidden') : ''}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-250"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <Header />
        <main
          className="flex-1 overflow-x-hidden"
          style={{ marginTop: '3.5rem' }}
        >
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
