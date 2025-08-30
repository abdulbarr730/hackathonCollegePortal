'use client';

import { useEffect, useState } from 'react';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  const loadIdeas = async () => {
    setLoadingData(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/ideas`, { credentials: 'include' });
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
      await fetch(`${API_BASE_URL}/api/admin/ideas/${id}`, { method: 'DELETE', credentials: 'include' });
      loadIdeas();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage All Ideas</h1>
      {error && <div className="rounded-md bg-red-500/20 p-3 text-red-200">{error}</div>}
      <div className="space-y-4">
        {loadingData ? <p>Loading ideas...</p> : ideas.length === 0 ? <p>No ideas found.</p> : (
          ideas.map((i) => (
            <div key={i._id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{i.title || '(no title)'}</h3>
                  <p className="text-sm text-slate-300">{i.author?.name || 'Unknown'}</p>
                </div>
                <button onClick={() => handleDelete(i._id)} className="rounded bg-rose-800 px-3 py-1 text-sm text-white hover:bg-rose-700">Delete</button>
              </div>
              {i.description && <p className="mt-3 text-sm text-slate-200">{i.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}