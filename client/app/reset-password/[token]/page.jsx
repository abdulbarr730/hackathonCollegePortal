'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (password.length < 6) {
      setStatus({ type: 'error', msg: 'Password must be at least 6 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`/api/users/reset-password/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg || 'Something went wrong');
      
      setStatus({ type: 'success', msg: 'Password reset successful! Redirecting...' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || "An unknown error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Ambient Glows */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[128px]"></div>
      
      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/30">
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Lock size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Set New Password</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {status.msg && (
              <div className={`flex items-start gap-3 rounded-lg p-4 text-sm ${
                status.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                  : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
              }`}>
                {status.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5"/> : <AlertCircle size={18} className="shrink-0 mt-0.5"/>}
                <p>{status.msg}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                New Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 pl-4 pr-10 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 pl-4 pr-10 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>Reset Password <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}