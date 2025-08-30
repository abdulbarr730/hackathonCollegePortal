'use client';

import { useState, useEffect } from 'react';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete team');
      setTeams(teams.filter(t => t._id !== teamId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditName = async (teamId) => {
    const newName = prompt('Enter new team name:');
    if (!newName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamName: newName }),
      });
      if (!res.ok) throw new Error('Failed to update team name');
      setTeams(teams.map(t => (t._id === teamId ? { ...t, teamName: newName } : t)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeLeader = async (teamId) => {
    const newLeaderEmail = prompt('Enter new leader email:');
    if (!newLeaderEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/leader`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newLeaderEmail }),
      });
      if (!res.ok) throw new Error('Failed to change leader');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMember = async (teamId) => {
    const memberEmail = prompt('Enter email of new member:');
    if (!memberEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: memberEmail }),
      });
      if (!res.ok) throw new Error('Failed to add member');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove member');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinRequest = async (teamId, requestId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/teams/${teamId}/join/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to update join request');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading teams...</div>;
  if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Teams</h1>
        <button
          onClick={fetchTeams}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {teams.length === 0 && (
          <div className="p-6 text-center text-slate-400 border border-slate-700 rounded-lg">
            No teams found.
          </div>
        )}
        {teams.map(team => (
          <div
            key={team._id}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">{team.teamName}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditName(team._id)}
                  className="rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-500"
                >
                  Edit Name
                </button>
                <button
                  onClick={() => handleChangeLeader(team._id)}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Change Leader
                </button>
                <button
                  onClick={() => handleDelete(team._id)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-1">
              Leader: <span className="text-white">{team.leader?.name}</span> ({team.leader?.email})
            </p>

            <p className="text-sm text-slate-400 mt-1">Members:</p>
            <ul className="ml-4 mt-1 space-y-1">
              {team.members?.map((m) => (
                <li key={m._id} className="flex justify-between text-sm text-slate-300">
                  {m.name} ({m.email})
                  <button
                    onClick={() => handleRemoveMember(team._id, m._id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleAddMember(team._id)}
              className="mt-2 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500"
            >
              + Add Member
            </button>

            {team.joinRequests?.length > 0 && (
              <div className="mt-4 border-t border-slate-700 pt-3">
                <p className="text-sm font-medium text-slate-300">Join Requests:</p>
                <ul className="ml-4 mt-1 space-y-1">
                  {team.joinRequests.map((req) => (
                    <li key={req._id} className="flex justify-between text-sm text-slate-300">
                      {req.user.name} ({req.user.email})
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRequest(team._id, req._id, 'approve')}
                          className="text-green-400 hover:text-green-300 text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleJoinRequest(team._id, req._id, 'reject')}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
