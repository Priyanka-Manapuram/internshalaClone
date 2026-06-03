const axios = require("axios");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, value, isPassword = false) {
  const subject = isPassword
    ? "Your New Internarea Password"
    : "Your Internarea Login OTP";

  const htmlContent = isPassword
    ? `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <h2 style="color:#2563eb;">Your New Password</h2>
        <p style="color:#374151;">Your password has been reset. Use the password below to login.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#111827;">${value}</span>
        </div>
        <p style="color:#e53e3e;font-size:13px;">Please change this password after logging in.</p>
        <p style="color:#6b7280;font-size:13px;">If you did not request this, please contact support.</p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <h2 style="color:#2563eb;">Login Verification</h2>
        <p style="color:#374151;">Use the OTP below to complete your login. It expires in <strong>5 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#111827;">${value}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you did not attempt to log in, please ignore this email.</p>
      </div>
    `;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Internarea", email: "priyankamanapuram08@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { generateOtp, sendOtpEmail };