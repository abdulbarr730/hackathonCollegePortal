'use client';

import Avatar from './Avatar';
import SocialBadges from './SocialBadges';

function NameWithEmail({ user, className }) {
  if (!user) return null;
  return (
    <div className={className || 'flex flex-col'}>
      <span className="font-semibold text-slate-200">{user.nameWithYear || user.name}</span>
      <span className="text-xs text-slate-400">{user.email || 'email not set'}</span>
    </div>
  );
}

export default function TeamDetailsModal({ isOpen, onClose, team }) {
  if (!isOpen || !team) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg bg-slate-800 p-8 text-white border border-slate-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-3xl font-bold text-purple-400">{team.teamName}</h2>
                <div className="mt-2 text-slate-300 flex items-center gap-2">
                    <Avatar name={team.leader?.name} src={team.leader?.photoUrl} size={24} />
                    <span>Led by {team.leader?.nameWithYear || team.leader?.name}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="mt-6 border-t border-slate-700 pt-6">
            <h3 className="font-semibold text-lg text-slate-200">Problem Statement</h3>
            <h4 className="mt-1 font-bold text-slate-100">{team.problemStatementTitle || "Not specified"}</h4>
            <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap">{team.problemStatementDescription || "No description provided."}</p>
        </div>

        <div className="mt-6 border-t border-slate-700 pt-6">
          <h3 className="font-semibold text-lg text-slate-200">Members ({team.members?.length} / 6)</h3>
          <ul className="mt-4 space-y-4">
            {team.members?.map(member => (
              <li key={member._id} className="flex items-center gap-4">
                <Avatar name={member.name} src={member.photoUrl} size={48} />
                <div>
                    <NameWithEmail user={member} />
                    <SocialBadges profiles={member.socialProfiles} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}