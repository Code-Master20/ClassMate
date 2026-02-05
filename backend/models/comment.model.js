const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;

/*
========================================finding related comments with postId=======================
commentSchema.index({ post: 1 });
for the above portion of code Now I am able to run this portion of code -->
Comment.find({ post: postId })
  .sort({ createdAt: -1 })
  .limit(20);
, which means -->“Give me all comments (20comts) belonging to this post”




==========================Reply-To-Comment->Reply-To-Reply infinity previliges===========================
   parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    the above portion allow as previlleges to do :-
    comment
    reply to comment
    reply to reply

=============================efficency during searching comments of a particular post==============================
    commentSchema.index({ post: 1, createdAt: -1 });
    “When MongoDB searches comments for a post,
    it will READ them in order of newest → oldest.”


    ====================populate() use cases===========================
    Your Comment document in MongoDB looks like this:-
            {
                "_id": "C2",
                "post": "P1",
                "user": "U3",
                "comment": "Nice post",
                "parentComment": "C1"
            }
        post, user, parentComment are just ObjectIds
        MongoDB does NOT know what they mean
        They are just IDs.

 BUT  populate() says to Mongoose:
 const comments = await Comment.find({ post: postId }).populate("user");
 
    “Hey, this field contains an ObjectId.
    Go to the referenced collection, fetch the document,
    and temporarily replace the ID with real data.”
*/
