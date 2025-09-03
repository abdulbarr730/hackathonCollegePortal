'use client';

import { useState } from 'react';

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }) {
  const [teamName, setTeamName] = useState('');
  const [problemStatementTitle, setProblemStatementTitle] = useState('');
  const [problemStatementDescription, setProblemStatementDescription] = useState('');
  const [logo, setLogo] = useState(null); // State for the logo file
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamName) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);

    // Use FormData to send file and text fields together
    const formData = new FormData();
    formData.append('teamName', teamName);
    formData.append('problemStatementTitle', problemStatementTitle);
    formData.append('problemStatementDescription', problemStatementDescription);
    if (logo) {
      formData.append('logo', logo); // The key 'logo' must match the backend
    }

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        credentials: 'include',
        // DO NOT set Content-Type header, the browser does it automatically for FormData
        body: formData,
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

          {/* Team Logo Input */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-slate-300 mb-1">
              Team Logo (Optional)
            </label>
            <input
              id="logo"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
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