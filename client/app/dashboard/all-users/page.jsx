'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function AllUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [allowedPlatforms, setAllowedPlatforms] = useState([]);

  useEffect(() => {
    fetchAllowedPlatforms();
    fetchUsers();
    fetchMyTeam();
  }, []);

  // Fetch allowed social platforms (LinkedIn, GitHub, etc.)
  const fetchAllowedPlatforms = async () => {
    try {
      const res = await axios.get('/api/social/config', { withCredentials: true });
      setAllowedPlatforms(res.data.allowedPlatforms || []);
    } catch (err) {
      console.error('Error fetching allowed platforms:', err);
    }
  };

  // Fetch all users
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

  // Fetch my current team
  const fetchMyTeam = async () => {
    try {
      const res = await axios.get('/api/teams/my-team', { withCredentials: true });
      setMyTeam(res.data || null);
    } catch (err) {
      console.error('Error fetching my team:', err);
    }
  };

  // Invite a user to my team
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
      await axios.post(`/api/teams/${myTeam._id}/invite/${userId}`, {}, { withCredentials: true });
      alert('Invitation sent successfully');
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Loading state */}
      {loading && <div className="text-center text-gray-400">Loading users...</div>}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <div className="text-center text-gray-400">No users found.</div>
      )}

      {/* User grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const inTeam = Boolean(u.team);
          const socialProfiles = u.socialProfiles || {};

          return (
            <motion.div
              key={u._id}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-xl bg-slate-800 border border-slate-700 shadow-lg"
            >
              {/* Profile Image */}
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
                  <p className="text-xs text-gray-500">
                    {u.year ? `${u.year}th Year` : 'Year not set'}
                  </p>
                </div>
              </div>

              {/* Dynamic Social Links */}
              {Object.keys(socialProfiles).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {allowedPlatforms.map((platform) => {
                    const url = socialProfiles[platform];
                    if (!url) return null; // Skip empty ones
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 underline capitalize"
                      >
                        {platform}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Invite or status */}
              {inTeam ? (
                <div className="mt-4 text-center text-gray-400">Already in a team</div>
              ) : (
                <button
                  className="mt-4 w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
                  onClick={() => handleInviteUser(u._id)}
                >
                  Invite to Team
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
