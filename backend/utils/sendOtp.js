const SibApiV3Sdk = require("@getbrevo/brevo");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp) {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
  apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = {
    sender: { name: "Internarea", email: "noreply@internarea.com" },
    to: [{ email: to }],
    subject: "Your Internarea Login OTP",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <h2 style="color:#2563eb;">Login Verification</h2>
        <p style="color:#374151;">Use the OTP below to complete your login. It expires in <strong>5 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you did not attempt to log in, please ignore this email.</p>
      </div>
    `,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

module.exports = { generateOtp, sendOtpEmail };