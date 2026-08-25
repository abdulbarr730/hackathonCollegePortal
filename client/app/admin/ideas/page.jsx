'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Trash2, Loader2, User } from 'lucide-react';

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  const loadIdeas = async () => {
    setLoadingData(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/ideas`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load ideas');
      const data = await res.json();
      setIdeas(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this idea?')) return;
    try {
      await fetch(`/api/admin/ideas/${id}`, { method: 'DELETE', credentials: 'include' });
      loadIdeas();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Idea Repository</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review student hackathon project proposals and collaboration ideas.</p>
      </div>

      {error && <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-300">{error}</div>}
      
      <div className="space-y-4">
        {loadingData ? (
          <div className="text-center py-12 text-slate-400">
            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={28} />
            Loading ideas...
          </div>
        ) : ideas.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
            <Lightbulb size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            No ideas submitted yet.
          </div>
        ) : (
          ideas.map((i) => (
            <div key={i._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{i.title || '(Untitled Idea)'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <User size={13} /> {i.author?.name || 'Anonymous'} {i.author?.email ? `(${i.author.email})` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(i._id)}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/40 px-3.5 py-1.5 text-xs font-bold transition"
                >
                  <Trash2 size={14} /> Delete Idea
                </button>
              </div>
              {i.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {i.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}