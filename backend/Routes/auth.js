const express = require("express");
const router = express.Router();
const LoginHistory = require("../Model/LoginHistory");
const Otp = require("../Model/Otp");
const { parseUserAgent } = require("../utils/parseUserAgent");
const { generateOtp, sendOtpEmail } = require("../utils/sendOtp");
const { mobileTimeRestriction } = require("../middleware/mobileTimeRestriction");

// ─── Helper: get real IP ─────────────────────────────────────────────────────
function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "Unknown"
  );
}

// ─── POST /api/auth/record-login ─────────────────────────────────────────────
// Called by the frontend right after Firebase auth succeeds.
// If device is Chrome → save history + send OTP → return { requiresOtp: true }
// If device is Mobile → check time window first → save history → return { requiresOtp: false }
router.post("/record-login", mobileTimeRestriction, async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    const ua = req.headers["user-agent"] || "";
    const { browser, os, device } = parseUserAgent(ua);
    const ipAddress = getIp(req);

    // Save login history entry
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

    // Chrome users need an OTP
    if (device === "Chrome") {
      const otp = generateOtp();
      // Upsert: remove any previous OTP for this email first
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
// Verifies the OTP the Chrome user typed in.
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Missing email or OTP." });
    }

    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP expired or not found." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // OTP correct — clean up
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
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
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

// ─── GET /api/auth/login-history/:uid ────────────────────────────────────────
// Returns login history for the given Firebase UID (latest first, max 50).
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