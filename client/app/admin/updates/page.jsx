'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import UpdateModal from '../../components/UpdateModal';
import { motion } from 'framer-motion';
import { Hash, Radio, RefreshCw } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">📢 Official Updates</h1>
          <p className="text-slate-400 mt-1 text-sm">Post news. Use "Retag" to fix old untagged posts.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-xl border border-slate-700">
           <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Radio size={14} className={activeHackathon ? "text-green-500 animate-pulse" : "text-red-500"} />
              Active:
           </div>
           <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${activeHackathon ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
             {activeHackathon ? activeHackathon.name : 'None'}
           </span>

           {/* RETAG BUTTON */}
           <button 
             onClick={handleRetag} 
             disabled={retagging || !activeHackathon} 
             className="ml-4 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition disabled:opacity-50"
             title="Tag all old updates to Current Event"
           >
             <RefreshCw size={18} className={retagging ? "animate-spin" : ""} />
           </button>

           <button 
             onClick={() => { setEditingUpdate(null); setIsModalOpen(true); }}
             className="ml-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:from-purple-500 hover:to-indigo-500 transition"
           >
             + Post Update
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-slate-400">Loading...</p> : updates.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border border-slate-700 rounded-lg"><p>No updates found.</p></div>
        ) : (
          updates.map((update, i) => (
            <motion.div
              key={update._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 shadow hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${update.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                      {update.isPublic ? 'Published' : 'Draft'}
                    </span>
                    {update.pinned && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300">📌 Pinned</span>}
                    
                    {update.hackathon ? (
                       <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                         <Hash size={10} /> {update.hackathon.shortName || update.hackathon.name}
                       </span>
                    ) : (
                       <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                         Global / Untagged
                       </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-white">{update.title}</h2>
                  {update.summary && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{update.summary}</p>}
                  
                  {/* File Indicator */}
                  {update.fileUrl && (
                    <div className="mt-2 text-xs text-indigo-300 flex items-center gap-1">
                      📄 Attachment Included
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 mt-2">Created: {new Date(update.createdAt).toLocaleString()}</div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => { setEditingUpdate(update); setIsModalOpen(true); }} className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 transition">✏️ Edit</button>
                  <button onClick={() => handleDelete(update._id)} className="rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 transition">🗑 Delete</button>
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