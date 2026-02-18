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
  Calendar
} from 'lucide-react';

export default function UpdateModal({ isOpen, onClose, onSave, update, hackathons = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    url: '',
    isPublic: false,
    pinned: false,
    hackathon: '',
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
    if (update) {
      setFormData({
        title: update.title || '',
        summary: update.summary || '',
        url: update.url || '',
        isPublic: update.isPublic || false,
        pinned: update.pinned || false,
        hackathon: update.hackathon?._id || update.hackathon || '',
        fileUrl: update.fileUrl || ''
      });
    } else {
      setFormData({
        title: '',
        summary: '',
        url: '',
        isPublic: false,
        pinned: false,
        hackathon: '',
        fileUrl: ''
      });
    }
    setError('');
  }, [update, isOpen]);

  // ✅ FILE UPLOAD (FIXED ROUTE + AUTH)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)");
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
      setError('Title required');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, update?._id);
      onClose();
    } catch {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-900/30 text-indigo-400">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {update ? 'Edit Update' : 'New Update'}
              </h2>
              <p className="text-xs text-slate-400">Keep teams informed</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>

        {/* FORM */}
        <div className="overflow-y-auto p-6">
          <form id="updateForm" onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* CONTEXT */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Context</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <select
                  value={formData.hackathon}
                  onChange={e => setFormData({ ...formData, hackathon: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white"
                >
                  <option value="">-- Use Active --</option>
                  {hackathons.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} {h.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TITLE */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Headline *</label>
              <input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
              />
            </div>

            {/* CONTENT */}
            <textarea
              rows="3"
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
              placeholder="Content..."
            />

            {/* LINK + FILE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <input
                type="url"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white"
                placeholder="https://"
              />

              {formData.fileUrl ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/50">
                  <a href={formData.fileUrl} target="_blank" className="text-xs text-indigo-300 truncate">
                    <FileText size={14}/> View File
                  </a>
                  <button type="button" onClick={removeFile} className="text-red-400">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf,image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="rounded-lg border border-dashed border-slate-600 px-3 py-2.5 text-sm text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-500">
                    {uploading ? "Uploading..." : <><UploadCloud size={16}/> Upload PDF</>}
                  </div>
                </div>
              )}

            </div>

            {/* ✅ TOGGLES BACK */}
            <div className="flex gap-4 pt-2">

              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-3 rounded-xl flex-1 border border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-300">Publish</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-3 rounded-xl flex-1 border border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={e => setFormData({ ...formData, pinned: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-300">Pin</span>
              </label>

            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-300">Cancel</button>
          <button
            type="submit"
            form="updateForm"
            disabled={loading || uploading}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-2"
          >
            <Save size={16}/> Save
          </button>
        </div>

      </div>
    </div>
  );
}
