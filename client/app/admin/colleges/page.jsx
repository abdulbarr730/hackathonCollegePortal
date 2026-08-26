'use client';

import { useEffect, useState } from 'react';
import { 
  Building2, CheckCircle, KeyRound, Loader2, Search, 
  ShieldCheck, XCircle, UserPlus, X, Mail, Phone, Lock, 
  User, Globe, Edit3, Trash2, Shield, Send, CheckCircle2,
  AlertCircle, RefreshCw, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  shortName: '',
  website: '',
  domain: '',
  hasCustomDomain: true,
  allowGenericEmails: false,
  city: '',
  state: '',
  spocName: '',
  spocEmail: '',
  spocPhone: '',
  designation: '',
  department: '',
  adminPassword: ''
};

export default function AdminCollegesPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdminUser = currentUser?.role === 'super_admin' || 
    ['abdulbarr730@gmail.com'].includes(currentUser?.email?.toLowerCase()) ||
    (currentUser?.isAdmin && currentUser?.role === 'admin' && !currentUser?.college);

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(emptyForm);

  // Staff Modal State
  const [staffModalCollege, setStaffModalCollege] = useState(null);
  const [activeStaffTab, setActiveStaffTab] = useState('search'); // 'search' | 'invite'
  const [worldwideQuery, setWorldwideQuery] = useState('');
  const [worldwideResults, setWorldwideResults] = useState([]);
  const [worldwideSearching, setWorldwideSearching] = useState(false);

  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('spoc');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffStep, setStaffStep] = useState('form'); // 'form' | 'otp'
  const [staffOtp, setStaffOtp] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null); // { collegeId, staff }
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('spoc');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffSaving, setEditStaffSaving] = useState(false);

  // Edit College Settings Modal
  const [settingsModalCollege, setSettingsModalCollege] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  // Approve & Provision Modal State
  const [approveModalCollege, setApproveModalCollege] = useState(null);
  const [approvePassword, setApprovePassword] = useState('');
  const [approveRole, setApproveRole] = useState('spoc');
  const [approveSendEmail, setApproveSendEmail] = useState(true);
  const [approveSaving, setApproveSaving] = useState(false);
  const [approveError, setApproveError] = useState('');


  const fetchColleges = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (status !== 'all') params.set('status', status);

    try {
      const res = await fetch(`/api/colleges?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to fetch colleges');
      setColleges(data.items || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [query, status]);

  // Worldwide Search for Users
  useEffect(() => {
    if (worldwideQuery.trim().length < 2) {
      setWorldwideResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setWorldwideSearching(true);
      try {
        const res = await fetch(`/api/colleges/users/search?q=${encodeURIComponent(worldwideQuery.trim())}`, {
          credentials: 'include'
        });
        const data = await res.json();
        setWorldwideResults(data.items || []);
      } catch {
        setWorldwideResults([]);
      } finally {
        setWorldwideSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [worldwideQuery]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitCollege = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/colleges/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'College onboarding failed');
      setForm(emptyForm);
      fetchColleges();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

    const generateRandomPassword = (shortName) => {
    const prefix = (shortName || 'CampX').replace(/[^a-zA-Z0-9]/g, '') || 'CampX';
    return `${prefix}@${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const openApproveModal = (college) => {
    setApproveModalCollege(college);
    setApprovePassword(generateRandomPassword(college.shortName || college.name));
    setApproveRole('spoc');
    setApproveSendEmail(true);
    setApproveError('');
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveModalCollege) return;
    if (!approvePassword || approvePassword.length < 6) {
      setApproveError('Please specify an initial password of at least 6 characters.');
      return;
    }

    setApproveSaving(true);
    setApproveError('');

    try {
      const res = await fetch(`/api/colleges/approve/${approveModalCollege._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adminPassword: approvePassword,
          role: approveRole,
          sendEmail: approveSendEmail,
          clientUrl: typeof window !== 'undefined' ? window.location.origin : 'https://www.campxcode.in'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to approve and provision college.');
      setApproveModalCollege(null);
      fetchColleges();
    } catch (err) {
      setApproveError(err.message);
    } finally {
      setApproveSaving(false);
    }
  };

  const rejectCollege = async (college) => {
    const reason = prompt(`Reason for rejecting ${college.name}:`, college.rejectedReason || '');
    if (reason === null) return;

    const res = await fetch(`/api/colleges/reject/${college._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Reject failed');
    fetchColleges();
  };

  // Step 1: Send Staff Invite OTP
  const handleSendStaffOtp = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setStaffSaving(true);

    try {
      const res = await fetch(`/api/colleges/${staffModalCollege._id}/staff/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          role: staffRole,
          phone: staffPhone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.message || 'Failed to dispatch staff OTP verification');

      setStaffSuccess(`Verification code dispatched to ${staffEmail}. Please enter the 6-digit code below.`);
      setStaffStep('otp');
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  // Step 2: Verify Staff OTP & Finalize
  const handleVerifyStaffOtp = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setStaffSaving(true);

    try {
      const res = await fetch(`/api/colleges/${staffModalCollege._id}/staff/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: staffEmail,
          otp: staffOtp,
          password: staffPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.message || 'Failed to verify staff OTP');

      setStaffSuccess(`${staffRole.toUpperCase()} verified and appointed successfully!`);
      setTimeout(() => {
        setStaffModalCollege(null);
        setStaffStep('form');
        setStaffName('');
        setStaffEmail('');
        setStaffOtp('');
        setStaffPassword('');
        fetchColleges();
      }, 1500);
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  // Edit Staff Member
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditStaffSaving(true);
    try {
      const userId = editingStaff.staff.user?._id || editingStaff.staff.user;
      const res = await fetch(`/api/colleges/${editingStaff.collegeId}/staff/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editStaffName,
          role: editStaffRole,
          phone: editStaffPhone
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update staff');
      setEditingStaff(null);
      fetchColleges();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditStaffSaving(false);
    }
  };

  // Delete / Demote Staff Member
  const handleDeleteStaff = async (collegeId, userId, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from college staff permissions? Their account will be demoted to a student.`)) return;
    try {
      const res = await fetch(`/api/colleges/${collegeId}/staff/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to remove staff');
      fetchColleges();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update College Settings
  const handleSaveCollegeSettings = async (e) => {
    e.preventDefault();
    if (!settingsModalCollege) return;
    setSettingsSaving(true);
    try {
      const res = await fetch(`/api/colleges/${settingsModalCollege._id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update college settings');
      setSettingsModalCollege(null);
      fetchColleges();
    } catch (err) {
      alert(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            College Governance & Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure institutional domains, worldwide user search, and OTP-verified SPOC & Admin appointments.
          </p>
        </div>
        
        {isSuperAdminUser && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search college, domain or SPOC..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved &amp; Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Super Admin Quick Onboarding Form */}
      {isSuperAdminUser && (
        <form onSubmit={submitCollege} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold">Register / Onboard New College</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="College Name *"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => updateForm('shortName', e.target.value)}
              placeholder="Short Name (e.g. BBDIT)"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.domain}
              onChange={(e) => updateForm('domain', e.target.value)}
              placeholder="Official Domain (e.g. bbdit.edu.in)"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateForm('city', e.target.value)}
              placeholder="City (e.g. Ghaziabad)"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              required
              type="text"
              value={form.spocName}
              onChange={(e) => updateForm('spocName', e.target.value)}
              placeholder="SPOC Full Name *"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              required
              type="email"
              value={form.spocEmail}
              onChange={(e) => updateForm('spocEmail', e.target.value)}
              placeholder="SPOC Email Address *"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.spocPhone}
              onChange={(e) => updateForm('spocPhone', e.target.value)}
              placeholder="SPOC Phone Number"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) => updateForm('adminPassword', e.target.value)}
              placeholder="Initial Temp Admin Password"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Onboard College
          </button>
        </form>
      )}

      {/* College Cards List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400">
            <Loader2 size={28} className="animate-spin mx-auto mb-2 text-indigo-500" />
            Loading institutions and staff rosters...
          </div>
        ) : colleges.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400">
            No colleges found matching the selected criteria.
          </div>
        ) : colleges.map((college) => (
          <div key={college._id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            
            {/* Header & Meta */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{college.name}</h3>
                  {college.shortName && (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/50">
                      {college.shortName}
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold capitalize ${
                    college.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                    college.status === 'rejected' ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                    'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {college.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{college.city || 'City N/A'}{college.state ? `, ${college.state}` : ''}</span>
                  {college.website && <span>• <a href={college.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{college.website}</a></span>}
                  {college.aisheCode && <span>• AISHE: <strong className="text-slate-700 dark:text-slate-300 font-mono">{college.aisheCode}</strong></span>}
                </p>

                {/* Domain Pill */}
                <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                  {college.hasCustomDomain && college.domain ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-mono font-medium">
                      <Globe size={13} /> Domain: @{college.domain}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 font-medium">
                      <CheckCircle2 size={13} /> Generic Emails Allowed (OTP Enforced)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSettingsModalCollege(college);
                    setSettingsForm({
                      name: college.name,
                      shortName: college.shortName || '',
                      domain: college.domain || '',
                      hasCustomDomain: !!college.hasCustomDomain,
                      allowGenericEmails: !!college.allowGenericEmails,
                      website: college.website || '',
                      city: college.city || '',
                      state: college.state || '',
                      aisheCode: college.aisheCode || ''
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
                >
                  <Edit3 size={14} /> Domain &amp; Settings
                </button>

                <button
                  onClick={() => {
                    setStaffModalCollege(college);
                    setStaffStep('form');
                    setActiveStaffTab('search');
                    setWorldwideQuery('');
                    setWorldwideResults([]);
                    setStaffName('');
                    setStaffEmail('');
                    setStaffRole('spoc');
                    setStaffPhone('');
                    setStaffPassword('');
                    setStaffError('');
                    setStaffSuccess('');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
                >
                  <UserPlus size={15} /> Add SPOC / Admin
                </button>

                {isSuperAdminUser && college.status !== 'approved' && (
                  <button onClick={() => openApproveModal(college)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all">
                    <CheckCircle size={15} /> Approve
                  </button>
                )}

                {isSuperAdminUser && college.status !== 'rejected' && (
                  <button onClick={() => rejectCollege(college)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all">
                    <XCircle size={15} /> Reject
                  </button>
                )}
              </div>
            </div>

            {/* Staff & SPOC Management Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                  Appointed SPOCs &amp; Administrative Staff ({college.staff?.length || 0})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(!college.staff || college.staff.length === 0) ? (
                  <div className="col-span-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No dedicated SPOC or admin assigned yet. Click "Add SPOC / Admin" to appoint one.
                  </div>
                ) : (
                  college.staff.map((s, idx) => {
                    const userId = s.user?._id || s.user;
                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                              {s.name || s.email}
                            </span>
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {s.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{s.email}</p>
                          {s.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{s.phone}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                          {s.isVerified !== false ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                              <AlertCircle size={13} /> Pending OTP
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStaff({ collegeId: college._id, staff: s });
                                setEditStaffName(s.name || '');
                                setEditStaffRole(s.role || 'spoc');
                                setEditStaffPhone(s.phone || '');
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Edit Staff Member"
                            >
                              <Edit3 size={14} />
                            </button>
                            {userId && (
                              <button
                                onClick={() => handleDeleteStaff(college._id, userId, s.name || s.email)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                                title="Remove Staff Member"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add Staff / SPOC Modal (Worldwide Search & OTP Flow) */}
      {staffModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setStaffModalCollege(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 mb-1">
              <UserPlus size={22} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appoint SPOC or College Admin</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Institution: <strong className="text-slate-800 dark:text-slate-200">{staffModalCollege.name}</strong>
            </p>

            {staffSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Success</p>
                <p>{staffSuccess}</p>
              </div>
            )}

            {staffError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
                {staffError}
              </div>
            )}

            {staffStep === 'form' ? (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveStaffTab('search')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      activeStaffTab === 'search'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Worldwide User Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStaffTab('invite')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      activeStaffTab === 'invite'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Invite New Email
                  </button>
                </div>

                {activeStaffTab === 'search' && (
                  <div className="space-y-3">
                    <label className="relative block">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={worldwideQuery}
                        onChange={(e) => setWorldwideQuery(e.target.value)}
                        placeholder="Type registered name, email, or roll number..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    {worldwideSearching && (
                      <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-indigo-500" /> Searching users across platform...
                      </div>
                    )}

                    {!worldwideSearching && worldwideResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                        {worldwideResults.map((u) => (
                          <div key={u._id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                              <p className="text-slate-500 font-mono">{u.email}</p>
                              {u.college && <p className="text-[11px] text-indigo-600">{u.college.shortName || u.college.name}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setStaffName(u.name);
                                setStaffEmail(u.email);
                                setStaffPhone(u.phone || '');
                                setWorldwideQuery('');
                                setWorldwideResults([]);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100"
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSendStaffOtp} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Role *</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-medium"
                    >
                      <option value="spoc">SPOC (Manages and exports teams for this college)</option>
                      <option value="college_admin">College Admin (Institutional Governance)</option>
                      <option value="admin">Platform Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="spoc@bbdit.edu.in or user@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="Optional phone number"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffModalCollege(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={staffSaving}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {staffSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Verification OTP Email
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyStaffOtp} className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                  <p className="font-bold">An appointment verification code was dispatched to:</p>
                  <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-300">{staffEmail}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">6-Digit OTP Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={staffOtp}
                    onChange={(e) => setStaffOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center text-xl font-bold tracking-widest font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Optional Initial Password</label>
                  <input
                    type="text"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Leave blank for default password (Staff@1234)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="pt-3 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffStep('form')}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={staffSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {staffSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Verify OTP &amp; Confirm Staff
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Staff Details</h3>

            <form onSubmit={handleUpdateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Role</label>
                <select
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                >
                  <option value="spoc">SPOC</option>
                  <option value="college_admin">College Admin</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStaffSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-60"
                >
                  {editStaffSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Domain & Settings Modal */}
      {settingsModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSettingsModalCollege(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Institutional Domain &amp; Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{settingsModalCollege.name}</p>

            <form onSubmit={handleSaveCollegeSettings} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Domain Matching Strategy
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settingsForm.hasCustomDomain}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, hasCustomDomain: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enforce Official Custom Domain for this institution</span>
                </label>

                {settingsForm.hasCustomDomain && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Official Domain</label>
                    <input
                      type="text"
                      value={settingsForm.domain}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="e.g. bbdit.edu.in"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowGenericEmails}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, allowGenericEmails: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow standard generic emails (Gmail, Yahoo, etc.) with OTP</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={settingsForm.shortName}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, shortName: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">AISHE Code</label>
                  <input
                    type="text"
                    value={settingsForm.aisheCode}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, aisheCode: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Website URL</label>
                <input
                  type="url"
                  value={settingsForm.website}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    value={settingsForm.state}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalCollege(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-60"
                >
                  {settingsSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Super Admin College Approval & SPOC Provisioning Modal */}
      {approveModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            
            <button
              onClick={() => setApproveModalCollege(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Approve &amp; Provision College
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify institution credentials and generate SPOC admin access.
                </p>
              </div>
            </div>

            {approveError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{approveError}</span>
              </div>
            )}

            {/* Institution Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-bold text-slate-900 dark:text-white">{approveModalCollege.name} ({approveModalCollege.shortName || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nodal SPOC:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{approveModalCollege.spocName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SPOC Email:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{approveModalCollege.spocEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Domain Policy:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{approveModalCollege.domain || (approveModalCollege.allowGenericEmails ? 'Generic Emails' : 'Custom Domain')}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-5">
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Assigned Administrative Role
                </label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="spoc">SPOC (Single Point of Contact - Team Approvals)</option>
                  <option value="college_admin">College Admin (Full Campus Administration)</option>
                </select>
              </div>

              {/* Password Setting */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Set Initial SPOC Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setApprovePassword(generateRandomPassword(approveModalCollege.shortName || approveModalCollege.name))}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={approvePassword}
                    onChange={(e) => setApprovePassword(e.target.value)}
                    placeholder="Enter or generate initial password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum 6 characters. SPOC will be prompted to change upon first login.
                </p>
              </div>

              {/* Dispatch Email Checkbox */}
              <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveSendEmail}
                    onChange={(e) => setApproveSendEmail(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Send credentials to SPOC via Email
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Dispatches an official welcome email to <strong className="font-mono text-slate-700 dark:text-slate-300">{approveModalCollege.spocEmail}</strong> containing their username, initial password, and portal link.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalCollege(null)}
                  disabled={approveSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {approveSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Approve &amp; Provision Access</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
