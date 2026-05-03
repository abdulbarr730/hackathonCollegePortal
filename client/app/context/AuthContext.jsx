'use client';

  // runs once on mount

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // CHECK USER (single source of truth)
  // =============================
  const checkUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch(`/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('token'); // clear bad token
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
  // LOGIN
  // =============================
  const login = useCallback(async (email, password) => {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // remove credentials: 'include' — no longer using cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Login failed');

    // Store token
    localStorage.setItem('token', data.token);
    return data;
  }, []);

  // =============================
  // LOGOUT
  // =============================
  const logout = useCallback(async () => {
  try {
    await fetch(`/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  } catch (err) {
    console.error('Logout failed', err);
  }

  localStorage.removeItem('token');
  setUser(null);
  window.location.href = '/login';
}, []);



  // =============================
  // RECHECK USER (NOW FIXED)
  // =============================
  const recheckUser = useCallback(async () => {
    const user = await checkUser();
    return user;
  }, [checkUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      recheckUser,
    }),
    [user, loading, login, logout, recheckUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}