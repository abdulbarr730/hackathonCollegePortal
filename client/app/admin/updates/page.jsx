'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import UpdateModal from '../../components/UpdateModal';
import { motion } from 'framer-motion';
import { 
  Hash, Radio, RefreshCw, Trash2, Mail, CheckCircle2, ShieldCheck, 
  Building2, Sparkles, ExternalLink, FileDown, Plus, Clock, Edit 
} from 'lucide-react';

export default function AdminUpdatesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  const router = useRouter();

  const [updates, setUpdates] = useState([]);
  const [activeHackathon, setActiveHackathon] = useState(null);
  const [allHackathons, setAllHackathons] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [retagging, setRetagging] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resUpdates = await fetch(`/api/admin/updates`, { credentials: 'include' });
      const dataUpdates = await resUpdates.json();
      
      const resActive = await fetch(`/api/hackathon/active`, { credentials: 'include' });
      const dataActive = await resActive.json();

      const resAll = await fetch(`/api/hackathon/all`, { credentials: 'include' }); 
      const dataAll = await resAll.json();

      if (resUpdates.ok) setUpdates(dataUpdates.items || []);
      if (resActive.ok && dataActive._id) setActiveHackathon(dataActive);
      if (resAll.ok) setAllHackathons(Array.isArray(dataAll) ? dataAll : []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/colleges?status=approved', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setColleges(data.items || []);
    } catch (err) {
      console.error('Failed to fetch colleges', err);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
    else if (user && user.isAdmin) {
      fetchData();
      if (isSuperAdminUser) fetchColleges();
    }
  }, [user, isAuthenticated, authLoading, router, isSuperAdminUser]);

  const handleRetag = async () => {
    if (!activeHackathon) return alert("No active hackathon to tag against!");
    if (!confirm(`Tag ALL untagged updates to '${activeHackathon.name}'?`)) return;
    
    setRetagging(true);
    try {
      const res = await fetch('/api/admin/updates/action/retag-all', { 
        method: 'PUT', 
        credentials: 'include' 
      });
      const data = await res.json();
      alert(data.msg || 'Retagged successfully');
      fetchData();
    } catch (err) {
      alert("Retagging failed.");
    } finally {
      setRetagging(false);
    }
  };

  const handleSave = async (formData, id) => {
    const isEditing = !!id;
    const url = isEditing ? `/api/admin/updates/${id}` : `/api/admin/updates`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      hackathon: formData.hackathon || activeHackathon?._id || null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || 'Failed to save update.');
      }
      
      setIsModalOpen(false);
      setEditingUpdate(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this update?')) return;
    try {
      const res = await fetch(`/api/admin/updates/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || 'Failed to delete');
      }
      fetchData();
    } catch (err) { 
      alert(err.message); 
    }
  };

  const handleCleanupScraped = async () => {
    if (!confirm('Delete all scraped SIH website notifications? Manual announcements will stay intact.')) return;
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/updates/purge/scraped', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Cleanup failed');
      alert(data.msg);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const handleSyncSIH = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/updates/sync-sih', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Sync failed');
      alert(data.msg);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDispatchEmail = async (id, title) => {
    if (!confirm(`Are you sure you want to broadcast email notifications for "${title}" to all registered students and team leaders?`)) return;
    setDispatchingId(id);
    try {
      const res = await fetch(`/api/admin/updates/${id}/dispatch-email`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Dispatch failed');
      alert(data.msg || 'Notification email successfully dispatched!');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Automated SIH Intelligence &amp; Multi-Campus Updates
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Official Updates &amp; Notices</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            High-precision 1-hour SIH scraping, verified college announcements, and instant student notification broadcasting.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          
          {isSuperAdminUser && (
            <>
              <button
                onClick={handleSyncSIH}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                title="Run precision SIH scraper now"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                {syncing ? 'Scraping SIH...' : 'Sync SIH Live'}
              </button>

              <button
                onClick={handleCleanupScraped}
                disabled={cleaning}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-4 py-3 text-xs font-bold hover:bg-rose-600 hover:text-white transition disabled:opacity-50"
                title="Clean scraped SIH circulars"
              >
                {cleaning ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Purge Scraped
              </button>
            </>
          )}

          <button 
            onClick={() => { setEditingUpdate(null); setIsModalOpen(true); }}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition flex items-center gap-1.5"
          >
            <Plus size={15} /> + Post Notice
          </button>
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-400 p-8 text-center">Loading updates...</p>
        ) : updates.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 space-y-2">
            <Sparkles className="mx-auto text-indigo-500 opacity-40" size={32} />
            <p className="font-bold text-slate-700 dark:text-slate-300">No updates or circulars posted yet.</p>
            <p className="text-xs text-slate-500">Click "Sync SIH Live" to scrape official Smart India Hackathon guidelines.</p>
          </div>
        ) : (
          updates.map((update, i) => (
            <motion.div
              key={update._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                <div className="flex-1 min-w-0 space-y-2">
                  
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${
                      update.source === 'sih_official'
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {update.source === 'sih_official' ? '🏛️ Official SIH Circular' : '📢 College Notice'}
                    </span>

                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Building2 size={11} /> {update.college?.shortName || update.college?.name || 'All Colleges (Global)'}
                    </span>

                    {update.pinned && (
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        📌 Pinned
                      </span>
                    )}

                    {update.emailDispatched ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Email Broadcasted
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Clock size={11} /> Staged for Email
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {update.title}
                  </h2>

                  {update.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {update.summary}
                    </p>
                  )}

                  {/* Actions & Links */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                    {update.url && (
                      <a 
                        href={update.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink size={13} /> View Official Document / Link &rarr;
                      </a>
                    )}
                    
                    <span className="text-slate-400 font-mono text-[11px]">
                      Published: {new Date(update.publishedAt || update.createdAt).toLocaleString()}
                    </span>
                  </div>

                </div>

                {/* Right Action Column */}
                <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0">
                  
                  {/* Broadcast Email Button (Super Admin Only) */}
                  {isSuperAdminUser && (
                    !update.emailDispatched ? (
                      <button
                        onClick={() => handleDispatchEmail(update._id, update.title)}
                        disabled={dispatchingId === update._id}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Mail size={13} />
                        {dispatchingId === update._id ? 'Dispatching...' : '📧 Blast Email'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDispatchEmail(update._id, update.title)}
                        disabled={dispatchingId === update._id}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                        title="Re-broadcast email notification"
                      >
                        <RefreshCw size={11} /> Re-send Email
                      </button>
                    )
                  )}

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingUpdate(update); setIsModalOpen(true); }} 
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
                      title="Edit Notice"
                    >
                      <Edit size={15} />
                    </button>

                    <button 
                      onClick={() => handleDelete(update._id)} 
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                      title="Delete Notice"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          ))
        )}
      </div>

      <UpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        update={editingUpdate}
        hackathons={allHackathons} 
      />
    </div>
  );
}
