'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Edit3, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  Sparkles,
  Users,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

const MAX_STAFF_LIMIT = 5;

export default function AdminStaffPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  // Colleges & Selection State
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  // Staff list
  const [staffList, setStaffList] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // Add Form State
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState('spoc');
  const [addPassword, setAddPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit Form State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('spoc');

  // Password Reset State
  const [targetStaffUser, setTargetStaffUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // 1. Fetch Colleges
  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/colleges', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.items || [];
        setColleges(list);

        if (list.length > 0) {
          if (!isSuperAdmin && user?.college) {
            const userColId = String(user.college?._id || user.college);
            setSelectedCollegeId(userColId);
            const found = list.find(c => String(c._id) === userColId);
            setSelectedCollege(found || list[0]);
            setStaffList(found?.staff || []);
          } else {
            setSelectedCollegeId(list[0]._id);
            setSelectedCollege(list[0]);
            setStaffList(list[0]?.staff || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load colleges:', err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // When college changes in selector
  const handleSelectCollege = (colId) => {
    setSelectedCollegeId(colId);
    const found = colleges.find(c => String(c._id) === String(colId));
    setSelectedCollege(found || null);
    setStaffList(found?.staff || []);
  };

  // Helper to generate a strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = (selectedCollege?.shortName || 'CampX').replace(/[^a-zA-Z]/g, '') + '@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    if (staffList.length >= MAX_STAFF_LIMIT) {
      alert(`Maximum limit reached (${MAX_STAFF_LIMIT} staff members). Please remove or demote an existing staff member first.`);
      return;
    }
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddRole('spoc');
    setAddPassword(generatePassword());
    setSendEmail(true);
    setModalError('');
    setShowAddModal(true);
  };

  // Submit Add Staff
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!addName || !addEmail) {
      setModalError('Please fill in both Name and Email.');
      return;
    }
    if (staffList.length >= MAX_STAFF_LIMIT) {
      setModalError(`Maximum limit of ${MAX_STAFF_LIMIT} SPOCs / Admins per college reached.`);
      return;
    }

    try {
      setActionLoading(true);
      setModalError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/colleges/${selectedCollegeId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
          role: addRole,
          password: addPassword,
          sendEmail,
          clientUrl: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || data.message || 'Failed to appoint staff member');
      }

      setShowAddModal(false);
      fetchColleges();
      alert(`Staff appointment confirmed for ${addName}!`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setEditName(staff.name || '');
    setEditPhone(staff.phone || '');
    setEditRole(staff.role || 'spoc');
    setModalError('');
    setShowEditModal(true);
  };

  // Submit Edit Staff
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      setActionLoading(true);
      setModalError('');
      const token = localStorage.getItem('token');
      const userId = editingStaff.user?._id || editingStaff.user || editingStaff._id;

      const res = await fetch(`/api/colleges/${selectedCollegeId}/staff/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          role: editRole
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update staff');

      setShowEditModal(false);
      fetchColleges();
      alert('Staff details updated successfully.');
    } catch (err) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Password Modal
  const handleOpenPassword = (staff) => {
    setTargetStaffUser(staff);
    setNewPassword(generatePassword());
    setModalError('');
    setShowPassModal(true);
  };

  // Submit Password Reset
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!targetStaffUser || !newPassword) return;

    try {
      setActionLoading(true);
      setModalError('');
      const token = localStorage.getItem('token');
      const userId = targetStaffUser.user?._id || targetStaffUser.user;

      if (!userId) {
        throw new Error('User account ID not found for this staff record.');
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to reset password');

      setShowPassModal(false);
      alert(`Password for ${targetStaffUser.name} has been updated to: ${newPassword}`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete / Remove Staff Member
  const handleDeleteStaff = async (staff) => {
    const staffName = staff.name || staff.email;
    if (!confirm(`Are you sure you want to remove ${staffName} from the institutional SPOC / Admin staff roster?`)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = staff.user?._id || staff.user || staff._id;

      const res = await fetch(`/api/colleges/${selectedCollegeId}/staff/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to delete staff member');

      fetchColleges();
      alert(`Staff member ${staffName} removed.`);
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const staffCount = staffList.length;
  const remainingSlots = Math.max(MAX_STAFF_LIMIT - staffCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-indigo-600 dark:text-indigo-400 h-7 w-7" />
            SPOCs &amp; Institutional Administrators
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage designated faculty coordinators, evaluators, and campus administrators (Limit: Max ${MAX_STAFF_LIMIT} staff combined).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchColleges}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Refresh Staff"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={staffCount >= MAX_STAFF_LIMIT}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all ${
              staffCount >= MAX_STAFF_LIMIT
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            <UserPlus size={16} />
            <span>Appoint SPOC / Admin</span>
          </button>
        </div>
      </div>

      {/* College Switcher (for Super Admin) & Quota Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* College Selector / Banner */}
        <div className="lg:col-span-2 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Selected Institution
              </p>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {selectedCollege?.name || 'Loading College...'} {selectedCollege?.shortName ? `(${selectedCollege.shortName})` : ''}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedCollege?.domain || selectedCollege?.website || 'Institution Workspace'}
              </p>
            </div>
          </div>

          {isSuperAdmin && colleges.length > 1 && (
            <div className="sm:w-64">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Switch Institution
              </label>
              <select
                value={selectedCollegeId}
                onChange={(e) => handleSelectCollege(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                {colleges.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.shortName ? `(${c.shortName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quota Progress Card */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Staff Allocation Quota
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {staffCount} / ${MAX_STAFF_LIMIT} Appointed
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  staffCount >= MAX_STAFF_LIMIT 
                    ? 'bg-rose-500' 
                    : staffCount >= 4 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${(staffCount / MAX_STAFF_LIMIT) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-between">
            <span>{remainingSlots} slots remaining</span>
            {staffCount >= MAX_STAFF_LIMIT ? (
              <span className="text-rose-500 font-bold text-[11px]">Maximum reached</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Slots available</span>
            )}
          </p>
        </div>

      </div>

      {/* Staff Roster List */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-600 h-4 w-4" />
            Appointed Staff Roster ({staffCount})
          </h3>
          <span className="text-xs text-slate-400">
            Institutional verification &amp; team management privileges
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-500" />
            <p className="mt-3 text-xs">Loading institutional staff...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Shield size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No Staff Members Appointed Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Appoint your designated SPOC or Campus Administrator to manage internal hackathons, verify students, and oversee squads.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition"
            >
              <UserPlus size={15} />
              Appoint First SPOC
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {staffList.map((staff, idx) => {
              const roleDisplay = (staff.role || 'spoc').toUpperCase();
              const isSpocRole = staff.role === 'spoc';

              return (
                <div 
                  key={staff.email || idx} 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 ${
                      isSpocRole ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'
                    }`}>
                      {(staff.name || 'S').charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {staff.name}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          isSpocRole 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                        }`}>
                          {roleDisplay === 'COLLEGE_ADMIN' ? 'COLLEGE ADMIN' : roleDisplay}
                        </span>
                        {staff.isVerified && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-slate-400" />
                          {staff.email}
                        </span>
                        {staff.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={13} className="text-slate-400" />
                            {staff.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenPassword(staff)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition"
                      title="Reset Password"
                    >
                      <KeyRound size={15} />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition"
                      title="Edit Details"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(staff)}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                      title="Remove Staff Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 1. ADD NEW SPOC / ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Appoint New Staff Member</h3>
                  <p className="text-xs text-slate-400">{selectedCollege?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="spoc@college.edu.in"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Appointed Role *
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="spoc">SPOC (Faculty Coordinator)</option>
                    <option value="college_admin">College Admin (Full Campus Admin)</option>
                    <option value="judge">Judge / Evaluator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-8 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAddPassword(generatePassword())}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      title="Generate new password"
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email dispatch checkbox */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <input
                  type="checkbox"
                  id="sendStaffEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sendStaffEmail" className="text-slate-700 dark:text-slate-200 font-medium cursor-pointer">
                  Email login credentials to this staff member automatically
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 size={16} />}
                  Confirm Appointment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 2. EDIT STAFF MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Staff Details</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Staff Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="spoc">SPOC (Faculty Coordinator)</option>
                  <option value="college_admin">College Admin (Full Campus Admin)</option>
                  <option value="judge">Judge / Evaluator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 3. RESET PASSWORD MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="text-amber-500 h-5 w-5" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Reset Staff Password</h3>
              </div>
              <button onClick={() => setShowPassModal(false)} className="p-2 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set a new login password for <strong>{targetStaffUser?.name}</strong> ({targetStaffUser?.email}).
            </p>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-8 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500"
                    title="Generate new password"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
