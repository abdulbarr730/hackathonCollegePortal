'use client';

import Link from 'next/link';
import { Github, Linkedin, Twitter, ExternalLink, Mail, Phone, Globe } from 'lucide-react';

export default function Footer() {
  return (
    /* FIX: Added 'z-40' to stay above the toggle and 'bg-slate-50 dark:bg-slate-950' 
       to ensure it's not transparent so the toggle doesn't show through.
    */
    <footer className="relative z-99 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors duration-300 overflow-hidden">
      
      {/* BACKGROUND PATTERN (Subtle Tech Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* COLUMN 1: BRANDING */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-white dark:via-indigo-200 dark:to-white">
                Find Your Dream Team
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-slate-500 dark:text-slate-400">
              Stop searching and start building. The ultimate platform to connect with skilled developers, designers, and innovators for your next project.
            </p>
            
            {/* Socials */}
            <div className="flex items-center gap-4 pt-2">
              <SocialLink href="https://github.com/abdulbarr730" icon={Github} label="GitHub" />
              <SocialLink href="https://www.linkedin.com/in/abdul-barr-9092a4251/" icon={Linkedin} label="LinkedIn" />
              <SocialLink href="https://x.com/ipokealot" icon={Twitter} label="Twitter" />
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS */}
          <div className="md:col-span-3">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Platform</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/updates">Live Updates</FooterLink>
              <FooterLink href="/ideas">Idea Board</FooterLink>
              <FooterLink href="/resources">Resource Hub</FooterLink>
            </ul>
          </div>

          {/* COLUMN 3: DEVELOPER INFO */}
          <div className="md:col-span-4">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Contact Developer</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <Mail size={16} />
                </div>
                <a href="mailto:abdulbarr730@gmail.com" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  abdulbarr730@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Phone size={16} />
                </div>
                <a href="tel:+917479934706" className="hover:text-emerald-600 dark:hover:text-white transition-colors">
                  +91 7479934706
                </a>
              </li>
              
              {/* PORTFOLIO LINK */}
              <li className="pt-4">
                <a 
                  href="https://www.abdulbarr.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                >
                  <div className="p-1 rounded-full bg-white/20 dark:bg-slate-900/10">
                    <Globe size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Designed & Built by</span>
                    <span className="text-sm font-bold">Abdul Barr</span>
                  </div>
                  <ExternalLink size={16} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SIH Portal. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
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
      className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300"
      aria-label={label}
    >
      <Icon size={18} />
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