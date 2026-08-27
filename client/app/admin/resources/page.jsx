'use client';

import { useState, useEffect } from 'react';
import { 
  FileDown, Eye, Edit, Trash2, Save, X, ExternalLink, Plus, 
  ShieldCheck, Lock, Globe, Building2, User, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TABS = ['pending', 'approved', 'rejected'];

export default function AdminResourcesPage() {
  const { user } = useAuth();
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  const [resources, setResources] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [status, setStatus] = useState('approved');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ 
    pending: 0, 
    approved: 0, 
    allApproved: 0, 
    collegeApproved: 0, 
    otherInstitutionsApproved: 0,
    rejected: 0 
  });

  // Admin Direct Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('link'); // 'link' | 'file'
  const [uploadForm, setUploadForm] = useState({
    title: '',
    url: '',
    description: '',
    category: 'Tools',
    visibility: 'private', // Default: Private
    college: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // For edit
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');

  // For bulk delete
  const [selected, setSelected] = useState([]);

  const fetchResources = async (currentStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/resources?status=${currentStatus}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setResources(data.items || []);
        if (data.counts) {
          setCounts(prev => ({
            ...prev,
            ...data.counts,
            [currentStatus]: data.pagination?.total || (data.items || []).length
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch resources", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await fetch(`/api/admin/resources/counts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCounts(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to fetch counts", error);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/colleges?status=approved', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setColleges(data.items || []);
    } catch (err) {
      console.error("Failed to fetch colleges", err);
    }
  };

  useEffect(() => {
    fetchResources(status);
    fetchCounts();
    if (isSuperAdminUser) fetchColleges();
    setSelected([]);
  }, [status, isSuperAdminUser]);

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

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newStatus === "rejected" ? { reason: "Rejected by college admin" } : {}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || `Failed to ${newStatus} resource`);
      }

      refreshData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resource permanently?")) return;
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.msg || "Failed to delete resource");
      }
      refreshData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDirectUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let endpoint = '/api/resources';
      let res;

      if (uploadType === 'file') {
        if (!uploadFile) throw new Error('Please select a file to attach');
        const data = new FormData();
        data.append('title', uploadForm.title);
        data.append('category', uploadForm.category);
        if (uploadForm.description) data.append('description', uploadForm.description);
        data.append('visibility', uploadForm.visibility);
        data.append('file', uploadFile);

        endpoint = '/api/resources/upload';
        res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: data
        });
      } else {
        if (!uploadForm.url.trim()) throw new Error('Please provide a valid URL');
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(uploadForm)
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || 'Upload failed');
      }

      setShowUploadModal(false);
      setUploadForm({
        title: '',
        url: '',
        description: '',
        category: 'Tools',
        visibility: 'private',
        college: ''
      });
      setUploadFile(null);
      refreshData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (res) => {
    setEditingId(res._id);
    setEditTitle(res.title);
    setEditDescription(res.description || '');
    setEditVisibility(res.visibility || 'private');
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          title: editTitle, 
          description: editDescription,
          visibility: editVisibility 
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Update failed');
      }
      setEditingId(null);
      refreshData();
    } catch (error) {
      alert(error.message);
    }
  };

  // Check if current user is allowed to edit/delete this specific resource
  const canManageResource = (resource) => {
    if (isSuperAdminUser) return true;
    if (!user?.college) return false;
    const userColId = String(user.college._id || user.college);
    const resColId = String(resource.college?._id || resource.college || '');
    return userColId === resColId;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Multi-College Resource Moderation &amp; Publishing
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Moderate Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review submissions from students, control Public vs. Private visibility, and publish verified materials.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 text-sm shrink-0"
        >
          <Plus size={16} /> + Post Resource
        </button>
      </div>

      {/* College Scoping Notice Banner for College SPOCs */}
      {!isSuperAdminUser && counts.otherInstitutionsApproved > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 className="text-indigo-600 dark:text-indigo-400 shrink-0" size={18} />
            <span>
              <strong>Campus Filter Active:</strong> Showing resources submitted by your college ({counts.collegeApproved || 0}). 
              There are <strong>{counts.otherInstitutionsApproved} public resources</strong> from partner colleges available in the student repository.
            </span>
          </div>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all capitalize ${
                status === tab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'approved' && !isSuperAdminUser ? (
                `Approved (${counts.collegeApproved || 0})`
              ) : (
                `${tab} (${counts[tab] || 0})`
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-400 p-8 col-span-full text-center">Loading resources...</p>
        ) : resources.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
            <Building2 className="mx-auto mb-2 opacity-30" size={32} />
            <p className="font-bold text-slate-700 dark:text-slate-300">No resources found in this category for your college.</p>
            {!isSuperAdminUser && counts.otherInstitutionsApproved > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                (7 public resources submitted by other colleges exist globally).
              </p>
            )}
          </div>
        ) : (
          resources.map(resource => {
            const hasManageAccess = canManageResource(resource);

            return (
              <div
                key={resource._id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {editingId === resource._id ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-xs"
                    />
                    <select
                      value={editVisibility}
                      onChange={(e) => setEditVisibility(e.target.value)}
                      className="w-full p-2 rounded-xl border dark:bg-slate-950 text-xs font-bold"
                    >
                      <option value="private">🔒 Private (College Only)</option>
                      <option value="public">🌐 Public (All Colleges)</option>
                    </select>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(resource._id)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {resource.category}
                        </span>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          resource.visibility === 'public'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {resource.visibility === 'public' ? (
                            <><Globe size={11} /> Public</>
                          ) : (
                            <><Lock size={11} /> Private (College Only)</>
                          )}
                        </span>
                      </div>

                      <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {resource.title}
                      </h2>

                      {resource.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {resource.description}
                        </p>
                      )}

                      {/* Author & College Meta */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <p className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <User size={13} className="text-indigo-500" />
                          <span>{resource.addedBy?.name || 'Admin'}</span>
                          <span className="text-[10px] uppercase opacity-75 font-mono">({resource.addedBy?.role || 'Staff'})</span>
                        </p>
                        <p className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{resource.college?.name || resource.college?.shortName || 'Global Campus'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition"
                          >
                            <ExternalLink size={12} /> Open
                          </a>
                        ) : resource.file?.downloadUrl ? (
                          <a
                            href={resource.file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition"
                          >
                            <FileDown size={12} /> Download
                          </a>
                        ) : null}
                      </div>

                      {/* Approval / Rejection Controls (Only for authorized admin) */}
                      {hasManageAccess ? (
                        <div className="flex items-center gap-1.5">
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(resource._id, 'approved')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(resource._id, 'rejected')}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => startEdit(resource)}
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Resource"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(resource._id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete Resource"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          Managed by author's institution
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Direct Post Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl w-full space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={20} />
              Publish Official Resource
            </h3>

            <form onSubmit={handleDirectUploadSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadType('link')}
                  className={`py-2 rounded-lg font-bold text-xs ${uploadType === 'link' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-500'}`}
                >
                  External URL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('file')}
                  className={`py-2 rounded-lg font-bold text-xs ${uploadType === 'file' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow' : 'text-slate-500'}`}
                >
                  Attach File
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIH 2026 Pitch Deck Architecture"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full p-3 rounded-xl border dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                <select
                  value={uploadForm.category}
                  onChange={e => setUploadForm({...uploadForm, category: e.target.value})}
                  className="w-full p-3 rounded-xl border dark:bg-slate-800 text-sm"
                >
                  <option value="Tools">Tools &amp; SDKs</option>
                  <option value="Documentation">Documentation &amp; Guides</option>
                  <option value="Datasets">Datasets &amp; Models</option>
                  <option value="Templates">Templates &amp; PPT Formats</option>
                  <option value="UI Kits">UI Kits &amp; Design Assets</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Visibility Policy *</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-3 rounded-xl border cursor-pointer font-bold ${uploadForm.visibility === 'private' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'border-slate-200 dark:border-slate-800'}`}>
                    <input type="radio" name="vis" checked={uploadForm.visibility === 'private'} onChange={() => setUploadForm({...uploadForm, visibility: 'private'})} className="mr-2" />
                    🔒 Private (College Only)
                  </label>
                  <label className={`p-3 rounded-xl border cursor-pointer font-bold ${uploadForm.visibility === 'public' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'border-slate-200 dark:border-slate-800'}`}>
                    <input type="radio" name="vis" checked={uploadForm.visibility === 'public'} onChange={() => setUploadForm({...uploadForm, visibility: 'public'})} className="mr-2" />
                    🌐 Public (All Colleges)
                  </label>
                </div>
              </div>

              {/* Super Admin College Selector */}
              {isSuperAdminUser && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Target College (Super Admin)</label>
                  <select
                    value={uploadForm.college}
                    onChange={e => setUploadForm({...uploadForm, college: e.target.value})}
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 text-sm"
                  >
                    <option value="">Platform / All Colleges</option>
                    {colleges.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.shortName})</option>
                    ))}
                  </select>
                </div>
              )}

              {uploadType === 'link' ? (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">URL Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={uploadForm.url}
                    onChange={e => setUploadForm({...uploadForm, url: e.target.value})}
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Attach File *</label>
                  <input
                    type="file"
                    required
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="w-full p-2.5 rounded-xl border dark:bg-slate-800 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes about this resource..."
                  value={uploadForm.description}
                  onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                  className="w-full p-3 rounded-xl border dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase hover:bg-indigo-500 shadow transition disabled:opacity-50"
                >
                  {uploading ? 'Publishing...' : 'Publish Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 rounded-xl border font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
