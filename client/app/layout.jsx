'use client';

import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // This array defines which pages should be completely full-screen
  const fullScreenPages = ['/', '/login', '/register', '/forgot-password'];
  const isFullScreenPage = fullScreenPages.includes(pathname) || pathname.startsWith('/reset-password');

  return (
    <html lang="en" className="h-full bg-slate-900" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>
        <AuthProvider>
          {isAdminPage ? (
            // ADMIN LAYOUT
            <div className="flex min-h-screen text-white">
              <AdminSidebar />
              <main className="flex-1 pl-64">
                <div className="p-8">{children}</div>
              </main>
            </div>
          ) : (
            // MAIN USER LAYOUT
            <div className="flex flex-col min-h-screen">
              {/* The Navbar is hidden on full-screen pages */}
              {!isFullScreenPage && <Navbar />}

              {/* This main tag is now "smart".
                - Full-screen pages get a simple container that lets the page control its own layout.
                - Other pages get a standard, centered content container.
              */}
              <main className={
                isFullScreenPage
                  ? "flex-grow"
                  : "flex-grow container mx-auto p-4 sm:p-6 lg:p-8"
              }>
                {children}
              </main>
              {/* ADDED: The Footer is rendered here for all non-admin, non-full-screen pages */}
              <Footer />
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}