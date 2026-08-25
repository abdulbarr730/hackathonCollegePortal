'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
import { LogOut, Globe, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const { activeEvent } = useHackathon();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors duration-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Hackathon info & portal switcher */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeEvent?.shortName || 'Hackathon Admin'}
          </span>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Switch to Student Dashboard View"
          >
            <Globe size={14} />
            <span className="hidden md:inline">Student View</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* Right: Theme Toggle & Admin Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {user.role === 'admin' && !user.college ? 'Super Admin' : user.role === 'spoc' ? 'College SPOC' : 'Admin'}
                </span>
              </div>

              <button
                onClick={() => router.push('/profile')}
                className="rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 hover:scale-105 transition-transform"
                title="View Profile"
              >
                <div className="p-0.5 bg-white dark:bg-slate-900 rounded-full">
                  <Avatar name={user.name} src={user.photoUrl} size={30} />
                </div>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
