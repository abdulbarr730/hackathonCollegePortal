'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import SubmitIdeaModal from '../components/SubmitIdeaModal'; // Assuming this component exists

export default function IdeasPage() {
  const { user, isAuthenticated } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ideas`, { credentials: 'include' });
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
      await fetch(`${API}/api/ideas/${ideaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchIdeas(); // Refresh list
    } catch (error) {
      alert('Failed to delete the idea.');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading Ideas...</div>;
  }

  return (
    <>
      <main className="container mx-auto p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold">Idea Board</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition-transform hover:scale-105"
          >
            + Submit an Idea
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.length > 0 ? (
            ideas.map(idea => (
              <Link href={`/ideas/${idea._id}`} key={idea._id} className="relative block rounded-lg border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-transform hover:scale-105 hover:border-purple-500">
                {user && user._id === idea.author._id && (
                  <button 
                    onClick={(e) => handleDelete(idea._id, e)}
                    className="absolute top-3 right-3 z-10 rounded-full bg-red-600/80 p-1.5 text-white transition-colors hover:bg-red-500"
                    aria-label="Delete idea"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                  </button>
                )}
                <h2 className="text-2xl font-bold text-purple-400">{idea.title}</h2>
                <p className="mt-2 text-sm text-gray-400">by {idea.author?.nameWithYear || idea.author?.name}</p>
                <p className="mt-4 text-gray-300 line-clamp-3">{idea.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {idea.tags.map(tag => (
                    <span key={tag} className="text-xs bg-slate-700 px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 px-4 rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
              <p className="text-slate-400">No ideas have been submitted yet. Be the first!</p>
            </div>
          )}
        </div>
      </main>
      <SubmitIdeaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onIdeaCreated={fetchIdeas}
      />
    </>
  );
}