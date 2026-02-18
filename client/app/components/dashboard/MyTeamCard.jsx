'use client';
import { motion } from 'framer-motion';
import Avatar from '../Avatar';
import SocialBadges from '../SocialBadges';
import { Lock, Send, CheckCircle2, XCircle, Clock, AlertTriangle, UserPlus, X } from 'lucide-react';

function NameWithEmail({ user, className }) {
  if (!user) return null;
  return (
    <div className={className || 'flex flex-col min-w-0'}>
      <span className="font-bold text-slate-800 dark:text-gray-200 truncate">
        {user.nameWithYear || user.name}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
        {user.email || 'email not set'}
      </span>
    </div>
  );
}

export default function MyTeamCard({ 
  myTeam, 
  user, 
  handlers, 
  hackathon, 
  sentInvites = [], // Default to empty array
  receivedInvites = [], 
  teams, 
  setIsCreateModalOpen, 
  setIsEditModalOpen, 
  setViewingTeam,
  router // Pass router prop from parent to navigate
}) {
  const isLeader = myTeam && String(user._id) === String(myTeam.leader._id);
  const myMembers = myTeam?.members || [];
  const myRequests = myTeam?.pendingRequests || [];
  const isSubmitted = myTeam?.isSubmitted || false;

  // --- 1. DYNAMIC RULES ---
  const rules = {
    minMembers: hackathon?.minTeamSize || 1,
    maxMembers: hackathon?.maxTeamSize || 6,
    minFemales: hackathon?.minFemaleMembers || 0,
  };

  // --- 2. DEADLINE LOGIC ---
  const deadline = hackathon?.submissionDeadline ? new Date(hackathon.submissionDeadline) : null;
  const isExpired = deadline && new Date() > deadline;

  // --- 3. VALIDATION STATUS ---
  const currentCount = myMembers.length;
  // Count Pending Invites towards the limit
  const pendingCount = sentInvites.length;
  const totalSlotsUsed = currentCount + pendingCount;
  const isFull = totalSlotsUsed >= rules.maxMembers;

  // Normalize gender check to be case-insensitive
  const femaleCount = myMembers.filter(m => 
    m.gender && ['female', 'f'].includes(m.gender.toLowerCase())
  ).length;

  const isSizeValid = currentCount >= rules.minMembers && currentCount <= rules.maxMembers;
  const isGenderValid = femaleCount >= rules.minFemales;
  const isTeamReady = isSizeValid && isGenderValid;

  return (
    <>
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          My Team
        </h2>
        {!myTeam && (
          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            disabled={isExpired} 
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExpired ? 'Registration Closed' : '+ Create Team'}
          </button>
        )}
      </div>

      {myTeam ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="relative rounded-2xl p-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 shadow-xl"
        >
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 h-full flex flex-col">
            
            {/* TOP ROW: Logo, Info, Actions */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              {/* Team Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                {myTeam.logoUrl ? (
                  <img src={myTeam.logoUrl} alt="logo" className="w-20 h-20 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl">
                    🛡️
                  </div>
                )}
                
                <div>
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
                    {myTeam.teamName}
                  </h3>
                  
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Led by:</span>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      <Avatar name={myTeam.leader.name} src={myTeam.leader.photoUrl} size={24} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                        {myTeam.leader.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  disabled={isSubmitted} 
                  className="flex-1 md:flex-none justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeader ? 'Edit Team' : 'Details'}
                </button>
                {isLeader ? (
                  <button 
                    onClick={() => handlers.onDelete(myTeam._id)} 
                    disabled={isSubmitted}
                    className="flex-1 md:flex-none justify-center rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                ) : (
                  <button 
                    onClick={handlers.onLeave} 
                    disabled={isSubmitted}
                    className="flex-1 md:flex-none justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Leave
                  </button>
                )}
              </div>
            </div>

            {/* PROBLEM STATEMENT */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Selected Problem Statement
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {myTeam.problemStatementTitle || "No problem statement selected yet."}
              </p>
            </div>

            {/* MEMBERS LIST */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Team Members <span className={`text-sm font-normal ${isSizeValid ? 'text-green-500' : 'text-amber-500'}`}>({currentCount}/{rules.maxMembers})</span>
                </p>
                {/* Find Members Button - Disabled if full */}
                {isLeader && !isSubmitted && !isExpired && (
                  <button
                    onClick={() => router.push('/dashboard/all-users')}
                    disabled={isFull}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserPlus size={14} />
                    {isFull ? 'Team Full' : 'Find Members'}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myMembers.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <Avatar name={m.name} src={m.photoUrl} size={36} />
                    <div className="flex-1 min-w-0">
                      <NameWithEmail user={m} />
                    </div>
                    {/* Leader Badge or Kick Button (Optional - Kick logic not passed in handlers yet but good to have space) */}
                    <div className="shrink-0">
                      <SocialBadges profiles={m.socialProfiles} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- SENT INVITATIONS SECTION (Leader Only) --- */}
            {isLeader && sentInvites.length > 0 && !isSubmitted && !isExpired && (
               <div className="mt-6">
                 <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                   Pending Invitations ({sentInvites.length})
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {sentInvites.map((invite) => (
                     <div key={invite._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* Use inviteeId directly as populated user object */}
                          <Avatar name={invite.inviteeId?.name} src={invite.inviteeId?.photoUrl} size={32} />
                          <div className="min-w-0">
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{invite.inviteeId?.name}</p>
                             <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1"><Clock size={10}/> Awaiting response</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handlers.onCancelInvite(invite._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                          title="Cancel Invite"
                        >
                           <X size={16}/>
                        </button>
                     </div>
                   ))}
                 </div>
               </div>
            )}

            {/* PENDING REQUESTS (Leader Only) */}
            {isLeader && myRequests.length > 0 && !isSubmitted && !isExpired && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Pending Join Requests
                </p>
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={req.name} src={req.photoUrl} size={32} />
                        <NameWithEmail user={req} />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handlers.onApprove(myTeam._id, req._id)} disabled={isFull} className="flex-1 sm:flex-none justify-center rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                          Approve
                        </button>
                        <button onClick={() => handlers.onReject(myTeam._id, req._id)} className="flex-1 sm:flex-none justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- FINAL SUBMIT & STATUS SECTION (Leader Only) --- */}
            {isLeader && (
              <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                
                {/* 1. If Submitted: GREEN SUCCESS */}
                {isSubmitted ? (
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-center">
                    <p className="text-green-700 dark:text-green-400 font-bold flex items-center justify-center gap-2">
                      <Lock size={18} /> Team Submitted & Locked
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Your team data has been sent to the admin. Good luck!
                    </p>
                  </div>
                
                /* 2. If Not Submitted AND Expired: RED ERROR */
                ) : isExpired ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-center">
                    <p className="text-red-700 dark:text-red-400 font-bold flex items-center justify-center gap-2">
                      <Clock size={18} /> Submission Deadline Passed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      The deadline was {deadline.toLocaleString()}. You can no longer submit.
                    </p>
                  </div>

                /* 3. If Active: CHECKLIST + BUTTON */
                ) : (
                  <div className="flex flex-col items-center gap-4">
                      
                      {/* Dynamic Requirements Checklist */}
                      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Submission Requirements</h4>
                        <ul className="space-y-2 text-sm">
                          {/* Rule 1: Team Size */}
                          <li className={`flex items-center gap-2 ${isSizeValid ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {isSizeValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            <span>Team Size: <strong>{currentCount}/{rules.maxMembers}</strong> (Min: {rules.minMembers})</span>
                          </li>
                          
                          {/* Rule 2: Female Members (Only show if rule exists > 0) */}
                          {rules.minFemales > 0 && (
                            <li className={`flex items-center gap-2 ${isGenderValid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                              {isGenderValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                              <span>Female Members: <strong>{femaleCount}/{rules.minFemales} required</strong></span>
                            </li>
                          )}
                        </ul>
                      </div>

                      <button
                        onClick={() => handlers.onSubmitTeam(myTeam._id)}
                        disabled={!isTeamReady}
                        className={`
                          w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                          flex items-center justify-center gap-2
                          ${isTeamReady 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/25 active:scale-95 cursor-pointer' 
                            : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'}
                        `}
                      >
                        <Send size={18} />
                        Final Submit to Admin
                      </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      ) : (
        /* EMPTY STATE / INVITATIONS */
        <div className="space-y-6">
           {/* Received Invites */}
           {receivedInvites.length > 0 && (
             <div className="rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  📬 Team Invitations
                </h3>
                <div className="space-y-3">
                  {receivedInvites.map(invite => {
                    const fullTeam = teams.find(t => t._id === invite.teamId?._id);
                    return (
                      <div key={invite._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Invited to join</span>
                          <button onClick={() => fullTeam && setViewingTeam(fullTeam)} className="text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left">
                            {fullTeam?.teamName || 'Unknown Team'}
                          </button>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button onClick={() => handlers.onAcceptInvite(invite._id)} className="flex-1 sm:flex-none rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-md">
                            Accept
                          </button>
                          <button onClick={() => handlers.onRejectInvite(invite._id)} className="flex-1 sm:flex-none rounded-lg bg-white dark:bg-transparent border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           )}

           {/* Empty State Placeholder */}
           <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-10 text-center">
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-3xl">
               🚀
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">You are not in a team yet</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 text-sm">
               Create your own squad or ask a friend to invite you to theirs.
             </p>
             <button onClick={() => setIsCreateModalOpen(true)} disabled={isExpired} className="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
               {isExpired ? 'Registration Closed' : 'Create a new team →'}
             </button>
           </div>
        </div>
      )}
    </>
  );
}