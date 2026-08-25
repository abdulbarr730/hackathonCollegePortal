'use client';

import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Database, Globe, Bell, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 max-w-4xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck size={14} /> Data Protection &amp; Regulatory Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Effective Date: <strong>August 26, 2026</strong> | Regulatory Compliance: Information Technology Act, 2000 &amp; Digital Personal Data Protection Act (DPDP), 2023.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              1. Preamble &amp; Institutional Scope
            </h2>
            <p>
              This Privacy Policy governs the collection, storage, processing, and safeguarding of Personally Identifiable Information (PII) and institutional records on the <strong>SIH &amp; Campus Hackathon Management Portal</strong> (&quot;the Platform&quot;), engineered and operated by Abdul Barr for verified educational institutions, students, faculty Single Points of Contact (SPOCs), and evaluators.
            </p>
            <p>
              By accessing this Platform, registering student profiles, onboarding an academic institution, or subscribing to bulletins, you explicitly consent to the data governance practices established in this document.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              2. Categories of Information Collected
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database size={16} className="text-indigo-600 dark:text-indigo-400" /> Student Profile Data
                </h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>Full legal name, gender, and contact telephone number.</li>
                  <li>Institutional email address and university roll number.</li>
                  <li>Academic program (e.g. B.Tech, BCA, Diploma) and year of study.</li>
                  <li>Uploaded student identification cards or credential proofs.</li>
                  <li>Technical skills, GitHub/LinkedIn URLs, and team memberships.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={16} className="text-indigo-600 dark:text-indigo-400" /> Institutional &amp; SPOC Data
                </h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>College/University official name, AISHE code, and university affiliation.</li>
                  <li>Campus physical address, domain, and administrative contact records.</li>
                  <li>Faculty SPOC full name, official email, mobile number, and department.</li>
                  <li>Pre-approved student roll rosters uploaded for automated clearance.</li>
                  <li>Encrypted password digests and cryptographic session tokens.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              3. Purpose and Legal Basis for Processing
            </h2>
            <p>
              Your data is processed strictly for the following legitimate academic purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Roster &amp; Identity Verification:</strong> Matching student roll numbers against official college databases to prevent unauthorized participation.</li>
              <li><strong>Smart India Hackathon (SIH) Compliance:</strong> Facilitating official nomination exports, SPOC approvals, and team leader submissions.</li>
              <li><strong>Double Opt-In Newsletters &amp; Alerts:</strong> Dispatching cryptographic confirmation tokens and event notifications via verified email relays (Resend API).</li>
              <li><strong>Security &amp; Abuse Prevention:</strong> Auditing IP addresses upon agreement signing, login verification, and CAPTCHA validation.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              4. Data Retention, Encryption &amp; Security Measures
            </h2>
            <p>
              We implement industry-standard security architectures to safeguard institutional records:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Password Protection:</strong> All passwords are irreversibly hashed using standard <code>bcrypt</code> algorithms with unique salts.</li>
              <li><strong>Database Protection:</strong> Stored on isolated MongoDB Atlas clusters with role-based access control (RBAC) and IP whitelisting.</li>
              <li><strong>Media Storage:</strong> Student identity proofs are stored on encrypted Cloudinary vaults with time-expiring signed access links.</li>
              <li><strong>Session Security:</strong> Authenticated sessions rely on secure HTTP-only cryptographic JSON Web Tokens (JWT).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              5. Third-Party Service Integrations
            </h2>
            <p>
              The Platform interfaces only with essential, GDPR &amp; SOC-2 compliant infrastructure providers:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Resend API:</strong> Transactional email dispatch, double opt-in confirmations, and broadcast communications.</li>
              <li><strong>Cloudinary:</strong> Encrypted document and profile asset hosting.</li>
              <li><strong>MongoDB Atlas:</strong> Multi-region database persistence and audit trails.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              6. Student &amp; Institutional Rights (DPDP Act Compliance)
            </h2>
            <p>
              Under applicable Indian data protection jurisprudence, users and onboarded institutions possess:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Right to Rectification:</strong> Edit academic course, contact phone, and social profile links via the user profile console.</li>
              <li><strong>Right to Erasure:</strong> Request permanent removal of team records or student profiles through your designated college SPOC.</li>
              <li><strong>Right to Unsubscribe:</strong> Instantly opt out of newsletter broadcasts via one-click unsubscribe headers or direct request.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              7. Data Protection Officer &amp; Grievance Redressal
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              For security disclosures, data removal requests, or institutional compliance audits, please address inquiries to:
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              Abdul Barr (Chief System Architect &amp; Data Administrator)<br />
              Email: <a href="mailto:hello@abdulbarr.in" className="text-indigo-600 underline">hello@abdulbarr.in</a> | Phone: +91 7479934706
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
