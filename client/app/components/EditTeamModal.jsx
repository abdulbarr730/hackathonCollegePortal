'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Camera, Loader2, UserMinus } from 'lucide-react';
import Avatar from './Avatar';

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
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);

  // --- UPDATED SCROLL LOCK LOGIC ---
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent the page from "jumping"
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (teamData) {
      setFormData({
        teamName: teamData.teamName || '',
        problemStatementTitle: teamData.problemStatementTitle || '',
        problemStatementDescription: teamData.problemStatementDescription || '',
      });
      setLogo(null);
    }
  }, [teamData]);

  if (!isOpen) return null;

  const isLeader = currentUser?._id === teamData?.leader?._id;

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
    if (!isLeader) return; // Guard clause

    setError('');
    if (!formData.teamName.trim()) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);

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

  const handleRemoveLogo = async () => {
    if (!window.confirm("Are you sure you want to remove the team logo?")) return;
    setIsRemovingLogo(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/${teamData._id}/logo`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to remove logo.');
      onTeamUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemovingLogo(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    setRemovingMember(memberId);
    setError('');

    try {
        const res = await fetch(`/api/teams/${teamData._id}/remove/${memberId}`, {
            method: 'POST',
            credentials: 'include'
        });

        // Check if response is JSON before parsing
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Failed to remove member");
        } else {
            // If the server sent HTML (404/500), show a clean error
            if (res.status === 404) throw new Error("Backend route missing. Restart your server.");
            throw new Error("Server error. Check your backend logs.");
        }

        onTeamUpdated();
    } catch (err) {
        setError(err.message);
    } finally {
        setRemovingMember(null);
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 max-h-[90vh] flex flex-col transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLeader ? 'Edit Team Settings' : 'Team Details'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isLeader ? 'Update your squad info and manage members' : 'View team information'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="editTeamForm" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* LOGO SECTION */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Team Logo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Logo Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {(logo || teamData.logoUrl) ? (
                      <img 
                        src={logo ? URL.createObjectURL(logo) : teamData.logoUrl} 
                        alt="Team logo" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Camera size={32} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Logo Actions */}
                {isLeader && (
                  <div className="flex-1 space-y-3 w-full">
                    <div className="relative">
                      <input
                        id="logo-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-100 dark:border-indigo-900/50 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors w-full sm:w-auto"
                      >
                        <Camera size={16} className="mr-2" />
                        {teamData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </label>
                    </div>

                    {teamData.logoUrl && !logo && (
                      <button 
                        type="button" 
                        onClick={handleRemoveLogo}
                        disabled={isRemovingLogo}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-semibold border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors w-full sm:w-auto disabled:opacity-50"
                      >
                        {isRemovingLogo ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="mr-2" />}
                        Remove Logo
                      </button>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Recommended size: 500x500px. Max size: 2MB.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

            {/* FORM FIELDS */}
            <div className="grid gap-5">
              <div>
                <label htmlFor="teamName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team Name
                </label>
                <input
                  id="teamName"
                  name="teamName"
                  type="text"
                  value={formData.teamName}
                  onChange={handleTextChange}
                  disabled={!isLeader}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="problemStatementTitle" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Problem Statement Title
                </label>
                <input
                  id="problemStatementTitle"
                  name="problemStatementTitle"
                  type="text"
                  value={formData.problemStatementTitle}
                  onChange={handleTextChange}
                  disabled={!isLeader}
                  placeholder="e.g. Smart Agriculture System"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="problemStatementDescription" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Problem Description
                </label>
                <textarea
                  id="problemStatementDescription"
                  name="problemStatementDescription"
                  rows="4"
                  value={formData.problemStatementDescription}
                  onChange={handleTextChange}
                  disabled={!isLeader}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

            {/* MEMBERS LIST */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                Team Members
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {teamData?.members?.length || 0} / 6
                </span>
              </h3>
              
              <div className="space-y-2">
                {teamData?.members?.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} src={member.photoUrl} size={32} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          {member.nameWithYear || member.name}
                          {member._id === teamData.leader._id && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              Leader
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{member.email}</span>
                      </div>
                    </div>

                    {isLeader && member._id !== currentUser._id && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(member._id)} 
                        disabled={removingMember === member._id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Remove Member"
                      >
                        {removingMember === member._id ? (
                          <Loader2 size={16} className="animate-spin text-red-500" />
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isLeader ? 'Cancel' : 'Close'}
          </button>
          
          {isLeader && (
            <button 
              type="submit" 
              form="editTeamForm" 
              disabled={loading} 
              className="rounded-lg px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center"
            >
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}