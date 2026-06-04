const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  photo: { type: String, default: "" },
  summary: { type: String, default: "" },
  qualification: { type: String, default: "" },
  institution: { type: String, default: "" },
  graduationYear: { type: String, default: "" },
  experience: { type: String, default: "" },
  skills: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  razorpayPaymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", ResumeSchema);