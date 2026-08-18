import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'distributor' | 'dealer' | null
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      // Try distributor first
      try {
        const res = await api.get('/auth/distributor/me');
        if (res.data?.success && res.data?.distributor) {
          setUser(res.data.distributor);
          setRole('distributor');
          return;
        }
      } catch (e) {
        // Ignore 401
      }

      // Try dealer
      try {
        const res = await api.get('/auth/dealer/me');
        if (res.data?.success && res.data?.dealer) {
          setUser(res.data.dealer);
          setRole('dealer');
          return;
        }
      } catch (e) {
        // Ignore 401
      }

      setUser(null);
      setRole(null);
    } catch (err) {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginDistributor = async (identifier, password) => {
    const res = await api.post('/auth/distributor/login', { identifier, password });
    if (res.data?.success) {
      setUser(res.data.distributor);
      setRole('distributor');
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const loginDealer = async (identifier, password) => {
    const res = await api.post('/auth/dealer/login', { identifier, password });
    if (res.data?.success) {
      setUser(res.data.dealer);
      setRole('dealer');
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = async () => {
    try {
      if (role === 'distributor') {
        await api.post('/auth/distributor/logout');
      } else if (role === 'dealer') {
        await api.post('/auth/dealer/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        distributor: role === 'distributor' ? user : null,
        dealer: role === 'dealer' ? user : null,
        isAuthenticated: Boolean(user),
        loading,
        loginDistributor,
        loginDealer,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
