'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Search, Filter, UserPlus, CheckCircle, ShieldAlert, ArrowLeft, Users, Mail } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import SocialBadges from '../../components/SocialBadges';
import Avatar from '../../components/Avatar';

export default function AllUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState(new Set());
  
  const [activeHackathon, setActiveHackathon] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchActiveHackathon = async () => {
      try {
        const res = await axios.get('/api/hackathon/all');
        const active = res.data.find(h => h.isActive);
        if (active) setActiveHackathon(active);
      } catch (err) {
        console.error('Error fetching active hackathon:', err);
      }
    };
    fetchActiveHackathon();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (courseFilter !== 'all') params.append('course', courseFilter);

      const res = await axios.get(`/api/users?${params.toString()}`, { withCredentials: true });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, yearFilter, courseFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!activeHackathon) return;

    const fetchMyTeamAndInvites = async () => {
      try {
        const res = await axios.get('/api/teams/my-team', { withCredentials: true });
        let team = res.data ? { ...res.data, members: res.data.members || [] } : null;

        if (team && team.hackathonId) {
            const teamHackId = team.hackathonId._id || team.hackathonId;
            if (teamHackId.toString() !== activeHackathon._id.toString()) {
                team = null; 
            }
        }

        setMyTeam(team);

        if (team) {
          const sentRes = await axios.get('/api/invitations/sent', { withCredentials: true });
          const pendingInviteeIds = new Set(sentRes.data.map(inv => inv.inviteeId._id));
          setInvitedUsers(pendingInviteeIds);
        }
      } catch (err) {
        console.error('Error fetching team or sent invites:', err);
      }
    };
    fetchMyTeamAndInvites();
  }, [activeHackathon]);

  const handleInviteUser = async (userId, userName) => {
    if (!myTeam) {
      alert('You must create a new team for this hackathon first.');
      return;
    }

    const maxMembers = activeHackathon?.maxTeamSize || 6;
    const currentMembers = myTeam.members?.length || 0;
    const pendingInvites = invitedUsers.size;
    const totalSlotsUsed = currentMembers + pendingInvites;

    if (totalSlotsUsed >= maxMembers) {
      alert(`Team Limit Reached! \n\nMembers: ${currentMembers}\nPending Invites: ${pendingInvites}\nTotal Slots: ${totalSlotsUsed}/${maxMembers}`);
      return;
    }

    try {
      await axios.post(`/api/invitations`, { teamId: myTeam._id, inviteeId: userId }, { withCredentials: true });
      setInvitedUsers(new Set([...invitedUsers, userId]));
      // POPUP FOR CONFIRMATION
      alert(`Invitation sent to ${userName} successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button onClick={() => router.push('/dashboard')} className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-3">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Teammates</span>
            </h1>
          </div>
          
          {myTeam && (
             <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="flex -space-x-2">
                   {myTeam.members.slice(0,3).map(m => (
                     <Avatar key={m._id} name={m.name} src={m.photoUrl} size={32} className="ring-2 ring-white dark:ring-slate-800" />
                   ))}
                 </div>
                 <div className="text-sm text-slate-900 dark:text-white font-bold">{myTeam.members.length} Members</div>
               </div>
               <div className="flex items-center gap-2 text-sm border-l border-slate-200 dark:border-slate-700 pl-4">
                  <Mail size={16} className="text-indigo-500" />
                  <span className="font-bold text-slate-900 dark:text-white">{invitedUsers.size} Pending</span>
               </div>
             </div>
          )}
        </div>

        {/* FILTERS */}
        <div className="sticky top-20 z-30 mb-8 p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search by name, skills, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 border focus:border-indigo-500 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
            <div className="flex gap-2">
              <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 border-none outline-none">
                <option value="all">All Courses</option><option value="B.Tech">B.Tech</option><option value="BCA">BCA</option><option value="Diploma">Diploma</option>
              </select>
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 border-none outline-none">
                <option value="all">All Years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* USERS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {users.map((u) => {
                const userTeamActive = u.team && activeHackathon && 
                                       (u.team.hackathonId === activeHackathon._id || 
                                        u.team.hackathonId?._id === activeHackathon._id);
                const isTaken = !!userTeamActive;
                const isMyTeamMember = myTeam && myTeam.members.some(m => m._id === u._id);
                const alreadyInvited = invitedUsers.has(u._id);

                return (
                  <motion.div key={u._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }} className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Avatar name={u.name} src={u.photoUrl} size={80} className="shadow-lg" />
                        {isTaken && <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm" title="Already in a team"><ShieldAlert size={16} className="text-slate-400" /></div>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{u.name}</h3>
                      <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{u.course} • {u.year} Year</p>
                      
                      {/* FIXED: ADDED EMAIL DISPLAY */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate w-full px-2" title={u.email}>{u.email}</p>
                      
                      <div className="mt-3"><SocialBadges profiles={u.socialProfiles} /></div>
                    </div>

                    <div className="mt-6">
                      {isMyTeamMember ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center justify-center gap-2"><CheckCircle size={16} /> In Your Squad</div>
                      ) : isTaken ? (
                        <div className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed opacity-70"><ShieldAlert size={16} /> Already Taken</div>
                      ) : alreadyInvited ? (
                        // FIXED: REMOVED CURSOR-WAIT AND PULSE ANIMATION
                        <div className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-bold flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-900/50">
                          <CheckCircle size={16} />
                          Invite Sent
                        </div>
                      ) : (
                        <button onClick={() => handleInviteUser(u._id, u.name)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                          <UserPlus size={16} /> Invite to Squad
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}