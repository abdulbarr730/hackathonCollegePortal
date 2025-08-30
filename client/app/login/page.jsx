'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;

    const handleMouseMoveInside = (e) => {
      const rect = formElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleX = gsap.utils.mapRange(0, rect.width, 0.98, 1.02, mouseX);
      const scaleY = gsap.utils.mapRange(0, rect.height, 1.02, 0.98, mouseY);
      gsap.to(formElement, { scaleX, scaleY, duration: 0.5, ease: 'power3.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(formElement, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    };

    formElement.addEventListener('mousemove', handleMouseMoveInside);
    formElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (formElement) {
        formElement.removeEventListener('mousemove', handleMouseMoveInside);
        formElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/coding-background.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div
        ref={formRef}
        className="relative z-10 w-full max-w-md rounded-2xl border border-blue-500/30 bg-slate-800/70 p-8 shadow-2xl shadow-blue-500/30"
      >
        <h2 className="mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-center text-3xl font-bold text-transparent">
          Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded bg-red-500/50 p-3 text-center text-sm">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          New to the portal?{' '}
          <Link
            href="/register"
            className="font-medium text-purple-400 hover:text-purple-300"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
