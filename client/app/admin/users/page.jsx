'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, ShieldCheck, Mail, AlertCircle, X, Search, Filter,
  Users, Building2, UserCheck, UserX, UserPlus, Key, Trash2
} from 'lucide-react';

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const ICONS = {
  verify: "M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.07a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l4.5-4.5a.75.75 0 00-1.06-1.06L10.75 11.3V6.75z",
  unverify: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
  makeAdmin: "M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.957 9.957 0 0010 12c-2.31 0-4.438.784-6.131 2.095zM17.25 8.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM19 9.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z",
  removeAdmin: "M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.957 9.957 0 0010 12c-2.31 0-4.438.784-6.131 2.095zM17.25 9a.75.75 0 01-.75-.75V7.5a.75.75 0 011.5 0v.75A.75.75 0 0117.25 9z",
  changeRole: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
  resetPass: "M15.75 5.25a3 3 0 013 3m3 0a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9h.008v.008H9.75V9z",
  delete: "M14.74 9l-.346 9.102a2.25 2.25 0 01-2.247 2.047H7.74a2.25 2.25 0 01-2.247-2.047L5.26 9m1.454-.472a.75.75 0 01.996-.528l.738.349 1.458-1.564a.75.75 0 011.171 0l1.458 1.564.737-.349a.75.75 0 01.996.528L15.346 9H4.654zM9.25 10a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0v-4.25a.75.75 0 01.75-.75z"
};

