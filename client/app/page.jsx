'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Users, 
  ShieldCheck,
  Check,
  Copy,
  LayoutGrid,
  Rocket,
  Code2,
  AlertTriangle,
  Lock,
  MessageCircle,
  Search,
  Zap,
  Trophy,
  Building2,
  X,
  CheckCircle,
  Loader2
} from "lucide-react";

import { useState, useEffect } from "react";
// We don't strictly need the context for the text anymore, 
// but we keep it to show the *active event badge* dynamically if desired.
import { useHackathon } from './context/HackathonContext'; 

export default function HomePage() {
  const { activeEvent, loading } = useHackathon(); 
  const [copied, setCopied] = useState(false);

  // College Onboarding Modal State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardData, setOnboardData] = useState({
    name: '',
    shortName: '',
    website: '',
    city: '',
    state: '',
    spocName: '',
    spocEmail: '',
    spocPhone: '',
    designation: ''
  });
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardError, setOnboardError] = useState('');
  // Auto-open modal on #onboard or ?onboard=college
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#onboard' || window.location.search.includes('onboard')) {
        setIsOnboardModalOpen(true);
      }
      const handleHash = () => {
        if (window.location.hash === '#onboard') setIsOnboardModalOpen(true);
      };
      window.addEventListener('hashchange', handleHash);
      return () => window.removeEventListener('hashchange', handleHash);
    }
  }, []);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardError('');
    setOnboardSuccess('');
    setOnboardSubmitting(true);
    try {
      const res = await fetch('/api/colleges/request-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: onboardData.name,
          shortName: onboardData.shortName,
          website: onboardData.website,
          city: onboardData.city,
          state: onboardData.state,
          requesterName: onboardData.spocName,
          requesterEmail: onboardData.spocEmail,
          requesterPhone: onboardData.spocPhone,
          notes: `Official SPOC Onboarding Request: Designation - ${onboardData.designation || 'Faculty Coordinator'}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Failed to submit onboarding request');
      setOnboardSuccess('Thank you! Your institutional onboarding request has been submitted. Our administrators will verify your credentials and configure your SPOC / Admin console.');
      setOnboardData({
        name: '',
        shortName: '',
        website: '',
        city: '',
        state: '',
        spocName: '',
        spocEmail: '',
        spocPhone: '',
        designation: ''
      });
    } catch (err) {
      setOnboardError(err.message);
    } finally {
      setOnboardSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`test123@gmail.com\npass@123`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const chatBubbleLeft = {
    hidden: { opacity: 0, x: -40, scale: 0.9 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  const chatBubbleRight = {
    hidden: { opacity: 0, x: 40, scale: 0.9 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-full min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* 1. TECH BACKGROUND PATTERN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full">
        
        {/* --- HERO SECTION --- */}
        <section className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 sm:pb-16 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            
            {/* Dynamic Badge showing CURRENTLY active event, but keeping main text general */}
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6 shadow-sm">
              <Zap size={14} className="fill-indigo-600 dark:fill-indigo-400" /> 
              Now Live: {activeEvent?.name || "Hackathon Season"}
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-tight md:leading-[0.95] mb-4 sm:mb-6 tracking-tight">
              One Portal. <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                Any Hackathon.
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto mb-6 sm:mb-8 font-medium leading-relaxed">
              Whether it's the massive <strong>Smart India Hackathon (SIH)</strong> or an intense <strong>Internal College Sprint</strong>, finding a team shouldn't be chaos. 
              <br className="hidden sm:inline" />
              <span className="text-slate-500 mt-2 block text-sm sm:text-lg">
                Connect with skilled students, form teams instantly, and streamline your submission process for <em>any</em> campus event.
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/login" className="group w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base sm:text-lg shadow-xl shadow-slate-900/10 hover:bg-indigo-600 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 relative">
                <span>Find Your Squad</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 font-bold text-base sm:text-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md">
                Register Profile
              </Link>
              <Link 
                href="/onboard-college"
                className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-base sm:text-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                Onboard College
              </Link>
            </div>
          </motion.div>
        </section>

        {/* --- THE PAIN POINT (The "SIH Problem") --- */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
           <div className="max-w-5xl mx-auto space-y-8 sm:space-y-14">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl sm:text-4xl font-black text-center text-slate-900 dark:text-white mb-8 sm:mb-14">
                Why I Built This: The "SIH Chaos"
              </motion.h2>
              
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleLeft} className="flex justify-start w-full">
                <div className="p-4 sm:p-7 rounded-2xl sm:rounded-[2.5rem] sm:rounded-bl-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 max-w-2xl shadow-sm relative">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle size={16} className="text-indigo-500" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Student A (Developer)</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed">"The official SIH website lists the rules, but it doesn't help me find a team <em>here on campus</em>. I need a backend dev, but I don't know anyone outside my class."</p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleRight} className="flex justify-end w-full">
                <div className="p-4 sm:p-7 rounded-2xl sm:rounded-[2.5rem] sm:rounded-br-none bg-indigo-600 text-white max-w-2xl shadow-xl relative">
                   <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-indigo-200" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-200">Student B (Idea Lead)</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed">"Exactly! And it's the same for every internal hackathon. WhatsApp groups are spammy and useless. We need a proper directory."</p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleLeft} className="flex justify-start w-full">
                <div className="p-4 sm:p-7 rounded-2xl sm:rounded-[2.5rem] sm:rounded-bl-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 max-w-2xl shadow-sm relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={16} className="text-indigo-500" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Student A</span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed">"If we can solve this for SIH, we can solve it for every hackathon our college organizes. Just one platform for everything."</p>
                </div>
              </motion.div>
           </div>
        </section>

        {/* --- THE SOLUTION --- */}
        <section className="relative w-full py-16 sm:py-28 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
           <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center z-[-1]" />

           <div className="container relative z-10 mx-auto px-4 sm:px-6 md:px-12 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest text-xs uppercase mb-6 sm:mb-8">
                  <Rocket size={18} /> Problem Solved
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-8 sm:mb-10 leading-tight text-slate-900 dark:text-white tracking-tight">
                  Built for Agility. <br/>
                  <span className="text-indigo-600 dark:text-indigo-400">Ready for Any Event.</span>
                </h2>
                <p className="text-base sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 sm:mb-12 leading-relaxed">
                  I'm <span className="text-indigo-600 dark:text-white font-bold">Abdul Barr</span>. I built this portal to be dynamic. Today it's managing {activeEvent?.name || "our current hackathon"}, but tomorrow it can scale to handle the next big inter-college event instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href="/login" className="px-10 py-4 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all text-center shadow-xl">
                    Enter Portal
                  </Link>
                  <Link 
                    href="/onboard-college"
                    className="px-10 py-4 rounded-[2rem] border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all text-center"
                  >
                    Onboard Your College
                  </Link>
                </div>
              </motion.div>
              
              <div className="relative group flex justify-center">
                 <div className="absolute -inset-10 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                 <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                    className="relative rounded-2xl shadow-2xl border-2 border-white/50 dark:border-white/10 w-full max-w-lg transform group-hover:scale-[1.02] transition-transform duration-500" 
                    alt="Dashboard Experience"
                  />
              </div>
           </div>
        </section>

        {/* --- DEDICATED COLLEGE ONBOARDING & VERIFICATION EXPLAINER --- */}
        <section id="onboard" className="container mx-auto px-4 sm:px-6 py-20 sm:py-32 scroll-mt-24">
          <div className="relative rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-14 lg:p-20 shadow-2xl overflow-hidden">
            
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Building2 size={16} /> Institutional Governance
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Bring Your College or University Onboard
              </h2>
              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Empower your students with structured team formation, verified roll-number rosters, SPOC-driven SIH nominations, and autonomous internal hackathons.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/onboard-college"
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base sm:text-lg shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Building2 size={20} />
                  Submit College Onboarding Request
                </Link>
                <Link
                  href="/admin/login"
                  className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-center shadow-sm"
                >
                  SPOC / Admin Portal
                </Link>
              </div>
            </div>

            {/* Validation Architecture Pipeline Cards */}
            <div className="mt-16 sm:mt-24 pt-12 border-t border-indigo-100 dark:border-slate-800">
              <div className="text-center mb-10">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  How We Validate & Verify Every College
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Multi-tier authenticity verification to ensure zero unapproved submissions and clean student data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/60 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                      1
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Domain & SPOC Verification</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    We verify the official college domain (e.g., <code className="font-mono text-indigo-600 dark:text-indigo-400">bbdit.edu.in</code>) and faculty SPOC credentials against official university records.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/60 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                      2
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Super Admin Provisioning</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Platform Super Admin approves the request, creates provisioned staff accounts, and triggers a forced first-login password setup handoff.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/60 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                      3
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Roster Auto-Verification</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Colleges upload approved student roll-number spreadsheets. Matching student signups are instantly auto-verified with duplicate-proof protection.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* --- FEATURES --- */}
        <section className="container mx-auto px-4 sm:px-6 py-20 sm:py-32 lg:py-40">
          <div className="text-center mb-16 sm:mb-24 lg:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 sm:mb-8">One Platform. Total Control.</h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-base sm:text-xl font-medium leading-relaxed">Admin-controlled event switching means this portal evolves with your college's schedule.</p>
          </div>

          <div className="grid gap-20 sm:gap-28 lg:gap-32">
            
            {/* Feature 1: Dynamic Events */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                 <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-8">
                    <Trophy size={32} /> 
                 </div>
                 <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Multi-Event Support</h3>
                 <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                    The admin decides what's live. Whether it's SIH 2025, an Internal Coding Sprint, or a Designathon—the entire platform adapts. Rules, team sizes, and banners update instantly.
                 </p>
                 <ul className="space-y-4">
                    {['Admin-Controlled Event Switching', 'Custom Team Size Rules per Event', 'Separate Team Lists for History'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                        <Check size={20} className="text-blue-500" /> {item}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                 <div className="absolute -inset-4 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" className="relative rounded-2xl sm:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-72 sm:h-[500px]" alt="Event Management" />
              </div>
            </div>

            {/* Feature 2: Team Formation */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                 <div className="absolute -inset-4 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" className="relative rounded-2xl sm:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-72 sm:h-[500px]" alt="Team Discovery" />
              </div>
              <div>
                 <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-8">
                    <Users size={32} />
                 </div>
                 <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Universal Team Discovery</h3>
                 <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                    Filter by skills (React, Node, Figma) and connect with students across years and branches. The directory resets for every new hackathon, ensuring you find people who are actually available <em>now</em>.
                 </p>
                 <ul className="space-y-4">
                    {['Skill-based Search', 'Role-based Filtering', 'Real-time Availability'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                        <Check size={20} className="text-emerald-500" /> {item}
                      </li>
                    ))}
                 </ul>
              </div>
            </div>
            
            {/* Feature 3: Official Status */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                 <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-8">
                    <LayoutGrid size={32} />
                 </div>
                 <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Centralized Nomination Status</h3>
                 <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                    For events like SIH, tracking who is officially nominated is a nightmare. This portal centralizes the SPOC's approval process, so you know exactly where your team stands.
                 </p>
                 <ul className="space-y-4">
                    {['Internal Selection Results', 'SPOC Approval Dashboard', 'Official Nomination Tracking'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-700 dark:text-slate-300">
                        <Check size={20} className="text-purple-500" /> {item}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="order-1 lg:order-2 relative group">
                 <div className="absolute -inset-4 bg-purple-500/10 dark:bg-purple-500/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" className="relative rounded-2xl sm:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-72 sm:h-[500px]" alt="Official Status" />
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* --- COLLEGE ONBOARDING MODAL --- */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Building2 size={14} /> Institution Onboarding
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Register Your College / University
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Fill in your official college details. Our team will verify your institution and provision administrator/SPOC credentials.
                </p>
              </div>
              <button
                onClick={() => { setIsOnboardModalOpen(false); setOnboardSuccess(''); setOnboardError(''); }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {onboardSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Onboarding Request Received!</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  {onboardSuccess}
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => { setIsOnboardModalOpen(false); setOnboardSuccess(''); }}
                    className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 font-bold text-sm shadow hover:opacity-90 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                {onboardError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-xs text-red-600 dark:text-red-300">
                    {onboardError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    College / Institute Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardData.name}
                    onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                    placeholder="e.g., BBD Institute of Technology & Management"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Short Name / Code
                    </label>
                    <input
                      type="text"
                      value={onboardData.shortName}
                      onChange={(e) => setOnboardData({ ...onboardData, shortName: e.target.value })}
                      placeholder="e.g., BBDITM"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Official Website / Domain
                    </label>
                    <input
                      type="text"
                      value={onboardData.website}
                      onChange={(e) => setOnboardData({ ...onboardData, website: e.target.value })}
                      placeholder="https://bbdit.edu.in"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardData.city}
                      onChange={(e) => setOnboardData({ ...onboardData, city: e.target.value })}
                      placeholder="e.g., Lucknow"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardData.state}
                      onChange={(e) => setOnboardData({ ...onboardData, state: e.target.value })}
                      placeholder="e.g., Uttar Pradesh"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                    Official Faculty SPOC / Representative Info
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        SPOC / Coordinator Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={onboardData.spocName}
                        onChange={(e) => setOnboardData({ ...onboardData, spocName: e.target.value })}
                        placeholder="Dr. / Prof. Full Name"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Official SPOC Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={onboardData.spocEmail}
                        onChange={(e) => setOnboardData({ ...onboardData, spocEmail: e.target.value })}
                        placeholder="spoc@college.edu.in"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        SPOC Phone Number
                      </label>
                      <input
                        type="tel"
                        value={onboardData.spocPhone}
                        onChange={(e) => setOnboardData({ ...onboardData, spocPhone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Designation / Department
                      </label>
                      <input
                        type="text"
                        value={onboardData.designation}
                        onChange={(e) => setOnboardData({ ...onboardData, designation: e.target.value })}
                        placeholder="HOD CSE / Hackathon Incharge"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOnboardModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={onboardSubmitting}
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {onboardSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Onboarding'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
