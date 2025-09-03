'use client';

import { useState, useEffect } from 'react';

export default function EditTeamModal({ 
  isOpen, 
  onClose, 
  onTeamUpdated, 
  teamData, 
  currentUser 
}) {
  const [formData, setFormData] = useState({
    teamName: '',
    problemStatementTitle: '',
    problemStatementDescription: '',
  });
  const [logo, setLogo] = useState(null); // State for the new logo file
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  useEffect(() => {
    if (teamData) {
      setFormData({
        teamName: teamData.teamName || '',
        problemStatementTitle: teamData.problemStatementTitle || '',
        problemStatementDescription: teamData.problemStatementDescription || '',
      });
      setLogo(null); // Reset logo state when modal opens
    }
  }, [teamData]);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.teamName) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);

    // Use FormData to be able to send a file
    const dataToSubmit = new FormData();
    dataToSubmit.append('teamName', formData.teamName);
    dataToSubmit.append('problemStatementTitle', formData.problemStatementTitle);
    dataToSubmit.append('problemStatementDescription', formData.problemStatementDescription);
    if (logo) {
      dataToSubmit.append('logo', logo);
    }

    try {
      const res = await fetch(`/api/teams/${teamData._id}`, {
        method: 'PUT',
        credentials: 'include',
        // Do not set 'Content-Type' header; browser sets it for FormData
        body: dataToSubmit,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update team.');
      onTeamUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemovingMember(memberId);
    try {
      const res = await fetch(
        `/api/teams/${teamData._id}/members/${memberId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to remove member');
      onTeamUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingMember(null);
    }
  };

  const isLeader = currentUser?._id === teamData?.leader?._id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-800 p-8 text-white shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-center">{isLeader ? 'Edit Team' : 'Team Details'}</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded bg-red-500/20 p-3 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          {/* Team Logo Section */}
          <div className="flex items-center gap-4">
            {(teamData.logoUrl || logo) && (
              <img 
                src={logo ? URL.createObjectURL(logo) : teamData.logoUrl} 
                alt="Team logo" 
                className="w-16 h-16 rounded-lg object-cover bg-slate-700" 
              />
            )}
            {isLeader && (
              <div>
                <label
                  htmlFor="logo-edit"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  {teamData.logoUrl ? 'Change Team Logo' : 'Upload Team Logo'} (Optional)
                </label>
                <input
                  id="logo-edit"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                />
              </div>
            )}
          </div>

          {/* Team Name */}
          <div>
            <label
              htmlFor="teamName-edit"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Team Name
            </label>
            <input
              id="teamName-edit"
              name="teamName"
              type="text"
              value={formData.teamName}
              onChange={handleTextChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
              disabled={!isLeader}
            />
          </div>

          {/* Problem Statement Title */}
          <div>
            <label
              htmlFor="problemStatementTitle-edit"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Problem Statement Title
            </label>
            <input
              id="problemStatementTitle-edit"
              name="problemStatementTitle"
              type="text"
              value={formData.problemStatementTitle}
              onChange={handleTextChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={!isLeader}
            />
          </div>

          {/* Problem Statement Description */}
          <div>
            <label
              htmlFor="problemStatementDescription-edit"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Problem Statement Description
            </label>
            <textarea
              id="problemStatementDescription-edit"
              name="problemStatementDescription"
              rows="4"
              value={formData.problemStatementDescription}
              onChange={handleTextChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              disabled={!isLeader}
            ></textarea>
          </div>

          {/* Members Section */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              Team Members
            </h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {teamData?.members?.map((member) => (
                <li
                  key={member._id}
                  className="flex items-center justify-between rounded-lg bg-slate-700/50 p-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.photoUrl || '/default-avatar.png'}
                      alt={member.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-slate-200 text-sm">
                      {member.name}
                      {member._id === teamData.leader._id && (
                        <span className="ml-2 text-xs text-emerald-400">
                          (Leader)
                        </span>
                      )}
                    </span>
                  </div>

                  {isLeader && member._id !== currentUser._id && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={removingMember === member._id}
                      className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50"
                    >
                      {removingMember === member._id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-sm font-medium bg-slate-600 hover:bg-slate-500"
            >
              {isLeader ? 'Cancel' : 'Close'}
            </button>
            {isLeader && (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}