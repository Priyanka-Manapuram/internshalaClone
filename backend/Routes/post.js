const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const Friend = require("../Model/Friend");
const { upload } = require("../utils/cloudinary");

// ─── Helper: get daily post limit based on friend count ──────────────────────
function getPostLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount === 2) return 2;
  if (friendCount >= 10) return Infinity;
  return friendCount; // 3-9 friends = that many posts
}

// ─── POST /api/post/create ────────────────────────────────────────────────────
router.post("/create", upload.single("media"), async (req, res) => {
  try {
    const { uid, name, photo, caption } = req.body;

    if (!req.file)
      return res.status(400).json({ success: false, message: "Media file is required." });

    // Get friend count
    const following = await Friend.find({ uid });
    const followingUids = following.map((f) => f.targetUid);
    const mutualFriends = await Friend.find({
      uid: { $in: followingUids },
      targetUid: uid,
    });
    const friendCount = mutualFriends.length;
    const postLimit = getPostLimit(friendCount);

    // Check if posting is allowed
    if (postLimit === 0) {
      return res.status(403).json({
        success: false,
        message: "You need at least 1 friend to post. Follow someone and wait for them to follow back!",
      });
    }

    // Check today's post count if not unlimited
    if (postLimit !== Infinity) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayPosts = await Post.countDocuments({
        uid,
        createdAt: { $gte: startOfDay },
        sharedFrom: null,
      });

      if (todayPosts >= postLimit) {
        return res.status(403).json({
          success: false,
          message: `You can only post ${postLimit} time(s) per day with ${friendCount} friend(s). Add more friends to post more!`,
        });
      }
    }

    const isVideo = req.file.mimetype?.startsWith("video/") ||
      req.file.path?.includes("/video/");

    const post = await Post.create({
      uid,
      name: name || "",
      photo: photo || "",
      caption: caption || "",
      mediaUrl: req.file.path,
      mediaType: isVideo ? "video" : "image",
    });

    return res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("create post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/post/feed ───────────────────────────────────────────────────────
router.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/post/like ──────────────────────────────────────────────────────
router.post("/like", async (req, res) => {
  try {
    const { postId, uid } = req.body;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found." });

    const alreadyLiked = post.likes.includes(uid);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id !== uid); // unlike
    } else {
      post.likes.push(uid); // like
    }
    await post.save();

    return res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/post/comment ───────────────────────────────────────────────────
router.post("/comment", async (req, res) => {
  try {
    const { postId, uid, name, photo, text } = req.body;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found." });

    post.comments.push({ uid, name, photo, text });
    await post.save();

    return res.status(200).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/post/share ─────────────────────────────────────────────────────
router.post("/share", async (req, res) => {
  try {
    const { postId, uid, name, photo } = req.body;

    const originalPost = await Post.findById(postId);
    if (!originalPost)
      return res.status(404).json({ success: false, message: "Post not found." });

    // Check friend count for share limit too
    const following = await Friend.find({ uid });
    const followingUids = following.map((f) => f.targetUid);
    const mutualFriends = await Friend.find({
      uid: { $in: followingUids },
      targetUid: uid,
    });
    const friendCount = mutualFriends.length;
    const postLimit = getPostLimit(friendCount);

    if (postLimit === 0) {
      return res.status(403).json({
        success: false,
        message: "You need at least 1 friend to share posts.",
      });
    }

    // Create shared post
    const sharedPost = await Post.create({
      uid,
      name: name || "",
      photo: photo || "",
      caption: originalPost.caption,
      mediaUrl: originalPost.mediaUrl,
      mediaType: originalPost.mediaType,
      sharedFrom: originalPost._id,
    });

    // Track who shared
    originalPost.shares.push(uid);
    await originalPost.save();

    return res.status(200).json({ success: true, post: sharedPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/post/user/:uid ──────────────────────────────────────────────────
router.get("/user/:uid", async (req, res) => {
  try {
    const posts = await Post.find({ uid: req.params.uid })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/post/:id ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found." });
    return res.status(200).json({ success: true, post });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;