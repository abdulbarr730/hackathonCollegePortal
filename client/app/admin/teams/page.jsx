'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Trash2, Unlock, Lock, Clock, Edit3, FileSpreadsheet,
  Search, Filter, Users, Venus, Mars, Mail, Loader2, 
  UserPlus, UserMinus, ShieldCheck, MoreVertical, X, ChevronDown, ChevronUp, UserCog,
  LayoutDashboard, CheckCircle, AlertCircle, Trophy, Ban, ExternalLink, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);

  // --- DATA FETCHING ---
  const fetchHackathons = async () => {
    try {
      const res = await fetch('/api/hackathon/all');
      const data = await res.json();
      setHackathons(data);
      const active = data.find(h => h.isActive);
      if (active) setSelectedHackathon(active._id);
      return active?._id || 'all';
    } catch (err) { return 'all'; }
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/colleges?status=approved', { credentials: 'include' });
      const data = await res.json();
      setColleges(data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchTeams = useCallback(async (hId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (hId && hId !== 'all') params.set('hackathonId', hId);
      if (selectedCollege !== 'all') params.set('collegeId', selectedCollege);
      if (submissionFilter !== 'all') params.set('submitted', submissionFilter);
      const res = await fetch(`/api/admin/teams?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      setTeams(data.items || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [selectedCollege, submissionFilter]);

  useEffect(() => {
    const init = async () => {
      const hId = await fetchHackathons();
      fetchColleges();
      fetchTeams(hId);
    };
    init();
  }, [fetchTeams]);

  useEffect(() => {
    fetchTeams(selectedHackathon);
  }, [selectedCollege, submissionFilter, selectedHackathon, fetchTeams]);

  // --- ACTIONS ---
  const handleExport = (type) => {
    const params = new URLSearchParams();
    if (type === 'filtered' && selectedHackathon !== 'all') params.set('hackathonId', selectedHackathon);
    if (type === 'filtered' && selectedCollege !== 'all') params.set('collegeId', selectedCollege);
    if (type === 'filtered' && submissionFilter !== 'all') params.set('submitted', submissionFilter);
    window.open(`/api/admin/teams/export?${params.toString()}`, '_blank');
  };

  const openSihSubmission = () => {
    window.open('https://www.sih.gov.in/sih2025PS', '_blank', 'noopener,noreferrer');
  };

  const handleUnlock = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Unlock this team for editing?")) return;
    const res = await fetch(`/api/admin/teams/unlock/${id}`, { method: 'POST' });
    if (res.ok) fetchTeams(selectedHackathon);
  };

  const handleRename = async (id) => {
    const name = prompt("Enter new Team Name:");
    if (!name) return;
    await fetch(`/api/admin/teams/${id}/name`, { 
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({teamName: name}) 
    });
    fetchTeams(selectedHackathon);
  };

  const handleAddMember = async (id) => {
    const email = prompt("Enter Registered Member Email to Force Add:");
    if (!email) return;
    const res = await fetch(`/api/admin/teams/${id}/member`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email})
    });
    if (!res.ok) { const err = await res.json(); alert(err.msg || "Failed to add"); }
    fetchTeams(selectedHackathon);
  };

  const handleKickMember = async (tId, mId, name) => {
    if (!confirm(`Remove ${name} from team?`)) return;
    await fetch(`/api/admin/teams/${tId}/member/${mId}`, { method: 'DELETE' });
    setOpenMemberMenuId(null);
    fetchTeams(selectedHackathon);
  };

  const handlePromoteToLeader = async (tId, email) => {
    if (!confirm(`Promote ${email} to Team Leader?`)) return;
    await fetch(`/api/admin/teams/${tId}/leader`, {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email})
    });
    setOpenMemberMenuId(null);
    fetchTeams(selectedHackathon);
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("CRITICAL: Disband this entire team? This cannot be undone.")) return;
    await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
    fetchTeams(selectedHackathon);
  };

  const handleMarkWinner = async (id) => {
    const position = prompt("Enter Winner Position (e.g., 1st Place, Runner Up, Category Winner):", "1st Place");
    if (position === null) return;
    const res = await fetch(`/api/admin/teams/${id}/winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: position || 'Winner' })
    });
    if (res.ok) fetchTeams(selectedHackathon);
    else alert("Failed to mark winner");
  };

  const handleUnmarkWinner = async (id) => {
    if (!confirm("Are you sure you want to remove the winner tag from this team?")) return;
    const res = await fetch(`/api/admin/teams/${id}/unmark-winner`, {
      method: 'POST'
    });
    if (res.ok) fetchTeams(selectedHackathon);
    else alert("Failed to unmark winner");
  };

  // --- STATS ---
  const filteredTeams = teams.filter(t => 
    t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = filteredTeams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const totalFemales = filteredTeams.reduce((acc, t) => acc + (t.members?.filter(m => ['female', 'f'].includes(m.gender?.toLowerCase())).length || 0), 0);
  const totalMales = filteredTeams.reduce((acc, t) => acc + (t.members?.filter(m => ['male', 'm'].includes(m.gender?.toLowerCase())).length || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HEADER & EXPORTS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Teams & SIH Export</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review team rosters, filter by college, and generate SPOC Excel submissions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleExport('filtered')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <FileSpreadsheet size={16} /> Export Selected ({filteredTeams.length})
          </button>
          
          <button 
            onClick={openSihSubmission}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <ExternalLink size={16} /> SIH Portal
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Squads</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredTeams.length}</h3>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Coders</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalMembers}</h3>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Females</p>
          <h3 className="text-2xl font-black text-pink-500 mt-1">{totalFemales}</h3>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Males</p>
          <h3 className="text-2xl font-black text-blue-500 mt-1">{totalMales}</h3>
        </div>
      </div>

      {/* 3. FILTERS PANEL */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Squad or Leader..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Hackathon, College, and Status Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <select 
            value={selectedCollege} 
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Colleges</option>
            {colleges.map(c => (
              <option key={c._id} value={c._id}>{c.name} {c.shortName ? `(${c.shortName})` : ''}</option>
            ))}
          </select>

          <select 
            value={selectedHackathon} 
            onChange={(e) => setSelectedHackathon(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Hackathons</option>
            {hackathons.map(h => (
              <option key={h._id} value={h._id}>{h.shortName || h.name} {h.isActive ? '(Active)' : ''}</option>
            ))}
          </select>

          <select 
            value={submissionFilter} 
            onChange={(e) => setSubmissionFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Submissions</option>
            <option value="true">Locked / Submitted</option>
            <option value="false">Draft State</option>
          </select>

          <button 
            onClick={() => fetchTeams(selectedHackathon)} 
            className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all"
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4. TEAMS ACCORDION LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={32} />
            Loading squads...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
            No squads found matching your filters.
          </div>
        ) : filteredTeams.map(team => (
          <div 
            key={team._id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-indigo-500/50 transition-all duration-200"
          >
            {/* ACCORDION HEADER */}
            <div 
              onClick={() => setExpandedTeamId(expandedTeamId === team._id ? null : team._id)}
              className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-800 shrink-0">
                  {team.teamName?.charAt(0) || 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{team.teamName}</h3>
                    {team.isWinner && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-400/30">
                        <Trophy size={11} className="text-yellow-500" /> {team.winnerPosition || 'Winner'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail size={12}/> {team.leader?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex gap-2">
                  {team.isSubmitted ? (
                    <button onClick={(e) => handleUnlock(e, team._id)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black border border-green-200 flex items-center gap-1 hover:bg-orange-100 hover:text-orange-700 transition-all">
                      <Lock size={12}/> LOCKED
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700">DRAFT</span>
                  )}
                </div>
                {expandedTeamId === team._id ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
              </div>
            </div>

            {/* EXPANDED CONTENT */}
            {expandedTeamId === team._id && (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1: Team Controls */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Settings</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => handleRename(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all"><Edit3 size={16} className="text-indigo-500"/> Rename Squad</button>
                      <button onClick={() => handleAddMember(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all"><UserPlus size={16} className="text-emerald-500"/> Force Add Member</button>
                      
                      {/* --- WINNER TOGGLE BUTTONS --- */}
                      {team.isWinner ? (
                        <button onClick={() => handleUnmarkWinner(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-red-50 text-red-600 transition-all">
                          <Ban size={16} className="text-red-500"/> Remove Winner Status
                        </button>
                      ) : (
                        <button onClick={() => handleMarkWinner(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-yellow-50 transition-all">
                          <Trophy size={16} className="text-yellow-500"/> Mark Winner
                        </button>
                      )}

                      {user?.role !== 'spoc' && (
                        <button onClick={() => handleDeleteTeam(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/> Disband Entire Team</button>
                      )}
                    </div>
                  </div>

                  {/* Column 2 & 3: Member Management */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Members ({team.members?.length}/6)</h4>
                      <div className="flex gap-4 text-[10px] font-bold">
                         <span className="text-pink-500 flex items-center gap-1"><Venus size={12}/> {team.members?.filter(m => ['female','f'].includes(m.gender?.toLowerCase())).length} Females</span>
                         <span className="text-blue-500 flex items-center gap-1"><Mars size={12}/> {team.members?.filter(m => ['male','m'].includes(m.gender?.toLowerCase())).length} Males</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.members?.map(m => (
                        <div key={m._id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${m.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{m.gender?.charAt(0) || 'U'}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-normal break-words">
                                {m.name}
                                {team.leader?._id === m._id && <ShieldCheck size={14} className="text-indigo-500 shrink-0"/>}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                            </div>
                          </div>

                          <div className="relative">
                            <button onClick={() => setOpenMemberMenuId(openMemberMenuId === m._id ? null : m._id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"><UserCog size={18}/></button>
                            {openMemberMenuId === m._id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in zoom-in-95">
                                <button onClick={() => handlePromoteToLeader(team._id, m.email)} disabled={team.leader?._id === m._id} className="w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-30"><ShieldCheck size={14} className="text-indigo-500"/> Make Leader</button>
                                <button onClick={() => handleKickMember(team._id, m._id, m.name)} className="w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><UserMinus size={14}/> Kick Member</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
