const nodemailer = require('nodemailer');

// Create a reusable transporter object with your SMTP provider settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,     // e.g. smtp.gmail.com, smtp.mailtrap.io, smtp.sendgrid.net
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,                   // true for port 465, false for others
  auth: {
    user: process.env.SMTP_USER,  // your SMTP username
    pass: process.env.SMTP_PASS,  // your SMTP password or API key
  },
});

// Optional: Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter connection error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

/**
 * Send email utility function
 * @param {Object} options - email options: to, subject, text, html
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('Missing recipient email address');

  const mailOptions = {
    from: process.env.SMTP_FROM || 'YourApp <no-reply@yourapp.com>', // sender address
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
}

module.exports = { sendEmail };
