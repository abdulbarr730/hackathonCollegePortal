'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import UpdateModal from '../../components/UpdateModal';
import { motion } from 'framer-motion';
import { Hash, Radio, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminUpdatesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [updates, setUpdates] = useState([]);
  const [activeHackathon, setActiveHackathon] = useState(null);
  const [allHackathons, setAllHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [retagging, setRetagging] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resUpdates = await fetch(`/api/admin/updates`, { credentials: 'include' });
      const dataUpdates = await resUpdates.json();
      
      const resActive = await fetch(`/api/hackathon/active`);
      const dataActive = await resActive.json();

      const resAll = await fetch(`/api/hackathon/all`); 
      const dataAll = await resAll.json();

      if (resUpdates.ok) setUpdates(dataUpdates.items || []);
      if (resActive.ok && dataActive._id) setActiveHackathon(dataActive);
      if (resAll.ok) setAllHackathons(dataAll);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
    else if (user && user.isAdmin) fetchData();
  }, [user, isAuthenticated, authLoading, router]);

  // --- RETAG LOGIC ---
  const handleRetag = async () => {
    if (!activeHackathon) return alert("No active hackathon to tag against!");
    if (!confirm(`Tag ALL untagged updates to '${activeHackathon.name}'?`)) return;
    
    setRetagging(true);
    try {
      const res = await fetch('/api/admin/updates/retag-all', { 
        method: 'POST', 
        credentials: 'include' 
      });
      const data = await res.json();
      alert(data.msg);
      fetchData(); // Refresh to show new tags
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
      // Default to active hackathon if not manually selected
      hackathon: formData.hackathon || activeHackathon?._id || null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save.');
      
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
      await fetch(`/api/admin/updates/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchData();
    } catch (err) { alert('Failed to delete.'); }
  };

  const handleCleanupScraped = async () => {
    if (!confirm('Delete all scraped SIH website notifications? Manual admin updates will stay.')) return;
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/updates/scraped', {
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

  const [syncing, setSyncing] = useState(false);

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Official Updates & Notices</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Automated SIH scraping, verified announcements, and instant student notifications.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Radio size={14} className={activeHackathon ? "text-emerald-500 animate-pulse" : "text-amber-500"} />
              Active:
           </div>
           <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${activeHackathon ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
             {activeHackathon ? activeHackathon.name : 'None (Global)'}
           </span>

           {/* SYNC SIH OFFICIAL PORTAL BUTTON */}
           <button
             onClick={handleSyncSIH}
             disabled={syncing}
             className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-sm disabled:opacity-50"
             title="Run live SIH auto-scraper now and notify students"
           >
             <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
             {syncing ? 'Scraping SIH...' : 'Sync SIH Live'}
           </button>

           {/* RETAG BUTTON */}
           <button 
             onClick={handleRetag} 
             disabled={retagging || !activeHackathon} 
             className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
             title="Tag all untagged updates to Current Event"
           >
             <RefreshCw size={16} className={retagging ? "animate-spin" : ""} />
           </button>

           <button
             onClick={handleCleanupScraped}
             disabled={cleaning}
             className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-500 shadow-sm disabled:opacity-50"
             title="Delete scraped SIH website notifications"
           >
             {cleaning ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
             Clean Scraped
           </button>

           <button 
             onClick={() => { setEditingUpdate(null); setIsModalOpen(true); }}
             className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition"
           >
             + Post Update
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-400">Loading updates...</p>
        ) : updates.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900"><p>No updates posted yet.</p></div>
        ) : (
          updates.map((update, i) => (
            <motion.div
              key={update._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${update.isPublic ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                      {update.isPublic ? 'Published' : 'Draft'}
                    </span>
                    {update.pinned && <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Pinned</span>}
                    
                    {update.hackathon ? (
                       <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                         <Hash size={10} /> {update.hackathon.shortName || update.hackathon.name}
                       </span>
                    ) : (
                       <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                         Global / Untagged
                       </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{update.title}</h2>
                  {update.summary && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{update.summary}</p>}
                  
                  {/* File Indicator */}
                  {update.fileUrl && (
                    <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      Attachment Included
                    </div>
                  )}
                  
                  <div className="text-[11px] text-slate-400 mt-2 font-medium">Created: {new Date(update.createdAt).toLocaleString()}</div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button onClick={() => { setEditingUpdate(update); setIsModalOpen(true); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Edit</button>
                  <button onClick={() => handleDelete(update._id)} className="rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 px-3.5 py-1.5 text-xs font-bold transition">Delete</button>
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
