'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubmitIdeaModal({ isOpen, onClose, onIdeaCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('⚠️ Title and description are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5001/api/ideas', {
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
      onClose();

      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold">💡 Submit a New Idea</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {error && (
                <div className="rounded-md bg-red-500/20 text-red-300 px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm mb-1 text-slate-300">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:ring focus:ring-purple-500/30 outline-none transition"
                  placeholder="Give your idea a catchy title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1 text-slate-300">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows="5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:ring focus:ring-purple-500/30 outline-none transition"
                  placeholder="Explain your idea in detail..."
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm mb-1 text-slate-300">
                  Tags <span className="text-slate-500">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:ring focus:ring-purple-500/30 outline-none transition"
                  placeholder="e.g. AI, Blockchain, Healthcare"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-5 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit Idea'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
