'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  // --- Auth Context ---
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- State Management ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 15; // users per page

  // --- ADDED STATE FOR TEAM FILTER ---
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(''); // Empty string means "All Teams"

  // --- ADDED: FETCH TEAMS FOR THE FILTER DROPDOWN ---
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // This endpoint should return a simple list of teams [{ _id: '...', name: '...' }]
        const res = await fetch('/api/admin/teams/list', { credentials: 'include' });
        if (!res.ok) throw new Error('Could not fetch teams');
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error(err.message);
      }
    };
    
    if (user && user.isAdmin) {
      fetchTeams();
    }
  }, [user]); // This hook runs once when the user is confirmed

  // --- Fetch Users from Backend ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);

      if (search) params.append('q', search);
      if (filter === 'verified') params.append('verified', 'true');
      if (filter === 'unverified') params.append('verified', 'false');
      if (filter === 'admin') params.append('admin', 'true');
      if (filter === 'nonadmin') params.append('admin', 'false');
      // --- ADDED: INCLUDE TEAM ID IN FETCH REQUEST ---
      if (selectedTeam) params.append('teamId', selectedTeam);

      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data.items || []);
      setTotalPages(data.pagination.pages || 1);
      setTotalUsers(data.pagination.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: Added selectedTeam to dependency array to refetch users on change ---
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    } else if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user, isAuthenticated, authLoading, search, filter, selectedTeam, currentPage, router]);

  // --- Update Single User ---
  const updateUser = async (userId, body, successMsg) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
       if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to update user');
      }
      fetchUsers();
      alert(successMsg);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Delete Single User ---
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This is irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to delete user');
      }
      fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Bulk Action on Selected Users ---
  const handleBulkAction = async (action) => {
    if (selected.length === 0) {
      alert('No users selected.');
      return;
    }

    if (action === 'delete' && !confirm(`Delete ${selected.length} users?`)) return;

    let endpoint = '';
    let body = {};
    if (action === 'verify' || action === 'unverify') {
      endpoint = '/users/bulk-verify';
      body = { ids: selected, isVerified: action === 'verify' };
    } else if (action === 'makeAdmin' || action === 'removeAdmin') {
      endpoint = '/users/bulk-admin';
      body = { ids: selected, isAdmin: action === 'makeAdmin' };
    } else if (action === 'delete') {
      endpoint = '/users/bulk-delete';
      body = { ids: selected };
    }

    try {
      const res = await fetch(`/api/admin${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      fetchUsers();
      setSelected([]);
      alert(`Bulk action '${action}' applied successfully`);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Export Users ---
  const handleExport = (format) => {
    // --- MODIFIED: Added teamId to export parameters ---
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (filter === 'verified') params.append('verified', 'true');
    if (filter === 'unverified') params.append('verified', 'false');
    if (filter === 'admin') params.append('admin', 'true');
    if (filter === 'nonadmin') params.append('admin', 'false');
    if (selectedTeam) params.append('teamId', selectedTeam);

    window.open(`/api/admin/users/export?format=${format}&${params.toString()}`, '_blank');
  };

  // --- Select All in Current Page ---
  const toggleSelectAll = () => {
    const idsOnPage = users.map(u => u._id);
    const allSelected = idsOnPage.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(selected.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelected([...new Set([...selected, ...idsOnPage])]);
    }
  };

  // --- UI ---
  if (authLoading || loading) {
    return <div className="text-center p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Manage Users</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* --- MODIFIED: ADDED TEAM FILTER DROPDOWN --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or roll number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="md:col-span-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="admin">Admins</option>
          <option value="nonadmin">Non-Admins</option>
        </select>
        <select
          value={selectedTeam}
          onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Teams</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleBulkAction('verify')} className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm font-semibold text-white">Bulk Verify</button>
        <button onClick={() => handleBulkAction('unverify')} className="rounded-md bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 text-sm font-semibold text-white">Bulk Un-verify</button>
        <button onClick={() => handleBulkAction('makeAdmin')} className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white">Bulk Make Admin</button>
        <button onClick={() => handleBulkAction('removeAdmin')} className="rounded-md bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white">Bulk Remove Admin</button>
        <button onClick={() => handleBulkAction('delete')} className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-semibold text-white">Bulk Delete</button>
      </div>

      {/* Table Header */}
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <div className="grid grid-cols-14 gap-4 bg-slate-800 p-4 text-sm font-medium text-slate-400">
          <div className="col-span-1">#</div>
          <div className="col-span-1">
            <input
              type="checkbox"
              onChange={toggleSelectAll}
              checked={users.length > 0 && users.every(u => selected.includes(u._id))}
            />
          </div>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Roll Number</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Team</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* User Rows */}
        <div className="divide-y divide-slate-800">
          {users.map((u, index) => (
            <div key={u._id} className="grid grid-cols-14 gap-4 p-4 items-center">
              <div className="col-span-1 text-sm text-slate-300">{(currentPage - 1) * pageSize + index + 1}</div>
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selected.includes(u._id)}
                  onChange={(e) =>
                    setSelected(e.target.checked
                      ? [...selected, u._id]
                      : selected.filter(id => id !== u._id)
                    )
                  }
                />
              </div>
              <div className="col-span-3">
                <p className="font-semibold text-white">{u.nameWithYear || u.name}</p>
                <p className="text-sm text-slate-400">{u.email}</p>
              </div>
              <div className="col-span-2 text-sm text-slate-300">{u.rollNumber || 'N/A'}</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {u.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="col-span-2 text-sm text-slate-300 capitalize">
                {u.role || (u.isAdmin ? 'admin' : 'student')}
              </div>
              <div className="col-span-2 text-sm text-slate-300">
                {u.teamName || 'No Team'}
              </div>
              <div className="col-span-2 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => updateUser(u._id, { isVerified: !u.isVerified }, `User ${u.isVerified ? 'un-verified' : 'verified'} successfully`)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${u.isVerified ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {u.isVerified ? 'Un-verify' : 'Verify'}
                </button>
                <button
                  onClick={() => updateUser(u._id, { isAdmin: !u.isAdmin }, `User ${u.isAdmin ? 'demoted from admin' : 'promoted to admin'}`)}
                  className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button
                  onClick={() => {
                    const newRole = prompt('Enter new role (student, spoc, judge, admin):', u.role || 'student');
                    if (newRole) updateUser(u._id, { role: newRole }, `Role updated to ${newRole}`);
                  }}
                  className="rounded-md bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Change Role
                </button>
                <button
                  onClick={() => {
                    const newPassword = prompt('Enter new password for this user:');
                    if (newPassword) updateUser(u._id, { password: newPassword }, 'Password reset successfully');
                  }}
                  className="rounded-md bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => handleDeleteUser(u._id)}
                  className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Total Users */}
      <div className="text-center mt-2 text-slate-400">
        Showing page {currentPage} of {totalPages} — Total users: {totalUsers}
      </div>
    </div>
  );
}