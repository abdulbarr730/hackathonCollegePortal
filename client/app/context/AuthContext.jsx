'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback
} from 'react';

export function getRoleRedirect(userData) {
  if (!userData) return '/login';
  if (userData.mustChangePassword) return '/change-password';
  if (userData.mustAddPhone) return '/complete-profile';

  // Super Admin (admin without a college scope)
  if (userData.role === 'admin' && !userData.college) return '/admin/dashboard';
  // College Admin (admin or college_admin assigned to a college)
  if (userData.role === 'admin' || userData.role === 'college_admin') return '/admin/dashboard';
  // SPOC
  if (userData.role === 'spoc') return '/admin/teams';
  // Default to student dashboard
  return '/dashboard';
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // CHECK USER (single source of truth)
  // =============================
  const checkUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/users/me`, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return null;
      }

      const data = await res.json();
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // =============================
  // LOGIN (Student / SPOC / Admin)
  // =============================
  const login = useCallback(async (email, password) => {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Login failed');

    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  // =============================
  // ADMIN LOGIN
  // =============================
  const adminLogin = useCallback(async (email, password) => {
    const res = await fetch(`/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Admin login failed');

    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  // =============================
  // FIRST LOGIN PASSWORD CHANGE
  // =============================
  const changeInitialPassword = useCallback(async ({ email, currentPassword, newPassword, otp }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/auth/change-initial-password`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ email, currentPassword, newPassword, otp }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Password update failed');

    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  // =============================
  // LOGOUT
  // =============================
  const logout = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed', err);
    }

    if (typeof window !== 'undefined') localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  }, []);

  // =============================
  // RECHECK USER
  // =============================
  const recheckUser = useCallback(async () => {
    const freshUser = await checkUser();
    return freshUser;
  }, [checkUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      adminLogin,
      changeInitialPassword,
      logout,
      recheckUser,
      getRoleRedirect,
    }),
    [user, loading, login, adminLogin, changeInitialPassword, logout, recheckUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}