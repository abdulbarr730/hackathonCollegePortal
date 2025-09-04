'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
// --- MODIFIED: Removed icons that are now handled by SocialBadges ---
// --- ADDED: Import the SocialBadges component ---
import SocialBadges from '../../components/SocialBadges';

export default function AllUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchMyTeamAndInvites();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', { withCredentials: true });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeamAndInvites = async () => {
    try {
      const res = await axios.get('/api/teams/my-team', { withCredentials: true });
      const team = res.data ? { ...res.data, members: res.data.members || [] } : null;
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

  const handleInviteUser = async (userId) => {
    if (!myTeam) {
        alert('You must create a team first before sending invites.');
        return;
    }
    const remainingSpots = 6 - (myTeam.members?.length || 0);
    if (remainingSpots <= 0) {
        alert('Your team is full. You cannot invite more members.');
        return;
    }
    try {
        await axios.post(`/api/invitations/${myTeam._id}/${userId}`, {}, { withCredentials: true });
        alert('Invitation sent successfully');
        setInvitedUsers(new Set([...invitedUsers, userId]));
    } catch (err) {
        console.error('Error sending invite:', err);
        alert(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const getYearLabel = (year) => {
    switch (String(year)) {
      case '1': return '1st Year';
      case '2': return '2nd Year';
      case '3': return '3rd Year';
      case '4': return '4th Year';
      default: return 'Year not set';
    }
  };

  // --- REMOVED: The getPlatformIcon function is now handled by the SocialBadges component ---

  /** Filtered list of users */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // --- ADDED: Permanent filter to only show users with the 'student' role ---
      const isStudent = u.role === 'student';

      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesYear =
        yearFilter === 'all' ? true : String(u.year) === String(yearFilter);
        
      // A user must be a student AND match other filters to be displayed.
      return isStudent && matchesSearch && matchesYear;
    });
  }, [users, searchQuery, yearFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Users</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-1/2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="w-full sm:w-40 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {loading && <div className="text-center text-gray-400">Loading users...</div>}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center text-gray-400">No users match your search/filter.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => {
          const inTeam = Boolean(u.team);
          const alreadyInvited = invitedUsers.has(u._id);

          return (
            <motion.div
              key={u._id}
              whileHover={{ scale: 1.02 }}
              // Added flex classes for better layout with the button at the bottom
              className="p-5 rounded-xl bg-slate-800 border border-slate-700 shadow-lg flex flex-col justify-between"
            >
              {/* Wrapper for the top content */}
              <div>
                <div className="flex items-center gap-3">
                  {u.photoUrl ? (
                    <img
                      src={u.photoUrl}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-600"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-white">{u.name}</p>
                    <p className="text-sm text-gray-400">{u.email}</p>
                    <p className="text-xs text-gray-500">{getYearLabel(u.year)}</p>
                  </div>
                </div>

                {/* --- REPLACED: The old social link logic with the new SocialBadges component --- */}
                <SocialBadges profiles={u.socialProfiles} className="mt-4" />
              </div>

              {/* Wrapper for the bottom content (button) */}
              <div>
                {inTeam ? (
                  <div className="mt-4 text-center text-gray-400">Already in a team</div>
                ) : alreadyInvited ? (
                  <div className="mt-4 text-center text-yellow-400 font-medium animate-pulse">
                    Invitation Sent
                  </div>
                ) : (
                  <button
                    className="mt-4 w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
                    onClick={() => handleInviteUser(u._id)}
                  >
                    Invite to Team
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}