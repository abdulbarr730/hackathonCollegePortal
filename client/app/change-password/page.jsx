'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import Footer from '../components/Footer';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound, Mail } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, changeInitialPassword, recheckUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await changeInitialPassword({
        email: email || user?.email,
        currentPassword,
        newPassword
      });

      setSuccess(true);
      const freshUser = await recheckUser();

      setTimeout(() => {
        const dest = getRoleRedirect(freshUser);
        window.location.href = dest;
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-grow flex items-center justify-center py-16 px-4 z-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl transition-all">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-4 shadow-md shadow-indigo-600/20">
              <KeyRound size={26} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              First-Time Security Setup
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Your account was provisioned with temporary access credentials. Please set your permanent secure password to continue.
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={44} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Password Successfully Updated!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Your credentials are now secured. Redirecting you to your workspace...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Current Temporary Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current / temporary password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  New Permanent Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm Permanent Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3.5 font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Set Permanent Password →'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Having trouble?{' '}
            <Link href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Reset via Email OTP
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
