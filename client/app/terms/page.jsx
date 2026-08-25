'use client';

import Link from 'next/link';
import { Scale, ArrowLeft, CheckCircle, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Scale size={14} /> Official Guidelines
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms & Conditions
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Last Updated: August 2026 &bull; Rules of Participation & Code of Conduct for SIH & Internal Campus Hackathons.
          </p>
        </div>

        {/* Overview Banner */}
        <div className="rounded-3xl border border-purple-100 dark:border-purple-900/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle className="text-purple-600 dark:text-purple-400 h-5 w-5" />
            Platform Code of Conduct
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            By accessing or registering on this platform, you agree to adhere to all institutional guidelines, team integrity rules, and fair play principles outlined below.
          </p>
        </div>

        {/* Terms Breakdown */}
        <div className="space-y-8">
          
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="text-purple-500 h-4 w-4" />
              1. Team Composition & Diversity Rules
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              For internal hackathons and SIH selections:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              <li>Teams must strictly follow the active event rules (e.g. exactly 6 members with mandatory female representation for SIH).</li>
              <li>A student may belong to only <strong>one active team</strong> per hackathon edition.</li>
              <li>All team members must be enrolled students of an approved/registered college.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="text-purple-500 h-4 w-4" />
              2. Intellectual Property & Original Work
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              All submitted ideas, codebases, and presentations must be the original work of the participating team members. Plagiarism, submission of pre-built commercial software, or fraudulent roll number registration will result in immediate disqualification.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-purple-500 h-4 w-4" />
              3. SPOC Authority & Final Nomination
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The designated College Single Point of Contact (SPOC) and internal jury hold final authority on internal evaluation scores, verification approvals, and official nomination selections forwarded to the national SIH portal.
            </p>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SIH & Campus Hackathon Portal. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-white transition">Privacy Policy</Link>
            <Link href="/login" className="hover:text-purple-600 dark:hover:text-white transition">Student Portal</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
