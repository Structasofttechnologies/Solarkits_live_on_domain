// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROLE_PERMISSIONS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/amc-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const result = await res.json();
          if (res.ok && result.success && result.user) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true, message: result.message };
          }
          set({ isLoading: false });
          return { success: false, message: result.message || 'Invalid email or password' };
        } catch (err) {
          console.error('API Login error:', err);
          set({ isLoading: false });
          return { success: false, message: 'Server connection failed. Please check backend.' };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/amc-auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: formData.companyName,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
            }),
          });

          const result = await res.json();
          set({ isLoading: false });
          if (res.ok && result.success) {
            return { success: true, message: result.message || 'Account created successfully!' };
          }
          return { success: false, message: result.message || 'Registration failed' };
        } catch (err) {
          console.error('API Register error:', err);
          set({ isLoading: false });
          return { success: false, message: 'Server connection failed. Please check backend.' };
        }
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, token: null });
        localStorage.removeItem('emergesun-auth');
      },

      switchRole: (role) => {
        set(state => ({
          user: state.user ? { ...state.user, role } : null
        }));
      },

      switchBranch: (branch) => {
        set(state => ({
          user: state.user ? { ...state.user, branch } : null
        }));
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        return perms.includes(permission);
      },
    }),
    {
      name: 'emergesun-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);
