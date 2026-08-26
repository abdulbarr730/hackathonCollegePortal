const emailService = require('./email.service');
const User = require('../../modules/users/user.model');
const Team = require('../../modules/teams/team.model');

async function notifyUsersNewUpdates(inserted = []) {
  if (!Array.isArray(inserted) || inserted.length === 0) return;

  try {
    // 1. Fetch all registered users
    const users = await User.find({
      email: { $exists: true, $ne: '' }
    }).select('email name isVerified').lean();

    // 2. Fetch all team leaders and members
    const teams = await Team.find()
      .populate('leader', 'email name')
      .populate('members', 'email name')
      .lean();

    const recipientSet = new Set();

    // Add all registered users
    users.forEach(u => {
      if (u.email) recipientSet.add(u.email.toLowerCase().trim());
    });

    // Explicitly add all team leaders and squad members
    teams.forEach(t => {
      if (t.leader?.email) recipientSet.add(t.leader.email.toLowerCase().trim());
      if (Array.isArray(t.members)) {
        t.members.forEach(m => {
          if (m?.email) recipientSet.add(m.email.toLowerCase().trim());
        });
      }
    });

    const emails = Array.from(recipientSet).filter(Boolean);
    if (emails.length === 0) return;

    const latest = inserted[0];
    const subject = inserted.length === 1
      ? `📢 New SIH Official Update: ${latest.title.slice(0, 65)}`
      : `📢 ${inserted.length} New Official SIH Hackathon Updates Published`;

    const updatesListHtml = inserted.map(u => `
      <div style="margin-bottom: 16px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${u.title}</h3>
        ${u.summary ? `<p style="margin: 0 0 12px 0; color: #475569; font-size: 13px; line-height: 1.5;">${u.summary}</p>` : ''}
        ${u.url ? `<a href="${u.url}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 8px; text-decoration: none;">View Official Circular &rarr;</a>` : ''}
      </div>
    `).join('');

    const content = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
          Official SIH Hackathon Bulletin
        </div>
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">New Hackathon Announcements Published</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          The Smart India Hackathon (SIH) portal has published new official updates, guidelines, or problem statements relevant to your team submission.
        </p>
        
        ${updatesListHtml}
        
        <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; text-align: center;">
          Sent automatically by CampXCode Hackathon Portal • Multi-Tenancy Institutional Network
        </p>
      </div>
    `;

    console.log(`📧 Dispatching update email to ${emails.length} users...`);
    
    // Dispatch in batches of 25 using emailService
    const BATCH_SIZE = 25;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(email => emailService.sendBroadcastEmail({
          to: email,
          subject,
          content,
          provider: 'auto'
        }))
      );
      if (i + BATCH_SIZE < emails.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log(`✅ Update notification email successfully dispatched to ${emails.length} recipients`);

  } catch (err) {
    console.error('Error in notifyUsersNewUpdates:', err.message);
  }
}

module.exports = { notifyUsersNewUpdates };
