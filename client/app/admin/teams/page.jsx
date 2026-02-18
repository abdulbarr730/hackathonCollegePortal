'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Trash2, Unlock, Lock, Clock, Edit3, FileSpreadsheet,
  Search, Filter, Users, Venus, Mars, Mail, Loader2, 
  UserPlus, UserMinus, ShieldCheck, MoreVertical, X, ChevronDown, ChevronUp, UserCog,
  LayoutDashboard, CheckCircle, AlertCircle, Trophy, Ban // Added Ban icon for unmarking
} from 'lucide-react';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('all');
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

  const fetchTeams = useCallback(async (hId) => {
    setLoading(true);
    try {
      const url = hId === 'all' ? `/api/admin/teams` : `/api/admin/teams?hackathonId=${hId}`;
      const res = await fetch(url);
      const data = await res.json();
      setTeams(data.items || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const init = async () => {
      const hId = await fetchHackathons();
      fetchTeams(hId);
    };
    init();
  }, [fetchTeams]);

  // --- ACTIONS ---
  const handleExport = (type) => {
    const hId = type === 'filtered' ? selectedHackathon : 'all';
    window.open(`/api/admin/teams/export?hackathonId=${hId}`, '_blank');
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
    const email = prompt("Enter Email to force-add:");
    if (!email) return;
    const res = await fetch(`/api/admin/teams/${id}/members`, { 
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) 
    });
    const d = await res.json();
    if (!res.ok) alert(d.msg);
    fetchTeams(selectedHackathon);
  };

  const handleKickMember = async (teamId, memberId, name) => {
    if (!confirm(`Kick ${name} from squad?`)) return;
    await fetch(`/api/admin/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
    fetchTeams(selectedHackathon);
    setOpenMemberMenuId(null);
  };

  const handlePromoteToLeader = async (teamId, email) => {
    if (!confirm(`Make ${email} the Team Leader?`)) return;
    await fetch(`/api/admin/teams/${teamId}/leader`, { 
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email}) 
    });
    fetchTeams(selectedHackathon);
    setOpenMemberMenuId(null);
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("DELETE ENTIRE TEAM?")) return;
    await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
    fetchTeams(selectedHackathon);
  };

  // --- WINNER ACTIONS ---
  const handleMarkWinner = async (teamId) => {
    const position = prompt("Enter Winner Position (e.g., '1st Place', 'Gold', 'Top 10'):");
    if (!position) return;

    try {
      const res = await fetch(`/api/admin/teams/${teamId}/winner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Team marked as ${position}!`);
        fetchTeams(selectedHackathon);
      } else {
        alert(data.msg);
      }
    } catch (err) { alert("Failed to mark winner"); }
  };

  // --- NEW: UNMARK WINNER ---
  const handleUnmarkWinner = async (teamId) => {
    if (!confirm("Remove this team from the winners list?")) return;
    
    try {
      // Assuming you handle DELETE on the same route to clear the status
      const res = await fetch(`/api/admin/teams/${teamId}/winner`, {
        method: 'DELETE' 
      });
      
      if (res.ok) {
        alert("Winner status removed.");
        fetchTeams(selectedHackathon);
      } else {
        alert("Failed to unmark winner.");
      }
    } catch (err) { alert("Error removing winner status"); }
  };

  const toggleAccordion = (id) => {
    setExpandedTeamId(expandedTeamId === id ? null : id);
  };

  // --- STATS CALCULATION ---
  const stats = {
    total: teams.length,
    locked: teams.filter(t => t.isSubmitted).length,
    draft: teams.filter(t => !t.isSubmitted).length,
    participants: teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)
  };

  const filteredTeams = teams.filter(t => 
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && teams.length === 0) return <div className="p-20 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Accessing Database...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Squad Repository</h1>
          <p className="text-slate-500 text-sm">Expand teams to manage members or export data.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => handleExport('all')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"><FileSpreadsheet size={16}/> Export All</button>
          <button onClick={() => handleExport('filtered')} disabled={selectedHackathon === 'all'} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 transition-all"><Filter size={16}/> Export Filtered</button>
          <select value={selectedHackathon} onChange={(e) => { setSelectedHackathon(e.target.value); fetchTeams(e.target.value); }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm outline-none cursor-pointer">
            <option value="all">All Events</option>
            {hackathons.map(h => <option key={h._id} value={h._id}>{h.shortName || h.name}</option>)}
          </select>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <LayoutDashboard size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Total Teams</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Locked</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.locked}</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Clock size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Drafts</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.draft}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Users size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Participants</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.participants}</p>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
        <input 
          type="text" placeholder="Search by team name or leader email..." 
          className="pl-12 pr-4 py-4 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 4. ACCORDION LIST */}
      <div className="space-y-3">
        {filteredTeams.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">No teams found.</div>
        ) : filteredTeams.map(team => (
          <div key={team._id} className={`bg-white dark:bg-slate-900 border ${expandedTeamId === team._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl overflow-hidden transition-all`}>
            
            {/* COLLAPSED ROW (The Header) */}
            <div 
              onClick={() => toggleAccordion(team._id)}
              className="p-4 md:p-6 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-3 h-3 rounded-full shrink-0 ${team.isSubmitted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white break-words flex items-center gap-2">
                    {team.teamName}
                    {team.isWinner && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full border border-yellow-200 uppercase">{team.winnerPosition || 'Winner'}</span>}
                  </h3>
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

                      <button onClick={() => handleDeleteTeam(team._id)} className="flex items-center gap-2 w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/> Disband Entire Team</button>
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