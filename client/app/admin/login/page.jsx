'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // MODIFIED: Get full auth state to check if already logged in
  const { recheckUser, isAuthenticated, user, loading: authLoading } = useAuth();

  // ADDED: useEffect to redirect if already an admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed.');
      await recheckUser();
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Loading state while checking auth
  if (authLoading || (isAuthenticated && user?.isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-white">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded bg-red-500/20 p-3 text-center text-sm text-red-300">{error}</p>}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border-slate-700 bg-slate-900 p-3"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border-slate-700 bg-slate-900 p-3"
              required
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}