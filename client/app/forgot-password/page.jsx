'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    setLoading(true);

    try {
      const res = await fetch(`/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success for security
      setStatus({ 
        type: 'success', 
        msg: 'If an account exists, a reset link has been sent to your email.' 
      });
    } catch (err) {
      setStatus({ type: 'error', msg: 'Network error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Ambient Glows (Theme Aware) */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[128px]"></div>
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-purple-500/10 dark:bg-purple-500/20 blur-[128px]"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/30">
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Mail size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Forgot Password?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Don't worry. Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>Send Reset Link <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}