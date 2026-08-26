'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Eye, 
  Edit3, 
  Globe, 
  Phone, 
  Send, 
  Users, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Calendar,
  Sparkles,
  History,
  ShieldCheck,
  CheckSquare,
  Square,
  Clock,
  Zap,
  Activity,
  UserCheck,
  Filter,
  GraduationCap,
  Building2,
  Cpu,
  Layers
} from 'lucide-react';

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Super Admin Check
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  useEffect(() => {
    if (user && !isSuperAdminUser) {
      router.push('/admin/dashboard');
    }
  }, [user, isSuperAdminUser, router]);

  // Data State
  const [subscribers, setSubscribers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [emailsSentToday, setEmailsSentToday] = useState(0);
  const [emailsSentThisMonth, setEmailsSentThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'subscribers'
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all, leaders, verified, students, spocs
  const [yearFilter, setYearFilter] = useState('all'); // all, 1, 2, 3, 4
  const [collegeFilter, setCollegeFilter] = useState('all'); // all, or college _id

  // Recipient Selection State
  const [selectedEmails, setSelectedEmails] = useState(new Set());

  // Broadcast Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [dispatchMode, setDispatchMode] = useState('immediate');
  const [provider, setProvider] = useState('auto'); // 'auto', 'resend', 'zeptomail'
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [broadcastError, setBroadcastError] = useState('');
  const [composerView, setComposerView] = useState('compose'); // 'compose' | 'preview'

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('q', search);

      const [subRes, colRes] = await Promise.all([
        fetch(`/api/newsletter/subscribers?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        }),
        fetch('/api/colleges/public')
      ]);

      const data = await subRes.json();
      if (subRes.ok) {
        setSubscribers(data.items || []);
        setRegisteredUsers(data.registeredUsers || []);
        setTotalActive(data.totalActive || 0);
        setTotalPending(data.totalPending || 0);
        setEmailsSentToday(data.emailsSentToday || 0);
        setEmailsSentThisMonth(data.emailsSentThisMonth || 0);
        setCampaigns(data.campaigns || []);
        setRecentLogs(data.recentLogs || []);

        // Default: select all registered users on first load
        if (selectedEmails.size === 0 && data.registeredUsers?.length > 0) {
          const allEmails = new Set(data.registeredUsers.map(u => u.email.toLowerCase()));
          setSelectedEmails(allEmails);
        }
      }

      if (colRes.ok) {
        const colData = await colRes.json();
        setColleges(colData.items || []);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Individual Recipient Selection
  const toggleEmail = (email) => {
    const clean = email.toLowerCase().trim();
    const next = new Set(selectedEmails);
    if (next.has(clean)) {
      next.delete(clean);
    } else {
      next.add(clean);
    }
    setSelectedEmails(next);
  };

  // Filter Pool Logic
  const currentPool = activeTab === 'users' ? registeredUsers : subscribers;
  const filteredPool = currentPool.filter(item => {
    if (activeTab === 'users') {
      // 1. Role Filter
      if (userRoleFilter === 'leaders' && !item.team) return false;
      if (userRoleFilter === 'verified' && !item.isVerified) return false;
      if (userRoleFilter === 'students' && item.role !== 'student') return false;
      if (userRoleFilter === 'spocs' && !['spoc', 'college_admin', 'admin'].includes(item.role)) return false;

      // 2. Year Filter
      if (yearFilter !== 'all') {
        const itemYear = parseInt(item.year, 10);
        if (isNaN(itemYear) || itemYear !== parseInt(yearFilter, 10)) return false;
      }

      // 3. College Filter
      if (collegeFilter !== 'all') {
        const itemColId = String(item.college?._id || item.college || '');
        const itemColName = String(item.college?.name || item.college?.shortName || item.collegeName || '').toLowerCase();
        const selectedCol = colleges.find(c => String(c._id) === String(collegeFilter));
        const matchesId = itemColId === String(collegeFilter);
        const matchesName = selectedCol && (
          (selectedCol.shortName && itemColName.includes(selectedCol.shortName.toLowerCase())) ||
          (selectedCol.name && itemColName.includes(selectedCol.name.toLowerCase()))
        );
        if (!matchesId && !matchesName) return false;
      }
    }

    // Search Query (Client-side fast refine)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchEmail = (item.email || '').toLowerCase().includes(q);
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchRoll = (item.rollNumber || '').toLowerCase().includes(q);
      return matchEmail || matchName || matchRoll;
    }

    return true;
  });

  // Select All Filtered Records
  const handleSelectFiltered = () => {
    const next = new Set(selectedEmails);
    filteredPool.forEach(u => next.add(u.email.toLowerCase().trim()));
    setSelectedEmails(next);
  };

  // Deselect All Filtered Records
  const handleDeselectFiltered = () => {
    const next = new Set(selectedEmails);
    filteredPool.forEach(u => next.delete(u.email.toLowerCase().trim()));
    setSelectedEmails(next);
  };

  // Select Specific Year Preset
  const handleSelectYearPreset = (yearNum) => {
    setYearFilter(String(yearNum));
    const next = new Set();
    registeredUsers.forEach(u => {
      if (Number(u.year) === Number(yearNum)) {
        next.add(u.email.toLowerCase().trim());
      }
    });
    setSelectedEmails(next);
    setActiveTab('users');
  };

  // Select Specific College Preset
  const handleSelectCollegePreset = (colId) => {
    setCollegeFilter(colId);
    const next = new Set();
    registeredUsers.forEach(u => {
      const uCol = String(u.college?._id || u.college || '');
      if (uCol === String(colId)) {
        next.add(u.email.toLowerCase().trim());
      }
    });
    setSelectedEmails(next);
    setActiveTab('users');
  };

  // Deselect All
  const handleDeselectAll = () => {
    setSelectedEmails(new Set());
  };

  // Dispatch Broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (selectedEmails.size === 0) {
      setBroadcastError('Please select at least 1 recipient to dispatch.');
      return;
    }

    const providerNames = {
      auto: 'Auto-Failover (ZeptoMail -> Resend)',
      resend: 'Resend API',
      zeptomail: 'Zoho ZeptoMail API'
    };

    const confirmMsg = `Are you sure you want to send this broadcast to ${selectedEmails.size} recipients via ${providerNames[provider]} in batches of 25?`;
    if (!confirm(confirmMsg)) return;

    try {
      setBroadcasting(true);
      setBroadcastResult(null);
      setBroadcastError('');

      const token = localStorage.getItem('token');
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          content,
          recipientEmails: Array.from(selectedEmails),
          mode: dispatchMode,
          provider,
          targetAudience: `Custom Selection (${selectedEmails.size} recipients)`,
          clientUrl: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Broadcast failed');

      setBroadcastResult(data);
      setSubject('');
      setContent('');
      fetchData();
    } catch (err) {
      setBroadcastError(err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/newsletter/subscribers/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Super Admin Multi-Provider Email &amp; Newsletter Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Broadcast &amp; Granular Audience Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter by academic year (1st–4th), college campus, or role, and dispatch batched emails via <strong>Resend</strong> or <strong>Zoho ZeptoMail</strong>.
          </p>
        </div>

        {/* Quota Tracker Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Emails Today</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{emailsSentToday}</p>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Subscribed</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalActive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: BROADCAST COMPOSER & PROVIDER SELECTOR (7 cols) */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setComposerView('compose')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      composerView === 'compose'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 size={13} /> Compose Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerView('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      composerView === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye size={13} /> 👁️ Live Email Preview
                  </button>
                </div>
              </div>

              <span className="text-xs px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black">
                {selectedEmails.size} Recipients Targeted
              </span>
            </div>

            {/* Results / Alerts */}
            {broadcastResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-bold">{broadcastResult.msg}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Delivered: {broadcastResult.deliveredCount} | Failed: {broadcastResult.failedCount} | Provider: {broadcastResult.provider}
                  </p>
                </div>
              </div>
            )}

            {broadcastError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{broadcastError}</span>
              </div>
            )}

            {composerView === 'preview' ? (
              <div className="space-y-6">
                <div className="p-1 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                  {/* Outer Email Frame */}
                  <div className="max-w-[560px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-slate-800 dark:text-slate-100 font-sans">
                    
                    {/* Brand Logo Header */}
                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/campxcode-logo.png" 
                          alt="CampXCode Logo" 
                          className="h-12 w-auto object-contain rounded-lg shadow-sm"
                          onError={(e) => {
                            // Fallback if local path not yet hydrated
                            e.target.src = 'https://www.campxcode.in/campxcode-logo.png';
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        Official Broadcast
                      </span>
                    </div>

                    {/* Email Subject */}
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-4 leading-snug">
                      {subject.trim() || 'Subject: [Important] Hackathon Notification & Guidelines'}
                    </h1>

                    {/* Email Body Content */}
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                      {content.trim() || 'Your broadcast body message, announcements, timelines, or submission details will appear here with rich formatting...'}
                    </div>

                    {/* CTA Button */}
                    <div className="mb-8">
                      <a 
                        href="https://campxcode.in" 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 text-center"
                      >
                        Open Hackathon Portal &rarr;
                      </a>
                    </div>

                    {/* Founder Executive Signature */}
                    <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-4">
                        <img 
                          src="/campxcode-logo.png" 
                          alt="CampXCode" 
                          className="h-10 w-10 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Abdul Barr</p>
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Founder &amp; Lead Architect • CampXCode</p>
                          
                          <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <a href="https://campxcode.in" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                              🌐 campxcode.in
                            </a>
                            <span>•</span>
                            <a href="https://abdulbarr.in" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                              💼 abdulbarr.in
                            </a>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <a href="mailto:hello@abdulbarr.in" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                              ✉️ hello@abdulbarr.in
                            </a>
                            <span>•</span>
                            <a href="tel:+917479934706" className="text-slate-700 dark:text-slate-300 font-bold hover:underline">
                              📞 +91 7479934706
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer disclaimer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                      You are receiving this official communication as a verified participant, team leader, or subscriber on CampXCode.<br/>
                      &copy; {new Date().getFullYear()} CampXCode Hackathon Portal. All rights reserved.
                    </div>

                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setComposerView('compose')}
                    className="flex-1 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
                  >
                    &larr; Back to Editor
                  </button>
                  <button
                    type="button"
                    onClick={handleBroadcast}
                    disabled={broadcasting || selectedEmails.size === 0 || !subject.trim() || !content.trim()}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                  >
                    <Send size={14} /> Send Broadcast to {selectedEmails.size} Recipients
                  </button>
                </div>
              </div>
            ) : (
<form onSubmit={handleBroadcast} className="space-y-5">
              
              {/* 1. Delivery Engine Provider Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-500" />
                  Select Email Delivery Engine (Provider)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  
                  <button
                    type="button"
                    onClick={() => setProvider('auto')}
                    className={`p-3 rounded-2xl border text-left font-bold transition-all ${
                      provider === 'auto'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🔄 Auto-Failover
                    <span className="block text-[10px] font-normal opacity-75 mt-0.5">ZeptoMail &rarr; Resend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('zeptomail')}
                    className={`p-3 rounded-2xl border text-left font-bold transition-all ${
                      provider === 'zeptomail'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛡️ Zoho ZeptoMail
                    <span className="block text-[10px] font-normal opacity-75 mt-0.5">10k Free credits</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('resend')}
                    className={`p-3 rounded-2xl border text-left font-bold transition-all ${
                      provider === 'resend'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⚡ Resend API
                    <span className="block text-[10px] font-normal opacity-75 mt-0.5">Standard Dispatch</span>
                  </button>

                </div>
              </div>

              {/* 2. Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. [Important] 3rd & 4th Year SIH 2025 Submission Window & Evaluation Guidelines"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 3. Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Content &amp; Instructions *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement, instructions, timeline, or meeting links for selected participants..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 4. Batch Dispatch Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-500" />
                  Dispatch Pacing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('immediate')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'immediate'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⚡ Immediate
                    <span className="block text-[10px] font-normal opacity-75">Chunks of 25</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchMode('staggered_3days')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'staggered_3days'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    📅 3-Day Window
                    <span className="block text-[10px] font-normal opacity-75">Staggered</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchMode('batch_50')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'batch_50'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛡️ Batch 50/day
                    <span className="block text-[10px] font-normal opacity-75">Free safe</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={broadcasting || selectedEmails.size === 0}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 p-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Dispatching in batches of 25 via {provider.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Dispatch Broadcast to {selectedEmails.size} Recipients</span>
                  </>
                )}
              </button>

            </form>
            )}

          </div>

          {/* Previous Campaigns Log */}
          {campaigns.length > 0 && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History size={16} /> Broadcast History ({campaigns.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {campaigns.map(c => (
                  <div key={c._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{c.subject}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(c.sentAt || c.createdAt).toLocaleDateString()} • {c.recipientCount} targeted • Delivered: {c.deliveredCount}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: GRANULAR AUDIENCE FILTER & SELECTOR (5 cols) */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-indigo-500 h-4 w-4" />
                Target Audience Selection
              </h2>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {selectedEmails.size} checked
              </span>
            </div>

            {/* Audience Pool Switcher */}
            <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                Registered Users ({registeredUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subscribers')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'subscribers' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                Subscribers ({subscribers.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, roll..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* AUDIENCE FILTERS (Only active on registered users tab) */}
            {activeTab === 'users' && (
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                
                {/* 1. Academic Year Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <GraduationCap size={12} /> Academic Year Filter:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectYearPreset(3)}
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        +3rd Year Only
                      </button>
                      <span className="text-slate-300 text-[9px]">•</span>
                      <button
                        type="button"
                        onClick={() => handleSelectYearPreset(4)}
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        +4th Year Only
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                    {[
                      { id: 'all', label: 'All' },
                      { id: '1', label: '1st Yr' },
                      { id: '2', label: '2nd Yr' },
                      { id: '3', label: '3rd Yr' },
                      { id: '4', label: '4th Yr' }
                    ].map(y => (
                      <button
                        key={y.id}
                        type="button"
                        onClick={() => setYearFilter(y.id)}
                        className={`py-1 rounded-lg transition text-center ${
                          yearFilter === y.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. College Institution Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <Building2 size={12} /> College Filter:
                    </span>
                  </div>
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="all">All Colleges (Worldwide)</option>
                    {colleges.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.shortName ? `(${c.shortName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Role / Sub-group Filter */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'All Roles' },
                    { id: 'leaders', label: 'Team Leaders' },
                    { id: 'verified', label: 'Verified Only' },
                    { id: 'students', label: 'Students' },
                    { id: 'spocs', label: 'SPOCs & Admins' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserRoleFilter(f.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                        userRoleFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Quick Bulk Selection Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleSelectFiltered}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <CheckSquare size={13} /> Select Filtered ({filteredPool.length})
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeselectFiltered}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Uncheck Filtered
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Square size={13} /> Clear All
                </button>
              </div>
            </div>

            {/* Recipient Checkbox List */}
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-indigo-500" />
                </div>
              ) : filteredPool.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No records match your selected year/college filters.
                </div>
              ) : (
                filteredPool.map((item) => {
                  const email = item.email.toLowerCase().trim();
                  const isChecked = selectedEmails.has(email);

                  return (
                    <div
                      key={item._id}
                      onClick={() => toggleEmail(email)}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-white shrink-0 ${
                          isChecked ? 'bg-indigo-600' : 'border border-slate-300 dark:border-slate-600'
                        }`}>
                          {isChecked && <CheckCircle2 size={12} />}
                        </div>

                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name || item.email}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.email}
                          </p>
                          {item.year && (
                            <span className="inline-block text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                              Year: {item.year} {item.course ? `(${item.course})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {activeTab === 'users' ? (
                          <>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                              {item.college?.shortName || item.college?.name || item.collegeName || 'CampX'}
                            </span>
                            {item.team && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold uppercase">
                                Leader
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.status === 'subscribed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                            }`}>
                              {item.status === 'subscribed' ? 'Active' : 'Pending'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubscriber(item._id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                              title="Delete subscriber"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
