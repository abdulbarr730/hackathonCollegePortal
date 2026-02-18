'use client';
import { useState, useEffect } from 'react';
import { Trophy, Calendar, Crown, Shield, Users } from 'lucide-react';

// COMPONENTS
import Avatar from '../components/Avatar';
import TeamDetailsModal from '../components/TeamDetailsModal';
import UserIdentity from '../components/shared/UserIdentity';

export default function ArchivePage() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingTeam, setViewingTeam] = useState(null);

  useEffect(() => {
    // Fetches inactive events via the updated backend route
    fetch('/api/hackathon/all?status=inactive')
      .then(res => res.json())
      .then(data => {
        setArchives(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      
      {/* --- DASHBOARD BACKGROUND GRID --- */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
            <Trophy size={14} /> The Hall of Fame
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Fame</span>
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-mono tracking-widest uppercase">Syncing Archives...</div>
        ) : (
          <div className="space-y-32">
            {archives.map(event => (
              <div key={event._id} className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                  <div className="space-y-1">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{event.name}</h2>
                       <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-sm font-bold">
                            <Calendar size={14} /> 
                            {/* BRUTALLY LOGICAL FIX:
                                1. Check for startDate (best case)
                                2. If missing, use createdAt (which you already have)
                                3. Final fallback to 2026
                            */}
                            {event.startDate ? (
                                `${new Date(event.startDate).getFullYear()} Edition`
                            ) : event.createdAt ? (
                                `${new Date(event.createdAt).getFullYear()} Edition`
                            ) : (
                                "2026 Edition"
                            )}
                    </div>
                  </div>
                </div>
                <EventTeamGrid hackathonId={event._id} setViewingTeam={setViewingTeam} />
              </div>
            ))}
          </div>
        )}
      </main>

      {viewingTeam && (
        <TeamDetailsModal isOpen={!!viewingTeam} onClose={() => setViewingTeam(null)} team={viewingTeam} />
      )}
    </div>
  );
}

function EventTeamGrid({ hackathonId, setViewingTeam }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/archive/teams?hackathonId=${hackathonId}`)
      .then(res => res.json())
      .then(data => {
        if (data) setTeams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hackathonId]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse"><div className="h-64 bg-slate-800 rounded-3xl col-span-full" /></div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {teams.map((team) => (
        <button key={team._id} onClick={() => setViewingTeam(team)}
          className={`group flex flex-col rounded-[2.5rem] border text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 w-full
            ${team.isWinner ? 'bg-white dark:bg-slate-900 border-indigo-500/50 shadow-xl' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 backdrop-blur-sm'}`}>
          <div className="p-7 flex flex-col h-full w-full">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${team.isWinner ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                {team.isWinner ? <Crown size={22} fill="currentColor" /> : <Shield size={22}/>}
              </div>
              {team.isWinner && <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase rounded-full shadow-md">Winner</span>}
            </div>
            <div className="mb-6 space-y-4">
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">{team.teamName}</h3>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                 <UserIdentity user={team.leader} size={32} />
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex -space-x-2">
                {team.members?.slice(0, 4).map((m) => (
                  <Avatar key={m._id} name={m.name} src={m.photoUrl} size={28} className="ring-2 ring-white dark:ring-slate-900" />
                ))}
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">Details <Users size={12} /></span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}