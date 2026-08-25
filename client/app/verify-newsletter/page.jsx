'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/newsletter/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setMessage(data.msg || '🎉 Your newsletter subscription is verified!');
        } else {
          setSuccess(false);
          setMessage(data.message || data.msg || 'Verification failed. The token may be expired.');
        }
      } catch (err) {
        setSuccess(false);
        setMessage('Network error while verifying subscription.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-2xl text-center space-y-6">
        
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          {loading ? (
            <Loader2 size={32} className="animate-spin" />
          ) : success ? (
            <CheckCircle2 size={36} className="text-emerald-500" />
          ) : (
            <AlertCircle size={36} className="text-rose-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Mail size={12} /> Newsletter Verification
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? 'Verifying Subscription...' : success ? 'Subscription Confirmed!' : 'Verification Issue'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
          {email && (
            <p className="text-xs text-slate-400 font-mono">
              Account: {email}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-md transition-all"
          >
            <span>Go to Hackathon Portal</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function VerifyNewsletterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
