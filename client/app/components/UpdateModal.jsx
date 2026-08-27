'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Megaphone,
  Save,
  Link as LinkIcon,
  FileText,
  UploadCloud,
  Trash2,
  Calendar,
  Lock,
  Globe,
  Building2,
  Pin,
  Eye,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UpdateModal({ isOpen, onClose, onSave, update, hackathons = [] }) {
  const { user } = useAuth();
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  const [colleges, setColleges] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    url: '',
    visibility: 'private', // 'private' | 'public'
    isPublic: true,
    pinned: false,
    hackathon: '',
    college: '',
    fileUrl: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (isSuperAdminUser && isOpen) {
      fetch('/api/colleges?status=approved', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setColleges(data.items || []))
        .catch(console.error);
    }
  }, [isSuperAdminUser, isOpen]);

  useEffect(() => {
    if (update) {
      setFormData({
        title: update.title || '',
        summary: update.summary || '',
        url: update.url || '',
        visibility: update.visibility || (update.college ? 'private' : 'public'),
        isPublic: update.isPublic !== undefined ? update.isPublic : true,
        pinned: update.pinned || false,
        hackathon: update.hackathon?._id || update.hackathon || '',
        college: update.college?._id || update.college || '',
        fileUrl: update.fileUrl || ''
      });
    } else {
      setFormData({
        title: '',
        summary: '',
        url: '',
        visibility: 'private',
        isPublic: true,
        pinned: false,
        hackathon: '',
        college: '',
        fileUrl: ''
      });
    }
    setError('');
  }, [update, isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (maximum size is 10MB)");
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/admin/updates/upload', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Upload failed');

      setFormData(prev => ({ ...prev, fileUrl: result.url }));
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = () => setFormData(prev => ({ ...prev, fileUrl: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Notice headline/title is required');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, update?._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save notice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Megaphone size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {update ? 'Edit Announcement / Notice' : 'Post Official Announcement'}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {update ? 'Modify notice details and adjust public/private visibility' : 'Publish notices and circulars to keep participants aligned'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Context / Hackathon & Super Admin College Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-indigo-500" /> Event Association
              </label>
              <select
                value={formData.hackathon}
                onChange={e => setFormData({ ...formData, hackathon: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="">-- Active Hackathon Round --</option>
                {hackathons.map(h => (
                  <option key={h._id} value={h._id}>{h.name} ({h.shortName})</option>
                ))}
              </select>
            </div>

            {isSuperAdminUser ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Building2 size={13} className="text-indigo-500" /> Target College (Super Admin)
                </label>
                <select
                  value={formData.college}
                  onChange={e => setFormData({ ...formData, college: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">Platform / All Colleges (Global)</option>
                  {colleges.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.shortName})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Building2 size={13} className="text-indigo-500" /> Campus Ownership
                </label>
                <div className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-2">
                  <Building2 size={14} className="text-indigo-500" />
                  {user?.college?.name || user?.college?.shortName || 'Your College Campus'}
                </div>
              </div>
            )}
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notice Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Internal Round Problem Statement Submission & PPT Deadline"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Summary / Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Announcement Summary &amp; Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Provide context, critical guidelines, submission URLs or team instructions..."
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Visibility Policy: Public vs Private (Default: Private) */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Lock size={13} /> Notice Visibility &amp; Sharing Scope
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                onClick={() => setFormData({ ...formData, visibility: 'private' })}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  formData.visibility === 'private'
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="visibility" 
                  checked={formData.visibility === 'private'} 
                  onChange={() => setFormData({ ...formData, visibility: 'private' })}
                  className="mt-0.5 text-indigo-600" 
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    🔒 Private (My College Only) <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-black">Default</span>
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Only students and mentors verified under your college can view this notice.
                  </span>
                </div>
              </label>

              <label 
                onClick={() => setFormData({ ...formData, visibility: 'public' })}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  formData.visibility === 'public'
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="visibility" 
                  checked={formData.visibility === 'public'} 
                  onChange={() => setFormData({ ...formData, visibility: 'public' })}
                  className="mt-0.5 text-indigo-600" 
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    🌐 Public (All Institutions)
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Visible to all participants across all colleges. Only your college admin can edit it.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Links & Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <LinkIcon size={13} className="text-indigo-500" /> Reference URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <UploadCloud size={13} className="text-indigo-500" /> Attachment Document / PDF
              </label>
              
              {formData.fileUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[180px]"
                  >
                    View Attachment
                  </a>
                  <button 
                    type="button" 
                    onClick={removeFile}
                    className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition"
                    title="Remove attachment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-pointer transition">
                  <UploadCloud size={15} className="text-indigo-500" />
                  <span>{uploading ? 'Uploading...' : 'Attach PDF / Document'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Flags: Pinned & Published */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={e => setFormData({ ...formData, pinned: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Pin size={13} className="text-amber-500" /> Pin Notice to Top
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Eye size={13} className="text-emerald-500" /> Published (Active)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {update ? 'Save Changes' : 'Publish Announcement'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
