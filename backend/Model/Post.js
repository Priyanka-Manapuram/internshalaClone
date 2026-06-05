const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, default: "" },
  photo: { type: String, default: "" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, default: "" },
  photo: { type: String, default: "" },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], default: "image" },
  likes: [{ type: String }], // array of uids
  comments: [CommentSchema],
  shares: [{ type: String }], // array of uids who shared
  sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", PostSchema);