/**
 * server/shared/services/discord.service.js
 * 100% Free Real-time Discord Webhook Notification Service
 * Supports dedicated channels per activity via specific webhook environment variables,
 * or falls back to a single general DISCORD_WEBHOOK_URL.
 */

const WEBHOOKS = {
  COLLEGES: process.env.DISCORD_WEBHOOK_COLLEGES || process.env.DISCORD_WEBHOOK_URL,
  USERS: process.env.DISCORD_WEBHOOK_USERS || process.env.DISCORD_WEBHOOK_URL,
  SECURITY: process.env.DISCORD_WEBHOOK_SECURITY || process.env.DISCORD_WEBHOOK_URL,
  NEWSLETTER: process.env.DISCORD_WEBHOOK_NEWSLETTER || process.env.DISCORD_WEBHOOK_URL,
  GENERAL: process.env.DISCORD_WEBHOOK_URL
};

/**
 * Dispatches an embed payload to a Discord webhook URL asynchronously (fire & forget)
 */
async function sendDiscordEmbed(webhookUrl, { title, description, color = 0x6366f1, fields = [], footer = 'CampXCode Notification Engine' }) {
  if (!webhookUrl) return; // Silent if webhook not configured

  try {
    const payload = {
      username: 'CampXCode Alert Bot',
      avatar_url: 'https://www.campxcode.in/favicon.ico',
      embeds: [
        {
          title,
          description,
          color,
          fields,
          footer: { text: footer },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Discord Webhook notification error (non-fatal):', err.message);
  }
}

// 1. College Onboarding
exports.notifyCollegeOnboarding = async (collegeData = {}) => {
  const url = WEBHOOKS.COLLEGES;
  if (!url) return;

  await sendDiscordEmbed(url, {
    title: '🏛️ New College Onboarding Application Received!',
    description: `**${collegeData.name || 'Unnamed Institution'}** has submitted an institutional registration request.`,
    color: 0x10b981, // Emerald Green
    fields: [
      { name: 'Short Name', value: collegeData.shortName || 'N/A', inline: true },
      { name: 'AISHE Code', value: collegeData.aisheCode || 'Pending', inline: true },
      { name: 'Location', value: `${collegeData.city || ''}, ${collegeData.state || ''}`, inline: true },
      { name: 'Nodal SPOC', value: `${collegeData.spocName || 'N/A'} (${collegeData.designation || 'Faculty'})`, inline: false },
      { name: 'Official SPOC Email', value: `\`${collegeData.spocEmail || 'N/A'}\``, inline: true },
      { name: 'SPOC Mobile', value: collegeData.spocPhone || 'N/A', inline: true },
      { name: 'Domain Policy', value: collegeData.domain ? `\`${collegeData.domain}\`` : (collegeData.allowGenericEmails ? 'Generic Allowed' : 'Custom Domain'), inline: true },
      { name: 'Admin Action', value: '[Review in Super Admin Console](https://www.campxcode.in/admin/colleges)', inline: false }
    ],
    footer: 'CampXCode • Institutional Governance'
  });
};

// 2. User Signup
exports.notifyUserSignup = async (userData = {}) => {
  const url = WEBHOOKS.USERS;
  if (!url) return;

  await sendDiscordEmbed(url, {
    title: '👤 New Student / User Registered',
    description: `**${userData.name || 'New User'}** just joined the platform.`,
    color: 0x6366f1, // Indigo
    fields: [
      { name: 'Email', value: `\`${userData.email || 'N/A'}\``, inline: true },
      { name: 'Role', value: (userData.role || 'student').toUpperCase(), inline: true },
      { name: 'Course & Year', value: `${userData.course || 'B.Tech'} - Year ${userData.year || '1'}`, inline: true },
      { name: 'Affiliated College', value: userData.collegeName || 'BBDIT / Global', inline: false }
    ],
    footer: 'CampXCode • User Directory'
  });
};

// 3. Security / Password Activity
exports.notifyPasswordActivity = async ({ email, action = 'Password Reset', ip = 'Unknown IP' }) => {
  const url = WEBHOOKS.SECURITY;
  if (!url) return;

  await sendDiscordEmbed(url, {
    title: `🔒 Security Alert: ${action}`,
    description: `A security action was performed for account \`${email}\`.`,
    color: 0xf59e0b, // Amber
    fields: [
      { name: 'Account Email', value: `\`${email}\``, inline: true },
      { name: 'Action', value: action, inline: true },
      { name: 'Origin IP', value: `\`${ip}\``, inline: false }
    ],
    footer: 'CampXCode • Security Watchdog'
  });
};

// 4. Newsletter Subscription
exports.notifyNewsletterSubscription = async ({ email, source = 'Footer' }) => {
  const url = WEBHOOKS.NEWSLETTER;
  if (!url) return;

  await sendDiscordEmbed(url, {
    title: '✉️ New Newsletter Subscriber',
    description: `A user has requested subscription to the official Hackathon bulletin.`,
    color: 0x8b5cf6, // Violet
    fields: [
      { name: 'Subscriber Email', value: `\`${email}\``, inline: true },
      { name: 'Source', value: source, inline: true }
    ],
    footer: 'CampXCode • Newsletter Engine'
  });
};

// 5. SIH Live Update Scraped Alert (1-Hour Automated Feeder)
exports.notifySIHUpdateScraped = async (updates = []) => {
  const url = WEBHOOKS.GENERAL || WEBHOOKS.COLLEGES;
  if (!url || !Array.isArray(updates) || updates.length === 0) return;

  const updateFields = updates.slice(0, 6).map((u, i) => ({
    name: `📌 [${i + 1}] ${(u.title || 'Official SIH Announcement').slice(0, 100)}`,
    value: `${u.summary ? u.summary.slice(0, 150) + '...' : 'Smart India Hackathon official circular.'}
🔗 [View Official Circular](${u.url || 'https://sih.gov.in'})
⚙️ [Review & Dispatch Email in Dashboard](https://www.campxcode.in/admin/updates)`,
    inline: false
  }));

  await sendDiscordEmbed(url, {
    title: `🚨 ${updates.length} New Official SIH Update(s) Scraped & Staged for Review!`,
    description: `The automated 1-hour SIH Scraper captured new official guidelines, deadlines, or announcements. You can review them in the Super Admin Dashboard and trigger student email notifications with one click.`,
    color: 0xec4899, // Pink / Magenta
    fields: updateFields,
    footer: 'CampXCode • High-Precision SIH Scraper Engine'
  });
};
