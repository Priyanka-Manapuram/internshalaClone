const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const LoginHistory = require("../Model/LoginHistory");
const Otp = require("../Model/Otp");
const User = require("../Model/User");
const { parseUserAgent } = require("../utils/parseUserAgent");
const { generateOtp, sendOtpEmail } = require("../utils/sendOtp");
const { mobileTimeRestriction } = require("../middleware/mobileTimeRestriction");

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "Unknown"
  );
}

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ─── POST /api/auth/record-login ─────────────────────────────────────────────
router.post("/record-login", mobileTimeRestriction, async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    const ua = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(ua);
    const ipAddress = getIp(req);

    await LoginHistory.create({
      uid,
      email,
      name: name || "",
      ipAddress,
      browser,
      os,
      device,
      status: "success",
    });

    if (device === "Chrome") {
      const otp = generateOtp();
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp });
      await sendOtpEmail(email, otp);
      return res.status(200).json({
        success: true,
        requiresOtp: true,
        message: "OTP sent to your email.",
      });
    }

    return res.status(200).json({ success: true, requiresOtp: false });
  } catch (error) {
    console.error("record-login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Missing email or OTP." });

    const record = await Otp.findOne({ email });
    if (!record)
      return res.status(400).json({ success: false, message: "OTP expired or not found." });

    if (record.otp !== otp.trim())
      return res.status(400).json({ success: false, message: "Invalid OTP." });

    await Otp.deleteMany({ email });
    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("verify-otp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/resend-otp ───────────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required." });

    const otp = generateOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });
    await sendOtpEmail(email, otp);
    return res.status(200).json({ success: true, message: "OTP resent." });
  } catch (error) {
    console.error("resend-otp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/email-login ──────────────────────────────────────────────
router.post("/email-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(400).json({ success: false, message: "No password set for this account. Use forgot password first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid password." });

    return res.status(200).json({ success: true, message: "Login successful." });
  } catch (error) {
    console.error("email-login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required." });

    // Check one request per day
    const existingUser = await User.findOne({ email });
    if (existingUser?.lastPasswordReset) {
      const lastReset = new Date(existingUser.lastPasswordReset);
      const now = new Date();
      const diffHours = (now - lastReset) / (1000 * 60 * 60);
      if (diffHours < 24) {
        const hoursLeft = Math.ceil(24 - diffHours);
        return res.status(429).json({
          success: false,
          message: `You can only reset your password once per day. Try again in ${hoursLeft} hour(s).`,
        });
      }
    }

    // Generate and hash new password
    const newPassword = generateRandomPassword();
    const hashed = await bcrypt.hash(newPassword, 10);

    // Save to DB (upsert)
    await User.findOneAndUpdate(
      { email },
      { email, password: hashed, lastPasswordReset: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    await sendOtpEmail(email, newPassword, true);

    return res.status(200).json({
      success: true,
      message: "New password sent to your email.",
    });
  } catch (error) {
    console.error("forgot-password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/auth/login-history/:uid ────────────────────────────────────────
router.get("/login-history/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const history = await LoginHistory.find({ uid })
      .sort({ loginTime: -1 })
      .limit(50);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("login-history error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;