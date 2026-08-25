'use client';

import Link from 'next/link';
import { 
  ShieldCheck, Lock, Eye, Database, Globe, Bell, 
  FileText, CheckCircle2, ChevronRight, Scale, AlertTriangle, 
  Server, Key, RefreshCw, Mail, Phone, Cpu
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 max-w-5xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck size={14} /> Statutory DPDP Act (2023) &amp; IT Act (2000) Compliance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy &amp; Data Protection Standards
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
            Effective Date: <strong>August 26, 2026</strong> | Document Version: <strong>2026.2-FINAL</strong> | Operational Jurisdiction: <strong>Republic of India</strong>
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-12 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Preamble &amp; Statutory Alignment
            </h2>
            <p>
              This Privacy Policy governs the collection, storage, cryptographic processing, transmission, and lifecycle management of Personally Identifiable Information (PII) and institutional records managed through the <strong>SIH &amp; Campus Hackathon Management Portal</strong> (&quot;the Platform&quot;), engineered and maintained by <strong>Abdul Barr</strong>.
            </p>
            <p>
              This policy is drafted in strict adherence to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li>The <strong>Digital Personal Data Protection Act (DPDP), 2023</strong> (Acts of Parliament, India).</li>
              <li>The <strong>Information Technology Act, 2000</strong> (IT Act), including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</li>
              <li>The <strong>Indian Computer Emergency Response Team (CERT-In)</strong> Cybersecurity Directions regarding log retention, user authentication, and incident reporting.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Data Fiduciary vs. Data Processor Relationships
            </h2>
            <p>
              For the purposes of data governance legislation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Database size={16} className="text-indigo-600 dark:text-indigo-400" /> Educational Institutions (Data Fiduciary)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  The onboarded College / University acts as the <strong>Data Fiduciary</strong> that determines the purpose and lawful means of student roster verification and competition nomination.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Server size={16} className="text-indigo-600 dark:text-indigo-400" /> The Platform (Data Processor)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  The Platform operates strictly as a <strong>Data Processor</strong> providing technical infrastructure, encryption, team coordination workflows, and nomination spreadsheet generation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. Granular Categories of Data Collected
            </h2>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white">A. Student Participant Records</h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>Full legal name, gender (required for SIH female representation quota compliance), and personal contact phone.</li>
                  <li>Institutional email address or personal email address (authenticated via 6-digit cryptographic OTP).</li>
                  <li>Academic degree program (B.Tech, BCA, MCA, Diploma), discipline, and current academic year (1st–4th year).</li>
                  <li>Institutional Roll Number / Enrollment ID (indexed uniquely per college).</li>
                  <li>Student identity card scans, college verification documents, GitHub profiles, and LinkedIn URLs.</li>
                  <li>Team memberships, role allocations (Leader vs. Member), and problem statement submission summaries.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white">B. Institutional &amp; SPOC Administrator Data</h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>Official institution name, short name, AISHE code, and university affiliation board.</li>
                  <li>Campus physical address, official email domain, and website endpoint.</li>
                  <li>Designated Single Point of Contact (SPOC) and College Admin full names, faculty designations, official emails, and mobile phone numbers.</li>
                  <li>Pre-approved student roll rosters uploaded by SPOCs for automated student clearance.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white">C. Telemetry, Security &amp; Audit Logs</h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>Client IP addresses and timestamps captured during registration, institutional agreement signing, and newsletter opt-in.</li>
                  <li>Canvas CAPTCHA interaction tokens to mitigate automated denial-of-service and credential stuffing attacks.</li>
                  <li>Immutable administrative audit records logging all SPOC verification decisions and role elevation events.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Purpose and Legal Basis for Processing
            </h2>
            <p>
              Under DPDP Act Section 6, the Platform processes personal data exclusively for specified, lawful purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Institutional Enrollment Verification:</strong> Cross-referencing participant roll numbers against verified college datasets to guarantee bona fide student status.</li>
              <li><strong>Smart India Hackathon (SIH) Compliance:</strong> Validating team roster composition (6 members, minimum 1 female member) and generating compliant XLSX nomination sheets for SPOC submission to the SIH central portal.</li>
              <li><strong>Verifiable Communication:</strong> Dispatching cryptographic One-Time Passwords (OTPs) for account registration, email address updates, and newsletter double opt-in confirmations via Resend.</li>
              <li><strong>Legal Audit Trail:</strong> Maintaining verifiable records of Terms acceptance and institutional MSA signings in accordance with IT Act evidentiary requirements.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              5. Multi-Tenant Scoping &amp; Cryptographic Safeguards
            </h2>
            <p>
              To ensure zero data leakage between competing educational institutions:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Tenant Scoping:</strong> College Admins and SPOCs can access only student profiles, teams, and ideas belonging to their specific institution ID.</li>
              <li><strong>Student Isolation:</strong> Students can search for and invite peers strictly from their own college.</li>
              <li><strong>Password Hashing:</strong> All passwords are salted and hashed using <code>bcrypt</code> (10 rounds) prior to database persistence. Plaintext credentials are never retained or logged.</li>
              <li><strong>Encrypted Transport:</strong> All data in transit is protected using TLS 1.3 encryption.</li>
              <li><strong>Signed Media Vaults:</strong> Student ID cards uploaded for manual verification are stored in secure Cloudinary storage buckets with restricted access.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              6. Third-Party Infrastructure Sub-Processors
            </h2>
            <p>
              Data is shared only with strictly vetted infrastructure providers under binding confidentiality agreements:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>MongoDB Atlas:</strong> Multi-region managed database cluster with automated encryption at rest.</li>
              <li><strong>Resend Technologies:</strong> SOC-2 compliant transactional email delivery service for OTPs and notifications.</li>
              <li><strong>Cloudinary Ltd.:</strong> Encrypted asset and image storage with expiring signatures.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              7. Data Principal Rights (Under DPDP Act 2023)
            </h2>
            <p>
              Every registered user and institution holds statutory rights under the law:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Right to Access &amp; Summary:</strong> View all registered profile information and team associations via the Profile console.</li>
              <li><strong>Right to Rectification:</strong> Update academic details, telephone numbers, and email addresses (protected via OTP validation).</li>
              <li><strong>Right to Erasure:</strong> Request deletion of obsolete team submissions or accounts upon conclusion of the hackathon season.</li>
              <li><strong>Right of Grievance Redressal:</strong> Submit inquiries or complaints directly to the designated Data Protection Officer.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
              8. Data Protection Officer &amp; Grievance Officer Contact
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              In accordance with Section 8 of the DPDP Act 2023 and Rule 5(9) of the IT Rules 2011, grievances regarding data processing, access requests, or regulatory disclosures should be addressed to:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-1 font-mono">
              <p><strong>Name:</strong> Abdul Barr</p>
              <p><strong>Designation:</strong> Chief System Architect &amp; Data Protection Officer</p>
              <p><strong>Official Email:</strong> <a href="mailto:hello@abdulbarr.in" className="text-indigo-600 dark:text-indigo-400 underline">hello@abdulbarr.in</a></p>
              <p><strong>Direct Telephone:</strong> +91 7479934706</p>
              <p><strong>Jurisdiction:</strong> Lucknow / Ghaziabad, Uttar Pradesh, India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
