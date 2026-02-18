'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, MessageSquare, Send, Trash2, User } from 'lucide-react';
import Avatar from '../../components/Avatar';

export default function IdeaDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { id: ideaId } = params;

  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIdeaAndComments = async () => {
    if (!ideaId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ideas/${ideaId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not fetch idea details.');
      const data = await res.json();
      setIdea(data.idea);
      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeaAndComments();
  }, [ideaId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newComment }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || 'Failed to post comment.');
      }
      
      const postedComment = await res.json();
      // Optimistically add comment to UI
      setComments([...comments, postedComment]);
      setNewComment('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
        const res = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) throw new Error((await res.json()).msg || 'Failed to delete comment.');
        
        setComments(comments.filter(comment => comment._id !== commentId));
    } catch (err) {
        alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-bounce text-xl font-bold text-slate-400">Loading Idea...</div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
        <div className="text-red-500 font-bold text-xl">{error || "Idea not found"}</div>
        <button onClick={() => router.back()} className="text-indigo-500 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Idea Board
        </button>

        {/* IDEA CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
          
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
              {idea.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Avatar name={idea.author.name} src={idea.author.photoUrl} size={24} />
                <span className="font-medium text-slate-700 dark:text-slate-200">{idea.author.name}</span>
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(idea.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {idea.tags?.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Description Body */}
          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-500" />
            Discussion <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({comments.length})</span>
          </h2>

          {/* Comment Input */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex gap-4">
            <div className="shrink-0 hidden sm:block">
              <Avatar name={user?.name} src={user?.photoUrl} size={40} />
            </div>
            <form onSubmit={handleCommentSubmit} className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                rows={3}
                className="w-full bg-transparent border-0 p-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 resize-none text-base"
              />
              <div className="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={14} />
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment._id} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="shrink-0">
                  <Avatar name={comment.author.name} src={comment.author.photoUrl} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {comment.author.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.text}
                  </p>

                  {user && user._id === comment.author._id && (
                    <button 
                      onClick={() => handleDeleteComment(comment._id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm italic">No comments yet. Be the first to share your feedback!</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}