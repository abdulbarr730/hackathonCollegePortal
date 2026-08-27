const { Resend } = require('resend');
const { getFrontendUrl } = require('../../core/utils/urlHelper');

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

function getContextualSender(category = 'general') {
  const domain = process.env.EMAIL_DOMAIN || 'campxcode.in';
  switch (category) {
    case 'security':
    case 'auth':
    case 'otp':
      return process.env.ZEPTOMAIL_FROM_SECURITY || `CampXCode Security <security@${domain}>`;
    case 'broadcast':
    case 'updates':
    case 'newsletter':
    case 'bulletin':
      // Personal Sender Name + Updates domain routes to Primary/Updates in Gmail
      return process.env.ZEPTOMAIL_FROM_UPDATES || `Abdul Barr from CampXCode <updates@${domain}>`;
    case 'onboarding':
    case 'institutional':
    case 'admin':
      return process.env.ZEPTOMAIL_FROM_ONBOARDING || `CampXCode Institutional Desk <onboarding@${domain}>`;
    default:
      return process.env.ZEPTOMAIL_FROM || process.env.RESEND_FROM || `Abdul Barr from CampXCode <updates@${domain}>`;
  }
}

const DEFAULT_FROM = getContextualSender('general');
const FALLBACK_FROM = 'Hackathon Portal <onboarding@resend.dev>';

/**
 * Dispatch via Zoho ZeptoMail REST API
 */
async function sendViaZeptoMail({ to, subject, html, text, from = DEFAULT_FROM, replyTo = 'hello@abdulbarr.in' }) {
  const token = process.env.ZEPTOMAIL_TOKEN || process.env.ZEPTOMAIL_API_KEY;
  if (!token) return false;

  const url = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
  
  const fromAddress = from.includes('<') ? from.match(/<([^>]+)>/)[1] : from;
  const fromName = from.includes('<') ? from.split('<')[0].trim() : 'Abdul Barr from CampXCode';

  const body = {
    from: { address: fromAddress, name: fromName },
    to: [{ email_address: { address: to } }],
    reply_to: [{ address: replyTo, name: 'Abdul Barr' }],
    subject: subject,
    htmlbody: html,
    textbody: text || subject
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Zoho-enczapikey ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `ZeptoMail error HTTP ${res.status}`);
  }

  const data = await res.json();
  return { success: true, id: data.data?.[0]?.message_id || 'zepto-' + Date.now(), provider: 'zeptomail' };
}

/**
 * Main sendMail dispatcher supporting explicit provider selection:
 * - 'zeptomail': Zoho ZeptoMail API
 * - 'resend': Resend API
 * - 'auto': ZeptoMail with Resend fallback
 */
async function sendMail({ to, subject, html, text, from = DEFAULT_FROM, replyTo = 'hello@abdulbarr.in', provider = 'auto' }) {
  if (!to) throw new Error('Missing recipient');

  const headers = {
    'X-Priority': '1',
    'Importance': 'high',
    'X-Entity-Ref-ID': 'campxcode-' + Date.now()
  };

  // 1. Explicit ZeptoMail Dispatch
  if (provider === 'zeptomail') {
    if (!process.env.ZEPTOMAIL_TOKEN && !process.env.ZEPTOMAIL_API_KEY) {
      throw new Error('Zoho ZeptoMail API Token is not configured in environment variables.');
    }
    return await sendViaZeptoMail({ to, subject, html, text, from, replyTo });
  }

  // 2. Explicit Resend Dispatch
  if (provider === 'resend') {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API Key is not configured in environment variables.');
    }
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      headers
    });
    if (error) {
      if (from !== FALLBACK_FROM && (error.message?.includes('domain') || error.message?.includes('from'))) {
        const fallbackRes = await resend.emails.send({ 
          from: FALLBACK_FROM, 
          to, 
          subject, 
          html, 
          text,
          reply_to: replyTo,
          headers
        });
        if (fallbackRes.error) throw new Error(fallbackRes.error.message);
        return { success: true, id: fallbackRes.data?.id, provider: 'resend' };
      }
      throw new Error(error.message);
    }
    return { success: true, id: data?.id, provider: 'resend' };
  }

  // 3. Auto Failover (ZeptoMail -> Resend)
  if (process.env.ZEPTOMAIL_TOKEN || process.env.ZEPTOMAIL_API_KEY) {
    try {
      const result = await sendViaZeptoMail({ to, subject, html, text, from, replyTo });
      if (result) return { ...result, provider: 'zeptomail' };
    } catch (zeptoErr) {
      console.warn('ZeptoMail dispatch attempt failed, falling back to Resend:', zeptoErr.message);
    }
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('No email provider API key configured. Email logged to console:', { to, subject });
    return { success: true, id: 'mock-id-' + Date.now(), provider: 'mock' };
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
    reply_to: replyTo,
    headers
  });

  if (error) {
    if (from !== FALLBACK_FROM && (error.message?.includes('domain') || error.message?.includes('from'))) {
      const fallbackRes = await resend.emails.send({ 
        from: FALLBACK_FROM, 
        to, 
        subject, 
        html, 
        text,
        reply_to: replyTo,
        headers
      });
      if (fallbackRes.error) throw new Error(fallbackRes.error.message);
      return { success: true, id: fallbackRes.data?.id, provider: 'resend' };
    }
    throw new Error(error.message);
  }

  return { success: true, id: data?.id, provider: 'resend' };
}

