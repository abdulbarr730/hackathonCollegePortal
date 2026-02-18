'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Pin, ArrowRight, Calendar, FileText } from 'lucide-react';

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/public/updates`);
      if (!res.ok) return;

      const data = await res.json();
      let items = data.items || [];

      items = items.filter(u => u.isPublic !== false);

      items.sort((a, b) =>
        new Date(b.publishedAt || b.createdAt || 0) -
        new Date(a.publishedAt || a.createdAt || 0)
      );

      setUpdates(items);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const pinned = updates.filter(u => u.pinned);
  const normal = updates.filter(u => !u.pinned);
  const ordered = [...pinned, ...normal];

  const formatDate = (d) =>
    new Date(d || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 md:px-12 py-16">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
            Hackathon Updates
          </h1>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && ordered.length === 0 && (
          <div className="text-center py-32 opacity-50">
            <Megaphone size={50} className="mx-auto mb-4 text-slate-400"/>
            <p className="text-lg text-slate-500">No notifications yet</p>
          </div>
        )}

        {/* LIST */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">

          {ordered.map((u) => {

            // decide what happens on click
            const targetUrl = u.url || u.fileUrl || null;
            const isClickable = !!targetUrl;

            const RowWrapper = ({ children }) =>
              isClickable ? (
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {children}
                </a>
              ) : children;

            return (
              <RowWrapper key={u._id}>
                <div
                  className={`flex items-center gap-4 py-4 px-3 rounded-xl transition group
                  ${isClickable 
                    ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    : ''}`}
                >

                  {/* DATE */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[120px]">
                    <Calendar size={14} />
                    {formatDate(u.publishedAt)}
                  </div>

                  {/* TITLE + SUMMARY */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {u.title}
                    </p>
                    {u.summary && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {u.summary}
                      </p>
                    )}
                  </div>

                  {/* PIN */}
                  {u.pinned && (
                    <div className="text-amber-500 flex items-center gap-1 text-xs font-bold">
                      <Pin size={14}/> PINNED
                    </div>
                  )}

                  {/* ICONS */}
                  <div className="flex items-center gap-2">

                    {u.fileUrl && (
                      <span className="p-2 rounded-lg">
                        <FileText size={16}/>
                      </span>
                    )}

                    {u.url && (
                      <span className="p-2 rounded-lg bg-indigo-600 text-white">
                        <ArrowRight size={16}/>
                      </span>
                    )}

                  </div>

                </div>
              </RowWrapper>
            );
          })}

        </div>
      </div>
    </div>
  );
}
