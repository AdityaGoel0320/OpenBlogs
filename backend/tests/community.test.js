import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { Blog } from "../models/blogSchema.js";
import { BlogInteraction } from "../models/blogInteractionSchema.js";
import { Comment } from "../models/commentSchema.js";
import { addComment, deleteComment, getCommunity, setRating, setUpvote } from "../controllers/communityController.js";
import { getCommunityStats } from "../utils/blogCommunity.js";

const blogId = new mongoose.Types.ObjectId();
const authorId = new mongoose.Types.ObjectId();
const readerId = new mongoose.Types.ObjectId();

function request(handler, overrides = {}) {
  return new Promise((resolve, reject) => {
    let status;
    const res = { status(code) { status = code; return this; }, json(data) { resolve({ status, ...data }); } };
    handler({ params: { id: String(blogId) }, query: {}, body: {}, user: { _id: readerId }, ...overrides }, res, reject);
  });
}

function published(context) {
  context.mock.method(Blog, "findOne", async (filter) => {
    assert.equal(filter.published, true);
    return { _id: blogId, createdBy: authorId };
  });
}

function emptyStats(context) {
  context.mock.method(BlogInteraction, "aggregate", async () => []);
  context.mock.method(Comment, "aggregate", async () => []);
}

test("community totals use weighted ratings and preserve empty stories", async (context) => {
  const emptyId = new mongoose.Types.ObjectId();
  context.mock.method(BlogInteraction, "aggregate", async () => [{ _id: blogId, upvoteCount: 2, ratingCount: 2, starTotal: 7 }]);
  context.mock.method(Comment, "aggregate", async () => [{ _id: blogId, commentCount: 3 }]);
  const stats = await getCommunityStats([blogId, emptyId]);
  assert.deepEqual(stats.get(String(blogId)), { upvoteCount: 2, ratingCount: 2, starTotal: 7, averageRating: 3.5, commentCount: 3 });
  assert.equal(stats.get(String(emptyId)).averageRating, 0);
  assert.equal((await getCommunityStats([])).size, 0);
});

test("vote writes are explicit, idempotent and can be removed", async (context) => {
  published(context);
  emptyStats(context);
  let voted = false;
  context.mock.method(BlogInteraction, "findOneAndUpdate", async (filter, update, options) => {
    assert.equal(filter.user, readerId);
    assert.equal(filter.blog, blogId);
    assert.equal(options.runValidators, true);
    voted = update.$set.upvoted;
    return { upvoted: voted, stars: 4 };
  });
  for (const value of [true, true, false]) {
    const result = await request(setUpvote, { body: { upvoted: value } });
    assert.equal(result.viewer.upvoted, value);
    assert.equal(result.viewer.stars, 4);
  }
  assert.equal(voted, false);
});

test("invalid votes, ratings and comments are rejected before writes", async () => {
  await assert.rejects(request(setUpvote, { body: { upvoted: "true" } }), { statusCode: 400 });
  for (const stars of [-1, 6, 2.5, "5", null]) {
    await assert.rejects(request(setRating, { body: { stars } }), { statusCode: 400 });
  }
  for (const body of ["   ", "x".repeat(2001), null]) {
    await assert.rejects(request(addComment, { body: { body } }), { statusCode: 400 });
  }
});

test("authors cannot vote or rate their own stories", async (context) => {
  published(context);
  await assert.rejects(request(setUpvote, { user: { _id: authorId }, body: { upvoted: true } }), { statusCode: 403 });
  await assert.rejects(request(setRating, { user: { _id: authorId }, body: { stars: 5 } }), { statusCode: 403 });
});

test("draft and invalid stories cannot receive interactions", async (context) => {
  context.mock.method(Blog, "findOne", async () => null);
  await assert.rejects(request(setUpvote, { body: { upvoted: true } }), { statusCode: 404 });
  await assert.rejects(request(setRating, { params: { id: "invalid" }, body: { stars: 5 } }), { statusCode: 404 });
});

