import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Blog } from "../models/blogSchema.js";
import { BlogInteraction } from "../models/blogInteractionSchema.js";
import { Comment } from "../models/commentSchema.js";
import { getCommunityStats } from "../utils/blogCommunity.js";

async function publishedBlog(id) {
  if (!mongoose.isValidObjectId(id)) throw new ErrorHandler("Story not found.", 404);
  const blog = await Blog.findOne({ _id: id, published: true });
  if (!blog) throw new ErrorHandler("Story not found.", 404);
  return blog;
}

function commentData(comment, viewerId, authorId) {
  const item = comment.toObject();
  return { ...item, canDelete: String(item.user?._id) === String(viewerId) || String(authorId) === String(viewerId) };
}

export const getCommunity = catchAsyncErrors(async (req, res) => {
  const blog = await publishedBlog(req.params.id);
  const filter = { blog: blog._id };
  if (req.query.before) {
    if (typeof req.query.before !== "string" || !mongoose.isValidObjectId(req.query.before)) throw new ErrorHandler("Invalid comment cursor.", 400);
    filter._id = { $lt: new mongoose.Types.ObjectId(String(req.query.before)) };
  }
  const [stats, viewer, comments] = await Promise.all([
    getCommunityStats([blog._id]),
    BlogInteraction.findOne({ blog: blog._id, user: req.user._id }),
    Comment.find(filter).sort({ _id: -1 }).limit(21).populate("user", "name avatar.url"),
  ]);
  const page = comments.slice(0, 20);
  res.status(200).json({
    success: true,
    community: stats.get(String(blog._id)),
    viewer: { upvoted: viewer?.upvoted || false, stars: viewer?.stars || 0 },
    comments: page.map((comment) => commentData(comment, req.user._id, blog.createdBy)),
    nextCursor: comments.length > 20 ? String(page.at(-1)._id) : null,
  });
});

async function setInteraction(req, res, field, value) {
  const blog = await publishedBlog(req.params.id);
  if (String(blog.createdBy) === String(req.user._id)) throw new ErrorHandler("You cannot upvote or rate your own story.", 403);
  const filter = { blog: blog._id, user: req.user._id };
  let interaction;
  try {
    interaction = await BlogInteraction.findOneAndUpdate(filter, { $set: { [field]: value } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    interaction = await BlogInteraction.findOneAndUpdate(filter, { $set: { [field]: value } }, { new: true, runValidators: true });
  }
  const stats = await getCommunityStats([blog._id]);
  res.status(200).json({ success: true, community: stats.get(String(blog._id)), viewer: { upvoted: interaction.upvoted, stars: interaction.stars } });
}

export const setUpvote = catchAsyncErrors(async (req, res) => {
  if (typeof req.body.upvoted !== "boolean") throw new ErrorHandler("Choose whether to upvote this story.", 400);
  await setInteraction(req, res, "upvoted", req.body.upvoted);
});

export const setRating = catchAsyncErrors(async (req, res) => {
  if (!Number.isInteger(req.body.stars) || req.body.stars < 0 || req.body.stars > 5) throw new ErrorHandler("Choose a whole number from 1 to 5 stars, or 0 to remove your rating.", 400);
  await setInteraction(req, res, "stars", req.body.stars);
});

export const addComment = catchAsyncErrors(async (req, res) => {
  if (typeof req.body.body !== "string" || !req.body.body.trim() || req.body.body.trim().length > 2000) throw new ErrorHandler("Write a comment between 1 and 2,000 characters.", 400);
  const blog = await publishedBlog(req.params.id);
  const comment = await Comment.create({ blog: blog._id, user: req.user._id, body: req.body.body.trim() });
  await comment.populate("user", "name avatar.url");
  const stats = await getCommunityStats([blog._id]);
  res.status(201).json({ success: true, comment: commentData(comment, req.user._id, blog.createdBy), community: stats.get(String(blog._id)) });
});

export const deleteComment = catchAsyncErrors(async (req, res) => {
  const blog = await publishedBlog(req.params.id);
  if (!mongoose.isValidObjectId(req.params.commentId)) throw new ErrorHandler("Comment not found.", 404);
  const filter = { _id: req.params.commentId, blog: blog._id };
  if (String(blog.createdBy) !== String(req.user._id)) filter.user = req.user._id;
  const comment = await Comment.findOneAndDelete(filter);
  if (!comment) throw new ErrorHandler("Comment not found or you cannot delete it.", 404);
  const stats = await getCommunityStats([blog._id]);
  res.status(200).json({ success: true, community: stats.get(String(blog._id)) });
});