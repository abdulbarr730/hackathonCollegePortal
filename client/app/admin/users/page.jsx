'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/admin/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
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
  }, [user, isAuthenticated, authLoading, router]);

  const updateUser = async (userId, body, successMsg) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
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

  const handleExport = (format) => {
    window.open(`http://localhost:5001/api/admin/users/export.${format}`, '_blank');
  };

  if (authLoading || loading) {
    return <div className="text-center p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Manage Users</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600">Export CSV</button>
          <button onClick={() => handleExport('xlsx')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">Export Excel</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700">
        <div className="grid grid-cols-12 gap-4 bg-slate-800 p-4 text-sm font-medium text-slate-400">
          <div className="col-span-3">User</div>
          <div className="col-span-2">Roll Number</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-800">
          {users.map((u) => (
            <div key={u._id} className="grid grid-cols-12 gap-4 p-4 items-center">
              {/* User info */}
              <div className="col-span-3">
                <p className="font-semibold text-white">{u.nameWithYear || u.name}</p>
                <p className="text-sm text-slate-400">{u.email}</p>
              </div>

              {/* Roll Number */}
              <div className="col-span-2 text-sm text-slate-300">{u.rollNumber || 'N/A'}</div>

              {/* Status */}
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {u.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>

              {/* Role */}
              <div className="col-span-2 text-sm text-slate-300 capitalize">
                {u.role || (u.isAdmin ? 'admin' : 'student')}
              </div>

              {/* Actions */}
              <div className="col-span-3 flex flex-wrap gap-2 justify-end">
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
                    const newRole = prompt('Enter new role (student, leader, admin):', u.role || 'student');
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
    </div>
  );
}