test("ratings can be cleared and concurrent first writes recover from unique-index conflicts", async (context) => {
  published(context);
  emptyStats(context);
  let writes = 0;
  context.mock.method(BlogInteraction, "findOneAndUpdate", async (filter, update, options) => {
    writes += 1;
    if (writes === 1) throw Object.assign(new Error("Duplicate"), { code: 11000 });
    assert.equal(options.upsert, undefined);
    assert.equal(update.$set.stars, 0);
    return { upvoted: true, stars: 0 };
  });
  const result = await request(setRating, { body: { stars: 0 } });
  assert.equal(result.viewer.stars, 0);
  assert.equal(writes, 2);
});

test("comments are trimmed, server-owned and populated safely", async (context) => {
  published(context);
  emptyStats(context);
  context.mock.method(Comment, "create", async (data) => {
    assert.equal(data.body, "A thoughtful perspective.");
    assert.equal(data.user, readerId);
    return {
      async populate(path, fields) { assert.equal(fields, "name avatar.url"); },
      toObject() { return { _id: "comment", body: data.body, user: { _id: readerId, name: "Reader" } }; },
    };
  });
  const result = await request(addComment, { body: { body: "  A thoughtful perspective.  ", user: authorId } });
  assert.equal(result.status, 201);
  assert.equal(result.comment.canDelete, true);
});

test("comment deletion is restricted to its writer or the story author", async (context) => {
  published(context);
  emptyStats(context);
  const commentId = new mongoose.Types.ObjectId();
  const filters = [];
  context.mock.method(Comment, "findOneAndDelete", async (filter) => { filters.push(filter); return filters.length === 1 ? null : {}; });
  await assert.rejects(request(deleteComment, { params: { id: String(blogId), commentId: String(commentId) } }), { statusCode: 404 });
  assert.equal(filters[0].user, readerId);
  await request(deleteComment, { params: { id: String(blogId), commentId: String(commentId) }, user: { _id: authorId } });
  assert.equal(filters[1].user, undefined);
  assert.equal(filters[1].blog, blogId);
});

test("comments use bounded cursor pagination and viewer-specific deletion permissions", async (context) => {
  published(context);
  emptyStats(context);
  const cursor = new mongoose.Types.ObjectId();
  context.mock.method(BlogInteraction, "findOne", async () => null);
  context.mock.method(Comment, "find", (filter) => {
    assert.equal(String(filter._id.$lt), String(cursor));
    return { sort(order) {
      assert.deepEqual(order, { _id: -1 });
      return { limit(count) {
        assert.equal(count, 21);
        return { async populate() { return Array.from({ length: 21 }, () => ({ toObject: () => ({ _id: new mongoose.Types.ObjectId(), user: { _id: authorId } }) })); } };
      } };
    } };
  });
  const result = await request(getCommunity, { query: { before: String(cursor) } });
  assert.equal(result.comments.length, 20);
  assert.equal(result.comments[0].canDelete, false);
  assert.ok(result.nextCursor);
  assert.deepEqual(result.viewer, { upvoted: false, stars: 0 });
});

test("interaction authentication rejects missing, expired and deleted-account sessions", async (context) => {
  await assert.rejects(request(isAuthenticated, { cookies: {} }), { statusCode: 401 });
  const verify = context.mock.method(jwt, "verify", () => { throw new Error("Expired token"); });
  await assert.rejects(request(isAuthenticated, { cookies: { token: "expired" } }), { statusCode: 401 });
  verify.mock.mockImplementation(() => ({ id: String(readerId) }));
  context.mock.method(User, "findById", async () => null);
  await assert.rejects(request(isAuthenticated, { cookies: { token: "deleted-user" } }), { statusCode: 401 });
});

test("interaction schemas enforce one reaction record per reader and bounded comment text", () => {
  assert.ok(BlogInteraction.schema.indexes().some(([fields, options]) => fields.blog === 1 && fields.user === 1 && options.unique));
  const invalidRating = new BlogInteraction({ blog: blogId, user: readerId, stars: 2.5 });
  assert.ok(invalidRating.validateSync().errors.stars);
  const invalidComment = new Comment({ blog: blogId, user: readerId, body: "x".repeat(2001) });
  assert.ok(invalidComment.validateSync().errors.body);
});