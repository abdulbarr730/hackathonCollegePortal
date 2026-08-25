'use client';

import Link from 'next/link';
import { Building2, ShieldCheck, FileCheck, CheckCircle2, Scale, Users, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function CollegeTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 max-w-4xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Institutional Agreement</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <Building2 size={14} /> Institutional Master Services Agreement &amp; DPA
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Institutional Master Services Agreement
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Framework governing Academic Institution Onboarding, Faculty SPOC Delegated Authority, and Student Data Processing under Indian Law.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Institutional Authority &amp; Representation
            </h2>
            <p>
              By submitting an Institutional Onboarding Application on this Platform, the individual submitting the application explicitly represents and warrants that:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>They are a full-time academic faculty member, Head of Department, Dean, or designated Single Point of Contact (SPOC) authorized by their college/university administration.</li>
              <li>They possess the institutional authority to register the academic institution on the Platform and manage student hackathon rosters.</li>
              <li>All AISHE codes, university affiliations, and campus details submitted are true, complete, and verifiable against statutory regulatory portals.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Student Data Processing Addendum (DPA)
            </h2>
            <p>
              Under the Digital Personal Data Protection Act (DPDP), 2023, the onboarded institution acts as the <strong>Data Fiduciary</strong>, and the Platform acts as the <strong>Data Processor</strong>:
            </p>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                <li><strong>Purpose Limitation:</strong> Uploaded pre-approved student rosters (roll numbers, names, departments) are utilized solely for authenticating student registrations and preventing impersonation.</li>
                <li><strong>Confidentiality:</strong> Institutional rosters are strictly isolated by multi-tenant database partitions and are never disclosed to third parties or other academic institutions.</li>
                <li><strong>Audit Logs:</strong> All SPOC actions, student roster modifications, and team approvals are recorded with immutable cryptographic timestamps and operator IDs.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. SPOC Governance &amp; SIH Nomination Responsibilities
            </h2>
            <p>
              The verified faculty SPOC undertakes the following operational responsibilities:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>Verify that all teams selected for SIH 2025 nomination satisfy the mandatory 6-member count and female diversity mandate.</li>
              <li>Ensure that initial administrative credentials provided during onboarding are updated to a permanent secure password upon first login.</li>
              <li>Promptly notify the platform administrator of any change in designated faculty coordinator or SPOC appointment.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Termination &amp; Roster Deletion
            </h2>
            <p>
              Institutions may terminate their node or request complete deletion of student rosters at the conclusion of an academic hackathon season by submitting a signed written request to <code>hello@abdulbarr.in</code>. All associated student rosters will be permanently expunged within 30 business days.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <Link href="/onboard-college" className="font-bold text-indigo-600 hover:underline">
              ← Go to College Onboarding Form
            </Link>
            <Link href="/privacy" className="font-bold text-indigo-600 hover:underline">
              View Student Privacy Policy →
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
