'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer'; // Ensure this path is correct
import { gsap } from 'gsap';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn, AlertCircle } from 'lucide-react';
import Captcha from '../components/Captcha';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
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

    if (!isCaptchaVerified) {
      setError('Please solve the security verification puzzle correctly.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      const user = await recheckUser();
      const redirectPath = getRoleRedirect(user);
      window.location.href = redirectPath;
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
    } finally {
      setLoading(false); // ← always runs, success or error
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-md shadow-indigo-600/20">
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
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                  {isUserNotFound && (
                    <div className="mt-2 text-xs">
                      Want to sign up instead? {' '}
                      <Link href="/register" className="font-bold underline hover:opacity-80">
                        Create an account
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Security CAPTCHA */}
            <Captcha onVerify={setIsCaptchaVerified} id="login-captcha" />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isCaptchaVerified}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3.5 font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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