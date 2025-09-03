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

/**
 * Utility: de-duplicate arrays of Mongo docs by _id
 */
function dedupeById(list = []) {
  const map = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const id = item && item._id ? String(item._id) : '';
    if (id && !map.has(id)) map.set(id, item);
  }
  return Array.from(map.values());
}

/**
 * Small presentational component for a user's name + email.
 */
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

  // --- State ---
  const [teams, setTeams] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);

  // --- Data fetchers ---
  const fetchTeams = async () => {
    try {
      const res = await fetch(`/api/teams`, { credentials: 'include' });
      if (res.ok) setTeams(await res.json());
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const res = await fetch(`/api/invitations/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPendingInvites(data);
      }
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
    }
  };

  const fetchSentInvites = async () => {
    try {
      const res = await fetch(`/api/invitations/sent`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSentInvites(data);
      }
    } catch (error) {
      console.error('Failed to fetch sent invites:', error);
    }
  };

  // Load everything after auth resolves
  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
      fetchUpdates();
      fetchPendingInvites();
      fetchSentInvites();
    }
  }, [isAuthenticated]);

  // Refresh local data + user object after any mutation
  const handleDataUpdate = () => {
    fetchTeams();
    fetchPendingInvites();
    fetchSentInvites();
    recheckUser();
  };

  // --- Actions on my team ---
  const handleDeleteClick = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await fetch(`/api/teams/${teamId}`, { method: 'DELETE', credentials: 'include' });
        handleDataUpdate();
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const handleLeaveClick = async () => {
    if (window.confirm('Leave your current team?')) {
      try {
        const res = await fetch(`/api/teams/members/leave`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error((await res.json())?.msg || 'Leave failed');
        handleDataUpdate();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // --- Join request flows for viewing other teams ---
  const handleJoinClick = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Request failed');
      handleDataUpdate();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancelJoin = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/cancel-request`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Cancel failed');
      handleDataUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleApprove = async (teamId, userId) => {
    try {
      await fetch(`/api/teams/${teamId}/approve/${userId}`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (teamId, userId) => {
    try {
      await fetch(`/api/teams/${teamId}/reject/${userId}`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      handleDataUpdate();
    }
  };

  // --- Invitations actions ---
  const handleAcceptInvite = async (inviteId) => {
    try {
      const res = await fetch(`/api/invitations/${inviteId}/accept`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Accept failed');
      handleDataUpdate();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      const res = await fetch(`/api/invitations/${inviteId}/reject`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Reject failed');
      handleDataUpdate();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancelSentInvite = async (inviteId) => {
    try {
      const res = await fetch(`/api/invitations/sent/${inviteId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Cancel failed');
      handleDataUpdate();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Early return while loading ---
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }

  // --- Derived data ---
  const myTeam = user.team ? teams.find((t) => String(t._id) === String(user.team)) : null;
  const otherTeams = dedupeById(teams.filter((t) => !user.team || String(t._id) !== String(user.team)));
  const myMembers = myTeam ? dedupeById(myTeam.members) : [];
  const myRequests = myTeam ? dedupeById(myTeam.pendingRequests) : [];

  return (
    <div className="min-h-screen w-full">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
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
          <p className="mt-2 text-slate-400">
            Manage your team, track updates, and explore ideas.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
          {/* Sidebar cards with invite badge */}
          <aside className="space-y-6">
            {[
              {
                title: '📢 Official Updates',
                color: 'indigo',
                description: 'Stay updated with the latest announcements.',
                items: updates,
                buttonText: 'View All Updates',
                onClick: () => router.push('/updates'),
                badge: pendingInvites.length,
              },
              {
                title: '💡 Got an Idea?',
                color: 'purple',
                description: 'Share proposals and track feedback.',
                buttonText: 'Browse Ideas',
                onClick: () => router.push('/ideas'),
              },
              {
                title: '📚 Resource Hub',
                color: 'emerald',
                description: 'Access curated study materials, guides, and references.',
                buttonText: 'Go to Resource Hub',
                onClick: () => router.push('/resources'),
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="relative rounded-xl p-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 animate-border"
              >
                <div className="rounded-xl bg-slate-900/90 p-6 relative">
                  <h3 className={`text-lg font-semibold text-${card.color}-400`}>{card.title}</h3>
                  {card.items ? (
                    card.items.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {card.items.slice(0, 3).map((u) => (
                          <li key={u._id}>
                            <a href={u.url} className="text-sm font-medium hover:text-indigo-300">{u.title}</a>
                            <p className="text-xs text-slate-500">{u.summary || 'No description'}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No updates available</p>
                    )
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">{card.description}</p>
                  )}
                  <button
                    onClick={card.onClick}
                    className={`mt-4 w-full rounded-md bg-${card.color}-600 px-4 py-2 text-sm font-medium hover:bg-${card.color}-500 transition`}
                  >
                    {card.buttonText}
                  </button>
                  {card.badge > 0 && (
                    <span className="absolute top-2 right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {card.badge}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </aside>

          <section>
            {/* My Team Section */}
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

                  {/* Pending Requests */}
                  {String(user._id) === String(myTeam.leader._id) && myRequests.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-4">
                      <p className="font-semibold text-cyan-400">Pending Requests:</p>
                      <ul className="mt-1 space-y-2">
                        {myRequests.map((requestUser) => (
                          <li key={requestUser._id} className="flex items-center justify-between text-gray-400">
                            <NameWithEmail user={requestUser} />
                            <div className="space-x-2">
                              <button
                                onClick={() => handleApprove(myTeam._id, requestUser._id)}
                                className="rounded bg-green-600 px-2 py-1 text-xs hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(myTeam._id, requestUser._id)}
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

                  {/* Sent Invitations */}
                  {String(user._id) === String(myTeam.leader._id) && sentInvites.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-4">
                      <p className="font-semibold text-purple-400">Sent Invitations:</p>
                      <ul className="mt-1 space-y-2">
                        {sentInvites.map((invite) => (
                          <li key={invite._id} className="flex items-center justify-between text-gray-400">
                            <NameWithEmail user={invite.inviteeId} /> {/* ✅ use inviteeId */}
                            <button
                              onClick={() => handleCancelSentInvite(invite._id)}
                              className="rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </li>
                        ))}
                      </ul>

                    </div>
                  )}

                  {/* Pending Invitations for users */}
                  {!myTeam && pendingInvites.length > 0 && (
                    <div className="mt-4 border-t border-slate-700 pt-4">
                      <p className="font-semibold text-yellow-400">Pending Invitations:</p>
                      <ul className="mt-1 space-y-2">
                        {pendingInvites.map((invite) => (
                          <li key={invite._id} className="flex items-center justify-between text-gray-400">
                            <span>{invite.team.teamName} (Invited by {invite.inviter.name})</span>
                            <div className="space-x-2">
                              <button
                                onClick={() => handleAcceptInvite(invite._id)}
                                className="rounded bg-green-600 px-2 py-1 text-xs hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectInvite(invite._id)}
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
              <p className="text-slate-400 mb-6">You are not part of any team yet.</p>
            )}

            {/* View All Users Button */}
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/all-users')}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                View All Users
              </button>
            </div>

            {/* Other Teams Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">All Other Teams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherTeams.map((team) => {
                  const members = team.members || [];
                  const memberCount = members.length;
                  const hasFemale = members.some((m) => m.gender === 'female');
                  const userAlreadyRequested = team.pendingRequests?.some(
                    (r) => String(r._id) === String(user._id)
                  );

                  // Determine what to show for the action area
                  let actionArea;
                  if (memberCount >= 6) {
                    actionArea = (
                      <span className="block w-full text-center text-xs text-gray-400 mt-1">
                        Team Full
                      </span>
                    );
                  } else if (userAlreadyRequested) {
                    actionArea = (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelJoin(team._id);
                        }}
                        className="w-full rounded bg-yellow-600 px-3 py-1 text-xs hover:bg-yellow-700"
                      >
                        Cancel Request
                      </button>
                    );
                  } else if (memberCount === 5 && !hasFemale && user.gender !== 'female') {
                    actionArea = (
                      <span className="block w-full text-center text-xs text-red-400 mt-1">
                        Female member required
                      </span>
                    );
                  } else {
                    actionArea = (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinClick(team._id);
                        }}
                        className="w-full rounded bg-green-600 px-3 py-1 text-xs hover:bg-green-700"
                      >
                        Request to Join
                      </button>
                    );
                  }

                  return (
                    <motion.div
                      key={team._id}
                      whileHover={{ scale: 1.02 }}
                      className="relative cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg flex flex-col justify-between"
                      onClick={() => setViewingTeam(team)} // open team details
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-cyan-400">{team.teamName}</h3>
                        <span className="text-xs text-gray-400">{memberCount}/6 members</span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {team.problemStatementTitle || 'No problem statement provided'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar name={team.leader?.name} src={team.leader?.photoUrl} size={28} />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-300">Led by</span>
                          <span className="text-sm text-white">{team.leader?.name || 'Unknown'}</span>
                        </div>
                      </div>

                      {/* Action button / message */}
                      <div className="mt-4">{actionArea}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleDataUpdate} />
      {myTeam && <EditTeamModal isOpen={isEditModalOpen} team={myTeam} onClose={() => setIsEditModalOpen(false)} onSuccess={handleDataUpdate} />}
      {viewingTeam && <TeamDetailsModal team={viewingTeam} onClose={() => setViewingTeam(null)} />}
    </div>
  );
}
