'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/reset-password/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      setMessage(data.msg + ' Redirecting to login...');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-blue-500/30 bg-slate-800/70 p-8 shadow-2xl shadow-blue-500/20">
        <h2 className="mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-center text-3xl font-bold text-transparent">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Success & Error */}
          {message && (
            <p className="rounded-lg bg-green-500/20 p-3 text-center text-sm text-green-300">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border-none bg-black/30 p-3 pr-10 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Must be at least 6 characters long.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          {/* Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-medium text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
