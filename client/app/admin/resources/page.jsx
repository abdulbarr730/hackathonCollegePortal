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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Moderate Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review learning materials and project documentation.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all capitalize ${
                status === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab} ({counts[tab] || 0})
            </button>
          ))}
        </div>

        {/* Bulk Delete + Select All */}
        <div className="flex items-center gap-3">
          {resources.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.length === resources.length}
                onChange={(e) =>
                  setSelected(e.target.checked ? resources.map(r => r._id) : [])
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Select All
            </label>
          )}

          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-md shadow-red-500/20 transition-all"
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
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
            No resources found in this category.
          </div>
        ) : (
          resources.map(resource => (
            <div
              key={resource._id}
              className={`rounded-2xl border ${
                selected.includes(resource._id) ? "border-red-500" : "border-slate-200 dark:border-slate-800"
              } bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition`}
            >
              {/* Select Checkbox */}
              <input
                type="checkbox"
                checked={selected.includes(resource._id)}
                onChange={() => toggleSelect(resource._id)}
                className="mb-3 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />

              {editingId === resource._id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm mb-2"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(resource._id)}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 shadow"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-1">{resource.title}</h2>

                  {/* Submitted By */}
                  <p className="text-xs text-slate-400 mb-2">
                    Submitted by:{" "}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {resource.addedBy?.name
                        || resource.addedBy?.email
                        || (typeof resource.addedBy === "string" ? resource.addedBy : "Unknown")}
                    </span>
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-3 leading-relaxed">{resource.description}</p>

                  {/* File Size */}
                  {resource.file?.size && (
                    <p className="text-[11px] text-slate-400 mb-3">Size: {(resource.file.size / 1024).toFixed(2)} KB</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {status === "pending" && (
                        <>
                        <button
                            onClick={() => handleUpdateStatus(resource._id, "approved")}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(resource._id, "rejected")}
                            className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
                        >
                            Reject
                        </button>
                        </>
                    )}
                    {status === "approved" && (
                        <button
                        onClick={() => handleUpdateStatus(resource._id, "rejected")}
                        className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
                        >
                        Reject
                        </button>
                    )}
                    {status === "rejected" && (
                        <button
                        onClick={() => handleUpdateStatus(resource._id, "approved")}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                        >
                        Approve
                        </button>
                    )}

                    {/* Edit */}
                    <button
                        onClick={() => startEdit(resource)}
                        className="flex items-center gap-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                        <Edit className="w-3.5 h-3.5" /> Edit
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => handleDelete(resource._id)}
                        className="flex items-center gap-1 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Link
                      </a>
                    )}
                    
                    {resource.file?.url && (
                      <>
                        <a
                          href={`/api/admin/resources/${resource._id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>

                        <a
                          href={`/api/admin/resources/${resource._id}/download`}
                          download={resource.file.originalName || true}
                          className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-sm"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Download
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
