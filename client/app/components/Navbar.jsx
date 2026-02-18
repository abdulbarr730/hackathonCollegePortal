'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext'; // <--- IMPORTED
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Code2, Menu, X, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { activeEvent } = useHackathon(); // <--- GET DYNAMIC DATA
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to close menu when navigating
  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  return (
    // GLASS HEADER
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between relative z-50">
        
        {/* LOGO (Visible Everywhere) */}
        <Link href="/" className="group flex items-center gap-2.5 z-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-all duration-300">
            {/* You could also make the icon dynamic if you added it to context */}
            <Code2 size={20} className="relative z-10" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col leading-none">
            {/* DYNAMIC HACKATHON NAME */}
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white truncate max-w-[200px]">
              {activeEvent?.shortName || "Hackathon Portal"}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              Official Portal
            </span>
          </div>
        </Link>

        {/* --- DESKTOP NAVIGATION (Hidden on Mobile) --- */}
        <div className="hidden md:flex items-center gap-5">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.name}</span>
              </div>

              <Link href={user.isAdmin ? "/admin/dashboard" : "/dashboard"}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </motion.button>
              </Link>

              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>

              <button onClick={() => router.push('/profile')} className="ml-1 relative rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 hover:scale-105 transition-transform">
                <div className="p-0.5 bg-white dark:bg-slate-900 rounded-full">
                  <Avatar name={user?.name} src={user?.photoUrl} size={32} />
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">Login</Link>
              <Link href="/register">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-lg transition-all">
                  Register Team
                </motion.button>
              </Link>
            </div>
          )}
        </div>

        {/* --- MOBILE NAVIGATION TOGGLE --- */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* --- MOBILE MENU DROPDOWN --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden absolute w-full left-0 top-16 shadow-2xl z-40"
          >
            <div className="p-4 space-y-4">
              {isAuthenticated && user ? (
                <>
                  {/* Profile Section inside Menu */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                    <Avatar name={user.name} src={user.photoUrl} size={48} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Signed in as</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{user.name}</span>
                      <span className="text-xs text-slate-500 truncate max-w-[150px]">{user.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Dashboard Link */}
                    <button 
                      onClick={() => handleNavigation(user.isAdmin ? "/admin/dashboard" : "/dashboard")}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </button>
                    
                    {/* Profile Link */}
                    <button 
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <UserIcon size={18} />
                      Profile
                    </button>

                    {/* Logout Link */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => handleNavigation('/login')}
                    className="w-full py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => handleNavigation('/register')}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg active:scale-95 transition-transform"
                  >
                    Register Team
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}