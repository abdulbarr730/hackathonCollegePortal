'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, EyeOff, User, Mail, Lock, GraduationCap, 
  Upload, CheckCircle, AlertCircle, Loader2, 
  School, CreditCard, ArrowRight, Check, Key,
  Building2, HelpCircle, Send, X, Phone
} from 'lucide-react';

import Footer from '../components/Footer'; 
import Captcha from '../components/Captcha';

export default function RegisterPage() {
  // --- Form States ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [year, setYear] = useState('');
  const [course, setCourse] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [document, setDocument] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState('rollNumber');
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  
  // --- College States ---
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [collegesLoading, setCollegesLoading] = useState(true);

  // --- Onboarding Request Modal ---
  const [showModal, setShowModal] = useState(false);
  const [modalCollegeName, setModalCollegeName] = useState('');
  const [modalCity, setModalCity] = useState('');
  const [modalState, setModalState] = useState('');
  const [modalContactEmail, setModalContactEmail] = useState('');
  const [modalContactName, setModalContactName] = useState('');
  const [modalContactPhone, setModalContactPhone] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  // --- UI States ---
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState(false);
  
  // --- Validation States ---
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | unavailable | invalid

  // --- OTP States ---
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const router = useRouter();
  const errorRef = useRef(null);

  // Fetch approved colleges list
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setCollegesLoading(true);
        const res = await fetch('/api/colleges/public');
        const data = await res.json();
        if (res.ok) {
          setColleges(data.items || []);
        }
      } catch (err) {
        console.error('Failed to load colleges', err);
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // 1. Email Availability Checker
  useEffect(() => {
    if (isOtpSent) return; 

    if (!email) {
      setEmailStatus('idle');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
      return;
    }

    setEmailStatus('checking');
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setEmailStatus(data.available ? 'available' : 'unavailable');
      } catch (err) {
        setEmailStatus('idle');
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [email, isOtpSent]);

  // 2. OTP Timer Logic
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // 3. Send OTP Handler
  const handleSendOtp = async () => {
    if (emailStatus !== 'available') return;
    setOtpLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');
      
      setIsOtpSent(true);
      setOtpTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // 4. File Upload Handler
  const handleFileChange = (e) => {
    if (e.target.files) {
      setDocument(e.target.files[0]);
    }
  };

  // 5. Submit College Onboarding Request
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      const res = await fetch('/api/colleges/request-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalCollegeName,
          city: modalCity,
          state: modalState,
          requesterName: modalContactName || name,
          requesterEmail: modalContactEmail || email,
          requesterPhone: modalContactPhone || phone,
          notes: 'Requested via student registration unlisted college modal'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Submission failed');

      setModalSuccess(true);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // 6. Final Registration Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (emailStatus === 'unavailable') return setError('Email is already taken.');
    if (emailStatus === 'invalid') return setError('Invalid email address.');
    if (!isOtpSent) return setError('Please verify your email address first.');
    if (!otp) return setError('Please enter the verification code sent to your email.');
    
    if (!name || !password || !gender || !year || !course) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!selectedCollege) {
      setError('Please select your college or choose "My college is not listed".');
      return;
    }

    if (verificationMethod === 'rollNumber' && !rollNumber) return setError('Roll Number is required.');
    if (verificationMethod === 'documentUpload' && !document) return setError('ID Document is required.');

    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('gender', gender);
    formData.append('year', year);
    formData.append('course', course);
    formData.append('otp', otp);
    formData.append('verificationMethod', verificationMethod);
    
    if (selectedCollege && selectedCollege !== 'unlisted') {
      formData.append('college', selectedCollege);
    }

    if (verificationMethod === 'rollNumber') {
      formData.append('rollNumber', rollNumber);
    } else if (document) {
      formData.append('document', document);
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      setLoading(false);
      return setError('Invalid 10-digit phone number.');
    }

    if (!agreedToLegal) {
      setLoading(false);
      return setError('You must read and agree to the Terms of Service and Privacy Policy to create an account.');
    }

    if (!isCaptchaVerified) {
      setLoading(false);
      return setError('Please complete the security verification challenge.');
    }

    formData.append('termsAccepted', 'true');
    formData.append('termsAcceptedAt', new Date().toISOString());

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Something went wrong during registration.');
      }
      
      setVerificationResult(data.isVerified);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
      if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center py-10 px-4 z-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden transition-all duration-300">
          
          {isSuccess ? (
            <div className="p-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              {verificationResult ? (
                <>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Verified Student!</h2>
                  <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 max-w-md">
                    Your details matched our approved student records. Your account has been created and verified automatically.
                  </p>
                  <button onClick={() => router.push('/login')} className="w-full max-w-xs rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Proceed to Login
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Registration Successful!</h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md">
                    Your account has been created and is currently <span className="font-bold text-amber-500">Pending Verification</span> by your college SPOC or platform administrators.
                  </p>
                  <Link href="/login" className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                    Return to Login
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Join the Squad
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Create your student profile and connect with your college's hackathon teams.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div ref={errorRef} className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 p-4 flex items-start gap-3 animate-pulse">
                    <AlertCircle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={18} />
                    <span className="text-sm font-medium text-red-600 dark:text-red-300">{error}</span>
                  </div>
                )}

                {/* --- COLLEGE SELECTION --- */}
                <div className="space-y-2 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 p-4 sm:p-5 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={16} /> Select Your College *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowModal(true); setModalSuccess(false); }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle size={13} /> Can't find yours?
                    </button>
                  </div>

                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Choose your registered college --</option>
                    {colleges.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.shortName ? `(${c.shortName})` : ''} {c.city ? `- ${c.city}` : ''}
                      </option>
                    ))}
                    <option value="unlisted">🚫 My college is NOT registered / listed</option>
                  </select>

                  {/* Warning banner when Unlisted College is picked */}
                  {selectedCollege === 'unlisted' && (
                    <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-300 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        College not yet registered on CampXCode
                      </p>
                      <p>
                        Your college is not currently onboarding students. Please ask your Faculty / SPOC to register your college or request onboarding so our team can onboard your institution and verify your account.
                      </p>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowModal(true); setModalSuccess(false); }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all"
                        >
                          Request College Onboarding
                        </button>
                        <Link
                          href="/"
                          className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 font-medium text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                        >
                          Learn More
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- EMAIL & OTP SECTION --- */}
                <div className="space-y-4 rounded-2xl bg-slate-50 dark:bg-slate-950/30 p-4 border border-slate-100 dark:border-slate-800">
                    
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                disabled={isOtpSent}
                                placeholder="name@example.com" 
                                className={`w-full pl-10 pr-28 py-2.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white outline-none transition-all ${emailStatus === 'available' ? 'border-emerald-500' : emailStatus === 'unavailable' ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                            />
                            
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                {isOtpSent ? (
                                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                        <Check size={12} /> Code Sent
                                    </span>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={emailStatus !== 'available' || otpLoading}
                                        className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {otpLoading ? <Loader2 size={14} className="animate-spin" /> : "Get Code"}
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Status Message */}
                        <div className="flex justify-between h-4 px-1">
                            <span className="text-[10px] text-slate-400">
                                {emailStatus === 'checking' && "Checking availability..."}
                            </span>
                            <span className="text-[10px] font-medium">
                                {emailStatus === 'available' && !isOtpSent && <span className="text-emerald-500">Email available</span>}
                                {emailStatus === 'unavailable' && <span className="text-red-500">Email already exists</span>}
                            </span>
                        </div>
                    </div>

                    {/* OTP Input */}
                    {isOtpSent && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Verification Code</label>
                                {otpTimer > 0 ? (
                                    <span className="text-[10px] text-slate-400">Resend in {otpTimer}s</span>
                                ) : (
                                    <button type="button" onClick={handleSendOtp} className="text-[10px] text-indigo-500 hover:underline">Resend Code</button>
                                )}
                            </div>
                            <div className="relative group">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)} 
                                    placeholder="Enter 6-digit code" 
                                    maxLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all tracking-widest font-mono"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- PERSONAL DETAILS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit phone"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Course</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="">Select Course</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Year</label>
                    <div className="relative group">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* --- VERIFICATION METHOD --- */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Student Verification Method</label>
                  <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => setVerificationMethod('rollNumber')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${verificationMethod === 'rollNumber' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>University Roll Number</button>
                    <button type="button" onClick={() => setVerificationMethod('documentUpload')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${verificationMethod === 'documentUpload' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Upload ID Card</button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      {verificationMethod === 'rollNumber' ? (
                        <div className="relative group">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="University Roll No. (matches pre-approved records)" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"/>
                        </div>
                      ) : (
                        <div className="relative">
                            <input type="file" id="doc-upload" onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                            <label htmlFor="doc-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                              <Upload className="text-slate-400 mb-2" size={24} />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{document ? document.name : "Click to Upload Student ID Document"}</span>
                            </label>
                        </div>
                      )}
                  </div>
                </div>

                {/* --- PASSWORD --- */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* --- LEGAL TERMS & CONDITIONS CHECKBOX --- */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="register-terms"
                    checked={agreedToLegal}
                    onChange={(e) => setAgreedToLegal(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    required
                  />
                  <label htmlFor="register-terms" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                    I confirm that the academic details provided are accurate and I agree to the{' '}
                    <Link href="/terms" target="_blank" className="font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" target="_blank" className="font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500">
                      Privacy Policy
                    </Link>.
                  </label>
                </div>

                {/* --- SECURITY CAPTCHA --- */}
                <div className="pt-2">
                  <Captcha onVerify={setIsCaptchaVerified} id="register-captcha" />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading || !agreedToLegal || !isCaptchaVerified} 
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-4 font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (<><Loader2 size={20} className="animate-spin" /> Verifying & Creating...</>) : (<>Join Now <ArrowRight size={20} /></>)}
                  </button>
                </div>

              </form>

              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- ONBOARDING REQUEST MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>

            {modalSuccess ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Request Received!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  We've noted your college onboarding request. Our team will contact your institution to set up SPOC credentials and verify student submissions.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all"
                >
                  Close & Continue
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                  <Building2 size={24} />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request College Onboarding</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Fill in your college details so we can provision SPOC access and add your campus to the portal.
                </p>

                {modalError && (
                  <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-xs text-red-600 dark:text-red-300">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleModalSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">College Name *</label>
                    <input
                      type="text"
                      required
                      value={modalCollegeName}
                      onChange={(e) => setModalCollegeName(e.target.value)}
                      placeholder="e.g. BBDIT Group of Institutions"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                      <input
                        type="text"
                        value={modalCity}
                        onChange={(e) => setModalCity(e.target.value)}
                        placeholder="Ghaziabad"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                      <input
                        type="text"
                        value={modalState}
                        onChange={(e) => setModalState(e.target.value)}
                        placeholder="Uttar Pradesh"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SPOC / Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={modalContactEmail}
                        onChange={(e) => setModalContactEmail(e.target.value)}
                        placeholder="spoc@college.edu or your email"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={modalContactName}
                        onChange={(e) => setModalContactName(e.target.value)}
                        placeholder="Faculty / SPOC name"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-60"
                    >
                      {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
