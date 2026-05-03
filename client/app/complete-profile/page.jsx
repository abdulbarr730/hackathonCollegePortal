'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';

export default function CompleteProfile() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  // Sync with current theme on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const check = async () => {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (!res.ok) return;
      const user = await res.json();
      if (!user.mustAddPhone) router.push('/dashboard');
    };
    check();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone) return setError('Phone number is required.');
    if (!/^[0-9]{10}$/.test(phone)) return setError('Enter a valid 10-digit mobile number.');

    setLoading(true);
    try {
      const res = await fetch('/api/users/update-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update phone');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">

      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Theme toggle */}
      

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-500/10 transition-colors duration-300">

        {/* Step indicators */}
        <div className="flex gap-1.5 justify-center mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 w-7 rounded-full transition-all ${i < 2 ? 'bg-indigo-500' : 'bg-indigo-500/40'}`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
            <Phone size={22} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            One last step
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Add your phone number to complete your profile and access your workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <span className="text-sm text-red-600 dark:text-red-300">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                <Phone size={18} />
              </div>
              {/* text not tel - kills browser phone icon; numeric inputMode for mobile keyboard; no autocomplete */}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 ml-1">
              We'll use this to notify you about hackathon updates.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Saving...</>
              ) : (
                <>Save &amp; continue <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}