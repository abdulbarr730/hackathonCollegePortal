'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import axios from 'axios';

// Modals
import CreateTeamModal from '../components/CreateTeamModal';
import EditTeamModal from '../components/EditTeamModal';
import TeamDetailsModal from '../components/TeamDetailsModal';

// Components
import SidebarCards from '../components/dashboard/SidebarCards';
import MyTeamCard from '../components/dashboard/MyTeamCard';
import TeamGrid from '../components/dashboard/TeamGrid';

function dedupeById(list = []) {
  const map = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const id = item && item._id ? String(item._id) : '';
    if (id && !map.has(id)) map.set(id, item);
  }
  return Array.from(map.values());
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function DashboardPage() {
  const { user, isAuthenticated, loading, recheckUser } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [activeHackathon, setActiveHackathon] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [sentInvites, setSentInvites] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);

  // --- API Fetchers ---
  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams`, { credentials: 'include' });
      if (res.ok) setTeams(await res.json());
    } catch (error) { console.error('Failed to fetch teams:', error); }
  }, []);

  const fetchActiveHackathon = useCallback(async () => {
    try {
      const res = await fetch(`/api/hackathon/active`); 
      if (res.ok) setActiveHackathon(await res.json());
    } catch (error) { console.error('Failed to fetch hackathon:', error); }
  }, []);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/updates`);
      if (res.ok) setUpdates(await res.json() || []);
    } catch (error) { console.error('Failed to fetch updates:', error); }
  }, []);

  const fetchSentInvites = useCallback(async () => {
    try {
      const res = await axios.get(`/api/invitations/sent`, { withCredentials: true });
      setSentInvites(res.data || []);
    } catch (error) { console.error('Failed to fetch sent invites:', error); }
  }, []);

  const fetchReceivedInvites = useCallback(async () => {
    try {
      const res = await axios.get(`/api/invitations/my-invitations`, { withCredentials: true });
      setReceivedInvites(res.data || []);
    } catch (error) { console.error('Failed to fetch received invites:', error); }
  }, []);

  const handleDataUpdate = useCallback(() => {
    fetchTeams();
    recheckUser();
    fetchSentInvites();
    fetchReceivedInvites();
  }, [fetchTeams, recheckUser, fetchSentInvites, fetchReceivedInvites]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
      fetchUpdates();
      fetchActiveHackathon();
      fetchSentInvites();
      fetchReceivedInvites();
    }
  }, [isAuthenticated, fetchTeams, fetchUpdates, fetchActiveHackathon, fetchSentInvites, fetchReceivedInvites]);

  // --- BULLTEPROOF TEAM MATCHING ---
  // This memoised block ensures that "test" shows in MyTeamCard, not the general grid.
  const myTeam = useMemo(() => {
    if (!user || teams.length === 0 || !activeHackathon) return null;

    // Search teams for leader ID or member ID that matches current user
    const found = teams.find(t => {
      const leaderId = t.leader?._id || t.leader;
      const isLeader = String(leaderId) === String(user._id);
      const isMember = t.members?.some(m => String(m._id || m) === String(user._id));
      
      // Ensure the team belongs to the CURRENT active hackathon
      const teamHackId = t.hackathonId?._id || t.hackathonId;
      const isCurrentEvent = String(teamHackId) === String(activeHackathon._id);
      
      return (isLeader || isMember) && isCurrentEvent;
    });

    return found || null;
  }, [user, teams, activeHackathon]);

  const otherTeams = useMemo(() => {
    return dedupeById(teams.filter((t) => !myTeam || String(t._id) !== String(myTeam._id)));
  }, [teams, myTeam]);

  const handlers = {
    onDelete: async (teamId) => {
      if (window.confirm('Are you sure you want to delete this team?')) {
        await fetch(`/api/teams/${teamId}`, { method: 'DELETE', credentials: 'include' });
        handleDataUpdate();
      }
    },
    onLeave: async () => {
      if (window.confirm('Leave your current team?')) {
        const res = await fetch(`/api/teams/members/leave`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) handleDataUpdate();
      }
    },
    onJoin: async (teamId) => {
      const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST', credentials: 'include' });
      if (res.ok) handleDataUpdate();
    },
    onCancelJoin: async (teamId) => {
      const res = await fetch(`/api/teams/${teamId}/cancel-request`, { method: 'POST', credentials: 'include' });
      if (res.ok) handleDataUpdate();
    },
    onApprove: async (teamId, userId) => {
      await fetch(`/api/teams/${teamId}/approve/${userId}`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    },
    onReject: async (teamId, userId) => {
      await fetch(`/api/teams/${teamId}/reject/${userId}`, { method: 'POST', credentials: 'include' });
      handleDataUpdate();
    },
    onAcceptInvite: async (inviteId) => {
      const res = await axios.post(`/api/invitations/${inviteId}/accept`, {}, { withCredentials: true });
      if (res.status === 200) handleDataUpdate();
    },
    onRejectInvite: async (inviteId) => {
      const res = await axios.post(`/api/invitations/${inviteId}/reject`, {}, { withCredentials: true });
      if (res.status === 200) fetchReceivedInvites();
    },
    onCancelInvite: async (inviteId) => {
      try {
        await axios.delete(`/api/invitations/${inviteId}`, { withCredentials: true });
        setSentInvites(prev => prev.filter(i => i._id !== inviteId));
      } catch (err) { alert("Failed to cancel invite"); }
    },
    onSubmitTeam: async (teamId) => {
      if (window.confirm('Are you sure? Once submitted, you cannot change members.')) {
        try {
           const res = await fetch(`/api/teams/${teamId}/submit`, { method: 'POST', credentials: 'include' });
           if (res.ok) {
             handleDataUpdate();
             alert("Team submitted successfully!");
           } else {
             const err = await res.json();
             alert(err.message || "Failed to submit team");
           }
        } catch(e) { alert("Network error submitting team"); }
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-bounce text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[200px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          {/* HEADER SECTION */}
          <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                Welcome, <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">{user.name}</span> 👋
              </h1>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Assemble your dream squad.</p>
            </div>
            
            <div className="flex items-center gap-4">
               <button onClick={() => router.push('/dashboard/all-users')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:scale-105 transition-transform">
                 <Search size={18} strokeWidth={2.5} /> Find Teammates
               </button>
               {/* FIXED BADGE: Uses the actual event name for branding */}
               <div className="hidden lg:block bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    📅 {activeHackathon?.name || activeHackathon?.title || "Active Event"}
                  </span>
               </div>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <motion.div variants={itemVariants} className="w-full lg:w-[340px] lg:sticky lg:top-24 shrink-0">
              <SidebarCards updates={updates} router={router} />
            </motion.div>

            <motion.div variants={itemVariants} className="flex-1 w-full space-y-10 min-w-0">
              <MyTeamCard 
                myTeam={myTeam} 
                user={user} 
                handlers={handlers} 
                hackathon={activeHackathon}
                sentInvites={sentInvites}
                receivedInvites={receivedInvites}
                teams={teams}
                setIsCreateModalOpen={setIsCreateModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                setViewingTeam={setViewingTeam}
                router={router}
              />

              <div className="pt-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-indigo-500">⚡</span> Active Squads
                  </h2>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">{otherTeams.length} TEAMS</span>
                </div>
                <TeamGrid otherTeams={otherTeams} user={user} myTeam={myTeam} handlers={handlers} setViewingTeam={setViewingTeam} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTeamCreated={handleDataUpdate} />
      {myTeam && <EditTeamModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onTeamUpdated={handleDataUpdate} teamData={myTeam} currentUser={user} />}
      <TeamDetailsModal isOpen={!!viewingTeam} onClose={() => setViewingTeam(null)} team={viewingTeam} currentUserId={user?._id} onDataUpdate={handleDataUpdate} />
    </div>
  );
}