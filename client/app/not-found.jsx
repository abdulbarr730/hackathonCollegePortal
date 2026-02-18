'use client';

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    // FULL SCREEN OVERLAY: 'fixed inset-0' ensures it covers everything
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center selection:bg-indigo-500/30 overflow-hidden">
      
      {/* 1. BACKGROUND GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-8">
          <FileQuestion size={40} className="text-slate-400 dark:text-slate-500" />
        </div>

        {/* Big 404 Text */}
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
          Page Not Found
        </h1>

        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10 max-w-lg mx-auto">
          The page you are looking for does not exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300"
          >
            <Home size={18} />
            Return Home
          </Link>
        </div>

      </div>

      {/* Footer Code */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          ERROR 404
        </span>
      </div>

    </div>
  );
}