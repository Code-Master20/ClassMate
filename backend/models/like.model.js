const mongoose = require("mongoose");

const likeSchema = new mongoose.schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
likeSchema.index({ post: 1, createdAt: -1 });
likeSchema.index({ post: 1, user: 1 }, { unique: true });
const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
/*
 per document for same post with different user's interaction is the like count of that post

 ==============================like limitation for one post for particular user===============
likeSchema.index({ post: 1, user: 1 }, { unique: true }); <this portion of code
decides that each user can like once a perticular post, so per like creates a document for each user for particular post

===========================extracting liked posts=====================================
(1)supposed I liked two posts then output with this query:
const total_Posts_I_liked = const likes = await Like.find({ user: userId }).populate("post");
[
  {
    _id: "L1",
    user: "U1",
    post: {
      _id: "P1",
      title: "Post 1",
      description: "...",
      postType: "image",
      url: "...",
      likeCount: 10,
      commentCount: 2,
      user: "U2",       // post owner
      createdAt: "...",
    },
    createdAt: "...",
  },
  {
    _id: "L2",
    user: "U1",
    post: {
      _id: "P2",
      title: "Post 2",
      description: "...",
      postType: "video",
      url: "...",
      likeCount: 5,
      commentCount: 1,
      user: "U3",       // post owner
      createdAt: "...",
    },
    createdAt: "...",
  }
]
*/
