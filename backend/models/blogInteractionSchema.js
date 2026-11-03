import mongoose from "mongoose";

const blogInteractionSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.ObjectId, ref: "Blog", required: true },
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  upvoted: { type: Boolean, default: false },
  stars: { type: Number, min: 0, max: 5, default: 0, validate: Number.isInteger },
});

blogInteractionSchema.index({ blog: 1, user: 1 }, { unique: true });

export const BlogInteraction = mongoose.model("BlogInteraction", blogInteractionSchema);