'use client';

import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import ThemeToggle from './components/ThemeToggle';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // FIX: Added '/resources' to this list so it can take up the full screen width
  const fullScreenPages = [
    '/', 
    '/login', 
    '/register', 
    '/forgot-password', 
    '/resources', // <--- ADDED THIS
    '/complete-profile',
    '/reset-password'
  ];

  // We check if the current path STARTS with any of the fullScreenPages
  // This ensures /resources AND /resources/new both get full width
  const isFullScreenPage = 
    fullScreenPages.some(page => pathname === page || pathname.startsWith(page + '/')) ||
    pathname.startsWith('/reset-password');

  if (isAdminPage) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 pl-64 p-8">{children}</main>
      </div>
    );
  }

  return (
    <>
      {/* Navbar shows on all pages except explicit fullScreen ones if you want, 
          BUT usually you want Navbar on resources too. 
          If you want Navbar on resources, remove !isFullScreenPage check or adjust logic.
          
          Based on your previous request, you likely WANT the Navbar on resources, 
          just not the container boxing.
      */}
      
      {/* Render Navbar everywhere except auth pages usually. 
          Adjusting logic to ensure Navbar shows on Resources but container doesn't. */}
      {(!['/login', '/register', '/forgot-password'].includes(pathname)) && <Navbar />}
      
      {['/login', '/register', '/forgot-password'].includes(pathname) && <ThemeToggle floating={true} />}

      <main
        className={
          isFullScreenPage
            ? "flex-grow" // No container, full width
            : "flex-grow container mx-auto p-4 sm:p-6 lg:p-8" // Boxed layout for dashboard etc.
        }
      >
        {children}
      </main>

      {(!['/login', '/register', '/forgot-password'].includes(pathname)) && <Footer />}
    </>
  );
}