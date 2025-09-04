'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [document, setDocument] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState('rollNumber');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState('');
  const [year, setYear] = useState('');
  const [verificationResult, setVerificationResult] = useState(false);
  
  const router = useRouter();
  const formRef = useRef(null);
  const errorRef = useRef(null);
  const titleRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (emailStatus === 'unavailable' || emailStatus === 'invalid') {
      setError('Please provide a valid and available email address.');
      return;
    }
    if (!name || !password || !gender || !year || (verificationMethod === 'rollNumber' && !rollNumber) || (verificationMethod === 'documentUpload' && !document)) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('gender', gender);
    formData.append('year', year);
    formData.append('verificationMethod', verificationMethod);
    if (verificationMethod === 'rollNumber') {
      formData.append('rollNumber', rollNumber);
    } else if (document) {
      formData.append('document', document);
    }
    try {
      // MODIFIED: Using relative path
      const res = await fetch(`/api/users/register`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setDocument(e.target.files[0]);
    }
  };

  useEffect(() => {
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
        // MODIFIED: Using relative path
        const res = await fetch(`/api/users/check-email`, {
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
  }, [email]);

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;
    const handleMouseMoveInside = (e) => {
      const rect = formElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleX = gsap.utils.mapRange(0, rect.width, 0.98, 1.02, mouseX);
      const scaleY = gsap.utils.mapRange(0, rect.height, 1.02, 0.98, mouseY);
      gsap.to(formElement, { scaleX, scaleY, duration: 0.5, ease: 'power3.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(formElement, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    };
    formElement.addEventListener('mousemove', handleMouseMoveInside);
    formElement.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      if (formElement) {
        formElement.removeEventListener('mousemove', handleMouseMoveInside);
        formElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      className="relative flex min-h-full w-full items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/coding-background.jpg')" }}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>
      <div
        ref={formRef}
        className="relative z-10 w-full max-w-md rounded-2xl border border-purple-500/30 bg-slate-800/50 p-8 shadow-2xl shadow-purple-500/20"
      >
        <h2 className="mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-center text-3xl font-bold text-transparent">
          Join the Hackathon
        </h2>
        {isSuccess ? (
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>

              {verificationResult ? (
                <>
                  <h3 className="mt-4 text-2xl font-semibold text-white">
                    College Student Verified!
                  </h3>
                  <p className="mt-2 text-gray-400">
                    Your account has been created and verified successfully.
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    Login Here
                  </button>
                </>
              ) : (
                <>
                  <h3 className="mt-4 text-2xl font-semibold text-white">
                    Successfully Registered!
                  </h3>
                  <p className="mt-2 text-gray-400">
                    Your account is now pending approval from the admin.
                  </p>

                  {/* ✅ Added urgent verification message */}
                  <div className="mt-4 text-sm text-gray-300">
                    <p>
                      <span className="font-semibold text-yellow-400">
                        Need to get verified ASAP?
                      </span>{' '}
                      Drop a message at{' '}
                      <a
                        href="tel:+917479934706"
                        className="text-blue-400 hover:underline"
                      >
                        +91 7479934706
                      </a>{' '}
                      or{' '}
                      <a
                        href="mailto:abdulbarr730@gmail.com"
                        className="text-blue-400 hover:underline"
                      >
                        abdulbarr730@gmail.com
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p ref={errorRef} className="rounded bg-red-500/50 p-3 text-center text-sm">{error}</p>}
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">Full Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-purple-500" />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`w-full rounded-md border-none bg-black/30 p-3 ring-1 placeholder:text-gray-400 focus:ring-purple-500 ${emailStatus === 'available' ? 'ring-green-500' : ''} ${emailStatus === 'unavailable' || emailStatus === 'invalid' ? 'ring-red-500' : 'ring-white/10'}`} />
                </div>
                <div className="pt-1 text-xs min-h-[16px]">
                  {emailStatus === 'checking' && <p className="text-yellow-400">Checking...</p>}
                  {emailStatus === 'unavailable' && <p className="text-red-500">Email is already taken.</p>}
                  {emailStatus === 'available' && <p className="text-green-500">Email is available!</p>}
                  {emailStatus === 'invalid' && <p className="text-red-500">Please enter a valid email.</p>}
                </div>
              </div>
              <div>
                <label htmlFor="gender" className="mb-2 block text-sm font-medium text-gray-300">Gender</label>
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required className={`w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 focus:ring-purple-500 ${!gender ? 'text-gray-400' : 'text-white'}`}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="year" className="mb-2 block text-sm font-medium text-gray-300">Academic Year</label>
                <select id="year" value={year} onChange={(e) => setYear(e.target.value)} required className={`w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 focus:ring-purple-500 ${!year ? 'text-gray-400' : 'text-white'}`}>
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Verification Method</label>
                <div className="flex items-center space-x-4 rounded-md bg-black/30 p-1">
                  <label className="flex-1 cursor-pointer rounded-md p-2 text-center text-gray-300 transition-colors hover:bg-white/10 has-[:checked]:bg-purple-600/50 has-[:checked]:text-white">
                    <input type="radio" name="verificationMethod" value="rollNumber" checked={verificationMethod === 'rollNumber'} onChange={(e) => setVerificationMethod(e.target.value)} className="sr-only" />
                    <span>Roll Number</span>
                  </label>
                  <label className="flex-1 cursor-pointer rounded-md p-2 text-center text-gray-300 transition-colors hover:bg-white/10 has-[:checked]:bg-purple-600/50 has-[:checked]:text-white">
                    <input type="radio" name="verificationMethod" value="documentUpload" checked={verificationMethod === 'documentUpload'} onChange={(e) => setVerificationMethod(e.target.value)} className="sr-only" />
                    <span>Upload Doc</span>
                  </label>
                </div>
              </div>
              {verificationMethod === 'rollNumber' && (
                <div>
                  <label htmlFor="rollNumber" className="mb-2 block text-sm font-medium text-gray-300">Roll Number</label>
                  <input type="text" id="rollNumber" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Enter your university roll number" className="w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-400 focus:ring-purple-500" />
                </div>
              )}
              {verificationMethod === 'documentUpload' && (
                <div>
                  <label htmlFor="document" className="mb-2 block text-sm font-medium text-gray-300">Upload ID Card</label>
                  <input type="file" id="document" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, application/pdf" className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-white hover:file:bg-slate-600" />
                  <p className="mt-1 text-xs text-gray-400">PDF, PNG, JPG, or JPEG.</p>
                </div>
              )}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-00">Create a Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-md border-none bg-black/30 p-3 ring-1 ring-white/10 placeholder:text-gray-700 focus:ring-purple-500"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">Login here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}