const express = require("express");
const router = express.Router();
const Friend = require("../Model/Friend");

// ─── GET /api/friend/users/:uid ───────────────────────────────────────────────
// Returns all users except the current user
router.get("/allusers/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const User = require("../Model/User");

    const users = await User.find(
      { firebaseUid: { $exists: true, $ne: null, $nin: [uid, ""] } },
      { firebaseUid: 1, name: 1, email: 1 }
    );

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/friend/follow ──────────────────────────────────────────────────
router.post("/follow", async (req, res) => {
  try {
    const { uid, targetUid } = req.body;
    if (uid === targetUid)
      return res.status(400).json({ success: false, message: "Cannot follow yourself." });

    const existing = await Friend.findOne({ uid, targetUid });
    if (existing)
      return res.status(400).json({ success: false, message: "Already following." });

    await Friend.create({ uid, targetUid });
    return res.status(200).json({ success: true, message: "Followed successfully." });
  } catch (error) {
    console.error("follow error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/friend/unfollow ────────────────────────────────────────────────
router.post("/unfollow", async (req, res) => {
  try {
    const { uid, targetUid } = req.body;
    await Friend.deleteOne({ uid, targetUid });
    return res.status(200).json({ success: true, message: "Unfollowed." });
  } catch (error) {
    console.error("unfollow error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/friend/friends/:uid ────────────────────────────────────────────
// Returns mutual follows (friends) and friend count
router.get("/friends/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    // People this user follows
    const following = await Friend.find({ uid });
    const followingUids = following.map((f) => f.targetUid);

    // People who follow this user back (mutual = friends)
    const mutualFriends = await Friend.find({
      uid: { $in: followingUids },
      targetUid: uid,
    });

    const friendUids = mutualFriends.map((f) => f.uid);
    const friendCount = friendUids.length;

    return res.status(200).json({
      success: true,
      friendCount,
      friendUids,
      followingUids,
    });
  } catch (error) {
    console.error("friends error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/friend/status/:uid/:targetUid ───────────────────────────────────
router.get("/status/:uid/:targetUid", async (req, res) => {
  try {
    const { uid, targetUid } = req.params;
    const iFollow = await Friend.findOne({ uid, targetUid });
    const theyFollow = await Friend.findOne({ uid: targetUid, targetUid: uid });
    return res.status(200).json({
      success: true,
      iFollow: !!iFollow,
      theyFollow: !!theyFollow,
      isFriend: !!iFollow && !!theyFollow,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;