const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  fromUid:   { type: String, required: true },
  fromName:  { type: String, default: "" },
  fromPhoto: { type: String, default: "" },
  toUid:     { type: String, required: true },
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);