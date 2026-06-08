const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Subscription = require("../Model/Subscription");
const Invoice = require("../Model/Invoice");
const { sendOtpEmail } = require("../utils/sendOtp");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  Free:   { price: 0,    limit: 1,      label: "Free" },
  Bronze: { price: 100,  limit: 3,      label: "Bronze" },
  Silver: { price: 300,  limit: 5,      label: "Silver" },
  Gold:   { price: 1000, limit: 999999, label: "Gold" },
};

function isPaymentAllowed() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  const start = 10 * 60; // 10:00 AM
  const end = 11 * 60;
  return totalMinutes >= start && totalMinutes < end;
}

// ─── GET /api/subscription/my-plan ───────────────────────────────────────────
router.get("/my-plan/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { email, name } = req.query;  // ← get from query
    
    let subscription = await Subscription.findOne({ uid });

    if (!subscription) {
      subscription = await Subscription.create({
        uid,
        email: email || "unknown@email.com",  // ← fallback
        name: name || "",
        plan: "Free",
        applicationLimit: 1,
        applicationsUsed: 0,
      });
    }

    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("my-plan error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/subscription/create-order ─────────────────────────────────────
router.post("/create-order", async (req, res) => {
  try {
    // Check payment time window (10–11 AM IST)
    if (!isPaymentAllowed()) {
      return res.status(403).json({
        success: false,
        message: "Payments are only allowed between 10:00 AM and 11:00 AM IST.",
      });
    }

    const { uid, email, name, plan } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan." });
    }

    const planDetails = PLANS[plan];

    const order = await razorpay.orders.create({
      amount: planDetails.price * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { uid, email, plan },
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: planDetails.price * 100,
      currency: "INR",
      plan,
    });
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/subscription/verify-payment ───────────────────────────────────
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      uid,
      email,
      name,
      plan,
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

    const planDetails = PLANS[plan];

    // Update or create subscription
    await Subscription.findOneAndUpdate(
      { uid },
      {
        uid,
        email,
        name: name || "",
        plan,
        applicationLimit: planDetails.limit,
        applicationsUsed: 0,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Save invoice
    await Invoice.create({
      uid,
      email,
      name: name || "",
      plan,
      amount: planDetails.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      invoiceNumber,
    });

    // Send invoice email
    await sendInvoiceEmail(email, name, plan, planDetails.price, invoiceNumber, razorpay_payment_id);

    return res.status(200).json({
      success: true,
      message: "Payment verified and plan activated.",
      invoiceNumber,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/subscription/check-limit ──────────────────────────────────────
router.post("/check-limit", async (req, res) => {
  try {
    const { uid, email } = req.body;  // ← add email
    let subscription = await Subscription.findOne({ uid });

    if (!subscription) {
      subscription = await Subscription.create({
        uid,
        email: email || "unknown@email.com",  // ← use email from body
        plan: "Free",
        applicationLimit: 1,
        applicationsUsed: 0,
      });
    }

    const canApply = subscription.applicationsUsed < subscription.applicationLimit;

    return res.status(200).json({
      success: true,
      canApply,
      plan: subscription.plan,
      applicationsUsed: subscription.applicationsUsed,
      applicationLimit: subscription.applicationLimit,
      remaining: subscription.applicationLimit - subscription.applicationsUsed,
    });
  } catch (error) {
    console.error("check-limit error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/subscription/increment-usage ──────────────────────────────────
router.post("/increment-usage", async (req, res) => {
  try {
    const { uid } = req.body;
    const subscription = await Subscription.findOne({ uid });

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found." });
    }

    if (subscription.applicationsUsed >= subscription.applicationLimit) {
      return res.status(403).json({
        success: false,
        message: "Application limit reached. Please upgrade your plan.",
      });
    }

    subscription.applicationsUsed += 1;
    await subscription.save();

    return res.status(200).json({
      success: true,
      applicationsUsed: subscription.applicationsUsed,
      applicationLimit: subscription.applicationLimit,
    });
  } catch (error) {
    console.error("increment-usage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Helper: send invoice email ───────────────────────────────────────────────
async function sendInvoiceEmail(to, name, plan, amount, invoiceNumber, paymentId) {
  const axios = require("axios");

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Internarea", email: "priyankamanapuram08@gmail.com" },
      to: [{ email: to }],
      subject: `Invoice ${invoiceNumber} — Internarea ${plan} Plan`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
          <h2 style="color:#2563eb;">Payment Invoice</h2>
          <p style="color:#374151;">Hi ${name || "there"},</p>
          <p style="color:#374151;">Thank you for subscribing to the <strong>${plan}</strong> plan on Internarea.</p>
          
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Invoice Number</td>
                <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Payment ID</td>
                <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;">${paymentId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Plan</td>
                <td style="padding:8px 0;color:#111827;font-weight:500;text-align:right;">${plan}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:12px 0;color:#111827;font-weight:600;font-size:16px;">Amount Paid</td>
                <td style="padding:12px 0;color:#2563eb;font-weight:700;font-size:16px;text-align:right;">₹${amount}</td>
              </tr>
            </table>
          </div>

          <p style="color:#6b7280;font-size:13px;">This is an automated invoice. Please keep it for your records.</p>
        </div>
      `,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = router;