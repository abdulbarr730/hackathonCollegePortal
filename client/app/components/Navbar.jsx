'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-slate-900/80 p-4 shadow-lg backdrop-blur-lg sticky top-0 z-40 border-b border-slate-700/50">
      <nav className="container mx-auto flex items-center justify-between">
        
        {/* Logo / Home */}
        <Link 
          href="/" 
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
        >
          SIH Portal
        </Link>

        <div className="flex items-center space-x-4 text-white">
          {isAuthenticated && user ? (
            <>
              <span className="text-slate-300 hidden sm:inline">
                Welcome, {user.name}
              </span>

              {/* Conditional Dashboard link */}
              {user.isAdmin ? (
                <Link 
                  href="/admin/dashboard" 
                  className="rounded-lg px-4 py-2 font-medium hover:bg-slate-700"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/dashboard" 
                  className="rounded-lg px-4 py-2 font-medium hover:bg-slate-700"
                >
                  Dashboard
                </Link>
              )}

              {/* Logout button */}
              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Logout
              </button>

              {/* Profile Avatar */}
              <button
                onClick={() => router.push('/profile')}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500"
                aria-label="Open profile"
                title="Profile"
              >
                <Avatar name={user?.name} src={user?.photoUrl} size={36} />
              </button>
            </>
          ) : (
            // Logged-out view
            <>
              <Link 
                href="/login" 
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="rounded-lg border border-purple-500 px-4 py-2 font-medium transition-colors hover:bg-purple-500/30"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
