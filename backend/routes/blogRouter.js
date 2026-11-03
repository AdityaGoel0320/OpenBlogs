import express from "express";
import {
  blogPost,
  deleteBlog,
  getAllBlogs,
  getMyBlogs,
  getSingleBlog,
  updateBlog,
} from "../controllers/blogController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";
import { addComment, deleteComment, getCommunity, setRating, setUpvote } from "../controllers/communityController.js";
const router = express.Router();

router.post("/post", isAuthenticated, isAuthorized("Author"), blogPost);
router.delete(
  "/delete/:id",
  isAuthenticated,
  isAuthorized("Author"),
  deleteBlog
);
router.get("/all", getAllBlogs);
router.get("/singleblog/:id", isAuthenticated, getSingleBlog);
router.get("/:id/community", isAuthenticated, getCommunity);
router.put("/:id/upvote", isAuthenticated, setUpvote);
router.put("/:id/rating", isAuthenticated, setRating);
router.post("/:id/comments", isAuthenticated, addComment);
router.delete("/:id/comments/:commentId", isAuthenticated, deleteComment);
router.get("/myblogs", isAuthenticated, isAuthorized("Author"), getMyBlogs);
router.put("/update/:id", isAuthenticated, isAuthorized("Author"), updateBlog);

export default router;
