'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Plus, Loader2, ExternalLink, FileDown } from 'lucide-react';

const API_BASE_URL = '';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [loading, setLoading] = useState(true);

  // Fetch resources
  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: filters.q || '',
        category: filters.category || '',
        page: 1,
        limit: 20,
      });

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/resources/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [filters]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white px-6 py-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.3),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.3),transparent_40%)] pointer-events-none"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-14"
        >
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Resource Hub
            </h1>
            <p className="mt-3 text-slate-400 text-lg max-w-2xl">
              A vibrant collection of tools, guides, and materials — discover,
              save, and share knowledge.
            </p>
          </div>

          <Link
            href="/resources/new"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Resource
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-12"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search resources..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Resource List */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading resources...
          </div>
        ) : resources.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-slate-400 text-lg"
          >
            No resources found.
          </motion.p>
        ) : (
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
          >
            {resources.map((r, idx) => (
              <motion.div
                key={r._id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="mb-6 break-inside-avoid rounded-2xl shadow-lg border border-slate-800 bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-950/90 hover:from-indigo-900/80 hover:to-cyan-900/80 transition-all duration-500 overflow-hidden"
              >
                <div className="p-6">
                  {/* Title */}
                  <h2 className="text-xl font-bold text-indigo-300 mb-3 group-hover:text-cyan-300 transition-colors">
                    {r.title}
                  </h2>

                  {/* Description */}
                  {r.description && (
                    <p className="text-sm text-slate-300 mb-4">
                      {r.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {/* URL */}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <ExternalLink className="w-4 h-4" /> Visit Resource
                      </a>
                    )}

                    {/* File */}
                    {r.file?.path && (
                      <a
                        href={`/api${r.file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition"
                      >
                        <FileDown className="w-4 h-4" /> Download File
                      </a>
                    )}
                    {r.submittedBy?.name && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                        <User className="w-4 h-4" />
                        <span>Submitted by {r.submittedBy.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
