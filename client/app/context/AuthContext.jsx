'use client';

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
    try {
      const res = await fetch(`/api/users/me`, {
        credentials: 'include'
      });

      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return null;
      }

      const data = await res.json();

      setUser(data);
      setLoading(false);

      return data;

    } catch (error) {
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  // =============================
  // LOGIN
  // =============================
  const login = useCallback(async (email, password) => {
    const res = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || 'Login failed');
    }

    // ❌ DO NOT trust login user
    // ❌ DO NOT setUser here

    return data;
  }, []);

  // =============================
  // LOGOUT
  // =============================
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