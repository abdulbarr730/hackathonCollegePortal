
module.exports = function registerRoutes(app) {
  require('dotenv').config();
  // 
  app.use('/api/auth',    require('./users/auth.routes'));
  app.use('/api/users', require('./users/user.routes'));
  app.use('/api/me', require('./users/me.routes'));
  app.use('/api/profile', require('./users/profile.routes'));

  // TEAMS
  app.use('/api/teams', require('./teams/team.routes'));
  app.use('/api/invitations', require('./teams/invitation.routes'));

  // IDEAS
  app.use('/api/ideas', require('./ideas/idea.routes'));
  app.use('/api/comments', require('./ideas/comment.routes'));

  // HACKATHONS
  app.use('/api/hackathon', require('./hackathons/hackathon.routes'));
  app.use('/api/archive', require('./hackathons/archive.routes'));

  // RESOURCES
  app.use('/api/resources', require('./resources/resource.routes'));

  // UPDATES
  app.use('/api/updates', require('./updates/update.routes'));
  app.use('/api/public/updates', require('./updates/publicUpdate.routes'));

  // SOCIAL
  app.use('/api/users/social', require('./social/social.routes'));

  // ADMIN
  app.use('/api/admin', require('./admin/admin.routes'));
  app.use('/api/admin/resources', require('./resources/adminResource.routes'));
  app.use('/api/admin/updates', require('./updates/adminUpdate.routes'));
  app.use('/api/admin/social-config', require('./admin/adminSocialConfig.routes'));
};