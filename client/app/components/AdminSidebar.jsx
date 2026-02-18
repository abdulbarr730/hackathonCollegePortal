'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, Lightbulb, ShieldCheck, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/ideas', label: 'Idea Repository', icon: Lightbulb },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300 flex flex-col">
      
      {/* HEADER: Admin Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
          <ShieldCheck size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Panel
          </h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            SIH Control
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Menu
        </p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
              />
              <span>{item.label}</span>
              
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER: Back to Site */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <Link 
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
          <span>Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}