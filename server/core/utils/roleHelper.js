/**
 * Helper to determine if a user is a Platform Super Admin.
 * Super Admins:
 *  - abdulbarr730@gmail.com, rkapoor2913@gmail.com
 *  - role === 'super_admin'
 *  - isAdmin === true && role === 'admin' && !college
 */
const SUPER_ADMIN_EMAILS = [
  'abdulbarr730@gmail.com'
];

const isSuperAdmin = (user) => {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(email)) return true;
  if (user.role === 'super_admin') return true;
  if (user.isAdmin && user.role === 'admin' && !user.college) return true;
  return false;
};

/**
 * Returns the college ID constraint for non-super admins.
 * Returns null if the user is a super admin (meaning no college filter is enforced).
 */
const getCollegeScope = (user) => {
  if (!user) return null;
  if (isSuperAdmin(user)) return null;
  return user.college ? String(user.college._id || user.college) : null;
};

module.exports = {
  isSuperAdmin,
  getCollegeScope,
  SUPER_ADMIN_EMAILS
};
