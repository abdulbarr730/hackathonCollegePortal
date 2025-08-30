'use client';
import { useState } from 'react';
import Link from 'next/link';

const API_BASE_URL = '';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      await res.json();
      // Always show a generic success message
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Overlay blur + dark tint */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-blue-500/30 bg-slate-800/70 p-8 shadow-2xl shadow-blue-500/20">
        {/* Title */}
        <h2 className="mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-center text-3xl font-bold text-transparent">
          Forgot Password
        </h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          Enter your email and we’ll send you a secure link to reset your password.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <p className="rounded-lg bg-blue-500/20 p-3 text-center text-sm text-blue-300">
              {message}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border-none bg-black/30 px-4 py-3 text-gray-200 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-blue-500 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
