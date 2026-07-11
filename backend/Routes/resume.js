const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Resume = require("../Model/Resume");
const Subscription = require("../Model/Subscription");
const Otp = require("../Model/Otp");
const { generateOtp, sendOtpEmail } = require("../utils/sendOtp");
const axios = require("axios");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const RESUME_PRICE = 50; // ₹50 per resume

// ─── POST /api/resume/send-otp ────────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { uid, email, plan } = req.body;

    // Check if user is on Silver or Gold plan
    const subscription = await Subscription.findOne({ uid });
    const allowedPlans = ["Silver", "Gold"];

    if (!subscription || !allowedPlans.includes(subscription.plan)) {
      return res.status(403).json({
        success: false,
        message: "Resume creation is only available for Silver and Gold plan users.",
      });
    }

    // Generate and send OTP
    const otp = generateOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });
    await sendOtpEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email for resume payment verification.",
    });
  } catch (error) {
    console.error("resume send-otp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/resume/verify-otp ─────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });
    if (!record)
      return res.status(400).json({ success: false, message: "OTP expired or not found." });

    if (record.otp !== otp.trim())
      return res.status(400).json({ success: false, message: "Invalid OTP." });

    await Otp.deleteMany({ email });

    return res.status(200).json({ success: true, message: "OTP verified." });
  } catch (error) {
    console.error("resume verify-otp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/resume/create-order ───────────────────────────────────────────
router.post("/create-order", async (req, res) => {
  try {
    const { uid, email } = req.body;

    const order = await razorpay.orders.create({
      amount: RESUME_PRICE * 100,
      currency: "INR",
      receipt: `res_${Date.now()}`,
      notes: { uid, email, type: "resume" },
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: RESUME_PRICE * 100,
      currency: "INR",
    });
  } catch (error) {
    console.error("resume create-order error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/resume/verify-payment ─────────────────────────────────────────
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      uid,
      email,
      resumeData,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    // Save resume to DB
    const resume = await Resume.create({
      uid,
      email,
      ...resumeData,
      razorpayPaymentId: razorpay_payment_id,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified. Resume saved.",
      resume,
    });
  } catch (error) {
    console.error("resume verify-payment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/resume/:uid ─────────────────────────────────────────────────────
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const resume = await Resume.findOne({ uid }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    console.error("resume get error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/resume/generate-summary ─────────────────────────
router.post("/generate-summary", async (req, res) => {
  try {
    const { name, qualification, institution, graduationYear, experience, skills } = req.body;

    if (!skills && !experience) {
      return res.status(400).json({
        success: false,
        message: "Please add at least skills or experience before generating a summary.",
      });
    }

    const prompt = `You are a resume-writing assistant. Based on the details below, write ONLY the final resume summary text — no explanations, no meta-commentary, no formatting notes, no line-count discussion. Output exactly 3-4 sentences, under 60 words total, third person, no first-person pronouns.

Name: ${name || "N/A"}
Qualification: ${qualification || "N/A"}
Institution: ${institution || "N/A"}
Graduation Year: ${graduationYear || "N/A"}
Experience: ${experience || "N/A"}
Skills: ${skills || "N/A"}

Resume Summary:`;

    const geminiRes = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
  maxOutputTokens: 400, 
  temperature: 0.7,
  thinkingConfig: { thinkingBudget: 0 }
},
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const summary = geminiRes.data.candidates[0].content.parts[0].text.trim();

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("resume generate-summary error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate summary. Please try again.",
    });
  }
});

module.exports = router;