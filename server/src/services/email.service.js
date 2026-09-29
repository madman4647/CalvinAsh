const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * The only account-related email in the system (N9/N10) - nobody ever
 * receives a password by email, only a one-time, expiring link to set one.
 * Used for both new-account activation and forgot-password resets.
 */
async function sendSetPasswordEmail(to, { loginId, url, isReset = false }) {
  const heading = isReset ? 'Reset your password' : 'Set your password';
  const intro = isReset
    ? 'A password reset was requested for your Calvin account.'
    : 'An account has been created for you on Calvin.';

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Team SynapsE" <synapse@iiml.ac.in>',
    to,
    subject: `Calvin - ${heading}`,
    html: `
      <h2>Calvin</h2>
      <p>${intro}</p>
      <p>Login ID: <strong>${escapeHtml(loginId)}</strong></p>
      <p><a href="${url}">${heading}</a></p>
      <p>This link expires in 24 hours and can only be used once.</p>
      <br/>
      <p>Regards,<br/>Team SynapsE<br/>IIM Lucknow</p>
    `,
  });
}

module.exports = { sendSetPasswordEmail };
