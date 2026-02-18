'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ floating = false }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={
          floating
            ? "fixed bottom-6 right-6 p-3 w-10 h-10"
            : "p-2 w-9 h-9"
        }
      />
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const baseClasses =
    "flex items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 shadow-md border";

  const styleClasses = floating
    ? "fixed bottom-6 right-6 z-[60] p-3 bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 border-slate-200 dark:border-slate-800 shadow-xl"
    : "p-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 border-slate-200 dark:border-slate-700";

  return (
    <button
      onClick={toggleTheme}
      className={`${baseClasses} ${styleClasses}`}
      aria-label="Toggle Theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={20} strokeWidth={2.5} />
      ) : (
        <Moon size={20} strokeWidth={2.5} />
      )}
    </button>
  );
}
