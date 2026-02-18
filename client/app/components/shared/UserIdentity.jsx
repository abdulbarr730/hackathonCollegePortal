import Avatar from '../Avatar';
import SocialBadges from '../SocialBadges';

export default function UserIdentity({ user, size = 28, showSocial = false }) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} src={user.photoUrl} size={size} />
      <div className="flex flex-col">
        <span className="font-medium text-gray-200">{user.nameWithYear || user.name}</span>
        <span className="text-xs text-slate-400">{user.email || 'No email'}</span>
      </div>
      {showSocial && <SocialBadges profiles={user.socialProfiles} className="ml-2" />}
    </div>
  );
}