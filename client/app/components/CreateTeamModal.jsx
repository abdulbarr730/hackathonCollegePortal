'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [problemStatementTitle, setProblemStatementTitle] = useState('');
  const [problemStatementDescription, setProblemStatementDescription] = useState('');
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- SCROLL LOCK LOGIC ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }
    
    setLoading(true);

    const formData = new FormData();
    formData.append('teamName', teamName);
    formData.append('problemStatementTitle', problemStatementTitle);
    formData.append('problemStatementDescription', problemStatementDescription);
    if (logo) {
      formData.append('logo', logo);
    }

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to create team.');
      }
      
      onTeamCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[90vh] flex flex-col transition-all duration-300">
        
        {/* STICKY HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Squad</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kickstart your hackathon journey</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* SCROLLABLE FORM AREA */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}
            
            {/* TEAM NAME */}
            <div>
              <label htmlFor="teamName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="e.g. Code Warriors"
                required
              />
            </div>

            {/* TEAM LOGO */}
            <div>
              <label htmlFor="logo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Team Logo <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <input
                id="logo"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  dark:file:bg-indigo-900/30 dark:file:text-indigo-300
                  dark:hover:file:bg-indigo-900/50
                  cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950/50"
              />
            </div>
            
            {/* PROBLEM STATEMENT TITLE */}
            <div>
              <label htmlFor="problemStatementTitle" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Problem Statement Title
              </label>
              <input
                id="problemStatementTitle"
                type="text"
                value={problemStatementTitle}
                onChange={(e) => setProblemStatementTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="e.g. Smart Traffic Management"
              />
            </div>

            {/* PROBLEM STATEMENT DESCRIPTION */}
            <div>
              <label htmlFor="problemStatementDescription" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                id="problemStatementDescription"
                rows="4"
                value={problemStatementDescription}
                onChange={(e) => setProblemStatementDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                // FIX: Updated placeholder to refer to the problem, not the solution
                placeholder="Briefly describe the problem you are solving..."
              ></textarea>
            </div>
          </form>
        </div>

        {/* STICKY FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading} 
            className="rounded-lg px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Creating...
              </>
            ) : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}