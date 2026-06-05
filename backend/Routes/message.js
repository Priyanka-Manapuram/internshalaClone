const express = require("express");
const router = express.Router();
const Message = require("../Model/Message");
const Post = require("../Model/Post");
const Friend = require("../Model/Friend");

// ─── POST /api/message/send ───────────────────────────────────────────────────
// B sends A's post to C
router.post("/send", async (req, res) => {
  try {
    const { fromUid, fromName, fromPhoto, toUid, postId } = req.body;

    if (!fromUid || !toUid || !postId)
      return res.status(400).json({ success: false, message: "Missing fields." });

    if (fromUid === toUid)
      return res.status(400).json({ success: false, message: "Cannot send to yourself." });

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found." });

    const message = await Message.create({
      fromUid,
      fromName: fromName || "",
      fromPhoto: fromPhoto || "",
      toUid,
      postId,
    });

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("send message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/message/inbox/:uid ─────────────────────────────────────────────
// Get all shared posts received by a user
router.get("/inbox/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const messages = await Message.find({ toUid: uid })
      .sort({ createdAt: -1 })
      .populate("postId");   // brings in full post data

    // Mark all as read
    await Message.updateMany({ toUid: uid, read: false }, { read: true });

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("inbox error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/message/unread/:uid ────────────────────────────────────────────
// Just the unread count — used for the inbox badge
router.get("/unread/:uid", async (req, res) => {
  try {
    const count = await Message.countDocuments({ toUid: req.params.uid, read: false });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;