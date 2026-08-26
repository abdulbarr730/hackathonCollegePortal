'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { 
  Building2, FileText, LayoutGrid, Megaphone, Trophy, 
  Users, Lightbulb, Shield, ShieldCheck, ArrowLeft, FileSpreadsheet, LogOut, Mail
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'admin' && !user?.college;
  const isCollegeAdmin = user?.role === 'college_admin' || (user?.role === 'admin' && user?.college);
  const isSpoc = user?.role === 'spoc';

  // Build menu items dynamically based on user role
  const getNavItems = () => {
    if (isSpoc) {
      return [
        { href: '/admin/staff', label: 'SPOCs & Admins', icon: Shield },
        { href: '/admin/teams', label: 'College Teams', icon: Users },
        { href: '/admin/approved-students', label: 'Approved Students', icon: FileSpreadsheet },
        { href: '/admin/resources', label: 'Resources', icon: FileText },
        { href: '/admin/updates', label: 'Updates', icon: Megaphone },
      ];
    }

    if (isCollegeAdmin) {
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
        { href: '/admin/staff', label: 'SPOCs & Admins', icon: Shield },
        { href: '/admin/hackathons', label: 'Internal Hackathons', icon: Trophy },
        { href: '/admin/approved-students', label: 'Approved Students', icon: FileSpreadsheet },
        { href: '/admin/users', label: 'College Users', icon: Users },
        { href: '/admin/teams', label: 'College Teams', icon: Users },
        { href: '/admin/ideas', label: 'Idea Repository', icon: Lightbulb },
        { href: '/admin/resources', label: 'Resources', icon: FileText },
        { href: '/admin/updates', label: 'Updates', icon: Megaphone },
      ];
    }

    // Super Admin: sees all system controls
    return [
      { href: '/admin/dashboard', label: 'Super Dashboard', icon: LayoutGrid },
      { href: '/admin/colleges', label: 'Colleges Onboarding', icon: Building2 },
      { href: '/admin/staff', label: 'SPOCs & Admins', icon: Shield },
      { href: '/admin/hackathons', label: 'All Hackathons', icon: Trophy },
      { href: '/admin/approved-students', label: 'Approved Students', icon: FileSpreadsheet },
      { href: '/admin/users', label: 'User Directory', icon: Users },
      { href: '/admin/teams', label: 'All Teams & SIH Export', icon: Users },
      { href: '/admin/ideas', label: 'Idea Repository', icon: Lightbulb },
      { href: '/admin/resources', label: 'Resources', icon: FileText },
      { href: '/admin/updates', label: 'Updates & Announcements', icon: Megaphone },
      { href: '/admin/newsletter', label: 'Newsletter Broadcast', icon: Mail },
    ];
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: 'Platform Super Admin', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' };
    if (isCollegeAdmin) return { label: 'College Admin', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' };
    if (isSpoc) return { label: 'College SPOC', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' };
    return { label: 'Admin', color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10' };
  };

  const roleBadge = getRoleBadge();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300 flex flex-col justify-between">
      
      {/* Top Header & Menu */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* HEADER: Admin Brand */}
        <div className="flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <div className="hidden lg:block min-w-0">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {user?.name || 'Admin Panel'}
            </h1>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${roleBadge.color} truncate max-w-full`}>
              {roleBadge.label}
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-2 lg:px-4 py-4 space-y-1 overflow-y-auto">
          <p className="hidden lg:block px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Navigation Menu
          </p>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <Icon 
                  size={18} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
                />
                <span className="hidden lg:inline truncate">{item.label}</span>
                
                {isActive && (
                  <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER: Theme Toggle & Logout Controls */}
      <div className="p-3 lg:p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
        
        {/* Theme Toggle Button Container */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="hidden lg:inline text-xs font-medium text-slate-500 dark:text-slate-400">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        {/* Back to Student Portal or Logout */}
        <div className="flex items-center gap-1">
          <Link 
            href="/dashboard"
            className="flex-1 flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Exit to Student Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="hidden lg:inline">Student View</span>
          </Link>
          
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </aside>
  );
}
