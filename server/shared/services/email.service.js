const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'CampXCode <no-reply@campxcode.in>'; // ← put your actual domain here

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('Missing recipient');

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  console.log('Email sent:', data?.id);
  return { success: true, id: data?.id };
}

module.exports = { sendMail };