export default function AdminUsersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  const router = useRouter();

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

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');

  // Interactive Verification Confirmation Modal State
  const [verifyModalTarget, setVerifyModalTarget] = useState(null); // null | { type: 'single', user: u } | { type: 'bulk', count: selected.length, ids: selected }
  const [sendEmailPrompt, setSendEmailPrompt] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/admin/teams/list', { headers, credentials: 'include' });
        if (!res.ok) throw new Error('Could not fetch teams');
        const data = await res.json();
        setTeams(data || []);
      } catch (err) {
        console.error(err.message);
      }
    };
    
    const fetchColleges = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/colleges?status=approved', { headers, credentials: 'include' });
        if (!res.ok) throw new Error('Could not fetch colleges');
        const data = await res.json();
        setColleges(data.items || []);
      } catch (err) {
        console.error(err.message);
      }
    };

    if (user && user.isAdmin) {
      fetchTeams();
      if (isSuperAdminUser) fetchColleges();
    }
  }, [user, isSuperAdminUser]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });

      if (search) params.append('search', search);
      if (filter && filter !== 'all') params.append('filter', filter);
      if (selectedTeam) params.append('teamId', selectedTeam);
      if (selectedCollege) params.append('collegeId', selectedCollege);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers,
        credentials: 'include',
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        // fallback
      }
      if (!res.ok) throw new Error(data.msg || 'Failed to fetch users');

      setUsers(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalUsers(data.pagination?.total || 0);
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
  }, [user, isAuthenticated, authLoading, search, filter, selectedTeam, selectedCollege, currentPage, router]);

  const updateUser = async (userId, body, successMsg) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        // fallback
      }
      if (!res.ok) {
        throw new Error(data.msg || data.message || 'Failed to update user');
      }
      fetchUsers();
      alert(successMsg);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        // fallback
      }
      if (!res.ok) {
        throw new Error(data.msg || data.message || 'Failed to delete user');
      }
      fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // Trigger single user verification prompt
  const initiateVerifyUser = (u) => {
    if (u.isVerified) {
      // Un-verifying
      if (confirm(`Un-verify ${u.name}?`)) {
        updateUser(u._id, { isVerified: false, sendEmail: false }, 'User status set to Unverified');
      }
    } else {
      // Verifying -> Open explicit modal prompt
      setVerifyModalTarget({ type: 'single', user: u });
      setSendEmailPrompt(true);
    }
  };

  // Trigger bulk verification prompt
  const initiateBulkVerify = () => {
    if (selected.length === 0) return alert('No users selected.');
    setVerifyModalTarget({ type: 'bulk', count: selected.length, ids: selected });
    setSendEmailPrompt(true);
  };

  // Confirm verification from modal
  const handleConfirmVerification = async () => {
    if (!verifyModalTarget) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      if (verifyModalTarget.type === 'single') {
        const u = verifyModalTarget.user;
        const res = await fetch(`/api/admin/users/${u._id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ isVerified: true, sendEmail: sendEmailPrompt }),
        });
        if (!res.ok) throw new Error('Failed to verify user');
        alert(`${u.name} has been verified successfully${sendEmailPrompt ? ' (Verification email dispatched)' : ''}!`);
      } else {
        const res = await fetch('/api/admin/users/bulk-verify', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ ids: verifyModalTarget.ids, isVerified: true, sendEmail: sendEmailPrompt }),
        });
        if (!res.ok) throw new Error('Failed to bulk verify users');
        alert(`${verifyModalTarget.count} users verified successfully${sendEmailPrompt ? ' (Verification emails dispatched)' : ''}!`);
        setSelected([]);
      }

      setVerifyModalTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selected.length === 0) {
      alert('No users selected.');
      return;
    }

    if (action === 'verify') {
      initiateBulkVerify();
      return;
    }

    if (action === 'delete' && !confirm(`Delete ${selected.length} users permanently?`)) return;

    let endpoint = '';
    let body = {};
    if (action === 'unverify') {
      endpoint = '/users/bulk-verify';
      body = { ids: selected, isVerified: false, sendEmail: false };
    } else if (action === 'makeAdmin' || action === 'removeAdmin') {
      endpoint = '/users/bulk-admin';
      body = { ids: selected, isAdmin: action === 'makeAdmin' };
    } else if (action === 'delete') {
      endpoint = '/users/bulk-delete';
      body = { ids: selected };
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/admin${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
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

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(users.map(u => u._id));
    } else {
      setSelected([]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Institutional Student Directory
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Student &amp; User Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage registrations, perform single/bulk verifications, assign roles, and inspect team rosters.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search by name, roll number or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
        >
          <option value="all">All Verification Statuses</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
          <option value="admin">Admins / SPOCs</option>
          <option value="nonadmin">Students</option>
        </select>
        <select
          value={selectedTeam}
          onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
        >
          <option value="">All Squads &amp; Teams</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name || team.teamName}</option>
          ))}
        </select>
        {isSuperAdminUser && (
          <select
            value={selectedCollege}
            onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
          >
            <option value="">All Colleges (Global)</option>
            {colleges.map(college => (
              <option key={college._id} value={college._id}>{college.shortName || college.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-indigo-50/70 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {selected.length} user(s) selected
            </p>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => handleBulkAction('verify')} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors shadow">
                  ✓ Verify Selected
                </button>
                <button onClick={() => handleBulkAction('unverify')} className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Un-verify
                </button>
                <button onClick={() => handleBulkAction('makeAdmin')} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Make Admin
                </button>
                <button onClick={() => handleBulkAction('delete')} className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Delete
                </button>
            </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-w-[920px] grid grid-cols-15 gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" onChange={toggleSelectAll} checked={users.length > 0 && users.every(u => selected.includes(u._id))} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          </div>
          <div className="col-span-3">User &amp; Email</div>
          <div className="col-span-2">Roll Number</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Assigned Team</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="text-center p-12 text-slate-400 font-bold text-xs">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center p-12 text-slate-400 font-bold text-xs">No users found matching your search.</div>
          ) : (
            users.map((u) => (
              <div key={u._id} className="min-w-[920px] grid grid-cols-15 gap-4 p-4 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="col-span-1">
                  <input type="checkbox" checked={selected.includes(u._id)} onChange={(e) => setSelected(e.target.checked ? [...selected, u._id] : selected.filter(id => id !== u._id))} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{u.nameWithYear || u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="col-span-2 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">{u.rollNumber || 'N/A'}</div>
                <div className="col-span-2">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${u.isVerified ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}>
                    {u.isVerified ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">{u.role || (u.isAdmin ? 'Admin' : 'Student')}</div>
                <div className="col-span-3 text-xs text-slate-600 dark:text-slate-300 truncate">{u.team?.teamName || u.team?.name || 'No Team'}</div>
                <div className="col-span-2 flex items-center gap-1.5 justify-end">
                  <button 
                    onClick={() => initiateVerifyUser(u)} 
                    title={u.isVerified ? 'Un-verify User' : 'Verify Profile (Asks to send email)'} 
                    className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 transition-all ${u.isVerified ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                  >
                    <Icon path={u.isVerified ? ICONS.unverify : ICONS.verify} />
                  </button>
                  <button onClick={() => updateUser(u._id, { isAdmin: !u.isAdmin }, `User ${u.isAdmin ? 'demoted from admin' : 'promoted to admin'}`)} title={u.isAdmin ? 'Remove Admin' : 'Make Admin'} className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"><Icon path={u.isAdmin ? ICONS.removeAdmin : ICONS.makeAdmin} /></button>
                  <button onClick={() => { const newPass = prompt('Enter new password for this user:'); if (newPass) updateUser(u._id, { password: newPass }, 'Password reset successfully'); }} title="Reset Password" className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"><Icon path={ICONS.resetPass} /></button>
                  <button onClick={() => handleDeleteUser(u._id)} title="Delete User" className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"><Icon path={ICONS.delete} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Page {currentPage} of {totalPages} (Total: {totalUsers} users)</span>
            <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {verifyModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {verifyModalTarget.type === 'single'
                    ? `Verify Profile: ${verifyModalTarget.user.name}`
                    : `Verify ${verifyModalTarget.count} Selected Students`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grant verified campus access &amp; team participation rights.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                Do you want to send an official verification email?
              </p>
              
              <label 
                onClick={() => setSendEmailPrompt(true)}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${sendEmailPrompt ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
              >
                <input
                  type="radio"
                  name="sendEmailOption"
                  checked={sendEmailPrompt}
                  onChange={() => setSendEmailPrompt(true)}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    ✉️ Yes, send official verification email
                  </span>
                  <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Dispatches an official account verification notice to the student's email.
                  </span>
                </div>
              </label>

              <label 
                onClick={() => setSendEmailPrompt(false)}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${!sendEmailPrompt ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
              >
                <input
                  type="radio"
                  name="sendEmailOption"
                  checked={!sendEmailPrompt}
                  onChange={() => setSendEmailPrompt(false)}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    🔕 No, verify silently without email
                  </span>
                  <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    Updates status to Verified in database without sending an email notification.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmVerification}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition"
              >
                Confirm &amp; Verify Profile
              </button>
              <button
                onClick={() => setVerifyModalTarget(null)}
                className="px-6 py-3.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
