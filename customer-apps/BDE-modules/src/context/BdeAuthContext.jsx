import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BdeAuthContext = createContext(null);

export function BdeAuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('bde_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bde_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      setProfile(res.data.data);
      if (res.data.data) {
        setUser(prev => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password, rememberMe = false) => {
    const res = await api.post('/auth/login', {
      identifier,
      password,
      remember_me: rememberMe,
    });

    const { token: newToken, bde } = res.data;
    setToken(newToken);
    setUser(bde);
    localStorage.setItem('bde_token', newToken);
    localStorage.setItem('bde_user', JSON.stringify(bde));
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('bde_token');
      localStorage.removeItem('bde_user');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });

    if (res.data.token) {
      setToken(res.data.token);
      localStorage.setItem('bde_token', res.data.token);
    }

    setUser(prev => ({ ...prev, is_first_login: false }));
    return res.data;
  };

  const updateProfile = async (updateData) => {
    const res = await api.put('/profile/update', updateData);
    await fetchProfile();
    return res.data;
  };

  return (
    <BdeAuthContext.Provider
      value={{
        token,
        user,
        profile,
        loading,
        login,
        logout,
        changePassword,
        updateProfile,
        refreshProfile: fetchProfile,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </BdeAuthContext.Provider>
  );
}

export function useBdeAuth() {
  const context = useContext(BdeAuthContext);
  if (!context) {
    throw new Error('useBdeAuth must be used within a BdeAuthProvider');
  }
  return context;
}
