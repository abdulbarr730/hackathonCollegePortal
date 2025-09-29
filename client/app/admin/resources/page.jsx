'use client';
import { useState, useEffect } from 'react';
import { FileDown, Eye, Edit, Trash2, Save, X, ExternalLink } from 'lucide-react';

const TABS = ['pending', 'approved', 'rejected'];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // For edit
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // For bulk delete
  const [selected, setSelected] = useState([]);

  // fetch resources by status
  const fetchResources = async (currentStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/resources?status=${currentStatus}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setResources(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch resources", error);
    } finally {
      setLoading(false);
    }
  };

  // fetch counts separately
  const fetchCounts = async () => {
    try {
      const res = await fetch(`/api/admin/resources/counts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCounts(data || { pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch counts", error);
    }
  };

  useEffect(() => {
    fetchResources(status);
    fetchCounts();
    setSelected([]); // clear selection when switching tabs
  }, [status]);

  const refreshData = () => {
    fetchResources(status);
    fetchCounts();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const endpoint =
        newStatus === "approved"
          ? `/api/admin/resources/${id}/approve`
          : `/api/admin/resources/${id}/reject`;

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newStatus === "rejected" ? { reason: "Rejected by admin" } : {}),
      });

      refreshData();
    } catch (error) {
      alert(`Failed to ${newStatus} resource.`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resource permanently?")) return;
    try {
      await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      refreshData();
    } catch (error) {
      alert("Failed to delete resource.");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return alert("No resources selected.");
    if (!confirm(`Delete ${selected.length} resources permanently?`)) return;

    try {
      await fetch(`/api/admin/resources/bulk-delete`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ ids: selected }),
      });
      refreshData();
      setSelected([]);
    } catch (error) {
      alert("Failed bulk delete.");
    }
  };

  const startEdit = (res) => {
    setEditingId(res._id);
    setEditTitle(res.title);
    setEditDescription(res.description);
  };

  const saveEdit = async (id) => {
    try {
      await fetch(`/api/admin/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      setEditingId(null);
      refreshData();
    } catch (error) {
      alert("Failed to update resource.");
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Moderate Resources</h1>

        {/* Tabs */}
        <div className="flex gap-2 rounded-lg bg-slate-900/80 p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                status === tab
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
            </button>
          ))}
        </div>

        {/* Bulk Delete + Select All */}
        <div className="flex items-center gap-4">
          {resources.length > 0 && (
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={selected.length === resources.length}
                onChange={(e) =>
                  setSelected(e.target.checked ? resources.map(r => r._id) : [])
                }
                className="accent-purple-600"
              />
              Select All
            </label>
          )}

          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 shadow"
            >
              Delete Selected ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Resource List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-400">Loading resources...</p>
        ) : resources.length === 0 ? (
          <p className="text-slate-400">No resources found in this category.</p>
        ) : (
          resources.map(resource => (
            <div
              key={resource._id}
              className={`rounded-xl border ${
                selected.includes(resource._id) ? "border-red-500" : "border-slate-700"
              } bg-slate-800 p-5 shadow hover:shadow-xl transition`}
            >
              {/* Select Checkbox */}
              <input
                type="checkbox"
                checked={selected.includes(resource._id)}
                onChange={() => toggleSelect(resource._id)}
                className="mb-2 accent-purple-600"
              />

              {editingId === resource._id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded bg-slate-700 text-white px-2 py-1 mb-2"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded bg-slate-700 text-white px-2 py-1 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(resource._id)}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 shadow"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded-md bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700 shadow"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-indigo-400 mb-1">{resource.title}</h2>

                  {/* Submitted By */}
                  <p className="text-xs text-slate-400 mb-2">
                    Submitted by:{" "}
                    {resource.addedBy?.name
                      || resource.addedBy?.email
                      || (typeof resource.addedBy === "string" ? resource.addedBy : "Unknown")}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-300 mb-2 line-clamp-3">{resource.description}</p>

                  {/* File Size */}
                  {resource.file?.size && (
                    <p className="text-xs text-slate-400 mb-2">Size: {(resource.file.size / 1024).toFixed(2)} KB</p>
                  )}

                  {/* Action Buttons (all in one row) */}
                    <div className="flex flex-wrap gap-2 mt-3">
                    {/* Approve/Reject depending on status */}
                    {status === "pending" && (
                        <>
                        <button
                            onClick={() => handleUpdateStatus(resource._id, "approved")}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 shadow"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(resource._id, "rejected")}
                            className="rounded-md bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700 shadow"
                        >
                            Reject
                        </button>
                        </>
                    )}
                    {status === "approved" && (
                        <button
                        onClick={() => handleUpdateStatus(resource._id, "rejected")}
                        className="rounded-md bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700 shadow"
                        >
                        Reject
                        </button>
                    )}
                    {status === "rejected" && (
                        <button
                        onClick={() => handleUpdateStatus(resource._id, "approved")}
                        className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 shadow"
                        >
                        Approve
                        </button>
                    )}

                    {/* Edit */}
                    <button
                        onClick={() => startEdit(resource)}
                        className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 shadow"
                    >
                        <Edit className="w-4 h-4" /> Edit
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => handleDelete(resource._id)}
                        className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 shadow"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    {/* ✨ NEW: View Link (if URL exists) ✨ */}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1 text-xs text-white hover:bg-sky-700 shadow"
                      >
                        <ExternalLink className="w-4 h-4" /> View Link
                      </a>
                    )}
                    {/* View + Download (if file exists) */}
                    {resource.file?.url && (
                      <>
                        {/* FINAL FIX: Points to the new /api/admin/.../view route */}
                        <a
                          href={`/api/admin/resources/${resource._id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-700 shadow"
                        >
                          <Eye className="w-4 h-4" /> View
                        </a>

                        {/* FINAL FIX: Points to the new /api/admin/.../download route */}
                        <a
                          href={`/api/admin/resources/${resource._id}/download`}
                          // The `download` attribute is not strictly needed here since the backend handles it,
                          // but it's good practice to keep it.
                          download={resource.file.originalName || true}
                          className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700 shadow"
                        >
                          <FileDown className="w-4 h-4" /> Download
                        </a>
                      </>
                    )}
                    </div>

                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
