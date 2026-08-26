const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

const DEFAULT_FROM = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'CampXCode <no-reply@campxcode.in>';
const FALLBACK_FROM = 'Hackathon Portal <onboarding@resend.dev>';

async function sendMail({ to, subject, html, text, from = DEFAULT_FROM }) {
  if (!to) throw new Error('Missing recipient');

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Email logged to console:', { to, subject });
    return { success: true, id: 'mock-id-' + Date.now() };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      // If error is domain verification related, attempt with fallback from address
      if (from !== FALLBACK_FROM && (error.message?.includes('domain') || error.message?.includes('from'))) {
        console.warn(`Resend domain error with "${from}", attempting with fallback: "${FALLBACK_FROM}"`);
        const fallbackRes = await resend.emails.send({
          from: FALLBACK_FROM,
          to,
          subject,
          html,
          text
        });
        if (fallbackRes.error) throw new Error(fallbackRes.error.message);
        return { success: true, id: fallbackRes.data?.id };
      }
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Failed to dispatch email via Resend:', err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// NEWSLETTER VERIFICATION EMAIL TEMPLATE (LIGHT THEME)
// ---------------------------------------------------------------------------
async function sendNewsletterVerification({ email, token, clientUrl }) {
  const verifyLink = `${clientUrl || 'http://localhost:3000'}/verify-newsletter?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; border: 1px solid #e0e7ff; }
        h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2); }
        .url-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #64748b; margin-top: 24px; word-break: break-all; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">⚡ Official Hackathon Portal</div>
        <h1>Confirm Your Newsletter Subscription</h1>
        <p>You recently requested to subscribe to official Smart India Hackathon announcements, campus problem statements, and schedule alerts.</p>
        <p>Please click the button below to verify your email address and activate your subscription:</p>
        <div class="btn-wrapper">
          <a href="${verifyLink}" class="btn" target="_blank">Confirm Subscription &rarr;</a>
        </div>
        <div class="url-box">
          If the button doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${verifyLink}" style="color: #4f46e5; text-decoration: underline;">${verifyLink}</a>
        </div>
        <div class="footer">
          If you did not request this subscription, you can safely ignore this email.<br/>
          &copy; ${new Date().getFullYear()} Campus Hackathon Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to: email,
    subject: 'Action Required: Confirm your Hackathon Newsletter Subscription',
    html,
    text: `Please confirm your newsletter subscription by visiting: ${verifyLink}`
  });
}

// ---------------------------------------------------------------------------
// BROADCAST ANNOUNCEMENT EMAIL TEMPLATE (LIGHT THEME)
// ---------------------------------------------------------------------------
async function sendBroadcastEmail({ to, subject, content, clientUrl }) {
  const formattedContent = String(content).replace(/\n/g, '<br/>');
  const portalLink = clientUrl || 'http://localhost:3000';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; border: 1px solid #e0e7ff; }
        h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 18px 0; line-height: 1.3; }
        .content { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 28px; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2); }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">Official Hackathon Bulletin</div>
        <h1>${subject}</h1>
        <div class="content">${formattedContent}</div>
        <div style="text-align: left; margin: 24px 0;">
          <a href="${portalLink}" class="btn" target="_blank">Open Hackathon Portal &rarr;</a>
        </div>
        <div class="footer">
          You are receiving this official communication as a registered participant, SPOC, or subscriber of the Campus Hackathon Portal.<br/>
          &copy; ${new Date().getFullYear()} Campus Hackathon Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to,
    subject,
    html,
    text: content
  });
}

module.exports = {
  sendMail,
  sendNewsletterVerification,
  sendBroadcastEmail
};