// ---------------------------------------------------------------------------
// 1. NEWSLETTER VERIFICATION EMAIL TEMPLATE
// ---------------------------------------------------------------------------
async function sendNewsletterVerification({ email, token, clientUrl, from = getContextualSender('newsletter') }) {
  const baseUrl = getFrontendUrl(null, clientUrl);
  const verifyLink = `${baseUrl}/verify-newsletter?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; border: 1px solid #e0e7ff; }
        h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 12px; }
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
// 2. BROADCAST BULLETIN EMAIL TEMPLATE
// ---------------------------------------------------------------------------
async function sendBroadcastEmail({ to, subject, content, clientUrl, from = getContextualSender('updates'), provider = 'auto' }) {
  const formattedContent = String(content).replace(/\n/g, '<br/>');
  const baseUrl = getFrontendUrl(null, clientUrl);
  const portalLink = baseUrl || 'https://www.campxcode.in';
  const logoUrl = 'https://www.campxcode.in/campxcode-logo.png';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">
        <!-- Top Brand Header -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <img src="${logoUrl}" alt="CampXCode" width="140" style="display: block; border: 0; max-height: 48px; width: auto;" />
                </td>
                <td align="right" style="vertical-align: middle;">
                  <span style="display: inline-block; background-color: #eef2ff; color: #4f46e5; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #e0e7ff;">
                    Official Notice
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 28px 32px 24px 32px;">
            <h1 style="margin: 0 0 18px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.4;">
              ${subject}
            </h1>
            
            <div style="font-size: 14px; line-height: 1.75; color: #334155; margin-bottom: 26px;">
              ${formattedContent}
            </div>

            <!-- Action Button -->
            <div style="margin: 28px 0 24px 0;">
              <a href="${portalLink}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-size: 13px; font-weight: 700; padding: 13px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 8px rgba(79, 70, 229, 0.25);">
                Open Hackathon Portal &rarr;
              </a>
            </div>
          </td>
        </tr>

        <!-- Executive Founder Signature -->
        <tr>
          <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="48" style="vertical-align: top; padding-right: 14px;">
                  <img src="${logoUrl}" alt="CampXCode" width="44" height="44" style="display: block; border-radius: 10px; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 2px;" />
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Abdul Barr</p>
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #4f46e5;">Founder &amp; Lead Architect • CampXCode</p>
                  
                  <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
                    <span>🌐 <a href="https://campxcode.in" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">campxcode.in</a></span> &bull; 
                    <span>💼 <a href="https://abdulbarr.in" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">abdulbarr.in</a></span><br/>
                    <span>✉️ <a href="mailto:hello@abdulbarr.in" style="color: #4f46e5; text-decoration: none; font-weight: 600;">hello@abdulbarr.in</a></span> &bull; 
                    <span>📞 <a href="tel:+917479934706" style="color: #0f172a; text-decoration: none; font-weight: 600;">+91 7479934706</a></span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer Notice -->
        <tr>
          <td style="padding: 16px 32px 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              You are receiving this official announcement as a verified participant, team leader, or subscriber on CampXCode.<br/>
              &copy; ${new Date().getFullYear()} CampXCode Institutional Hackathon Portal. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendMail({
    to,
    subject,
    html,
    text: content,
    from,
    replyTo: 'hello@abdulbarr.in',
    provider
  });
}

// ---------------------------------------------------------------------------
// 3. WELCOME EMAIL ON USER SIGNUP
// ---------------------------------------------------------------------------
async function sendWelcomeEmail({ to, name, collegeName, clientUrl, from = getContextualSender('general') }) {
  const baseUrl = getFrontendUrl(null, clientUrl);
  const portalLink = `${baseUrl}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; border: 1px solid #d1fae5; }
        h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
        .highlight { background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 18px; margin: 20px 0; border-radius: 0 12px 12px 0; font-size: 13px; color: #334155; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 12px; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">✓ Welcome to CampXCode</div>
        <h1>Welcome, ${name || 'Student'}!</h1>
        <p>Your account has been created on the official CampXCode Portal for <strong>${collegeName || 'your institution'}</strong>.</p>
        
        <div class="highlight">
          <strong>Next Steps:</strong><br/>
          1. Complete your coder profile with GitHub & LinkedIn.<br/>
          2. Form or join a hackathon squad on your campus.<br/>
          3. Submit your problem statements for SPOC approval.
        </div>

        <div class="btn-wrap">
          <a href="${portalLink}" class="btn" target="_blank">Access Your Dashboard &rarr;</a>
        </div>

        <div class="footer">
          Official institutional communication from CampXCode Portal.<br/>
          &copy; ${new Date().getFullYear()} Campus Hackathon Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to,
    subject: `Welcome to CampXCode Hackathon Portal - ${name}`,
    html,
    text: `Welcome to CampXCode, ${name}! Log in at: ${portalLink}`
  });
}

