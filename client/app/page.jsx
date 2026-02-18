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
  Trophy // <--- ADDED THIS
} from "lucide-react";

import { useState } from "react";
// We don't strictly need the context for the text anymore, 
// but we keep it to show the *active event badge* dynamically if desired.
import { useHackathon } from './context/HackathonContext'; 

export default function HomePage() {
  const { activeEvent, loading } = useHackathon(); 
  const [copied, setCopied] = useState(false);

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
    <main className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* 1. TECH BACKGROUND PATTERN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="container mx-auto px-6 pt-32 pb-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            
            {/* Dynamic Badge showing CURRENTLY active event, but keeping main text general */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-10 shadow-sm">
              <Zap size={14} className="fill-indigo-600 dark:fill-indigo-400" /> 
              Now Live: {activeEvent?.name || "Hackathon Season"}
            </span>

            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-10">
              One Portal. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
                Any Hackathon.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto mb-16 font-medium leading-relaxed">
              Whether it's the massive <strong>Smart India Hackathon (SIH)</strong> or an intense <strong>Internal College Sprint</strong>, finding a team shouldn't be chaos. 
              <br/>
              <span className="text-slate-500 mt-2 block text-lg">
                Connect with skilled students, form teams instantly, and streamline your submission process for <em>any</em> campus event.
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login" className="group w-full sm:w-auto px-12 py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-2xl shadow-slate-900/20 hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 overflow-hidden relative">
                <span className="relative z-10">Find Your Squad</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-12 py-5 rounded-[2rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md">
                Register Profile
              </Link>
            </div>
          </motion.div>
        </section>

        {/* --- THE PAIN POINT (The "SIH Problem") --- */}
        <section className="container mx-auto px-6 py-24">
           <div className="max-w-5xl mx-auto space-y-16">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-black text-center text-slate-900 dark:text-white mb-16">
                Why I Built This: The "SIH Chaos"
              </motion.h2>
              
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleLeft} className="flex justify-start w-full">
                <div className="p-8 rounded-[3rem] rounded-bl-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 max-w-2xl shadow-sm relative">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={16} className="text-indigo-500" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Student A (Developer)</span>
                  </div>
                  <p className="text-lg leading-relaxed">"The official SIH website lists the rules, but it doesn't help me find a team <em>here on campus</em>. I need a backend dev, but I don't know anyone outside my class."</p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleRight} className="flex justify-end w-full">
                <div className="p-8 rounded-[3rem] rounded-br-none bg-indigo-600 text-white max-w-2xl shadow-xl relative">
                   <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-indigo-200" />
                    <span className="text-sm font-bold uppercase tracking-wider text-indigo-200">Student B (Idea Lead)</span>
                  </div>
                  <p className="text-lg leading-relaxed">"Exactly! And it's the same for every internal hackathon. WhatsApp groups are spammy and useless. We need a proper directory."</p>
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={chatBubbleLeft} className="flex justify-start w-full">
                <div className="p-8 rounded-[3rem] rounded-bl-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 max-w-2xl shadow-sm relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Search size={16} className="text-indigo-500" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Student A</span>
                  </div>
                  <p className="text-lg leading-relaxed">"If we can solve this for SIH, we can solve it for every hackathon our college organizes. Just one platform for everything."</p>
                </div>
              </motion.div>
           </div>
        </section>

        {/* --- THE SOLUTION --- */}
        <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] py-40 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
           {/* Background Overlay */}
           <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-slate-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900/20 z-0" />
           <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center z-[-1]" />

           <div className="container relative z-10 mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-24 items-center">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest text-xs uppercase mb-8">
                  <Rocket size={18} /> Problem Solved
                </div>
                <h2 className="text-5xl md:text-7xl font-black mb-10 leading-tight text-slate-900 dark:text-white">
                  Built for Agility. <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Ready for Any Event.</span>
                </h2>
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed">
                  I'm <span className="text-indigo-600 dark:text-white font-bold">Abdul Barr</span>. I built this portal to be dynamic. Today it's managing {activeEvent?.name || "our current hackathon"}, but tomorrow it can scale to handle the next big inter-college event instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href="/login" className="px-10 py-4 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all text-center shadow-xl">
                    Enter Portal
                  </Link>
                  <Link href="/register" className="px-10 py-4 rounded-[2rem] border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center">
                    Join Now
                  </Link>
                </div>
              </motion.div>
              
              <div className="relative group flex justify-center">
                 <div className="absolute -inset-10 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                 <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                    className="relative rounded-[2rem] shadow-2xl border-2 border-white/50 dark:border-white/10 w-full max-w-lg transform group-hover:scale-[1.02] transition-transform duration-500" 
                    alt="Dashboard Experience"
                  />
              </div>
           </div>
        </section>

        {/* --- FEATURES --- */}
        <section className="container mx-auto px-6 py-40">
          <div className="text-center mb-32">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">One Platform. Total Control.</h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-xl font-medium leading-relaxed">Admin-controlled event switching means this portal evolves with your college's schedule.</p>
          </div>

          <div className="grid gap-32">
            
            {/* Feature 1: Dynamic Events */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                 <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-8">
                    <Trophy size={32} /> 
                    {/* Note: I swapped icon to Trophy for generic event vibe */}
                 </div>
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Multi-Event Support</h3>
                 <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
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
                 <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" className="relative rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-[500px]" alt="Event Management" />
              </div>
            </div>

            {/* Feature 2: Team Formation */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                 <div className="absolute -inset-4 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" className="relative rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-[500px]" alt="Team Discovery" />
              </div>
              <div>
                 <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-8">
                    <Users size={32} />
                 </div>
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Universal Team Discovery</h3>
                 <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
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
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Centralized Nomination Status</h3>
                 <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
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
                 <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" className="relative rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full object-cover h-[500px]" alt="Official Status" />
              </div>
            </div>

          </div>
        </section>

        {/* --- THE TERMINAL (STRICT DEMO TESTING) --- */}
        <section className="container mx-auto px-6 pb-40 pt-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-[3rem] overflow-hidden border-2 border-amber-500/20 bg-white dark:bg-slate-900 shadow-3xl relative"
          >
            {/* Warning Banner */}
            <div className="bg-amber-500 text-slate-950 px-8 py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.3em]">
              <AlertTriangle size={16} strokeWidth={3} />
              Strictly for Demo Testing Purposes Only
              <AlertTriangle size={16} strokeWidth={3} />
            </div>

            <div className="p-12 md:p-16 font-mono text-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500">
                     <Lock size={24} />
                   </div>
                   <div>
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Access Level</p>
                     <p className="text-xl font-bold text-slate-900 dark:text-white">Temporary Sandbox Credentials</p>
                   </div>
                </div>
                <button onClick={copyToClipboard} className="px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-bold flex items-center gap-3 transition-all shadow-sm">
                  {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "COPIED TO CLIPBOARD" : "COPY CREDENTIALS"}
                </button>
              </div>

              <div className="space-y-6 mb-12">
                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between gap-4 md:items-center group hover:border-indigo-500 transition-all duration-300">
                  <span className="text-slate-400 text-lg">$ user_email:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-2xl tracking-tight break-all">test123@gmail.com</span>
                </div>
                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between gap-4 md:items-center group hover:border-indigo-500 transition-all duration-300">
                  <span className="text-slate-400 text-lg">$ password:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-2xl tracking-tight break-all">pass@123</span>
                </div>
              </div>

              {/* Legal Warning Footer */}
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-700 dark:text-amber-500 text-sm leading-relaxed font-medium flex gap-4">
                  <AlertTriangle size={24} className="flex-shrink-0" />
                  <span>
                    <span className="font-black uppercase tracking-widest block mb-1">Usage Disclaimer</span>
                    These credentials provide access to a temporary, isolated testing environment. Do not use them for official team registration or store any personal or sensitive data. All data in this environment is periodically purged without notice.
                  </span>
                </p>
              </div>

              <div className="mt-12 text-center">
                 <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 uppercase text-sm tracking-widest">
                    Launch Demo Environment <ArrowRight size={18} />
                 </Link>
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </main>
  );
}