'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import UpdateModal from '../../components/UpdateModal';
import { motion } from 'framer-motion';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export default function AdminUpdatesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/updates`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
    else if (user && user.isAdmin) fetchUpdates();
  }, [user, isAuthenticated, authLoading, router]);

  const handleSave = async (formData, id) => {
    const isEditing = !!id;
    const url = isEditing
      ? `${API_BASE_URL}/api/admin/updates/${id}`
      : `${API_BASE_URL}/api/admin/updates`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save update.');
      setIsModalOpen(false);
      setEditingUpdate(null);
      fetchUpdates();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/updates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchUpdates();
    } catch (err) {
      alert('Failed to delete update.');
    }
  };

  const openCreateModal = () => {
    setEditingUpdate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (update) => {
    setEditingUpdate(update);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">📢 Manage Official Updates</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Create, edit, and manage official announcements shown on the portal.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:from-purple-500 hover:to-indigo-500 transition"
        >
          + Create Update
        </button>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-400">Loading updates...</p>
        ) : updates.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border border-slate-700 rounded-lg">
            <p>No updates yet. Start by creating one!</p>
          </div>
        ) : (
          updates.map((update, i) => (
            <motion.div
              key={update._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 shadow hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Status Tags */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        update.isPublic
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {update.isPublic ? 'Published' : 'Draft'}
                    </span>
                    {update.pinned && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300">
                        📌 Pinned
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <h2 className="text-lg font-semibold text-white">{update.title}</h2>
                  {update.summary && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{update.summary}</p>
                  )}

                  {/* URL */}
                  {update.url && (
                    <a
                      href={update.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 text-xs hover:underline mt-2 inline-block"
                    >
                      {update.url}
                    </a>
                  )}

                  {/* Date */}
                  <div className="text-xs text-slate-500 mt-2">
                    {update.createdAt
                      ? `Created: ${new Date(update.createdAt).toLocaleString()}`
                      : ''}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(update)}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(update._id)}
                    className="rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 transition"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Update Modal */}
      <UpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        update={editingUpdate}
      />
    </div>
  );
}
