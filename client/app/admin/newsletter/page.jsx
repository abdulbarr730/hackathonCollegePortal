'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
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
  Filter
} from 'lucide-react';

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Data State
  const [subscribers, setSubscribers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [emailsSentToday, setEmailsSentToday] = useState(0);
  const [emailsSentThisMonth, setEmailsSentThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'subscribers'
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Recipient Selection State
  const [selectedEmails, setSelectedEmails] = useState(new Set());

  // Broadcast Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [dispatchMode, setDispatchMode] = useState('immediate');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [broadcastError, setBroadcastError] = useState('');

  // Super Admin Check
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  useEffect(() => {
    if (user && !isSuperAdminUser) {
      router.push('/admin/dashboard');
    }
  }, [user, isSuperAdminUser, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('q', search);

      const res = await fetch(`/api/newsletter/subscribers?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.items || []);
        setRegisteredUsers(data.registeredUsers || []);
        setTotalActive(data.totalActive || 0);
        setTotalPending(data.totalPending || 0);
        setEmailsSentToday(data.emailsSentToday || 0);
        setEmailsSentThisMonth(data.emailsSentThisMonth || 0);
        setCampaigns(data.campaigns || []);
        setRecentLogs(data.recentLogs || []);

        // Default: select all registered users on initial load
        if (selectedEmails.size === 0 && data.registeredUsers?.length > 0) {
          const allEmails = new Set(data.registeredUsers.map(u => u.email.toLowerCase()));
          setSelectedEmails(allEmails);
        }
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

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

  // Select All / Deselect All for current view
  const currentPool = activeTab === 'users' ? registeredUsers : subscribers;
  const filteredPool = currentPool.filter(item => {
    if (activeTab === 'users') {
      if (userRoleFilter === 'leaders') return !!item.team;
      if (userRoleFilter === 'verified') return item.isVerified;
      if (userRoleFilter === 'students') return item.role === 'student';
    }
    return true;
  });

  const handleSelectAll = () => {
    const next = new Set(selectedEmails);
    filteredPool.forEach(item => next.add(item.email.toLowerCase().trim()));
    setSelectedEmails(next);
  };

  const handleDeselectAll = () => {
    const next = new Set(selectedEmails);
    filteredPool.forEach(item => next.delete(item.email.toLowerCase().trim()));
    setSelectedEmails(next);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    if (selectedEmails.size === 0) {
      alert('Please select at least one recipient.');
      return;
    }

    setBroadcastError('');
    setBroadcastResult(null);
    setBroadcasting(true);

    try {
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
          targetAudience: `Custom Selection (${selectedEmails.size} recipients)`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Broadcast failed');

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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Super Admin Email & Newsletter Console
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Broadcast & Recipient Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage who receives emails, dispatch announcements via Resend, and track delivery quota.
          </p>
        </div>

        {/* Free-Tier Resend Quota Tracker Widget */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Resend Today</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{emailsSentToday} <span className="text-xs font-normal text-slate-400">/ 100 free</span></p>
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
        
        {/* LEFT COLUMN: BROADCAST COMPOSER (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
                Compose Official Broadcast
              </h2>
              <span className="text-xs px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black">
                {selectedEmails.size} Recipients Targeted
              </span>
            </div>

            {broadcastResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-bold">{broadcastResult.msg}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Delivered: {broadcastResult.deliveredCount} | Failed: {broadcastResult.failedCount}</p>
                </div>
              </div>
            )}

            {broadcastError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{broadcastError}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. [Important] SIH 2025 Internal Submission & Evaluation Window"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Content & Instructions
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement, timetable, or reminder for participants..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dispatch Strategy Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Dispatch Strategy / Batching
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDispatchMode('immediate')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'immediate'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⚡ Immediate
                    <span className="block text-[10px] font-normal opacity-75">Send to all now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchMode('staggered_3days')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'staggered_3days'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    📅 3-Day Window
                    <span className="block text-[10px] font-normal opacity-75">Staggered dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchMode('batch_50')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      dispatchMode === 'batch_50'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛡️ Batch 50/day
                    <span className="block text-[10px] font-normal opacity-75">Free tier safe</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={broadcasting || selectedEmails.size === 0}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {broadcasting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Broadcasting via Resend...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Send Broadcast to {selectedEmails.size} Selected Recipients</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Broadcast History */}
          {campaigns.length > 0 && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={16} className="text-indigo-500" />
                Recent Broadcast Dispatches
              </h3>
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div key={camp._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{camp.subject}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{camp.content}</p>
                      <span className="inline-block text-[10px] text-slate-400 font-semibold">{camp.targetAudience}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold">
                        {camp.deliveredCount || camp.recipientCount} Sent
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(camp.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: GRANULAR RECIPIENT PICKER (5 cols) */}
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

            {/* Search & Bulk Select Controls */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {activeTab === 'users' && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Users' },
                    { id: 'leaders', label: 'Team Leaders' },
                    { id: 'verified', label: 'Verified Only' },
                    { id: 'students', label: 'Students' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserRoleFilter(f.id)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                        userRoleFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Master Select / Deselect Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <CheckSquare size={13} /> Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1"
                >
                  <Square size={13} /> Deselect All
                </button>
              </div>
            </div>

            {/* Recipient Checkbox List */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-indigo-500" />
                </div>
              ) : filteredPool.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No records match your filter.
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
                          {item.termsAcceptedAt && (
                            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                              ✓ Terms: {new Date(item.termsAcceptedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {activeTab === 'users' ? (
                          <>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                              {item.collegeName ? 'BBDIT' : item.role}
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
