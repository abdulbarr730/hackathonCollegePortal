'use client';

import { useState, useEffect } from 'react';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = '' || 'http://localhost:5001';

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/public/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <main className="container mx-auto p-6 lg:p-10">
      <h1 className="mb-8 text-4xl font-bold text-white">📢 Official Updates</h1>

      {loading ? (
        <p className="text-slate-400">Loading updates...</p>
      ) : updates.length === 0 ? (
        <p className="text-slate-400">No updates available at the moment.</p>
      ) : (
        <div className="space-y-6">
          {updates.map((u) => (
            <div
              key={u._id}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow hover:shadow-lg transition"
            >
              {/* Status Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {u.isPublic ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/30 text-green-300">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-600 text-slate-300">
                      Draft
                    </span>
                  )}
                  {u.pinned && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/30 text-amber-300">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(u.publishedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Title + Summary */}
              <h2 className="text-2xl font-semibold text-white">{u.title}</h2>
              <p className="mt-2 text-slate-300">{u.summary || 'No description provided.'}</p>

              {/* Optional Link */}
              {u.url && (
                <a
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                >
                  Read More →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
