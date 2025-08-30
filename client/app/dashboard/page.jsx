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
  const [updates, setUpdates] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`/api/teams`, { credentials: 'include' });
      if (res.ok) setTeams(await res.json());
    } catch (error) { console.error('Failed to fetch teams:', error); }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/public/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items || []);
      }
    } catch (error) { console.error('Failed to fetch updates:', error); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
      fetchUpdates();
    }
  }, [isAuthenticated]);

  const handleDataUpdate = () => {
    fetchTeams();
    recheckUser();
  };

  const handleDeleteClick = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await fetch(`/api/teams/${teamId}`, { method: 'DELETE', credentials: 'include' });
        handleDataUpdate();
      } catch (error) { console.error('Failed to delete team:', error); }
    }
  };

  const handleLeaveClick = async () => {
    if (window.confirm('Leave your current team?')) {
      try {
        const res = await fetch(`/api/teams/members/leave`, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) throw new Error((await res.json())?.msg || 'Leave failed');
        handleDataUpdate();
      } catch (error) { alert(error.message); }
    }
  };

  // ADDED: Handler to request to join a team
  const handleJoinClick = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Request failed');
      handleDataUpdate(); // Refresh to show "Pending" status
    } catch (error) {
      alert(error.message);
    }
  };

  // ADDED: Handler to cancel a join request
  const handleCancelJoin = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/cancel-request`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json())?.msg || 'Cancel failed');
      handleDataUpdate();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><h1 className="text-3xl font-bold">Loading...</h1></div>;
  }

  const myTeam = user.team ? teams.find((t) => String(t._id) === String(user.team)) : null;
  const otherTeams = dedupeById(teams.filter((t) => !user.team || String(t._id) !== String(user.team)));
  const myMembers = myTeam ? dedupeById(myTeam.members) : [];

  return (
    <div className="min-h-screen w-full">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">
            Welcome, <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="mt-2 text-slate-400">Manage your team, track updates, and explore ideas.</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6">
            {/* Sidebar Cards */}
          </aside>

          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Team</h2>
              {!myTeam && (
                <button onClick={() => setIsCreateModalOpen(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">+ Create Team</button>
              )}
            </div>

            {myTeam ? (
              <motion.div /* ... My Team card ... */ className="relative rounded-lg p-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500">
                {/* My Team Details */}
              </motion.div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
                You are not part of a team yet. Create one or join an existing team!
              </div>
            )}

            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-bold">All Other Teams</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {otherTeams.map((team) => {
                  const hasRequested = (team.pendingRequests || []).some(req => String(req._id || req) === String(user._id));
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
                          <p className="mt-4 text-sm text-slate-300">Members: {team.members?.length || 0} / 6</p>
                        </div>

                        {/* MODIFIED: Added button logic here */}
                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Click to view members</span>
                          {!myTeam && (
                            hasRequested ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelJoin(team._id); }}
                                className="rounded bg-slate-600 px-3 py-1.5 text-xs text-white hover:bg-slate-500"
                              >
                                Cancel Request
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleJoinClick(team._id); }}
                                className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                disabled={isFull}
                              >
                                {isFull ? 'Full' : 'Request to Join'}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTeamCreated={handleDataUpdate} />
      {myTeam && (
        <EditTeamModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onTeamUpdated={handleDataUpdate} teamData={myTeam} currentUser={user} />
      )}
      <TeamDetailsModal isOpen={!!viewingTeam} onClose={() => setViewingTeam(null)} team={viewingTeam} currentUserId={user?._id} onDataUpdate={handleDataUpdate} />
    </div>
  );
}