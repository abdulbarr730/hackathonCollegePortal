'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Building2, CheckCircle, KeyRound, Loader2, Search, 
  ShieldCheck, XCircle, UserPlus, X, Mail, Phone, Lock, User
} from 'lucide-react';

const emptyForm = {
  name: '',
  shortName: '',
  website: '',
  domain: '',
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
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(emptyForm);

  // Staff Modal State
  const [staffModalCollege, setStaffModalCollege] = useState(null);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('spoc');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

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

  const approveCollege = async (college) => {
    const adminPassword = prompt(`Create temporary password for ${college.spocEmail} (they will be forced to change on first login):`);
    if (!adminPassword) return;

    const res = await fetch(`/api/colleges/approve/${college._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ adminPassword })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Approval failed');
    fetchColleges();
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

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setStaffSaving(true);

    try {
      const res = await fetch(`/api/colleges/${staffModalCollege._id}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          role: staffRole,
          phone: staffPhone,
          password: staffPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to provision staff');

      setStaffSuccess(`Successfully provisioned ${staffRole.toUpperCase()} account for ${staffEmail}. They will be prompted to reset their password on first login.`);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffPassword('');
      fetchColleges();
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            College Governance & Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verify affiliated colleges, manage permissions, and provision College Admin & SPOC accounts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search college or SPOC..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Onboard College Form */}
      <form onSubmit={submitCollege} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
          <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold">Register / Onboard New College</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            ['name', 'College Name *'],
            ['shortName', 'Short Name (e.g. BBDIT)'],
            ['website', 'Website URL'],
            ['domain', 'Official Email Domain'],
            ['city', 'City'],
            ['state', 'State'],
            ['spocName', 'SPOC Name *'],
            ['spocEmail', 'SPOC Email *'],
            ['spocPhone', 'SPOC Phone'],
            ['designation', 'Designation'],
            ['department', 'Department'],
            ['adminPassword', 'Initial Temp Admin Password']
          ].map(([key, label]) => (
            <input
              key={key}
              required={label.includes('*')}
              type={key === 'adminPassword' ? 'password' : 'text'}
              value={form[key]}
              onChange={(e) => updateForm(key, e.target.value)}
              placeholder={label}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Onboard College & Provision Staff
        </button>
      </form>

      {/* College Cards List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
            Loading colleges...
          </div>
        ) : colleges.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400">
            No colleges found matching the selected criteria.
          </div>
        ) : colleges.map((college) => (
          <div key={college._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{college.name}</h3>
                  {college.shortName && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {college.shortName}
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                    college.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                    college.status === 'rejected' ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                    'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {college.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {college.city || 'City not set'}{college.state ? `, ${college.state}` : ''} {college.website ? `• ${college.website}` : ''} {college.aisheCode ? `• AISHE: ${college.aisheCode}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <span><strong>SPOC:</strong> {college.spocName} ({college.spocEmail})</span>
                  <span><strong>Admin Account:</strong> {college.adminUser?.email || 'Not provisioned'}</span>
                  {college.affiliatedUniversity && (
                    <span><strong>Affiliation:</strong> {college.affiliatedUniversity}</span>
                  )}
                  {college.termsAcceptedAt && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      ✓ DPA Signed: {new Date(college.termsAcceptedAt).toLocaleDateString()}
                    </span>
                  )}
                  {college.adminUser?.mustChangePassword && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">• First Login Password Change Pending</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {college.status === 'approved' && (
                  <button
                    onClick={() => {
                      setStaffModalCollege(college);
                      setStaffError('');
                      setStaffSuccess('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold transition-all"
                  >
                    <UserPlus size={15} /> Add Staff / Admin
                  </button>
                )}

                {college.status !== 'approved' && (
                  <button onClick={() => approveCollege(college)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all">
                    <CheckCircle size={15} /> Approve
                  </button>
                )}

                {college.status !== 'rejected' && (
                  <button onClick={() => rejectCollege(college)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all">
                    <XCircle size={15} /> Reject
                  </button>
                )}

                {college.adminUser && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={15} className="text-emerald-500" /> Active SPOC
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff / Admin / SPOC Modal */}
      {staffModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setStaffModalCollege(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 mb-2">
              <UserPlus size={22} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add College Staff</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Provisioning for: <span className="font-bold text-slate-800 dark:text-slate-200">{staffModalCollege.name}</span>
            </p>

            {staffSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5"><CheckCircle size={14} /> Account Created</p>
                <p>{staffSuccess}</p>
              </div>
            )}

            {staffError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
                {staffError}
              </div>
            )}

            <form onSubmit={handleStaffSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Role *</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-medium"
                >
                  <option value="spoc">SPOC (Can export & manage teams, cannot delete users)</option>
                  <option value="college_admin">College Admin (Can manage hackathons, teams & college users)</option>
                  <option value="admin">Super Admin (Platform Level)</option>
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
                  placeholder="rajesh@college.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="Optional phone"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Temporary Initial Password *</label>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="e.g. TempPass@2026"
                  minLength={6}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">
                  🔒 The user will be automatically forced to change this password when they first log in.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStaffModalCollege(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={staffSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-60"
                >
                  {staffSaving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Create & Handoff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
