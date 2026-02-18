'use client';
import { motion } from 'framer-motion';
import Avatar from '../Avatar';
import { Users, UserPlus, XCircle, ArrowRight, Lock } from 'lucide-react';

export default function TeamGrid({ otherTeams, user, myTeam, handlers, setViewingTeam }) {
  
  // Empty State
  if (!otherTeams || otherTeams.length === 0) {
    return (
      <div className="mt-8 text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="text-4xl mb-3">🛡️</div>
        <p className="text-slate-900 dark:text-white font-semibold text-lg">No active teams found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Be the first to create a squad and lead the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {otherTeams.map((team, index) => {
        const hasRequested = (team.pendingRequests || []).some(req => String(req._id || req) === String(user._id));
        const membersCount = (team.members || []).length;
        const isFull = membersCount >= 6;
        
        // Status Badge Logic
        let statusColor = isFull ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
        let statusText = isFull ? "Full Squad" : "Recruiting";

        return (
          <motion.div 
            key={team._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            onClick={() => setViewingTeam(team)}
            className="group relative cursor-pointer flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            {/* Hover Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="p-5 flex flex-col h-full">
              
              {/* HEADER: Logo & Title */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {team.logoUrl ? (
                     <img src={team.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xl shadow-inner">
                      🛡️
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {team.teamName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar name={team.leader.name} src={team.leader.photoUrl} size={16} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {team.leader.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${statusColor}`}>
                  {statusText}
                </span>
              </div>

              {/* BODY: Problem Statement */}
              <div className="mb-6 flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                   Problem Statement
                 </p>
                 <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                   {team.problemStatementTitle || "No problem statement selected yet."}
                 </p>
              </div>

              {/* FOOTER: Stats & Actions */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                
                {/* Member Count */}
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Users size={14} />
                  <span className="text-xs font-semibold">{membersCount} / 6</span>
                </div>

                {/* ACTION BUTTONS */}
                {!myTeam ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    {hasRequested ? (
                      <button 
                        onClick={() => handlers.onCancelJoin(team._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <XCircle size={14} />
                        Cancel
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlers.onJoin(team._id)}
                        disabled={isFull}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all
                          ${isFull 
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-95"
                          }
                        `}
                      >
                        {isFull ? <Lock size={14} /> : <UserPlus size={14} />}
                        {isFull ? "Full" : "Join"}
                      </button>
                    )}
                  </div>
                ) : (
                   // FIX: 'opacity-100' on mobile, 'md:opacity-0' on desktop
                   <span className="text-xs font-bold text-indigo-500 flex items-center gap-1 
                     opacity-100 md:opacity-0 group-hover:opacity-100 
                     translate-x-0 md:-translate-x-2 group-hover:translate-x-0 
                     transition-all duration-300">
                     View Details <ArrowRight size={12} />
                   </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}