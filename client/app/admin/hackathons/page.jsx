'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Trophy, Pencil, X, Lock, Venus, Loader2, Clock, CheckCircle 
} from 'lucide-react';
import { useHackathon } from '../../context/HackathonContext'; 

export default function AdminHackathonsPage() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { refreshEvent } = useHackathon(); 

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', shortName: '', tagline: '', 
    startDate: '', // Controlled manually now
    submissionDeadline: '',
    minTeamSize: 1, maxTeamSize: 6, minFemaleMembers: 1,
    isActive: false
  });

  // --- THE BULLETPROOF DATE FORMATTER ---
  // Ensures the input sees the local time, not UTC, so it doesn't shift or reset
  const formatForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Manual ISO string construction to force local time
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
      const res = await fetch('/api/hackathon/all');
      const data = await res.json();
      setHackathons(data);
    } catch (err) { console.error("Fetch failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHackathons(); }, []);

  const handleEditClick = (h) => {
    setFormData({
      name: h.name,
      shortName: h.shortName,
      tagline: h.tagline || '',
      startDate: formatForInput(h.startDate), 
      submissionDeadline: formatForInput(h.submissionDeadline),
      minTeamSize: h.minTeamSize || 1,
      maxTeamSize: h.maxTeamSize || 6,
      minFemaleMembers: h.minFemaleMembers || 0,
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
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      resetForm();
      fetchHackathons();
      refreshEvent();
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', shortName: '', tagline: '', startDate: '', submissionDeadline: '',
      minTeamSize: 1, maxTeamSize: 6, minFemaleMembers: 1, isActive: false 
    });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const handleActivate = async (id) => {
    if(!confirm("Set this as the LIVE event?")) return;
    const res = await fetch(`/api/hackathon/set-active/${id}`, { method: 'PUT' });
    if (res.ok) { fetchHackathons(); refreshEvent(); }
  };

  const handleBulkLock = async (id) => {
    if(prompt("Type 'LOCK' to freeze submissions") !== 'LOCK') return;
    const res = await fetch('/api/hackathon/lock-all-teams', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hackathonId: id })
    });
    const data = await res.json();
    alert(data.msg);
    fetchHackathons();
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 dark:text-white">Hackathon Manager</h1>
          <p className="text-slate-500">Control event timing and squad constraints.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg">+ New Edition</button>
        )}
      </div>

      {showForm && (
        <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
          <button onClick={resetForm} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button>
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Trophy className="text-indigo-500" size={20} />
            {isEditing ? 'Modify Edition' : 'Initialize New Edition'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <input required placeholder="Event Name" className="p-4 rounded-xl border dark:bg-slate-800 outline-none focus:ring-2 ring-indigo-500/20" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Short Label" className="p-4 rounded-xl border dark:bg-slate-800 outline-none focus:ring-2 ring-indigo-500/20" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-600">Archive Reference Date</label>
                <input required type="datetime-local" className="w-full p-3 rounded-xl border outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                <p className="text-[10px] text-slate-500 italic">Sets the year in the Hall of Fame.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-red-500">Submission Lock Deadline</label>
                <input required type="datetime-local" className="w-full p-3 rounded-xl border outline-none" value={formData.submissionDeadline} onChange={e => setFormData({...formData, submissionDeadline: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <input type="number" placeholder="Min" className="p-4 rounded-xl border dark:bg-slate-800" value={formData.minTeamSize} onChange={e => setFormData({...formData, minTeamSize: e.target.value})} />
              <input type="number" placeholder="Max" className="p-4 rounded-xl border dark:bg-slate-800" value={formData.maxTeamSize} onChange={e => setFormData({...formData, maxTeamSize: e.target.value})} />
              <input type="number" placeholder="Females" className="p-4 rounded-xl border dark:bg-slate-800" value={formData.minFemaleMembers} onChange={e => setFormData({...formData, minFemaleMembers: e.target.value})} />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">Save Configuration</button>
              <button type="button" onClick={resetForm} className="px-10 py-4 border rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LIST VIEW */}
      <div className="grid gap-6">
        {hackathons.map((h) => (
          <div key={h._id} className={`p-8 rounded-[2rem] border transition-all flex flex-col lg:flex-row items-center justify-between gap-6 ${h.isActive ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-start gap-6">
              <div className={`p-4 rounded-2xl ${h.isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Trophy size={28} /></div>
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">{h.name}</h3>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 mt-2 uppercase">
                  <span className="flex items-center gap-1"><Calendar size={14} className="text-indigo-500"/> Year: {h.startDate ? new Date(h.startDate).getFullYear() : 'N/A'}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-red-500"/> Lock: {h.submissionDeadline ? new Date(h.submissionDeadline).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => handleEditClick(h)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 transition-colors"><Pencil size={20} /></button>
              
              {/* LOCK BUTTON */}
              <button onClick={() => handleBulkLock(h._id)} className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white text-xs font-black uppercase transition-all flex items-center gap-2"><Lock size={14}/> Freeze Subs</button>
              
              {h.isActive ? (
                <div className="px-8 py-2.5 bg-green-500 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-green-500/20"><CheckCircle size={14}/> LIVE</div>
              ) : (
                <button onClick={() => handleActivate(h._id)} className="px-8 py-2.5 rounded-xl border-2 border-indigo-500 text-indigo-500 text-xs font-black uppercase hover:bg-indigo-500 hover:text-white transition-all">Activate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}