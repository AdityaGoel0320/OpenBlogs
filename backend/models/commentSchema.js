import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.ObjectId, ref: "Blog", required: true },
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  body: { type: String, trim: true, required: true, maxLength: 2000 },
}, { timestamps: true });

commentSchema.index({ blog: 1, _id: -1 });

export const Comment = mongoose.model("Comment", commentSchema);