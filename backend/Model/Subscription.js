const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  plan: {
    type: String,
    enum: ["Free", "Bronze", "Silver", "Gold"],
    default: "Free",
  },
  applicationLimit: { type: Number, default: 5 },
  applicationsUsed: { type: Number, default: 0 },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);