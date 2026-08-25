'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Github, Linkedin, Twitter, ExternalLink, Mail, Phone, Globe, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    if (!agreedToTerms) {
      setIsError(true);
      setMessage('Please agree to the Privacy Policy and Terms & Conditions to subscribe.');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Subscription failed');
      setMessage(data.msg || "🎉 Check your email to confirm your subscription!");
      setEmail('');
      setAgreedToTerms(false);
    } catch (err) {
      setIsError(true);
      setMessage(err.message || 'Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative z-[99] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors duration-300 overflow-hidden">
      
      {/* Subtle Background Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 py-12 lg:py-16">
        
        {/* 4-COLUMN INLINE FOOTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* COLUMN 1: BRANDING & SOCIALS (col-span-4) */}
          <div className="lg:col-span-4 space-y-3.5">
            <Link href="/" className="inline-block">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Find Your Dream Team
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm">
              Stop searching and start building. The unified platform to connect with skilled developers, designers, and innovators for your next hackathon.
            </p>
            
            {/* Socials */}
            <div className="flex items-center gap-3 pt-1">
              <SocialLink href="https://github.com/abdulbarr730" icon={Github} label="GitHub" />
              <SocialLink href="https://www.linkedin.com/in/abdul-barr-9092a4251/" icon={Linkedin} label="LinkedIn" />
              <SocialLink href="https://x.com/ipokealot" icon={Twitter} label="Twitter" />
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS (col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/onboard-college">College Onboarding</FooterLink>
              <FooterLink href="/updates">Live Updates</FooterLink>
              <FooterLink href="/ideas">Idea Board</FooterLink>
              <FooterLink href="/resources">Resource Hub</FooterLink>
              <FooterLink href="/college-terms">Institutional MSA</FooterLink>
            </ul>
          </div>

          {/* COLUMN 3: DEVELOPER & CONTACT INFO (col-span-3) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Contact &amp; Creator
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <Mail size={15} />
                </div>
                <a href="mailto:hello@abdulbarr.in" className="hover:text-indigo-600 dark:hover:text-white transition-colors truncate">
                  hello@abdulbarr.in
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Phone size={15} />
                </div>
                <a href="tel:+917479934706" className="hover:text-emerald-600 dark:hover:text-white transition-colors">
                  +91 7479934706
                </a>
              </li>
              
              {/* PORTFOLIO LINK */}
              <li className="pt-1">
                <a 
                  href="https://www.abdulbarr.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto"
                >
                  <div className="p-1 rounded-full bg-white/20 dark:bg-slate-900/10">
                    <Globe size={15} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-medium opacity-80 uppercase tracking-wider">Built by</span>
                    <span className="text-xs font-bold leading-tight">Abdul Barr</span>
                  </div>
                  <ExternalLink size={14} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: NEWSLETTER WIDGET (col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Get notified for official SIH deadlines, problem statements &amp; schedules.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-600 transition-all shadow-inner"
              />

              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="footer-newsletter-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  required
                />
                <label htmlFor="footer-newsletter-terms" className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none leading-tight">
                  I agree to the{' '}
                  <Link href="/privacy" className="text-slate-800 dark:text-slate-200 underline hover:text-indigo-600">
                    Privacy Policy
                  </Link>{' '}
                  &amp;{' '}
                  <Link href="/terms" className="text-slate-800 dark:text-slate-200 underline hover:text-indigo-600">
                    Terms
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  agreedToTerms && !loading
                    ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent opacity-70'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Subscribe</span>
                  </>
                )}
              </button>

              {message && (
                <div className={`text-[11px] flex items-center gap-1 font-medium ${isError ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isError ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                  <span>{message}</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SIH &amp; Campus Hackathon Portal. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/college-terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Institutional Agreement</Link>
            <a href="mailto:hello@abdulbarr.in" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300"
      aria-label={label}
    >
      <Icon size={16} />
    </a>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link 
        href={href} 
        className="group flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
        <span className="group-hover:translate-x-1 transition-transform duration-200">{children}</span>
      </Link>
    </li>
  );
}
