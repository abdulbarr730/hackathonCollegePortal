'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Trophy, Pencil, X, Lock, Venus, Loader2, Clock, CheckCircle, Trash2, Users, ShieldCheck, Building2
} from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext'; 
import { useAuth } from '../../context/AuthContext';

export default function AdminHackathonsPage() {
  const { user } = useAuth();
  const isSuperAdminUser = user?.role === 'super_admin' || 
    user?.email?.toLowerCase() === 'abdulbarr730@gmail.com' ||
    (user?.isAdmin && user?.role === 'admin' && !user?.college);

  const [hackathons, setHackathons] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { refreshEvent } = useHackathon(); 

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', shortName: '', tagline: '', 
    college: '',
    startDate: '', 
    submissionDeadline: '',
    minTeamSize: 6, 
    maxTeamSize: 6, 
    minFemaleMembers: 1,
    isActive: false
  });

  const formatForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchHackathons = async () => {
    try {
      const res = await fetch('/api/hackathon/all', { credentials: 'include' });
      const data = await res.json();
      setHackathons(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Fetch hackathons failed", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/colleges?status=approved', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setColleges(data.items || []);
    } catch (err) { 
      console.error("College fetch failed", err); 
    }
  };

  useEffect(() => { 
    fetchHackathons(); 
    if (isSuperAdminUser) fetchColleges(); 
  }, [isSuperAdminUser]);

  const handleEditClick = (h) => {
    setFormData({
      name: h.name,
      shortName: h.shortName,
      tagline: h.tagline || '',
      college: h.college?._id || h.college || '',
      startDate: formatForInput(h.startDate), 
      submissionDeadline: formatForInput(h.submissionDeadline),
      minTeamSize: h.minTeamSize || 6,
      maxTeamSize: h.maxTeamSize || 6,
      minFemaleMembers: h.minFemaleMembers !== undefined ? h.minFemaleMembers : 1,
      isActive: h.isActive
    });
    setIsEditing(true);
    setEditId(h._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `/api/hackathon/update/${editId}` : '/api/hackathon/create';
    const method = isEditing ? 'PUT' : 'POST';
    
    const payload = {
      ...formData,
      minTeamSize: Number(formData.minTeamSize) || 6,
      maxTeamSize: Number(formData.maxTeamSize) || 6,
      minFemaleMembers: Number(formData.minFemaleMembers) || 0
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      resetForm();
      fetchHackathons();
      refreshEvent();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.msg || 'Failed to save hackathon');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', shortName: '', tagline: '', startDate: '', submissionDeadline: '',
      college: '',
      minTeamSize: 6, maxTeamSize: 6, minFemaleMembers: 1, isActive: false 
    });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const handleActivate = async (id) => {
    if(!confirm("Set this as the LIVE event for your college?")) return;
    const res = await fetch(`/api/hackathon/set-active/${id}`, { 
      method: 'PUT',
      credentials: 'include' 
    });
    if (res.ok) { 
      fetchHackathons(); 
      refreshEvent(); 
    }
  };

  const handleBulkLock = async (id) => {
    if(prompt("Type 'LOCK' to freeze submissions") !== 'LOCK') return;
    const res = await fetch('/api/hackathon/lock-all-teams', {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include',
      body: JSON.stringify({ hackathonId: id })
    });
    const data = await res.json();
    alert(data.msg || 'Teams locked successfully');
    fetchHackathons();
  };

  const handleDeleteHackathon = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the hackathon "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/hackathon/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to delete hackathon');
      fetchHackathons();
      refreshEvent();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Multi-College Hackathon Operations
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Internal Hackathon Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configure edition rules, squad sizes, mandatory female member quotas, and submission lock deadlines.
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> + New Edition
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 space-y-6">
          <button onClick={resetForm} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"><X size={20}/></button>
          
          <h3 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Trophy className="text-indigo-600 dark:text-indigo-400" size={22} />
            {isEditing ? 'Modify Hackathon Edition' : 'Create New Hackathon Edition'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Event Name & Short Label */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Event Full Name *
                </label>
                <input 
                  required 
                  placeholder="e.g. Smart India Hackathon 2026 Internal Round" 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm outline-none focus:ring-2 ring-indigo-500/20 text-slate-900 dark:text-white" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Short Tag / Label *
                </label>
                <input 
                  required 
                  placeholder="e.g. SIH 2026" 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm outline-none focus:ring-2 ring-indigo-500/20 text-slate-900 dark:text-white" 
                  value={formData.shortName} 
                  onChange={e => setFormData({...formData, shortName: e.target.value})} 
                />
              </div>
            </div>

            {/* Super Admin College Selector */}
            {isSuperAdminUser && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Building2 size={14} className="text-indigo-500" />
                  Target College Campus (Super Admin Only)
                </label>
                <select 
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm outline-none focus:ring-2 ring-indigo-500/20 text-slate-900 dark:text-white cursor-pointer" 
                  value={formData.college} 
                  onChange={e => setFormData({...formData, college: e.target.value})}
                >
                  <option value="">Platform / Global Event (All Colleges)</option>
                  {colleges.map(college => (
                    <option key={college._id} value={college._id}>{college.name} ({college.shortName})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Calendar size={14} /> Start / Reference Date *
                </label>
                <input 
                  required 
                  type="datetime-local" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm outline-none text-slate-900 dark:text-white" 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sets the official start and archive year.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Clock size={14} /> Submission &amp; Edit Freezing Deadline *
                </label>
                <input 
                  required 
                  type="datetime-local" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm outline-none text-slate-900 dark:text-white" 
                  value={formData.submissionDeadline} 
                  onChange={e => setFormData({...formData, submissionDeadline: e.target.value})} 
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Team edits and problem statement submissions lock automatically after this time.</p>
              </div>
            </div>

            {/* Squad Size & Female Quota Rules */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Squad Constraints &amp; Rules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Users size={14} /> Minimum Team Size
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none" 
                    value={formData.minTeamSize} 
                    onChange={e => setFormData({...formData, minTeamSize: e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">SIH Standard: 6 members</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Users size={14} /> Maximum Team Size
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none" 
                    value={formData.maxTeamSize} 
                    onChange={e => setFormData({...formData, maxTeamSize: e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">SIH Standard: 6 members</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 mb-1 flex items-center gap-1.5">
                    <Venus size={14} /> Min Female Coders
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="6"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none" 
                    value={formData.minFemaleMembers} 
                    onChange={e => setFormData({...formData, minFemaleMembers: e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">SIH Mandatory: At least 1 female</p>
                </div>

              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="submit" 
                className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-wider hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition text-xs"
              >
                Save Hackathon Configuration
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-8 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST VIEW */}
      <div className="grid gap-4">
        {hackathons.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
            <Trophy size={36} className="mx-auto mb-3 opacity-40 text-indigo-500" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No hackathon editions found for your college.</p>
            <p className="text-xs text-slate-500 mt-1">Click "+ New Edition" above to create an internal hackathon round.</p>
          </div>
        ) : (
          hackathons.map((h) => (
            <div key={h._id} className={`p-6 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${h.isActive ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-1 ring-indigo-500/30' : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
              <div className="flex items-start gap-4 sm:gap-6 w-full min-w-0">
                <div className={`p-4 rounded-2xl shrink-0 ${h.isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Trophy size={28} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight truncate">{h.name}</h3>
                    {h.isActive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase">
                        Live Edition
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-slate-400 pt-1">
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Building2 size={13}/> {h.college?.shortName || h.college?.name || 'Global'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-indigo-500"/> Year: {h.startDate ? new Date(h.startDate).getFullYear() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-rose-500"/> Lock: {h.submissionDeadline ? new Date(h.submissionDeadline).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-slate-500"/> Squad: {h.minTeamSize}-{h.maxTeamSize} (Min {h.minFemaleMembers || 0} ♀)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
                <button onClick={() => handleEditClick(h)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300" title="Edit Hackathon">
                  <Pencil size={18} />
                </button>
                
                <button onClick={() => handleDeleteHackathon(h._id, h.name)} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-all" title="Delete Hackathon">
                  <Trash2 size={18} />
                </button>

                <button onClick={() => handleBulkLock(h._id)} className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white text-xs font-black uppercase transition-all flex items-center gap-1.5">
                  <Lock size={13}/> Freeze Subs
                </button>
                
                {h.isActive ? (
                  <div className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={14}/> LIVE
                  </div>
                ) : (
                  <button onClick={() => handleActivate(h._id)} className="px-6 py-2.5 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-black uppercase transition-all">
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
