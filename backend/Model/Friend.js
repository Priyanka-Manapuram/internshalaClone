const mongoose = require("mongoose");

const FriendSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  targetUid: { type: String, required: true },
  status: {
    type: String,
    enum: ["following"],
    default: "following",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Friend", FriendSchema);