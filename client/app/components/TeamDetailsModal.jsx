'use client';

import { useEffect } from 'react';
import Avatar from './Avatar';
import SocialBadges from './SocialBadges';
import { X, Target, Users, Shield, Mail, ExternalLink } from 'lucide-react';

export default function TeamDetailsModal({ isOpen, onClose, team }) {
  
  // --- PERFECT SCROLL LOCK ---
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div 
        className="relative w-full max-w-3xl rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        
        {/* HEADER SECTION */}
        <div className="flex items-start justify-between px-8 py-7 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-6">
            {/* Team Logo */}
            <div className="relative shrink-0">
              {team.logoUrl ? (
                <img 
                  src={team.logoUrl} 
                  alt="logo" 
                  className="w-20 h-20 rounded-[1.5rem] object-cover bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">
                  🛡️
                </div>
              )}
            </div>

            {/* Team Info */}
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                {team.teamName}
              </h2>
              <div className="flex items-center gap-2">
                {/* FIXED: Robust Leader Display */}
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                  <Shield size={12} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Led by {team.leader?.name || 'Unknown Leader'}
                  </span>
                </div>
                {team.hackathonId && (
                   <span className="text-[10px] font-mono text-slate-400 uppercase">
                     {team.hackathonId.name || 'Archive'}
                   </span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2.5 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all active:scale-90"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto p-8 custom-scrollbar space-y-10">
          
          {/* PROBLEM STATEMENT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-orange-500" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Mission Objective</h3>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-6 shadow-inner">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {team.problemStatementTitle || "Project Title Pending"}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap italic">
                "{team.problemStatementDescription || "No detailed briefing provided for this operation."}"
              </p>
            </div>
          </div>

          {/* SQUAD ROSTER */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                <Users size={20} className="text-indigo-500" />
                Squad Members
              </h3>
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20">
                {team.members?.length || 0} OPERATIVES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.members?.map(member => (
                <div 
                  key={member._id} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
                >
                  {/* REAL PROFILE PIC */}
                  <Avatar name={member.name} src={member.photoUrl} size={56} className="ring-2 ring-indigo-500/20" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                        {member.nameWithYear || member.name}
                      </h4>
                      {member._id === team.leader?._id && (
                        <Shield size={12} className="text-amber-500 fill-amber-500/20" />
                      )}
                    </div>
                    
                    {/* EMAIL DISPLAY */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate font-medium">{member.email || 'Classified'}</span>
                    </div>

                    {/* SOCIAL BADGES */}
                    <div className="flex items-center justify-between">
                      <SocialBadges profiles={member.socialProfiles} />
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <ExternalLink size={12} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}