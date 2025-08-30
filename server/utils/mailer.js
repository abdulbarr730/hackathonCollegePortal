const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,   // e.g. 587
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,   // e.g. '"SIH Portal" <noreply@yourdomain.com>'
} = process.env;

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const port = Number(SMTP_PORT || 587);
  const secure = false; // STARTTLS on 587

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure, // true only for 465
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    // Uncomment only if you hit self-signed certs in dev:
    // tls: { rejectUnauthorized: false },
  });

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('Missing recipient');
  const tx = getTransporter();
  const from = SMTP_FROM || 'SIH Portal <no-reply@sih-portal.local>';
  return tx.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };
