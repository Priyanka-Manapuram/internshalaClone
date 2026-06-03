const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "",
  },
  ipAddress: {
    type: String,
    default: "Unknown",
  },
  browser: {
    type: String,
    default: "Unknown",
  },
  os: {
    type: String,
    default: "Unknown",
  },
  device: {
    type: String,
    enum: ["Chrome", "Mobile", "Other"],
    default: "Other",
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["success", "blocked"],
    default: "success",
  },
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);