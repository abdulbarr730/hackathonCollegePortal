'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, UserCheck, ShieldCheck, Mail, Phone, Globe, 
  MapPin, CheckCircle2, AlertCircle, Loader2, ArrowRight, 
  FileText, Lock, Eye, EyeOff, Sparkles, School, ChevronRight
} from 'lucide-react';
import Captcha from '../components/Captcha';
import Footer from '../components/Footer';

export default function CollegeOnboardingPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    aisheCode: '',
    institutionType: 'Engineering & Technology',
    affiliatedUniversity: '',
    website: '',
    domain: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    spocName: '',
    spocEmail: '',
    spocPhone: '',
    spocAlternatePhone: '',
    designation: '',
    department: '',
    estimatedStudents: '500-1500',
    adminPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.spocName || !formData.spocEmail) {
      setError('Please fill in all mandatory institutional and SPOC details.');
      return;
    }

    if (formData.adminPassword && formData.adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters.');
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Initial administrative passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must accept the Institutional Master Services Agreement and Data Processing Terms.');
      return;
    }

    if (!isCaptchaVerified) {
      setError('Please complete the security verification challenge.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/colleges/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          institutionalAgreementSignedBy: formData.spocName,
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.msg || 'Institutional onboarding failed.');
      }

      setSuccessData({
        name: formData.name,
        spocEmail: formData.spocEmail,
        spocName: formData.spocName,
        aisheCode: formData.aisheCode || 'Pending Verification'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to submit onboarding request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 max-w-5xl">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white">Institutional Onboarding</span>
        </div>

        {/* Hero Header */}
        <div className="space-y-4 mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            <Building2 size={14} /> Institutional Governance &amp; SIH 2025 Node
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Onboard Your College or University
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Provision dedicated institutional infrastructure for your institution. Automate student roster validation, streamline team formation, and empower your SPOC with one-click SIH nomination exports.
          </p>
        </div>

        {/* SUCCESS CONFIRMATION SCREEN */}
        {successData ? (
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-8 sm:p-14 text-center shadow-xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold uppercase tracking-wider">
                Application Received
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {successData.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your institutional onboarding request has been registered under AISHE reference: <strong>{successData.aisheCode}</strong>.
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nodal SPOC:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{successData.spocName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{successData.spocEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Status:</span>
                <span className="font-semibold text-amber-500">Under Fast-Track Review</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/admin/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                Go to SPOC Login Portal
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          /* ONBOARDING APPLICATION FORM */
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Error Notification */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: INSTITUTIONAL DETAILS */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <School size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    1. Academic Institution Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official records recognized by UGC, AICTE, or State University Boards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Official Institution Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Babu Banarasi Das Institute of Technology and Management"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Short Name / Acronym *
                  </label>
                  <input
                    type="text"
                    required
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    placeholder="e.g. BBDITM or BBDIT"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    AISHE Code / AICTE ID
                  </label>
                  <input
                    type="text"
                    name="aisheCode"
                    value={formData.aisheCode}
                    onChange={handleChange}
                    placeholder="e.g. C-46123 or 1-1234567"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Institution Category
                  </label>
                  <select
                    name="institutionType"
                    value={formData.institutionType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="Engineering & Technology">Engineering &amp; Technology College</option>
                    <option value="Autonomous University">Autonomous University / Deemed University</option>
                    <option value="Affiliated Engineering Institute">Affiliated Engineering Institute</option>
                    <option value="Polytechnic / Diploma College">Polytechnic / Diploma College</option>
                    <option value="Management & Applied Sciences">Management &amp; Applied Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Affiliated University / Board
                  </label>
                  <input
                    type="text"
                    name="affiliatedUniversity"
                    value={formData.affiliatedUniversity}
                    onChange={handleChange}
                    placeholder="e.g. Dr. A.P.J. Abdul Kalam Technical University (AKTU)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Official College Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.bbditm.ac.in"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Domain Selector */}
                <div className="sm:col-span-2 p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                      Does your institution have an official email domain for students and faculty?
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      If your college provides email addresses like <code>@bbdit.edu.in</code>, select Yes. If students use personal emails like <code>@gmail.com</code>, select No.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.hasCustomDomain !== false
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="hasDomainToggle"
                        checked={formData.hasCustomDomain !== false}
                        onChange={() => setFormData(prev => ({ ...prev, hasCustomDomain: true, allowGenericEmails: false }))}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold block">Yes, we have an official domain</span>
                        <span className="text-[11px] opacity-80">Students &amp; SPOC will register using official domain emails.</span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.hasCustomDomain === false
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="hasDomainToggle"
                        checked={formData.hasCustomDomain === false}
                        onChange={() => setFormData(prev => ({ ...prev, hasCustomDomain: false, allowGenericEmails: true, domain: '' }))}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold block">No, allow standard emails</span>
                        <span className="text-[11px] opacity-80">Allows Gmail/Yahoo with mandatory OTP email validation.</span>
                      </div>
                    </label>
                  </div>

                  {formData.hasCustomDomain !== false ? (
                    <div className="pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Official Domain Name *
                      </label>
                      <input
                        type="text"
                        name="domain"
                        value={formData.domain}
                        onChange={handleChange}
                        placeholder="e.g. bbditm.ac.in or bbdit.edu.in"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                      ✓ Generic email registration enabled. All students and staff will be authenticated via real-time OTP codes and institution enrollment verification.
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Sector / Road / Landmark, Campus"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Lucknow or Ghaziabad"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: NODAL SPOC & FACULTY REPRESENTATIVE */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    2. Designated Faculty SPOC / Nodal Coordinator
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The primary authorized faculty contact responsible for approving student teams and managing event nominations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    SPOC / Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="spocName"
                    value={formData.spocName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Official Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    name="spocEmail"
                    value={formData.spocEmail}
                    onChange={handleChange}
                    placeholder="admin@bbdit.edu.in or spoc@college.ac.in"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Official Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    name="spocPhone"
                    value={formData.spocPhone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Faculty Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Professor & Head of CSE / SIH SPOC"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Estimated Student Participation
                  </label>
                  <select
                    name="estimatedStudents"
                    value={formData.estimatedStudents}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="100-500">100 - 500 Students (Internal Sprint)</option>
                    <option value="500-1500">500 - 1,500 Students (Standard SIH Campus)</option>
                    <option value="1500-5000">1,500 - 5,000 Students (Large Institute / University)</option>
                    <option value="5000+">5,000+ Students (Multi-Campus University)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: INITIAL SPOC ADMINISTRATIVE CREDENTIALS */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Lock size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    3. Provision SPOC Dashboard Access Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set the initial password for the SPOC admin account ({formData.spocEmail || 'spoc@college.edu'}).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Initial Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Confirm Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: INSTITUTIONAL LEGAL AGREEMENT & SECURITY CHALLENGE */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    4. Institutional Compliance Declaration &amp; Verification
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Binding legal affirmation of institutional authority and human security check.
                  </p>
                </div>
              </div>

              {/* Legal Declaration Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="college-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  required
                />
                <label htmlFor="college-terms" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer select-none">
                  I hereby declare that I am an authorized academic faculty or administrative representative of <strong>{formData.name || 'the specified institution'}</strong>. I accept and agree to the{' '}
                  <Link href="/college-terms" target="_blank" className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500">
                    Institutional Master Services Agreement
                  </Link>,{' '}
                  <Link href="/privacy" target="_blank" className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500">
                    Student Data Protection Policy
                  </Link>, and{' '}
                  <Link href="/terms" target="_blank" className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500">
                    Platform Terms of Service
                  </Link>.
                </label>
              </div>

              {/* CAPTCHA Component */}
              <div className="pt-2">
                <Captcha onVerify={setIsCaptchaVerified} id="onboard-captcha" />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Cancel and return to home
              </Link>

              <button
                type="submit"
                disabled={loading || !agreedToTerms || !isCaptchaVerified}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Institutional Registration...</span>
                  </>
                ) : (
                  <>
                    <Building2 size={18} />
                    <span>Submit College Onboarding Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
