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
  ShieldCheck
} from 'lucide-react';

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Broadcast Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [broadcastError, setBroadcastError] = useState('');

  // Super Admin Check
  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.isSuperAdmin) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/newsletter/subscribers?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.items || []);
        setTotalActive(data.totalActive || 0);
        setTotalSubscribers(data.totalSubscribers || 0);
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [search, statusFilter]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    setBroadcastError('');
    setBroadcastSuccess('');
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
        body: JSON.stringify({ subject, content })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Broadcast failed');

      setBroadcastSuccess(data.msg || `Newsletter sent to ${totalActive} subscribers!`);
      setSubject('');
      setContent('');
      fetchSubscribers();
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
      if (res.ok) {
        fetchSubscribers();
      }
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
            <ShieldCheck size={14} /> Super Admin Control
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Newsletter & Broadcast Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch announcements to subscribed students, faculty coordinators, and stakeholders.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Active Audience</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{totalActive}</p>
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
                Compose Broadcast
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold">
                Target: {totalActive} Subscribers
              </span>
            </div>

            {broadcastSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{broadcastSuccess}</span>
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
                  Newsletter Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. [Important] SIH Round 1 Internal Evaluation Schedule"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Broadcast Content / Announcement
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft your official newsletter, milestone update, or guideline bulletin here..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting || totalActive === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {broadcasting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Broadcasting Newsletter...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Send Official Broadcast to {totalActive} Subscribers</span>
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
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold">
                        {camp.recipientCount} Recipients
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

        {/* RIGHT COLUMN: SUBSCRIBER ROSTER (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="text-indigo-500 h-4 w-4" />
                Subscriber Roster
              </h2>
              <span className="text-xs font-bold text-slate-400">{subscribers.length} listed</span>
            </div>

            {/* Filter & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter subscribers by email..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                {['all', 'subscribed', 'unsubscribed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-indigo-500" />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No subscribers found.
                </div>
              ) : (
                subscribers.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sub.email}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className={`font-semibold ${sub.status === 'subscribed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {sub.status}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSubscriber(sub._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Remove subscriber"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
