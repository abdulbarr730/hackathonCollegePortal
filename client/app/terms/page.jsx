'use client';

import Link from 'next/link';
import { 
  Scale, ShieldAlert, CheckCircle2, Award, Users, 
  ChevronRight, FileText, Lock, AlertTriangle, BookOpen, 
  HelpCircle, Sparkles, Cpu
} from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-5xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Terms of Service</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <Scale size={14} /> Legally Enforceable Institutional &amp; Student Bylaws
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms &amp; Conditions of Service
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
            Last Revised: <strong>August 26, 2026</strong> | Applicable to all Student Participants, Team Leaders, Faculty SPOCs, and Evaluators.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-12 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Acceptance of Terms &amp; Binding Agreement
            </h2>
            <p>
              By accessing, browsing, registering an account, forming teams, or submitting problem statements on the <strong>SIH &amp; Campus Hackathon Management Portal</strong> (&quot;the Platform&quot;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service, our Privacy Policy, and any college-specific competition bylaws established by your academic institution.
            </p>
            <p>
              If you do not agree to these terms in their entirety, you must refrain from creating an account or participating in team activities on this Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Participant Eligibility &amp; Identity Verification
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Bona Fide Student Status:</strong> Only actively enrolled students pursuing recognized undergraduate, postgraduate, or diploma programs in verified academic institutions are eligible to participate.</li>
              <li><strong>Accurate Registration:</strong> Students must provide their true legal name, verified institutional or personal email, valid telephone number, and official university roll number.</li>
              <li><strong>Pre-Approved Clearance:</strong> Where an academic institution has uploaded an authenticated student roster, registrations matching pre-approved roll numbers are verified automatically. All other registrations require institutional SPOC or administrator approval.</li>
              <li><strong>Single Account Rule:</strong> Each participant may maintain only one active platform account. Creation of duplicate, surrogate, or fictitious profiles is strictly prohibited and subject to immediate blacklisting.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. Hackathon Team Formation Bylaws &amp; SIH Compliance
            </h2>
            <p>
              To maintain statutory compliance with national hackathon mandates (including Smart India Hackathon directives):
            </p>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li><strong>Team Size Requirement:</strong> Each team must consist of exactly 6 verified students (1 Team Leader and 5 Team Members).</li>
                <li><strong>Mandatory Female Representation:</strong> In strict alignment with national guidelines, every hackathon team must include at least one female team member. Submission lock is automatically enforced by the portal if this condition is unmet.</li>
                <li><strong>Single-Institution Cohort:</strong> All 6 members of a team must belong to the same onboarded educational institution. Cross-institutional teams are disallowed for institutional nomination tracks.</li>
                <li><strong>Single Team Concurrency:</strong> A student cannot be a leader or member of more than one team for any single active hackathon season.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Intellectual Property, Originality &amp; AI-Assisted Code
            </h2>
            <p>
              We champion innovation while upholding the highest standards of academic and technological integrity:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Ownership:</strong> Participants retain 100% intellectual property ownership of code, algorithms, hardware designs, and pitch materials produced during the hackathon.</li>
              <li><strong>Warranty of Originality:</strong> Submissions must be the original creation of the team members. Plagiarism, copyright infringement, or presentation of pre-existing commercial solutions will result in disqualification.</li>
              <li><strong>AI-Assisted Tools:</strong> Use of modern software engineering tools (e.g. LLMs, copilot agents, open-source libraries) is permitted provided all open-source licenses (MIT, Apache, BSD) are honored and the architectural solution is engineered by the team.</li>
              <li><strong>Evaluation License:</strong> Teams grant their faculty SPOCs, appointed judges, and evaluating committees a limited, non-exclusive license to inspect source code and design documentation solely for evaluation and scoring purposes.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              5. Faculty SPOC &amp; Institutional Governance Authority
            </h2>
            <p>
              Designated Faculty Single Points of Contact (SPOCs) and College Administrators exercise definitive institutional authority:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Review, endorse, or request amendments to team rosters, problem statement selections, and idea abstracts.</li>
              <li>Authorize the official export of institutional nomination sheets formatted for direct submission to the SIH central coordination committee.</li>
              <li>Resolve internal team disputes, member substitution requests, and disciplinary matters.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              6. Code of Conduct &amp; Prohibited Activities
            </h2>
            <p>
              Users agree not to engage in any activity that compromises platform integrity, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Attempting unauthorized access to other institutions&apos; data or exploiting API endpoints.</li>
              <li>Submitting fraudulent identity documents or manipulating roll number records.</li>
              <li>Deploying automated scrapers, bots, or malicious scripts against portal infrastructure.</li>
              <li>Engaging in harassment, discrimination, or abusive conduct toward teammates, faculty, or administrators.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              7. Disclaimers, Limitation of Liability &amp; Jurisdiction
            </h2>
            <p>
              The Platform is provided &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot;. While reasonable efforts are maintained to ensure high uptime and data integrity, the platform architects and affiliated academic institutions shall not be liable for indirect, incidental, or consequential damages resulting from technical interruptions or missed competition deadlines.
            </p>
            <p>
              These Terms shall be governed by and construed in accordance with the substantive laws of the <strong>Republic of India</strong>. Any dispute arising out of or in connection with these terms shall fall under the exclusive jurisdiction of the competent civil courts in <strong>Lucknow / Ghaziabad, Uttar Pradesh, India</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
