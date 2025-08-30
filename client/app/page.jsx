import Link from 'next/link';

export const metadata = {
  title: 'SIH Portal | Home',
  description: 'Welcome to the official Smart India Hackathon portal.',
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/60 to-slate-900">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/3 h-64 w-64 rounded-full bg-purple-600/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content Card */}
      <div className="w-full max-w-2xl text-center rounded-2xl bg-slate-800/40 border border-slate-700/60 p-10 backdrop-blur-md shadow-xl">
        <h1 className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to the SIH Portal
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Register, form teams, and submit your groundbreaking ideas.
        </p>
        <p className="mt-1 text-sm text-slate-400 italic">
          Smart India Hackathon 2025 • Innovation starts here 🚀
        </p>

        <div className="mt-10 flex justify-center gap-6">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 hover:scale-105 hover:shadow-purple-500/40 transition-transform duration-300"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-purple-400 px-6 py-3 font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-white transition-colors duration-300"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
