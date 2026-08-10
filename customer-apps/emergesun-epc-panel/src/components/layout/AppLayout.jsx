import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useStore from '../../store/useStore';
import SessionExpiredModal from '../common/SessionExpiredModal';
import { Toaster } from 'react-hot-toast';

export default function AppLayout() {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="min-h-screen bg-solar-bg flex">
      <Sidebar />

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <TopBar />

        {/* Page content */}
        <main className="flex-1 pt-16 overflow-auto">
          <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <SessionExpiredModal />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#102A43',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22A06B', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
