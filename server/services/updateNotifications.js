const { sendMail } = require('../utils/mailer');
const User = require('../models/User');

const EMAILS_ENABLED = String(process.env.UPDATES_EMAILS_ENABLED || 'true') === 'true';
const BATCH_SIZE = Math.max(parseInt(process.env.UPDATES_EMAILS_BATCH_SIZE || '100', 10), 1);

function buildContent(inserted = []) {
  const subject = 'New SIH update(s) published';
  const text = `New updates:\n${inserted.map(u => `• ${u.title}${u.url ? ` - ${u.url}` : ''}`).join('\n')}`;
  const html = `<p>New updates:</p><ul>${inserted
    .map(u => `<li>${u.url ? `<a href="${u.url}" target="_blank" rel="noreferrer">${u.title}</a>` : u.title}</li>`)
    .join('')}</ul>`;
  return { subject, text, html };
}

async function sendBatches(emails, subject, text, html) {
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const slice = emails.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    await Promise.allSettled(slice.map(to => sendMail({ to, subject, text, html })));
  }
}

async function notifyUsersNewUpdates(inserted = []) {
  try {
    if (!EMAILS_ENABLED) {
      console.log('UPDATES_EMAILS_ENABLED=false: skipping emails.');
      return;
    }
    if (!inserted.length) return;

    const users = await User.find({
      verified: true,
      email: { $exists: true, $ne: '' },
      $or: [{ emailOptOut: { $exists: false } }, { emailOptOut: false }],
    })
      .select('email')
      .lean();

    const emails = users.map(u => u.email).filter(Boolean);
    if (!emails.length) return;

    const { subject, text, html } = buildContent(inserted);
    await sendBatches(emails, subject, text, html);
  } catch (err) {
    console.error('notifyUsersNewUpdates error:', err?.message || err);
  }
}

module.exports = { notifyUsersNewUpdates };
