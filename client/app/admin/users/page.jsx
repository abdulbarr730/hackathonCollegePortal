'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE_URL = ''; // Leave empty, Next.js will proxy /api to backend

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
  const pageSize = 15; // users per page

  // --- Fetch Users from Backend ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (filter === 'verified') params.append('verified', 'true');
      if (filter === 'unverified') params.append('verified', 'false');
      if (filter === 'admin') params.append('admin', 'true');
      if (filter === 'nonadmin') params.append('admin', 'false');

      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      console.log('Fetched Users:', data.items); // Debugging team data
      setUsers(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    } else if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user, isAuthenticated, authLoading, search, filter, router]);

  // --- Update Single User ---
  const updateUser = async (userId, body, successMsg) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update user');
      fetchUsers();
      alert(successMsg);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Delete Single User ---
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u._id !== userId));
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

    window.open(`/api/admin/users/export?${params.toString()}`, '_blank');
  };

  // --- Filter + Search + Pagination ---
  const filteredUsers = users; // Already filtered by backend
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  // --- Select All in Current Page ---
  const toggleSelectAll = () => {
    const idsOnPage = paginatedUsers.map(u => u._id);
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

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by name, email, or roll number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full md:w-1/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="admin">Admins</option>
          <option value="nonadmin">Non-Admins</option>
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
              checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selected.includes(u._id))}
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
          {paginatedUsers.map((u, index) => (
            <div key={u._id} className="grid grid-cols-14 gap-4 p-4 items-center">
              <div className="col-span-1 text-sm text-slate-300">{startIndex + index + 1}</div>
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
    </div>
  );
}
