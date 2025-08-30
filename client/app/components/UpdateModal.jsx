'use client';

import { useState, useEffect } from 'react';

export default function UpdateModal({ isOpen, onClose, onSave, update }) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    url: '',
    isPublic: false,
    pinned: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // If an update object is passed, it's an edit; otherwise, it's a create.
    if (update) {
      setFormData({
        title: update.title || '',
        summary: update.summary || '',
        url: update.url || '',
        isPublic: update.isPublic || false,
        pinned: update.pinned || false,
      });
    } else {
      // Reset for creating a new update
      setFormData({ title: '', summary: '', url: '', isPublic: false, pinned: false });
    }
  }, [update, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.title) {
      setError('Title is required.');
      return;
    }
    await onSave(formData, update?._id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-slate-800 p-8 text-white border border-slate-700">
        <h2 className="text-2xl font-bold">{update ? 'Edit Update' : 'Create New Update'}</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" required />
          </div>
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-1">Summary</label>
            <textarea name="summary" rows="4" value={formData.summary} onChange={handleChange} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"></textarea>
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1">URL (Optional)</label>
            <input type="url" name="url" value={formData.url} onChange={handleChange} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} className="h-4 w-4 rounded bg-slate-700 text-purple-500" />
              Publish this update
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="pinned" checked={formData.pinned} onChange={handleChange} className="h-4 w-4 rounded bg-slate-700 text-purple-500" />
              Pin this update
            </label>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-600 hover:bg-slate-500">Cancel</button>
            <button type="submit" className="rounded-lg px-5 py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-500">Save Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}