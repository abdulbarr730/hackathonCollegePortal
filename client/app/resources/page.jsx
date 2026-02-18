'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  ExternalLink,
  FileDown,
  FileText,
  Filter,
  Library,
  Calendar,
  LayoutGrid,
  ArrowUpRight,
  User,
  Sparkles,
  Command,
  Eye,
  Download
} from 'lucide-react';
import useDebounce from '../hooks/useDebounce'; 

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(filters.q, 300);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch || '',
        category: filters.category || '',
        page: 1,
        limit: 50,
        status: 'approved',
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
  }, [debouncedSearch, filters.category]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/resources/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Skeleton Loader
  const ResourceSkeleton = () => (
    <div className="h-[380px] rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 animate-pulse shadow-sm">
      <div className="flex justify-between">
        <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
        <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-3 mt-4">
        <div className="h-7 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="mt-auto h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
  );

  return (
    // FIX: Removed 'overflow-x-hidden' which breaks sticky. 
    // Used 'overflow-clip' instead to contain the full-width layout safely.
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-clip selection:bg-indigo-500/30">
      
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <main className="relative z-10 w-full max-w-[2400px] mx-auto px-6 md:px-12 py-16 pb-32">
        
        {/* HEADER AREA */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm">
                <LayoutGrid size={22} />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400 uppercase">Knowledge Base</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-[1.1]">
              Resource <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 animate-gradient-x">Vault.</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl leading-relaxed">
              Unlimited access to community-curated tools, boilerplates, and documentation.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Link
              href="/resources/new"
              className="group flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300"
            >
              <Plus size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Contribute</span>
            </Link>
          </motion.div>
        </div>

        {/* --- STICKY GLASS FILTER BAR --- */}
        {/* sticky: sticks when you scroll past it. top-24: leaves space for your Navbar. */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky top-20 md:top-24 z-50 mb-12"
        >
          <div className="w-full p-2 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 flex flex-col md:flex-row gap-2 transition-all duration-300 hover:border-indigo-500/30">
            
            {/* Search Input */}
            <div className="relative flex-1 group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300">
                <Search size={22} />
              </div>
              <input
                type="text"
                placeholder="Search resources by keyword..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full h-14 pl-16 pr-4 bg-transparent rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400/80 outline-none focus:bg-slate-100/50 dark:focus:bg-slate-800/50 transition-all text-lg font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <Command size={10} /> K
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800 my-3" />

            {/* Category Filter */}
            <div className="relative min-w-[260px]">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full h-14 pl-6 pr-12 bg-transparent rounded-2xl text-slate-600 dark:text-slate-300 outline-none focus:bg-slate-100/50 dark:focus:bg-slate-800/50 cursor-pointer appearance-none text-base font-medium transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>
        </motion.div>

        {/* FULL WIDTH GRID */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => <ResourceSkeleton key={i} />)}
            </div>
          ) : resources.length === 0 ? (
            <div className="py-40 text-center flex flex-col items-center justify-center opacity-60">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Layers size={48} className="text-slate-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">No resources found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8 auto-rows-fr">
              <AnimatePresence>
                {resources.map((r, idx) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    // CARD: Safe Colors (White/Slate900)
                    className="group relative flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-black/60 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 ease-out overflow-hidden hover:-translate-y-2"
                  >
                    {/* Hover Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="p-7 flex flex-col h-full relative z-10">
                      
                      {/* Meta Header */}
                      <div className="flex items-start justify-between mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                          {r.category || 'General'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                          <Calendar size={12} />
                          <span>
                            {new Date(r.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                          {r.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 font-medium opacity-90">
                          {r.description || "No description provided for this resource."}
                        </p>
                      </div>

                      {/* Actions Area */}
                      <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        
                        {/* External Link */}
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-100 dark:hover:border-indigo-900/30 border border-transparent transition-all group/link"
                          >
                            <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover/link:text-indigo-700 dark:group-hover/link:text-indigo-300">
                               <ExternalLink size={16} /> Open Resource
                            </span>
                            <ArrowUpRight size={16} className="text-slate-400 group-hover/link:text-indigo-500 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                        )}

                        {/* File Download + View */}
                        {r.file?.url && (
                          <div className="flex flex-col gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                            
                            {/* File Info */}
                            <div className="flex items-center gap-3 w-full">
                              <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-indigo-500 shadow-sm">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                  {r.file.originalName}
                                </p>
                                <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
                                  {fmtSize(r.file.size)}
                                </p>
                              </div>
                            </div>

                            {/* Dual Buttons */}
                            <div className="flex gap-2 mt-1">
                              <a 
                                href={`/api/resources/${r._id}/view`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                              >
                                <Eye size={14} /> View
                              </a>
                              
                              <a 
                                href={`/api/resources/${r._id}/download`}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:shadow-lg hover:shadow-slate-500/20 hover:-translate-y-0.5 transition-all"
                              >
                                <Download size={14} /> Download
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Author Chip (PERMANENT) */}
                      <div className="mt-5 flex items-center gap-2.5">
                         <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {r.addedBy?.name ? r.addedBy.name[0] : 'U'}
                         </div>
                         <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                           Posted by <span className="text-slate-700 dark:text-slate-300 font-semibold">{r.addedBy?.name || 'User'}</span>
                         </span>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}