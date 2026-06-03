const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Generates a 6-digit numeric OTP.
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an OTP email to the given address.
 * Uses Gmail SMTP — set EMAIL_USER and EMAIL_PASS in .env
 */
async function sendOtpEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
    },
  });

  const mailOptions = {
    from: `"Internarea Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Internarea Login OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <h2 style="color:#2563eb;margin-bottom:8px;">Login Verification</h2>
        <p style="color:#374151;">Use the OTP below to complete your login. It expires in <strong>5 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you did not attempt to log in, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOtp, sendOtpEmail };