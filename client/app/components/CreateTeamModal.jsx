'use client';

import { useState } from 'react';

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [problemStatementTitle, setProblemStatementTitle] = useState('');
  const [problemStatementDescription, setProblemStatementDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamName) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamName, problemStatementTitle, problemStatementDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to create team.');
      }
      onTeamCreated(); // This refreshes the dashboard
      onClose(); // Close the modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-slate-800 p-8 text-white border border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Your Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="rounded bg-red-500/20 p-3 text-center text-sm text-red-300">{error}</p>}
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="problemStatementTitle" className="block text-sm font-medium text-slate-300 mb-1">Problem Statement Title</label>
            <input
              id="problemStatementTitle"
              type="text"
              value={problemStatementTitle}
              onChange={(e) => setProblemStatementTitle(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="problemStatementDescription" className="block text-sm font-medium text-slate-300 mb-1">Problem Statement Description</label>
            <textarea
              id="problemStatementDescription"
              rows="4"
              value={problemStatementDescription}
              onChange={(e) => setProblemStatementDescription(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-600 hover:bg-slate-500">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg px-5 py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}