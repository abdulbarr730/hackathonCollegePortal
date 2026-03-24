'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Stable Check User Function
  // GET /api/users/me — stays on user routes (not auth)
  const checkUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // 2. Login: POST /api/auth/login — moved to auth routes
  const login = useCallback(async (email, password) => {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.msg || 'Login failed');
    }

    // Force a hard refresh to the dashboard to ensure all state is clean
    window.location.href = '/dashboard';
  }, []);

  // 3. Logout: POST /api/auth/logout — moved to auth routes
  const logout = useCallback(async () => {
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed', error);
    }

    setUser(null);
    // Forces the browser to reload, clearing all memory/cache
    window.location.href = '/login';
  }, []);

  const recheckUser = useCallback(() => {
    setLoading(true);
    checkUser();
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