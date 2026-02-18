'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Tag, Lightbulb, Search, ArrowRight, MessageSquare } from 'lucide-react';
import SubmitIdeaModal from '../components/SubmitIdeaModal';
import Avatar from '../components/Avatar';

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function IdeasPage() {
  const { user, isAuthenticated } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas`, { credentials: 'include' });
      if (res.ok) {
        setIdeas(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdeas();
    }
  }, [isAuthenticated]);

  const handleDelete = async (ideaId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this idea?')) return;

    try {
      await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setIdeas(ideas.filter(i => i._id !== ideaId));
    } catch (error) {
      alert('Failed to delete the idea.');
    }
  };

  // Filter ideas based on search
  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                <Lightbulb size={28} />
              </span>
              Idea Board
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl">
              Share your innovative concepts, find collaborators, and get feedback from the community.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Submit New Idea
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search ideas by title or tag..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredIdeas.length > 0 ? (
                filteredIdeas.map((idea, index) => (
                  <motion.div
                    key={idea._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      href={`/ideas/${idea._id}`} 
                      className="group relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300"
                    >
                      {/* Hover Top Border */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

                      {/* Header: Author & Date */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={idea.author?.name} src={idea.author?.photoUrl} size={36} />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {idea.author?.nameWithYear || idea.author?.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(idea.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Delete Button (Only for Author) */}
                        {user && user._id === idea.author._id && (
                          <button 
                            onClick={(e) => handleDelete(idea._id, e)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Idea"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {idea.title}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {idea.description}
                        </p>
                      </div>

                      {/* Footer: Tags & CTA */}
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {idea.tags && idea.tags.length > 0 ? (
                            idea.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <Tag size={10} /> {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No tags</span>
                          )}
                          {idea.tags && idea.tags.length > 2 && (
                            <span className="text-xs text-slate-400 flex items-center">
                              +{idea.tags.length - 2}
                            </span>
                          )}
                        </div>

                        {/* VIEW DISCUSSION CTA (Visible on Mobile, Hover on Desktop) */}
                        <span className="text-xs font-bold text-indigo-500 flex items-center gap-1 
                           opacity-100 md:opacity-0 group-hover:opacity-100 
                           translate-x-0 md:-translate-x-2 group-hover:translate-x-0 
                           transition-all duration-300 whitespace-nowrap ml-2">
                           View Discussion <ArrowRight size={12} />
                        </span>

                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Lightbulb size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No ideas found</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                    {searchTerm ? "Try adjusting your search terms." : "Be the first to share a brilliant idea with the community!"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Start Brainstorming &rarr;
                    </button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <SubmitIdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onIdeaCreated={fetchIdeas}
      />
    </div>
  );
}