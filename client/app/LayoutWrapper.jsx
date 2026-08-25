'use client';

import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import ThemeToggle from './components/ThemeToggle';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';

  // Pages that take full width and handle their own layout
  const fullScreenPages = [
    '/', 
    '/login', 
    '/register', 
    '/forgot-password', 
    '/resources',
    '/complete-profile',
    '/reset-password',
    '/change-password',
    '/admin/login'
  ];

  const isFullScreenPage = 
    fullScreenPages.some(page => pathname === page || pathname.startsWith(page + '/')) ||
    pathname.startsWith('/reset-password');

  if (isAdminPage) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <AdminSidebar />
        <main className="flex-1 pl-20 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    );
  }

  const isAuthOrStandalonePage = [
    '/login',
    '/register',
    '/forgot-password',
    '/complete-profile',
    '/reset-password',
    '/change-password',
    '/admin/login'
  ].some(page => pathname === page || pathname.startsWith(page + '/'));

  return (
    <>
      {!isAuthOrStandalonePage && <Navbar />}
      
      {isAuthOrStandalonePage && <ThemeToggle floating={true} />}

      <main
        className={
          isFullScreenPage
            ? "flex-grow" // No container, full width
            : "flex-grow container mx-auto p-4 sm:p-6 lg:p-8" // Boxed layout for dashboard etc.
        }
      >
        {children}
      </main>

      {!isAuthOrStandalonePage && <Footer />}
    </>
  );
}
