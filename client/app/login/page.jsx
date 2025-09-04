'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';

// --- Icon components for the show/hide button ---
const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUserNotFound(false);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      
      // --- MODIFIED: Changed to a full page reload/navigation ---
      window.location.href = '/dashboard'; 

    } catch (err) {
      if (err.message.includes('USER_NOT_FOUND')) {
        setIsUserNotFound(true);
      } else if (err.message.includes('INVALID_PASSWORD')) {
        setError('Invalid password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-fixed p-4"
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
          
          {/* Unified Error Display Area */}
          {(error || isUserNotFound) && (
            <div className="rounded bg-red-500/50 p-3 text-center text-sm text-white">
              {isUserNotFound ? (
                <span>
                  Email not found. Have you registered?{' '}
                  <Link href="/register" className="font-bold underline hover:text-red-100">
                    Register here
                  </Link>
                </span>
              ) : (
                <span>{error}</span>
              )}
            </div>
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
          
          {/* Password input with Show/Hide toggle */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border-none bg-black/30 p-3 pr-10 ring-1 ring-white/10 placeholder:text-gray-600 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
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
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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