// ---------------------------------------------------------------------------
// 4. ACCOUNT VERIFIED BY ADMIN EMAIL
// ---------------------------------------------------------------------------
async function sendAccountVerifiedEmail({ to, name, collegeName, role = 'student', adminNotes = '', clientUrl, from = getContextualSender('onboarding') }) {
  const baseUrl = getFrontendUrl(null, clientUrl);
  const portalLink = `${baseUrl}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; }
        .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; border: 1px solid #d1fae5; }
        h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
        .details-box { background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 22px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .row:last-child { margin-bottom: 0; }
        .label { color: #64748b; font-weight: 600; }
        .val { color: #0f172a; font-weight: 700; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 12px; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">✓ Account Verified</div>
        <h1>Your Profile is Verified!</h1>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your account has been officially verified by the administrator for <strong>${collegeName || 'your college'}</strong>. You now have full verified access to access the portal, create or join hackathon squads, share resources, submit project ideas, and represent your college in collegiate hackathons and coding sprints.</p>
        
        <div class="details-box">
          <div class="row"><span class="label">Registered Email:</span> <span class="val">${to}</span></div>
          <div class="row"><span class="label">Account Role:</span> <span class="val">${role.toUpperCase()}</span></div>
          <div class="row"><span class="label">Status:</span> <span class="val" style="color: #059669;">Verified &amp; Active</span></div>
          ${adminNotes ? `<div class="row"><span class="label">Admin Notes:</span> <span class="val">${adminNotes}</span></div>` : ''}
        </div>

        <div class="btn-wrap">
          <a href="${portalLink}" class="btn" target="_blank">Open Your Dashboard &rarr;</a>
        </div>

        <div class="footer">
          Official institutional verification notice from CampXCode Portal.<br/>
          &copy; ${new Date().getFullYear()} Campus Hackathon Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to,
    subject: `Account Verified: You now have full portal access - ${name}`,
    html,
    text: `Your account has been verified by the administrator. Log in at: ${portalLink}`
  });
}

module.exports = {
  sendMail,
  sendNewsletterVerification,
  sendBroadcastEmail,
  sendWelcomeEmail,
  sendAccountVerifiedEmail
};
