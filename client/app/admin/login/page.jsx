'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Captcha from '../../components/Captcha';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { adminLogin, recheckUser, isAuthenticated, user, loading: authLoading, getRoleRedirect } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(getRoleRedirect ? getRoleRedirect(user) : '/admin/dashboard');
    }
  }, [isAuthenticated, user, authLoading, router, getRoleRedirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isCaptchaVerified) {
      setError('Please solve the security verification puzzle correctly.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email, password);
      const freshUser = await recheckUser();
      const target = getRoleRedirect ? getRoleRedirect(freshUser) : '/admin/dashboard';
      window.location.href = target;
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && user?.isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[300px] bg-purple-500/10 dark:bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/10 transition-all z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-4 shadow-md shadow-indigo-600/20">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Administrator Gateway
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs sm:text-sm">
            Sign in with Super Admin, College Admin, or SPOC credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@college.edu or abdulbarr730@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Security CAPTCHA */}
          <Captcha onVerify={setIsCaptchaVerified} id="admin-login-captcha" />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3.5 font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying Admin Access...
                </>
              ) : (
                'Sign In to Admin Portal →'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft size={14} /> Student Login
          </Link>
          <Link href="/change-password" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            First-time Password Reset?
          </Link>
        </div>
      </div>
    </div>
  );
}