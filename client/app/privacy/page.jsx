'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
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

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Official Platform Governance
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Last Updated: August 2026 &bull; Effective for all registered students, institutional SPOCs, and college administrators.
          </p>
        </div>

        {/* Overview Banner */}
        <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lock className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
            Our Core Privacy Commitment
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            We value your trust and are dedicated to protecting your academic data, project ideas, and institutional records. This Privacy Policy details how we collect, handle, store, and protect student and college data across the Hackathon Portal.
          </p>
        </div>

        {/* Section Breakdown */}
        <div className="space-y-8">
          
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="text-indigo-500 h-4 w-4" />
              1. Information We Collect
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When creating an account or managing campus hackathons, we collect:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              <li><strong>Student Credentials:</strong> Full Name, Official Roll Number, College Email, Branch/Course, Academic Year, and Contact Phone.</li>
              <li><strong>Institutional Information:</strong> College Name, Domain/Website, Faculty SPOC Designation, and Official Authorization Letters.</li>
              <li><strong>Hackathon & Team Data:</strong> Team formations, project proposals, problem statement IDs, and submission files.</li>
              <li><strong>Technical Logs:</strong> Session cookies, device authentication tokens, and audit trails for security monitoring.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="text-indigo-500 h-4 w-4" />
              2. How Your Information is Utilized
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Data collected is strictly used for platform integrity and hackathon administration:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
              <li>Verifying student eligibility against pre-approved institutional rosters.</li>
              <li>Enabling team discovery, peer collaboration, and skill-based matching.</li>
              <li>Facilitating official SPOC review and SIH nomination exports.</li>
              <li>Sending high-priority hackathon announcements, deadlines, and schedule alerts.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="text-indigo-500 h-4 w-4" />
              3. Data Protection & Encryption
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              All passwords are encrypted with industry-standard bcrypt hashing. Sessions use HTTP-only, secure cookies with JWT protection. We do not sell, rent, or trade your personal or academic information with any third-party advertisers.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-indigo-500 h-4 w-4" />
              4. SPOC & Administrative Access
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Designated Single Point of Contact (SPOC) faculty and College Administrators are granted scoped access exclusively to inspect teams, view student roll numbers, and submit official nominations for their respective institutions.
            </p>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SIH & Campus Hackathon Portal. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-white transition">Terms of Service</Link>
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-white transition">Student Portal</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
