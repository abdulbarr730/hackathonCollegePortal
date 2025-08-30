'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Avatar from '../../components/Avatar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function IdeaDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const { id: ideaId } = params;

  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIdeaAndComments = async () => {
      if (!ideaId) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/ideas/${ideaId}`, { credentials: 'include' });
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
    fetchIdeaAndComments();
  }, [ideaId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ideas/${ideaId}/comments`, {
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
      setComments([...comments, postedComment]); // Add new comment to the list instantly
      setNewComment(''); // Clear the input field
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading Idea...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-400">Error: {error}</div>;
  }
  if (!idea) {
    return <div className="text-center p-8">Idea not found.</div>;
  }

  return (
    <div className="w-full">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Link href="/ideas" className="text-purple-400 hover:underline mb-8 inline-block">
          &larr; Back to Idea Board
        </Link>
        
        {/* --- Idea Details --- */}
        <div className="rounded-lg bg-slate-800/50 p-8 border border-slate-700">
          <h1 className="text-4xl font-bold text-purple-400">{idea.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-md text-gray-400">
            <Avatar name={idea.author.name} src={idea.author.photoUrl} size={24} />
            <span>by <span className="font-semibold">{idea.author.nameWithYear || idea.author.name}</span></span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {idea.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-700 px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <p className="mt-6 text-slate-300 whitespace-pre-wrap">{idea.description}</p>
        </div>

        {/* --- Comments Section --- */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Comments ({comments.length})</h2>
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment._id} className="flex items-start gap-4">
                <Avatar name={comment.author.name} src={comment.author.photoUrl} size={40} />
                <div className="flex-1 rounded-lg bg-slate-800/30 p-4 border border-slate-700/50">
                  <p className="text-sm font-semibold text-white">{comment.author.nameWithYear || comment.author.name}</p>
                  <p className="text-slate-300 mt-1">{comment.text}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
                <p className="text-slate-400">Be the first to comment on this idea.</p>
            )}
          </div>
        </div>

        {/* --- Add Comment Form --- */}
        <div className="mt-8 border-t border-slate-700 pt-8">
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-4">
                <Avatar name={user?.name} src={user?.photoUrl} size={40} />
                <div className="flex-1">
                    <textarea
                        id="newComment"
                        rows="3"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full rounded-md border-slate-700 bg-slate-800 p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500"
                        placeholder="Share your thoughts..."
                    ></textarea>
                    <button type="submit" className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50" disabled={!newComment.trim()}>
                        Post Comment
                    </button>
                </div>
            </form>
        </div>
      </main>
    </div>
  );
}