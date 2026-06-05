import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Heart, MessageCircle, Share2, Upload, X,
  UserPlus, UserCheck, Users,
} from "lucide-react";
import { ImageIcon, VideoIcon } from "lucide-react";

const API = "https://internshalaclone-jby6.onrender.com/api";

interface Post {
  _id: string;
  uid: string;
  name: string;
  photo: string;
  caption: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  likes: string[];
  comments: {
    _id: string;
    uid: string;
    name: string;
    photo: string;
    text: string;
    createdAt: string;
  }[];
  shares: string[];
  sharedFrom: string | null;
  createdAt: string;
}

export default function CommunityPage() {
  const user = useSelector(selectuser);
  const [posts, setposts] = useState<Post[]>([]);
  const [loading, setloading] = useState(true);
  const [friendCount, setfriendCount] = useState(0);
  const [friendUids, setfriendUids] = useState<string[]>([]);
  const [followingUids, setfollowingUids] = useState<string[]>([]);
  const [showCreateModal, setshowCreateModal] = useState(false);
  const [caption, setcaption] = useState("");
  const [mediaFile, setmediaFile] = useState<File | null>(null);
  const [mediaPreview, setmediaPreview] = useState<string | null>(null);
  const [posting, setposting] = useState(false);
  const [commentText, setcommentText] = useState<{ [key: string]: string }>({});
  const [showComments, setshowComments] = useState<{ [key: string]: boolean }>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setactiveTab] = useState<"feed" | "people">("feed");
  const [allUsers, setallUsers] = useState<any[]>([]);
  const [usersLoading, setusersLoading] = useState(false);

  useEffect(() => {
    fetchFeed();
    if (user) {
      fetchFriendData();
      fetchUsers();
    }
  }, [user]);

  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${API}/post/feed`);
      setposts(res.data.posts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  const fetchFriendData = async () => {
    try {
      const res = await axios.get(`${API}/friend/friends/${user?.uid}`);
      setfriendCount(res.data.friendCount);
      setfriendUids(res.data.friendUids);
      setfollowingUids(res.data.followingUids);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    try {
      setusersLoading(true);
      const res = await axios.get(`${API}/friend/users/${user.uid}`);
      setallUsers(res.data.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setusersLoading(false);
    }
  };

  const getPostLimit = (fc: number) => {
    if (fc === 0) return 0;
    if (fc === 1) return 1;
    if (fc === 2) return 2;
    if (fc >= 10) return Infinity;
    return fc;
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setmediaFile(file);
    setmediaPreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async () => {
    if (!user) { toast.error("Please login first."); return; }
    if (!mediaFile) { toast.error("Please select a photo or video."); return; }
    const limit = getPostLimit(friendCount);
    if (limit === 0) { toast.error("You need at least 1 friend to post!"); return; }
    try {
      setposting(true);
      const formData = new FormData();
      formData.append("media", mediaFile);
      formData.append("uid", user.uid);
      formData.append("name", user.name || "");
      formData.append("photo", user.photo || "");
      formData.append("caption", caption);
      await axios.post(`${API}/post/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post created!");
      setshowCreateModal(false);
      setcaption("");
      setmediaFile(null);
      setmediaPreview(null);
      fetchFeed();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create post.");
    } finally {
      setposting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) { toast.error("Please login to like."); return; }
    try {
      const res = await axios.post(`${API}/post/like`, { postId, uid: user.uid });
      setposts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likes: res.data.liked ? [...p.likes, user.uid] : p.likes.filter((id) => id !== user.uid) }
            : p
        )
      );
    } catch (error) { console.error(error); }
  };

  const handleComment = async (postId: string) => {
    if (!user) { toast.error("Please login to comment."); return; }
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      const res = await axios.post(`${API}/post/comment`, {
        postId, uid: user.uid, name: user.name, photo: user.photo, text,
      });
      setposts((prev) =>
        prev.map((p) => p._id === postId ? { ...p, comments: res.data.comments } : p)
      );
      setcommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) { console.error(error); }
  };

  const handleShare = async (postId: string) => {
    if (!user) { toast.error("Please login to share."); return; }
    try {
      await axios.post(`${API}/post/share`, {
        postId, uid: user.uid, name: user.name, photo: user.photo,
      });
      toast.success("Post shared to your profile!");
      fetchFeed();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to share.");
    }
  };

  const handleFollow = async (targetUid: string) => {
    if (!user) { toast.error("Please login first."); return; }
    const isFollowing = followingUids.includes(targetUid);
    try {
      if (isFollowing) {
        await axios.post(`${API}/friend/unfollow`, { uid: user.uid, targetUid });
        setfollowingUids((prev) => prev.filter((id) => id !== targetUid));
        toast.success("Unfollowed.");
      } else {
        await axios.post(`${API}/friend/follow`, { uid: user.uid, targetUid });
        setfollowingUids((prev) => [...prev, targetUid]);
        toast.success("Following! If they follow back, you'll be friends.");
      }
      fetchFriendData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const postLimit = getPostLimit(friendCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Community</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {friendCount} friend{friendCount !== 1 ? "s" : ""} —{" "}
                {postLimit === 0 ? "Add friends to post"
                  : postLimit === Infinity ? "Unlimited posts"
                  : `${postLimit} post${postLimit !== 1 ? "s" : ""}/day`}
              </p>
            )}
          </div>
          {user && activeTab === "feed" && (
            <button
              onClick={() => setshowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Post
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setactiveTab("feed")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "feed" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setactiveTab("people")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "people" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            People
          </button>
        </div>

        {/* ── FEED TAB ── */}
        {activeTab === "feed" && (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No posts yet. Be the first to post!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.photo || `https://ui-avatars.com/api/?name=${post.name}&background=3b82f6&color=fff`}
                          alt={post.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{post.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      {user && post.uid !== user.uid && (
                        <button
                          onClick={() => handleFollow(post.uid)}
                          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            followingUids.includes(post.uid)
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          {followingUids.includes(post.uid)
                            ? <><UserCheck className="h-3 w-3" /> Following</>
                            : <><UserPlus className="h-3 w-3" /> Follow</>}
                        </button>
                      )}
                    </div>

                    {/* Shared indicator */}
                    {post.sharedFrom && (
                      <div className="px-4 pb-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Share2 className="h-3 w-3" /> Shared post
                        </span>
                      </div>
                    )}

                    {/* Media */}
                    <div className="w-full bg-black">
                      {post.mediaType === "video" ? (
                        <video src={post.mediaUrl} controls className="w-full max-h-96 object-contain" />
                      ) : (
                        <img src={post.mediaUrl} alt={post.caption} className="w-full max-h-96 object-contain" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 pt-3 pb-1 flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                          user && post.likes.includes(user.uid) ? "text-red-500" : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart className="h-5 w-5" fill={user && post.likes.includes(user.uid) ? "currentColor" : "none"} />
                        {post.likes.length}
                      </button>
                      <button
                        onClick={() => setshowComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {post.comments.length}
                      </button>
                      <button
                        onClick={() => handleShare(post._id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-green-600"
                      >
                        <Share2 className="h-5 w-5" />
                        {post.shares.length}
                      </button>
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <div className="px-4 pb-2">
                        <span className="text-sm text-gray-800">
                          <span className="font-semibold">{post.name}</span> {post.caption}
                        </span>
                      </div>
                    )}

                    {/* Comments */}
                    {showComments[post._id] && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-3">
                        {post.comments.map((c) => (
                          <div key={c._id} className="flex items-start gap-2">
                            <img
                              src={c.photo || `https://ui-avatars.com/api/?name=${c.name}&background=3b82f6&color=fff`}
                              alt={c.name}
                              className="w-7 h-7 rounded-full"
                            />
                            <div className="bg-gray-50 rounded-xl px-3 py-1.5 text-sm flex-1">
                              <span className="font-semibold text-gray-800">{c.name}</span>{" "}
                              <span className="text-gray-600">{c.text}</span>
                            </div>
                          </div>
                        ))}
                        {user && (
                          <div className="flex items-center gap-2 mt-2">
                            <img
                              src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`}
                              alt={user.name}
                              className="w-7 h-7 rounded-full"
                            />
                            <input
                              type="text"
                              value={commentText[post._id] || ""}
                              onChange={(e) => setcommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)}
                              placeholder="Add a comment..."
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => handleComment(post._id)} className="text-blue-600 text-sm font-semibold hover:text-blue-700">
                              Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PEOPLE TAB ── */}
        {activeTab === "people" && (
          <div className="space-y-3">
            {!user ? (
              <p className="text-center text-gray-400 py-10">Please login to see people.</p>
            ) : usersLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No other users found yet.</p>
            ) : (
              allUsers.map((u) => (
                <div key={u._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${u.name || u.email}&background=3b82f6&color=fff`}
                      alt={u.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{u.name || u.email?.split("@")[0]}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                      {friendUids.includes(u.firebaseUid) && (
                        <span className="text-xs text-green-600 font-medium">✓ Friends</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollow(u.firebaseUid)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      followingUids.includes(u.firebaseUid)
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    {followingUids.includes(u.firebaseUid)
                      ? <><UserCheck className="h-3 w-3" /> Following</>
                      : <><UserPlus className="h-3 w-3" /> Follow</>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
              <button onClick={() => { setshowCreateModal(false); setmediaPreview(null); setmediaFile(null); }}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className={`text-xs px-3 py-2 rounded-lg font-medium ${postLimit === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {postLimit === 0
                  ? "⚠️ You need at least 1 mutual friend to post."
                  : postLimit === Infinity
                  ? `✓ You have ${friendCount} friends — unlimited posts!`
                  : `✓ You have ${friendCount} friend(s) — ${postLimit} post(s)/day allowed.`}
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                {mediaPreview ? (
                  mediaFile?.type.startsWith("video/") ? (
                    <video src={mediaPreview} className="w-full max-h-48 rounded-lg object-contain" controls />
                  ) : (
                    <img src={mediaPreview} alt="preview" className="w-full max-h-48 rounded-lg object-contain" />
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center gap-3">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <VideoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Click to upload photo or video</p>
                    <p className="text-gray-400 text-xs">JPG, PNG, GIF, MP4, MOV</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />
              <textarea
                value={caption}
                onChange={(e) => setcaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleCreatePost}
                disabled={posting || !mediaFile || postLimit === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {posting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    Posting...
                  </div>
                ) : "Share Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}