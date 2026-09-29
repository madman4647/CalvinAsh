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

async function sendPasswordEmail(to, password) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Team SynapsE" <synapse@iiml.ac.in>',
    to,
    subject: 'Calvin CCA Platform - Password Reset',
    html: `
      <h2>Calvin CCA Platform</h2>
      <p>Your password has been reset.</p>
      <p>Your new password is: <strong>${password}</strong></p>
      <p>Please log in and change your password at your earliest convenience.</p>
      <br/>
      <p>Regards,<br/>Team SynapsE<br/>IIM Lucknow</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendCredentialEmail(to, pgpid) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Team SynapsE" <synapse@iiml.ac.in>',
    to,
    subject: 'Calvin CCA Platform - Your Login Credentials',
    html: `
      <h2>Calvin CCA Platform</h2>
      <p>Your account has been created on the Calvin CCA Platform.</p>
      <p>Your login ID is: <strong>${pgpid}</strong></p>
      <p>Please log in to the Calvin CCA Platform at <a href="http://calvin.iiml.ac.in">http://calvin.iiml.ac.in</a> using your credentials.</p>
      <p>If you need your password, use the <strong>Forgot Password</strong> feature on the login page.</p>
      <br/>
      <p>Regards,<br/>Team SynapsE<br/>IIM Lucknow</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordEmail, sendCredentialEmail };
