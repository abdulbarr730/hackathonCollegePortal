'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

// --- Icon components for a cleaner UI ---
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const ICONS = {
  verify: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z",
  unverify: "M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z",
  makeAdmin: "M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.957 9.957 0 0010 12c-2.31 0-4.438.784-6.131 2.095z",
  removeAdmin: "M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.957 9.957 0 0010 12c-2.31 0-4.438.784-6.131 2.095z",
  changeRole: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
  resetPass: "M15.75 5.25a3 3 0 013 3m3 0a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9h.008v.008H9.75V9z",
  delete: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
};


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
  const pageSize = 15;

  // --- ADDED STATE FOR TEAM FILTER ---
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  // --- ADDED: FETCH TEAMS FOR THE FILTER DROPDOWN ---
  useEffect(() => {
    const fetchTeams = async () => {
      try {
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
  }, [user]);

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

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen bg-slate-900 text-white">Loading...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen bg-slate-900 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Users</h1>
          <p className="mt-1 text-sm text-slate-400">Total users found: {totalUsers}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => handleExport('csv')} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Export CSV</button>
          <button onClick={() => handleExport('xlsx')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors">Export Excel</button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or roll..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="md:col-span-1 rounded-lg border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
          className="rounded-lg border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="">All Teams</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>
      </div>
      
      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-slate-800 p-4 rounded-lg flex flex-wrap items-center gap-4">
            <p className="text-sm font-medium text-white">{selected.length} user(s) selected</p>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => handleBulkAction('verify')} className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors">Verify</button>
                <button onClick={() => handleBulkAction('unverify')} className="rounded-md bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors">Un-verify</button>
                <button onClick={() => handleBulkAction('makeAdmin')} className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors">Make Admin</button>
                <button onClick={() => handleBulkAction('removeAdmin')} className="rounded-md bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors">Remove Admin</button>
                <button onClick={() => handleBulkAction('delete')} className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors">Delete</button>
            </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-800">
        {/* Table Header */}
        <div className="grid grid-cols-15 gap-4 bg-slate-800 p-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" onChange={toggleSelectAll} checked={users.length > 0 && users.every(u => selected.includes(u._id))} className="rounded border-slate-600 bg-slate-700 focus:ring-indigo-500" />
          </div>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Roll Number</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Team</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* User Rows */}
        <div className="divide-y divide-slate-800 bg-slate-900">
          {loading ? (
            <div className="text-center p-8 text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-slate-400">No users found matching your criteria.</div>
          ) : (
            users.map((u) => (
              <div key={u._id} className="grid grid-cols-15 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors">
                <div className="col-span-1">
                  <input type="checkbox" checked={selected.includes(u._id)} onChange={(e) => setSelected(e.target.checked ? [...selected, u._id] : selected.filter(id => id !== u._id))} className="rounded border-slate-600 bg-slate-700 focus:ring-indigo-500" />
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-white truncate">{u.nameWithYear || u.name}</p>
                  <p className="text-sm text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="col-span-2 text-sm text-slate-300">{u.rollNumber || 'N/A'}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                </div>
                <div className="col-span-2 text-sm text-slate-300 capitalize">{u.role || (u.isAdmin ? 'Admin' : 'Student')}</div>
                <div className="col-span-3 text-sm text-slate-300 truncate">{u.teamName || 'No Team'}</div>
                <div className="col-span-2 flex items-center gap-2 justify-end">
                  <button onClick={() => updateUser(u._id, { isVerified: !u.isVerified }, `User ${u.isVerified ? 'un-verified' : 'verified'}`)} title={u.isVerified ? 'Un-verify' : 'Verify'} className={`p-1 rounded-full text-slate-300 hover:text-white transition-colors ${u.isVerified ? 'hover:bg-yellow-500/20' : 'hover:bg-green-500/20'}`}><Icon path={u.isVerified ? ICONS.unverify : ICONS.verify} /></button>
                  <button onClick={() => updateUser(u._id, { isAdmin: !u.isAdmin }, `User ${u.isAdmin ? 'demoted' : 'promoted'}`)} title={u.isAdmin ? 'Remove Admin' : 'Make Admin'} className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-blue-500/20 transition-colors"><Icon path={u.isAdmin ? ICONS.removeAdmin : ICONS.makeAdmin} /></button>
                  <button onClick={() => { const newRole = prompt('Enter new role:', u.role || 'student'); if (newRole) updateUser(u._id, { role: newRole }, `Role updated`); }} title="Change Role" className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-purple-500/20 transition-colors"><Icon path={ICONS.changeRole} /></button>
                  <button onClick={() => { const newPass = prompt('Enter new password:'); if (newPass) updateUser(u._id, { password: newPass }, 'Password reset'); }} title="Reset Password" className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-amber-500/20 transition-colors"><Icon path={ICONS.resetPass} /></button>
                  <button onClick={() => handleDeleteUser(u._id)} title="Delete User" className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-red-500/20 transition-colors"><Icon path={ICONS.delete} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-slate-400">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="rounded-lg bg-slate-800 px-3 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="rounded-lg bg-slate-800 px-3 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
        </div>
      )}
    </div>
  );
}