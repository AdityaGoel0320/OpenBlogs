import { BlogInteraction } from "../models/blogInteractionSchema.js";
import { Comment } from "../models/commentSchema.js";

export const emptyCommunityStats = () => ({ upvoteCount: 0, ratingCount: 0, averageRating: 0, starTotal: 0, commentCount: 0 });

export async function getCommunityStats(blogIds) {
  if (!blogIds.length) return new Map();
  const [interactions, comments] = await Promise.all([
    BlogInteraction.aggregate([
      { $match: { blog: { $in: blogIds } } },
      { $group: {
        _id: "$blog",
        upvoteCount: { $sum: { $cond: ["$upvoted", 1, 0] } },
        ratingCount: { $sum: { $cond: [{ $gt: ["$stars", 0] }, 1, 0] } },
        starTotal: { $sum: "$stars" },
      } },
    ]),
    Comment.aggregate([
      { $match: { blog: { $in: blogIds } } },
      { $group: { _id: "$blog", commentCount: { $sum: 1 } } },
    ]),
  ]);
  const stats = new Map(blogIds.map((id) => [String(id), emptyCommunityStats()]));
  for (const item of interactions) {
    stats.set(String(item._id), {
      ...emptyCommunityStats(),
      upvoteCount: item.upvoteCount,
      ratingCount: item.ratingCount,
      starTotal: item.starTotal,
      averageRating: item.ratingCount ? item.starTotal / item.ratingCount : 0,
    });
  }
  for (const item of comments) stats.get(String(item._id)).commentCount = item.commentCount;
  return stats;
}

export async function withCommunityStats(blogs) {
  const stats = await getCommunityStats(blogs.map((blog) => blog._id));
  return blogs.map((blog) => ({ ...blog.toObject(), community: stats.get(String(blog._id)) }));
}