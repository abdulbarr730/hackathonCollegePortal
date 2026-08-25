'use client';

import Link from 'next/link';
import { FileText, ShieldAlert, CheckCircle2, Award, Users, Scale, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 max-w-4xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Terms of Service</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <Scale size={14} /> Legally Enforceable Terms of Use
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms &amp; Conditions of Service
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Last Revised: <strong>August 26, 2026</strong> | Applicable to all registered students, team leaders, faculty coordinators, and college administrations.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Acceptance of Terms &amp; Binding Agreement
            </h2>
            <p>
              By accessing, browsing, registering an account, or creating teams on the <strong>Hackathon &amp; SIH College Portal</strong>, you agree to be bound by these Terms of Service, our Privacy Policy, and any event-specific guidelines published by your institution or the National Smart India Hackathon organizing committee.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Student Eligibility &amp; Identity Verification
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Enrolled Status:</strong> Only bona fide students enrolled in approved academic programs (e.g. B.Tech, BCA, Diploma, M.Tech) of registered colleges are permitted to form teams.</li>
              <li><strong>Single Account Policy:</strong> Each student must register using their official roll number and verified institutional email address. Creation of duplicate or dummy accounts will result in immediate disqualification.</li>
              <li><strong>Roster Pre-Approval:</strong> If a student&apos;s roll number is pre-approved by the college SPOC, verification is automated. Otherwise, verification is subject to manual document review.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. Team Formation &amp; SIH Roster Rules
            </h2>
            <p>
              To maintain compliance with national hackathon mandates (including Smart India Hackathon 2025 guidelines):
            </p>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                <li><strong>Team Size:</strong> Teams must comprise exactly 6 verified students (1 Team Leader and 5 Members).</li>
                <li><strong>Gender Diversity Mandate:</strong> In accordance with SIH directives, each team must include at least one female team member.</li>
                <li><strong>Institutional Exclusivity:</strong> All 6 members of a team must belong to the same onboarded college or university node.</li>
                <li><strong>Single Team Membership:</strong> A student cannot be a member or leader of more than one team simultaneously for any single active hackathon season.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Idea Submissions, Intellectual Property &amp; Plagiarism
            </h2>
            <p>
              Users retain full original ownership of their code, designs, and intellectual property developed during hackathon sprints. However:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Original Work Warranty:</strong> Submissions must be the original creations of the listed team members. Plagiarized code or purchased projects will lead to disciplinary blacklisting.</li>
              <li><strong>Evaluation License:</strong> Teams grant their faculty SPOCs, judges, and organizing committees a non-exclusive license to inspect, review, and evaluate their submissions.</li>
              <li><strong>Open Source Compliance:</strong> Use of open-source libraries is permitted provided open-source licensing terms (MIT, Apache 2.0, GPL) are fully honored.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              5. Role of Institutional SPOC &amp; Administration
            </h2>
            <p>
              Designated Faculty SPOCs hold final administrative authority within their college node to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Approve, reject, or request revisions to team rosters and problem statement selections.</li>
              <li>Export authenticated institutional nomination sheets for the SIH central portal.</li>
              <li>Provision internal college hackathon sprints, judge panels, and scoring rubrics.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              6. Limitation of Liability &amp; Jurisdiction
            </h2>
            <p>
              The Platform is provided on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis without warranties of uninterrupted uptime. In no event shall the platform architects, hosting providers, or affiliated academic institutions be liable for indirect or consequential damages arising from competition outcomes or deadline misses.
            </p>
            <p>
              Any legal disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent civil courts in Lucknow, Uttar Pradesh, India.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
