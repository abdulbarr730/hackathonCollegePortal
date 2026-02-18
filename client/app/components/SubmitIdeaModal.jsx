'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Loader2, Tag } from 'lucide-react';

export default function SubmitIdeaModal({ isOpen, onClose, onIdeaCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- SCROLL LOCK LOGIC ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || 'Failed to submit idea.');
      }

      await res.json();
      if (onIdeaCreated) onIdeaCreated();
      
      // Reset and Close
      setTitle('');
      setDescription('');
      setTags('');
      onClose();

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[90vh] flex flex-col overflow-hidden"
          >
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Lightbulb size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit New Idea</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Share your innovation with the community</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE FORM */}
            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form id="ideaForm" onSubmit={handleSubmit} className="space-y-5">
                
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    placeholder="e.g. AI-Powered Waste Management"
                    required
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="6"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                    placeholder="Explain the problem, your solution, and the tech stack you plan to use..."
                    required
                  />
                </div>

                {/* Tags Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tags <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">(Comma separated)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-slate-400">
                      <Tag size={16} />
                    </div>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      placeholder="Blockchain, IoT, React, HealthTech"
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="ideaForm"
                disabled={loading}
                className="rounded-lg px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Posting...
                  </>
                ) : 'Submit Idea'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}