import { create } from 'zustand';
import { getSession, mockLogout } from '../mocks/auth';
import { companies } from '../mocks/companies';

const useStore = create((set, get) => ({
  // Auth
  user: getSession(),
  isAuthenticated: !!getSession(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    mockLogout();
    set({ user: null, isAuthenticated: false });
  },

  // Global selectors
  selectedCompanyId: getSession()?.companyId || companies[0]?.id,
  selectedCountry: getSession()?.country || 'India',

  setSelectedCompany: (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    set({
      selectedCompanyId: companyId,
      selectedCountry: company?.operatingCountries?.[0] || 'India',
    });
  },
  setSelectedCountry: (country) => set({ selectedCountry: country }),

  getSelectedCompany: () => {
    const { selectedCompanyId } = get();
    return companies.find((c) => c.id === selectedCompanyId) || companies[0];
  },

  // Sidebar
  sidebarCollapsed: false,
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Mobile drawer
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (val) => set({ mobileDrawerOpen: val }),

  // Notifications
  notificationCount: 3,
  setNotificationCount: (n) => set({ notificationCount: n }),

  // Dev role switcher
  devRoleOverride: null,
  setDevRoleOverride: (role) => set({ devRoleOverride: role }),

  // Effective role
  getEffectiveRole: () => {
    const { user, devRoleOverride } = get();
    return devRoleOverride || user?.roleCode || 'SUPER_ADMIN';
  },

  // Session expired modal
  sessionExpired: false,
  setSessionExpired: (val) => set({ sessionExpired: val }),
}));

export default useStore;
