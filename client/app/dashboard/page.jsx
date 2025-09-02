'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CreateTeamModal from '../components/CreateTeamModal';
import EditTeamModal from '../components/EditTeamModal';
import TeamDetailsModal from '../components/TeamDetailsModal';
import SocialBadges from '../components/SocialBadges';
import Avatar from '../components/Avatar';

function dedupeById(list = []) {
  const map = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const id = item && item._id ? String(item._id) : '';
    if (id && !map.has(id)) map.set(id, item);
  }
  return Array.from(map.values());
}

function NameWithEmail({ user, className }) {
  if (!user) return null;
  return (
    <div className={className || 'flex flex-col'}>
      <span className="font-medium text-gray-200">{user.nameWithYear || user.name}</span>
      <span className="text-xs text-slate-400">{user.email || 'email not set'}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading, recheckUser } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [viewMode, setViewMode] = useState('teams'); // teams | users | invites

  // -------------------------
  // FETCH FUNCTIONS
  // -------------------------
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams', { credentials: 'include' });
      if (res.ok) setTeams(await res.json());
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) setAllUsers(await res.json());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/updates');
      if (res.ok) setUpdates(await res.json());
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/invitations/me', { credentials: 'include' });
      if (res.ok) setInvites(await res.json());
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
      fetchUsers();
      fetchUpdates();
      fetchInvites();
    }
  }, [isAuthenticated]);

  const handleDataUpdate = () => {
    fetchTeams();
    fetchUsers();
    fetchInvites();
    recheckUser();
  };

  // -------------------------
  // TEAM ACTIONS
  // -------------------------
  const handleDeleteClick = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE', credentials: 'include' });
      handleDataUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveClick = async () => {
    if (!window.confirm('Leave your current team?')) return;
    try {
      const res = await fetch('/api/teams/members/leave', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Leave failed');
      handleDataUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinClick = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Request failed');
      handleDataUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelJoin = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/cancel-request`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Cancel failed');
      handleDataUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (teamId, userId) => {
    try {
      await fetch(`/api/teams/${teamId}/approve/${userId}`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (teamId, userId) => {
    try {
      await fetch(`/api/teams/${teamId}/reject/${userId}`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------
  // INVITE ACTIONS
  // -------------------------
  const handleInviteUser = async (inviteeId) => {
    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteeId }),
      });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Invite failed');
      alert('Invitation sent!');
      handleDataUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await fetch(`/api/invitations/${inviteId}/accept`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await fetch(`/api/invitations/${inviteId}/reject`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------
  // LOADING
  // -------------------------
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }

  const myTeam = user.team ? teams.find((t) => String(t._id) === String(user.team)) : null;
  const otherTeams = dedupeById(teams.filter((t) => !user.team || String(t._id) !== String(user.team)));
  const myMembers = myTeam ? dedupeById(myTeam.members) : [];
  const myRequests = myTeam ? dedupeById(myTeam.pendingRequests) : [];

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen w-full">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">
            Welcome,{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {user.name}
            </span>
          </h1>
          <p className="mt-2 text-slate-400">Manage your team, track updates, and explore ideas.</p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md border border-slate-700 bg-slate-800/60 p-1">
            <button
              onClick={() => setViewMode('teams')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'teams' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Users
            </button>
            {!user.team && (
              <button
                onClick={() => setViewMode('invites')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'invites' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                } flex items-center gap-2`}
              >
                Invitations
                {invites.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                    {invites.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ------------------ VIEW: Teams ------------------ */}
        {viewMode === 'teams' && (
          <div>
            {/* My Team */}
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Team</h2>
              {!myTeam && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
                >
                  + Create Team
                </button>
              )}
            </div>

            {myTeam ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-lg p-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500"
              >
                <div className="rounded-lg bg-slate-900/90 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-400">{myTeam.teamName}</h3>
                      <div className="mt-2 text-slate-400">
                        Led by:
                        <div className="mt-1 flex items-center gap-2">
                          <Avatar name={myTeam.leader.name} src={myTeam.leader.photoUrl} size={36} />
                          <NameWithEmail user={myTeam.leader} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
                      >
                        Edit
                      </button>
                      {String(user._id) === String(myTeam.leader._id) ? (
                        <button
                          onClick={() => handleDeleteClick(myTeam._id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-500"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={handleLeaveClick}
                          className="rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium hover:bg-yellow-500"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 font-medium text-gray-200">Problem Statement:</p>
                  <p className="mt-1 text-slate-400">{myTeam.problemStatementTitle}</p>

                  <p className="mt-4 font-medium text-gray-200">Members ({myMembers.length} / 6):</p>
                  <ul className="mt-2 space-y-2">
                    {myMembers.map((m) => (
                      <li key={m._id} className="flex items-center gap-2">
                        <Avatar name={m.name} src={m.photoUrl} size={28} />
                        <NameWithEmail user={m} />
                        <SocialBadges profiles={m.socialProfiles} className="ml-2" />
                      </li>
                    ))}
                  </ul>

                  {String(user._id) === String(myTeam.leader._id) && myRequests.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-4">
                      <p className="font-semibold text-cyan-400">Pending Requests:</p>
                      <ul className="mt-1 space-y-2">
                        {myRequests.map((requestUser) => (
                          <li
                            key={requestUser._id}
                            className="flex items-center justify-between text-gray-400"
                          >
                            <NameWithEmail user={requestUser} />
                            <div className="space-x-2">
                              <button
                                onClick={() => handleApprove(myTeam._id, requestUser._id)}
                                className="rounded bg-green-600 px-2 py-1 text-xs hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(myTeam._id, requestUser._id)}
                                className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
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
              </motion.div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
                You are not part of a team yet. Create one or join an existing team!
              </div>
            )}

            {/* All Other Teams */}
            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-bold">All Other Teams</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {otherTeams.map((team) => {
                  const hasRequested = (team.pendingRequests || []).some(
                    (req) => String(req._id || req) === String(user._id)
                  );
                  const isFull = (team.members || []).length >= 6;
                  return (
                    <motion.div
                      key={team._id}
                      whileHover={{ scale: 1.02 }}
                      className="flex flex-col justify-between rounded-lg p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 cursor-pointer"
                      onClick={() => setViewingTeam(team)}
                    >
                      <div className="rounded-lg bg-slate-900/90 p-6 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-indigo-400">{team.teamName}</h3>
                          <p className="mt-2 text-slate-400 text-sm">Led by {team.leader.name}</p>
                          <p className="mt-4 text-sm text-slate-300">
                            Members: {team.members?.length || 0} / 6
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          {user.team ? (
                            <p className="text-xs text-slate-500">You are already in a team</p>
                          ) : isFull ? (
                            <p className="text-xs text-red-500">Team is full</p>
                          ) : hasRequested ? (
                            <button
                              onClick={() => handleCancelJoin(team._id)}
                              className="rounded bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-500"
                            >
                              Cancel Request
                            </button>
                          ) : String(user._id) === String(team.leader._id) ? (
                            <button disabled className="rounded bg-gray-600 px-3 py-1 text-xs text-white cursor-not-allowed">
                              Leader
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinClick(team._id)}
                              className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------ VIEW: Users ------------------ */}
        {viewMode === 'users' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allUsers
              .filter((u) => String(u._id) !== String(user._id))
              .map((u) => {
                const inTeam = Boolean(u.team);
                const alreadyInvited = invites.some((i) => String(i.inviteeId._id) === String(u._id));
                return (
                  <div
                    key={u._id}
                    className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 flex flex-col items-center gap-2"
                  >
                    <Avatar name={u.name} src={u.photoUrl} size={48} />
                    <NameWithEmail user={u} className="text-center" />
                    <SocialBadges profiles={u.socialProfiles} />
                    {user.team && String(user._id) === String(myTeam?.leader._id) ? (
                      <button
                        onClick={() => handleInviteUser(u._id)}
                        disabled={inTeam || alreadyInvited}
                        className={`mt-2 rounded px-3 py-1 text-sm text-white ${
                          inTeam || alreadyInvited
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500'
                        }`}
                      >
                        {inTeam ? 'In a Team' : alreadyInvited ? 'Invited' : 'Invite'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}

        {/* ------------------ VIEW: Invitations ------------------ */}
        {viewMode === 'invites' && (
          <div className="grid grid-cols-1 gap-4">
            {invites.length === 0 ? (
              <p className="text-slate-400">No pending invitations.</p>
            ) : (
              invites.map((invite) => (
                <div key={invite._id} className="p-4 bg-slate-800 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">Team: {invite.teamId?.name || 'Unnamed Team'}</p>
                    <p className="text-slate-400 text-sm">Invited by {invite.inviterId?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite._id)}
                      className="px-3 py-1 bg-green-600 rounded text-sm text-white hover:bg-green-500"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectInvite(invite._id)}
                      className="px-3 py-1 bg-red-600 rounded text-sm text-white hover:bg-red-500"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTeamCreated={handleDataUpdate}
      />
      {myTeam && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          team={myTeam}
          onTeamUpdated={handleDataUpdate}
        />
      )}
      {viewingTeam && <TeamDetailsModal team={viewingTeam} onClose={() => setViewingTeam(null)} />}
    </div>
  );
}
