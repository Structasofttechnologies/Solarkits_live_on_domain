// src/store/uiStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: true, // for mobile
      activeBranch: { id: 'all', name: 'All Branches' },
      activeCountry: { code: 'IN', name: 'India', flag: '🇮🇳' },
      theme: 'light',
      onboardingComplete: false,
      tourActive: false,
      tourStep: 0,

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveBranch: (branch) => set({ activeBranch: branch }),
      setActiveCountry: (country) => set({ activeCountry: country }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      startTour: () => set({ tourActive: true, tourStep: 0 }),
      endTour: () => set({ tourActive: false, tourStep: 0 }),
      nextTourStep: () => set(state => ({ tourStep: state.tourStep + 1 })),
    }),
    {
      name: 'emergesun-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeBranch: state.activeBranch,
        activeCountry: state.activeCountry,
        theme: state.theme,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);
