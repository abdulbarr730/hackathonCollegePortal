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

  const API = '' || 'http://localhost:5001';

  const fetchTeams = async () => {
    try {
      const res = await fetch(`/api/teams`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/public/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
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
        await fetch(`/api/teams/${teamId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        handleDataUpdate();
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const handleLeaveClick = async () => {
    if (window.confirm('Leave your current team?')) {
      try {
        const res = await fetch(`/api/teams/members/leave`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.msg || 'Leave failed');
        }
        handleDataUpdate();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-3xl font-bold">Loading Dashboard...</h1>
      </div>
    );
  }

  const myTeam = user.team ? teams.find((t) => String(t._id) === String(user.team)) : null;
  const otherTeams = dedupeById(teams.filter((t) => !user.team || String(t._id) !== String(user.team)));
  const myMembers = myTeam ? dedupeById(myTeam.members) : [];

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">
            Welcome, <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
              {user.name}
            </span>
          </h1>
          <p className="mt-2 text-slate-400">
            Manage your team, track updates, explore ideas & access resources.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
          
          {/* Sidebar */}
          <aside className="space-y-6">
            {[
              {
                title: "📢 Official Updates",
                color: "indigo",
                description: "Stay updated with the latest announcements.",
                items: updates,
                buttonText: "View All Updates",
                onClick: () => router.push('/updates'),
              },
              {
                title: "💡 Got an Idea?",
                color: "purple",
                description: "Share proposals and track feedback.",
                buttonText: "Browse Ideas",
                onClick: () => router.push('/ideas'),
              },
              {
                title: "📚 Resource Hub",
                color: "emerald",
                description: "Access curated study materials, guides, and references.",
                buttonText: "Go to Resource Hub",
                onClick: () => router.push('/resources'),
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="relative rounded-xl p-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 animate-border"
              >
                <div className="rounded-xl bg-slate-900/90 p-6">
                  <h3 className={`text-lg font-semibold text-${card.color}-400`}>{card.title}</h3>
                  {card.items ? (
                    card.items.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {card.items.slice(0, 3).map((u) => (
                          <li key={u._id}>
                            <a href={u.url} className="text-sm font-medium hover:text-indigo-300">
                              {u.title}
                            </a>
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
                </div>
              </motion.div>
            ))}
          </aside>

          {/* Main Content */}
          <section>
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
                </div>
              </motion.div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
                You are not part of a team yet. Create one or join an existing team!
              </div>
            )}

            {/* Other Teams */}
            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-bold">All Other Teams</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {otherTeams.map((team) => (
                  <motion.div
                    key={team._id}
                    whileHover={{ scale: 1.02 }}
                    className="relative rounded-lg p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 cursor-pointer"
                    onClick={() => setViewingTeam(team)}
                  >
                    <div className="rounded-lg bg-slate-900/90 p-6">
                      <h3 className="text-lg font-semibold text-indigo-400">{team.teamName}</h3>
                      <p className="mt-2 text-slate-400">Led by {team.leader.name}</p>
                      <p className="mt-4 text-sm text-slate-300">
                        Members: {team.members?.length || 0} / 6
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
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
          onTeamUpdated={handleDataUpdate}
          teamData={myTeam}
          currentUser={user}
        />
      )}
      <TeamDetailsModal
        isOpen={!!viewingTeam}
        onClose={() => setViewingTeam(null)}
        team={viewingTeam}
        currentUserId={user?._id}
        onDataUpdate={handleDataUpdate}
      />
    </div>
  );
}
