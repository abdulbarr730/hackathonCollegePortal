import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          Page Not Found
        </h2>
        <p className="mt-2 text-slate-400">
          Sorry, we couldn't find the page you were looking for.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}