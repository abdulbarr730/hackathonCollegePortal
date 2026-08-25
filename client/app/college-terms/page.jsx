'use client';

import Link from 'next/link';
import { 
  Building2, ShieldCheck, FileCheck, CheckCircle2, 
  Scale, Users, ChevronRight, Server, Lock, Award, 
  FileText, Mail, Phone
} from 'lucide-react';

export default function CollegeTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-5xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Institutional MSA</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <Building2 size={14} /> Institutional Master Services Agreement &amp; DPA
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Institutional Master Services Agreement (MSA)
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
            Legal Framework governing Educational Institution Onboarding, Faculty SPOC Delegated Authority, and Student Data Processing Addendum (DPA).
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-12 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Institutional Authority &amp; Legal Capacity
            </h2>
            <p>
              By completing the Institutional Onboarding process on the <strong>SIH &amp; Campus Hackathon Management Portal</strong>, the registering individual certifies that:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li>They are a full-time academic faculty member, Head of Department, Dean, or designated Single Point of Contact (SPOC) authorized by the leadership of their college or university.</li>
              <li>They hold the requisite delegated power of attorney to establish an institutional node on the Platform and administer student hackathon rosters.</li>
              <li>All institutional data submitted—including AISHE Code, university affiliation, accreditation details, and campus addresses—is authentic and verifiable against Ministry of Education / UGC records.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Student Data Processing Addendum (DPA)
            </h2>
            <p>
              In compliance with Section 8 of the Digital Personal Data Protection Act (DPDP), 2023:
            </p>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li><strong>Purpose Limitation:</strong> Uploaded pre-approved student rosters (roll numbers, names, departments) shall be used solely for authenticating participant registration and preventing unauthorized entries.</li>
                <li><strong>Tenant Isolation:</strong> All institutional records are isolated within dedicated database partitions and are never accessible to competing educational institutions.</li>
                <li><strong>Confidentiality:</strong> The Platform shall maintain strict confidentiality over all student identification datasets and shall not monetize, sell, or disclose such data to third-party marketing entities.</li>
                <li><strong>Sub-Processor Safeguards:</strong> Sub-processors utilized for transactional email relays (Resend) and encrypted media vaults (Cloudinary) operate under binding SOC-2 and data protection covenants.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. Faculty SPOC Governance &amp; SIH Nomination Protocols
            </h2>
            <p>
              The appointed Faculty SPOC undertakes the following operational responsibilities:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Roster Verification:</strong> Ensure all nominated teams fulfill national criteria (exactly 6 members with mandatory female representation).</li>
              <li><strong>Account Security:</strong> Complete initial password reset upon first administrative login and maintain credential confidentiality.</li>
              <li><strong>Staff Delegation:</strong> Appoint and manage assistant coordinators or evaluators using the OTP-verified staff provisioning workflow.</li>
              <li><strong>Nomination Export:</strong> Validate and download official nomination spreadsheets for upload to the SIH central coordination portal.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Domain Configuration &amp; Generic Email Policy
            </h2>
            <p>
              Institutions with official domain infrastructure (e.g. <code>@bbdit.edu.in</code>) can enforce custom domain matching to ensure seamless student registration. Institutions lacking dedicated domains may permit generic email providers (e.g. Gmail), with each account subject to mandatory real-time OTP validation and roll number verification.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              5. Term, Season Closure &amp; Secure Data Expungement
            </h2>
            <p>
              This Agreement remains in effect for the active academic hackathon cycle. Upon season conclusion, institutions may request complete expungement of student rosters by submitting an authenticated request to <code>hello@abdulbarr.in</code>. All corresponding student roster datasets will be securely purged within thirty (30) business days.
            </p>
          </section>

          {/* Quick Links Nav */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 text-xs">
            <Link href="/onboard-college" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Institutional Onboarding Portal
            </Link>
            <Link href="/privacy" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View Privacy Policy →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
