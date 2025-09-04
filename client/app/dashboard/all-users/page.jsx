'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import useDebounce from '../../hooks/useDebounce';
import SocialBadges from '../../components/SocialBadges';

export default function AllUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const debouncedSearch = useDebounce(searchQuery, 300);

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
    fetchMyTeamAndInvites();
  }, []);

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
      await axios.post(`/api/invitations`, { teamId: myTeam._id, inviteeId: userId }, { withCredentials: true });
      alert('Invitation sent successfully');
      setInvitedUsers(new Set([...invitedUsers, userId]));
    } catch (err) {
      console.error('Error sending invite:', err);
      alert(err.response?.data?.message || 'Failed to send invite');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Users</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 flex flex-col md:flex-row gap-4 md:items-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Courses</option>
          <option value="B.Tech">B.Tech</option>
          <option value="BCA">BCA</option>
          <option value="Diploma">Diploma</option>
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* Loading & Empty State */}
      {loading && <div className="text-center text-gray-400">Loading users...</div>}
      {!loading && users.length === 0 && (
        <div className="text-center text-gray-400">No users match your search/filter.</div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((u) => {
          const inTeam = Boolean(u.team);
          const alreadyInvited = invitedUsers.has(u._id);

          return (
            <motion.div
              key={u._id}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-xl bg-slate-800 border border-slate-700 shadow-lg flex flex-col justify-between transition"
            >
              {/* User Info */}
              <div className="flex flex-col items-center text-center">
                {u.photoUrl ? (
                  <img
                    src={u.photoUrl}
                    alt={u.name}
                    className="w-16 h-16 rounded-full object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="mt-3">
                  <p className="text-lg font-semibold text-white">{u.nameWithYear || u.name}</p>
                  <p className="text-sm text-gray-400">{u.email}</p>
                </div>

                <SocialBadges profiles={u.socialProfiles} className="mt-3" />
              </div>

              {/* Actions */}
              <div className="mt-5">
                {inTeam ? (
                  <div className="text-center text-gray-400 text-sm">Already in a team</div>
                ) : alreadyInvited ? (
                  <div className="text-center text-yellow-400 font-medium animate-pulse text-sm">
                    Invitation Sent
                  </div>
                ) : (
                  <button
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
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
