'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer'; // Ensure this path is correct
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn, AlertCircle } from 'lucide-react';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const { login, recheckUser } = useAuth();
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

    const user = await recheckUser();

    if (user?.mustAddPhone) {
      router.push('/complete-profile');
    } else {
      router.push('/dashboard');
    }

  } catch (err) {
    if (err.message?.includes('USER_NOT_FOUND')) {
      setIsUserNotFound(true);
    } else if (err.message?.includes('INVALID_PASSWORD')) {
      setError('Invalid password. Please try again.');
    } else if (err.message?.includes('ACCOUNT_NOT_VERIFIED')) {
      setError('Your account is awaiting admin verification.');
    } else {
      setError('An unexpected error occurred.');
    }
  }
    
  };

  // GSAP Hover Effect
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
    // Updated Layout: flex-col ensures footer stays at the bottom
    <div className="relative flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Area (flex-grow pushes footer down) */}
      <div className="flex-grow flex items-start justify-center min-h-[110vh] pt-20 pb-32 px-4 z-10">
        <div
          ref={formRef}
          className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-500/10 transition-colors duration-300"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
              <LogIn size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Enter your credentials to access your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Display */}
            {(error || isUserNotFound) && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-red-600 dark:text-red-300">
                  {isUserNotFound ? (
                    <span>
                      Account not found. {' '}
                      <Link href="/register" className="font-bold underline hover:text-red-800 dark:hover:text-red-200 transition-colors">
                        Create an account
                      </Link>
                    </span>
                  ) : (
                    <span>{error}</span>
                  )}
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/50 pl-10 pr-10 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            New to the portal?{' '}
            <Link
              href="/register"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
      
    </div>
  );
}